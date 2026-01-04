// Prompt Validator Service
// Validates workflow blocks for completeness and auto-fixes issues

import { WorkflowBlock, BlockType, Language } from '../types';
import { AUTO_FIX_TEMPLATES } from '../constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ValidationCategory = 
  | 'MISSING_RETRY'
  | 'MISSING_FALLBACK'
  | 'MISSING_ERROR_HANDLER'
  | 'UNRESOLVED_DEPENDENCY'
  | 'MISSING_MERGE_CONSOLIDATION';

export interface ValidationIssue {
  id: string;
  blockType: BlockType;
  blockId: string;
  category: ValidationCategory;
  description: { EN: string; DE: string };
  severity: 'BLOCKING' | 'WARNING';
  autoFix: {
    insertText: { EN: string; DE: string };
    insertPosition: 'append' | 'prepend' | 'inline-transform';
    transformFn?: (content: string, language: Language) => string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  fixableCount: number;
  blockingCount: number;
  warningCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

// Keywords that indicate external API/HTTP calls
const HTTP_API_KEYWORDS = [
  'http request', 'api', 'fetch', 'webhook', 'rest', 'endpoint',
  'http-anfrage', 'schnittstelle', 'abrufen'
];

// Keywords that indicate retry is already configured
const RETRY_KEYWORDS = ['retry', 'wiederholen', 'retries', 'wiederholungen'];

// Keywords indicating error handling
const ERROR_KEYWORDS = ['error', 'fail', 'fehler', 'fehlschlag', 'error trigger', 'on error'];

// Keywords indicating branching
const BRANCH_KEYWORDS = ['if', 'switch', 'route', 'branch', 'condition', 'wenn', 'verzweigung', 'bedingung'];

// Keywords indicating merge
const MERGE_KEYWORDS = ['merge', 'consolidate', 'combine', 'zusammenführen', 'konsolidieren'];

// Regex to find $json.field patterns without fallback
const JSON_FIELD_REGEX = /\{\{\s*\$json\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
const JSON_FIELD_WITH_FALLBACK_REGEX = /\{\{\s*\$json\.[a-zA-Z_][a-zA-Z0-9_]*\s*\|\|/g;

// Common n8n node names for dependency detection
const KNOWN_NODE_PATTERNS = [
  /\*\*(Slack|Gmail|Google Sheets?|Notion|Airtable|Discord|Telegram|HTTP Request|Webhook|OpenAI|Anthropic|SendGrid|Twilio|Stripe|Shopify|HubSpot|Salesforce|Jira|Trello|Asana|Monday|Zendesk|Intercom|Mailchimp|PostgreSQL|MySQL|MongoDB|Redis|S3|Google Drive|Dropbox|OneDrive|Box)\s*(Node)?\*\*/gi
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if block content contains any of the given keywords
 */
function containsKeyword(content: string, keywords: string[]): boolean {
  const lowerContent = content.toLowerCase();
  return keywords.some(kw => lowerContent.includes(kw.toLowerCase()));
}

/**
 * Detect MISSING_RETRY issues
 */
function detectMissingRetry(block: WorkflowBlock, language: Language): ValidationIssue | null {
  const content = block.content.toLowerCase();
  
  // Check if block mentions HTTP/API calls
  const hasHttpCall = containsKeyword(content, HTTP_API_KEYWORDS);
  
  // Check if retry is already mentioned
  const hasRetry = containsKeyword(content, RETRY_KEYWORDS);
  
  if (hasHttpCall && !hasRetry) {
    return {
      id: `retry-${block.id}`,
      blockType: block.type,
      blockId: block.id,
      category: 'MISSING_RETRY',
      description: {
        EN: 'HTTP/API call detected without retry policy. External calls can fail temporarily.',
        DE: 'HTTP/API-Aufruf ohne Retry-Richtlinie erkannt. Externe Aufrufe können temporär fehlschlagen.'
      },
      severity: 'WARNING',
      autoFix: {
        insertText: AUTO_FIX_TEMPLATES.RETRY_POLICY,
        insertPosition: 'append'
      }
    };
  }
  
  return null;
}

/**
 * Detect MISSING_FALLBACK issues
 */
function detectMissingFallback(block: WorkflowBlock, language: Language): ValidationIssue | null {
  const content = block.content;
  
  // Find $json.field patterns
  const allMatches = content.match(JSON_FIELD_REGEX);
  const fallbackMatches = content.match(JSON_FIELD_WITH_FALLBACK_REGEX);
  
  const totalFields = allMatches?.length || 0;
  const fieldsWithFallback = fallbackMatches?.length || 0;
  
  if (totalFields > 0 && fieldsWithFallback < totalFields) {
    return {
      id: `fallback-${block.id}`,
      blockType: block.type,
      blockId: block.id,
      category: 'MISSING_FALLBACK',
      description: {
        EN: `${totalFields - fieldsWithFallback} expression(s) without fallback values. Missing data will cause errors.`,
        DE: `${totalFields - fieldsWithFallback} Ausdruck/Ausdrücke ohne Fallback-Werte. Fehlende Daten verursachen Fehler.`
      },
      severity: 'WARNING',
      autoFix: {
        insertText: AUTO_FIX_TEMPLATES.FALLBACK_PATTERN,
        insertPosition: 'inline-transform',
        transformFn: (content: string, lang: Language) => {
          // Transform {{ $json.field }} to {{ $json.field || 'default_value' }}
          const defaultValue = lang === 'DE' ? 'Standardwert' : 'default_value';
          return content.replace(
            /\{\{\s*\$json\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
            (match, field) => {
              // Check if it already has a fallback
              if (match.includes('||')) return match;
              return `{{ $json.${field} || '${defaultValue}' }}`;
            }
          );
        }
      }
    };
  }
  
  return null;
}

/**
 * Detect MISSING_ERROR_HANDLER issues
 */
function detectMissingErrorHandler(block: WorkflowBlock, language: Language): ValidationIssue | null {
  // Only check STORAGE blocks
  if (block.type !== BlockType.STORAGE) return null;
  
  const content = block.content.toLowerCase();
  const hasErrorHandling = containsKeyword(content, ERROR_KEYWORDS);
  
  // Only flag if the block has actual content
  if (block.content.trim().length > 20 && !hasErrorHandling) {
    return {
      id: `error-${block.id}`,
      blockType: block.type,
      blockId: block.id,
      category: 'MISSING_ERROR_HANDLER',
      description: {
        EN: 'Storage/Output block has no error handling. Failed operations will go unnoticed.',
        DE: 'Speicher/Ausgabe-Block ohne Fehlerbehandlung. Fehlgeschlagene Operationen bleiben unbemerkt.'
      },
      severity: 'BLOCKING',
      autoFix: {
        insertText: AUTO_FIX_TEMPLATES.ERROR_HANDLER,
        insertPosition: 'append'
      }
    };
  }
  
  return null;
}

/**
 * Detect MISSING_MERGE_CONSOLIDATION issues
 */
function detectMissingMerge(block: WorkflowBlock, language: Language): ValidationIssue | null {
  // Only check LOGIC blocks
  if (block.type !== BlockType.LOGIC) return null;
  
  const content = block.content.toLowerCase();
  const hasBranching = containsKeyword(content, BRANCH_KEYWORDS);
  const hasMerge = containsKeyword(content, MERGE_KEYWORDS);
  
  if (hasBranching && !hasMerge && block.content.trim().length > 20) {
    return {
      id: `merge-${block.id}`,
      blockType: block.type,
      blockId: block.id,
      category: 'MISSING_MERGE_CONSOLIDATION',
      description: {
        EN: 'Conditional branches detected without merge. Parallel paths may not consolidate properly.',
        DE: 'Bedingte Verzweigungen ohne Merge erkannt. Parallele Pfade werden möglicherweise nicht korrekt konsolidiert.'
      },
      severity: 'WARNING',
      autoFix: {
        insertText: AUTO_FIX_TEMPLATES.MERGE_CONSOLIDATION,
        insertPosition: 'append'
      }
    };
  }
  
  return null;
}

/**
 * Detect UNRESOLVED_DEPENDENCY issues
 * Checks if nodes mentioned in content have corresponding nodes in the block's node list
 */
function detectUnresolvedDependency(block: WorkflowBlock, allBlocks: WorkflowBlock[], language: Language): ValidationIssue | null {
  const content = block.content;
  
  // Get all node names from all blocks
  const allNodeNames = allBlocks.flatMap(b => b.nodes.map(n => n.name.toLowerCase()));
  
  // Find mentioned node names in content
  for (const pattern of KNOWN_NODE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const nodeName = match[1];
      const isInTopology = allNodeNames.some(n => n.includes(nodeName.toLowerCase()));
      
      if (!isInTopology) {
        // Check if credential reminder is already present
        const hasCredentialReminder = content.toLowerCase().includes('credentials') || 
                                       content.toLowerCase().includes('zugangsdaten');
        
        if (!hasCredentialReminder) {
          return {
            id: `dep-${block.id}-${nodeName}`,
            blockType: block.type,
            blockId: block.id,
            category: 'UNRESOLVED_DEPENDENCY',
            description: {
              EN: `${nodeName} is mentioned but may need credential configuration.`,
              DE: `${nodeName} wird erwähnt, benötigt aber möglicherweise Zugangsdaten-Konfiguration.`
            },
            severity: 'BLOCKING',
            autoFix: {
              insertText: {
                EN: AUTO_FIX_TEMPLATES.CREDENTIAL_REMINDER.EN.replace('{nodeName}', nodeName),
                DE: AUTO_FIX_TEMPLATES.CREDENTIAL_REMINDER.DE.replace('{nodeName}', nodeName)
              },
              insertPosition: 'append'
            }
          };
        }
      }
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate all blocks and return issues
 */
export function validateAllBlocks(blocks: WorkflowBlock[], language: Language): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  for (const block of blocks) {
    // Skip empty blocks
    if (!block.content || block.content.trim().length < 10) continue;
    
    // Run all detectors
    const retryIssue = detectMissingRetry(block, language);
    if (retryIssue) issues.push(retryIssue);
    
    const fallbackIssue = detectMissingFallback(block, language);
    if (fallbackIssue) issues.push(fallbackIssue);
    
    const errorIssue = detectMissingErrorHandler(block, language);
    if (errorIssue) issues.push(errorIssue);
    
    const mergeIssue = detectMissingMerge(block, language);
    if (mergeIssue) issues.push(mergeIssue);
    
    const depIssue = detectUnresolvedDependency(block, blocks, language);
    if (depIssue) issues.push(depIssue);
  }
  
  const blockingCount = issues.filter(i => i.severity === 'BLOCKING').length;
  const warningCount = issues.filter(i => i.severity === 'WARNING').length;
  
  return {
    isValid: issues.length === 0,
    issues,
    fixableCount: issues.length, // All issues we detect are auto-fixable
    blockingCount,
    warningCount
  };
}

/**
 * Get issues for a specific block
 */
export function getBlockIssues(block: WorkflowBlock, allBlocks: WorkflowBlock[], language: Language): ValidationIssue[] {
  const result = validateAllBlocks(allBlocks, language);
  return result.issues.filter(i => i.blockId === block.id);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-FIX FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply all fixes to blocks and return updated blocks
 */
export function applyAllFixes(blocks: WorkflowBlock[], issues: ValidationIssue[], language: Language): WorkflowBlock[] {
  // Group issues by block
  const issuesByBlock = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    const existing = issuesByBlock.get(issue.blockId) || [];
    existing.push(issue);
    issuesByBlock.set(issue.blockId, existing);
  }
  
  // Apply fixes to each block
  return blocks.map(block => {
    const blockIssues = issuesByBlock.get(block.id);
    if (!blockIssues || blockIssues.length === 0) return block;
    
    let newContent = block.content;
    
    for (const issue of blockIssues) {
      if (issue.autoFix.insertPosition === 'inline-transform' && issue.autoFix.transformFn) {
        // Apply inline transformation
        newContent = issue.autoFix.transformFn(newContent, language);
      } else if (issue.autoFix.insertPosition === 'append') {
        // Append fix text
        const insertText = typeof issue.autoFix.insertText === 'string' 
          ? issue.autoFix.insertText 
          : issue.autoFix.insertText[language];
        newContent = newContent.trimEnd() + '\n' + insertText;
      } else if (issue.autoFix.insertPosition === 'prepend') {
        // Prepend fix text
        const insertText = typeof issue.autoFix.insertText === 'string' 
          ? issue.autoFix.insertText 
          : issue.autoFix.insertText[language];
        newContent = insertText + '\n' + newContent;
      }
    }
    
    return {
      ...block,
      content: newContent,
      // Reset risk level after fixes
      riskLevel: 'SAFE' as const
    };
  });
}

/**
 * Apply a single fix to a block
 */
export function applySingleFix(blocks: WorkflowBlock[], issue: ValidationIssue, language: Language): WorkflowBlock[] {
  return applyAllFixes(blocks, [issue], language);
}
