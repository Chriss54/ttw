// Prompt Quality Scoring Service
// Client-side analysis of user intent to provide actionable feedback
// v2.0: Additive scoring system for more accurate quality assessment

import { Language } from '../types';
import { N8N_NODES, getNodesByCategory } from '../data/n8nNodes';

export interface QualityScore {
    score: number; // 0-100
    issues: Array<{ id: string; text: { EN: string; DE: string }; severity: 'error' | 'warning' | 'info' }>;
    suggestions: Array<{ text: { EN: string; DE: string }; priority: number }>;
    estimatedNodes: number;
    detectedTrigger: string | null;
    detectedComplexity: 'simple' | 'medium' | 'complex';
}

// Keywords that indicate specific workflow elements
const TRIGGER_KEYWORDS = {
    webhook: ['webhook', 'api', 'endpoint', 'http request', 'form submission', 'formular'],
    email: ['email', 'e-mail', 'gmail', 'mail', 'inbox', 'postfach'],
    schedule: ['every', 'daily', 'hourly', 'morning', 'schedule', 'cron', 'jeden', 'täglich', 'stündlich', 'morgens'],
    slack: ['slack message', 'slack-nachricht'],
    sheets: ['new row', 'spreadsheet', 'google sheet', 'neue zeile', 'tabelle'],
    chat: ['chat', 'conversation', 'message', 'konversation', 'nachricht']
};

const COMPLEXITY_INDICATORS = {
    simple: ['simple', 'just', 'basic', 'only', 'einfach', 'nur', 'basic'],
    complex: ['and then', 'if', 'else', 'depending', 'multiple', 'several', 'various', 'check', 'validate',
        'und dann', 'wenn', 'sonst', 'abhängig', 'mehrere', 'verschiedene', 'prüfen', 'validieren']
};

const AI_KEYWORDS = ['ai', 'ki', 'gpt', 'llm', 'classify', 'extract', 'summarize', 'analyze', 'generate',
    'klassifizieren', 'extrahieren', 'zusammenfassen', 'analysieren', 'generieren'];

const OUTPUT_KEYWORDS = ['send', 'notify', 'store', 'save', 'create', 'update', 'post',
    'senden', 'benachrichtigen', 'speichern', 'erstellen', 'aktualisieren', 'posten'];

const ERROR_HANDLING_KEYWORDS = ['error', 'fail', 'retry', 'if fails', 'fehler', 'fehlschlag', 'wiederholen'];

// NEW: Concrete tool/service keywords for better detection
const CONCRETE_TOOLS = [
    'gmail', 'google drive', 'google sheets', 'slack', 'discord', 'notion', 'airtable',
    'hubspot', 'salesforce', 'stripe', 'shopify', 'twitter', 'x.com', 'linkedin',
    'telegram', 'whatsapp', 'trello', 'asana', 'jira', 'github', 'gitlab',
    'mysql', 'postgres', 'mongodb', 'supabase', 'firebase', 'openai', 'anthropic',
    'aws', 's3', 'dropbox', 'onedrive', 'mailchimp', 'sendgrid', 'twilio'
];

// NEW: Data flow keywords - describing what happens to data
const DATA_FLOW_KEYWORDS = [
    'extract', 'transform', 'parse', 'filter', 'map', 'convert', 'format',
    'extrahieren', 'transformieren', 'parsen', 'filtern', 'konvertieren', 'formatieren',
    'split', 'merge', 'combine', 'aggregate', 'summarize', 'enrich',
    'teilen', 'zusammenführen', 'kombinieren', 'aggregieren', 'anreichern'
];

// NEW: Vague patterns that indicate low-quality prompts
const VAGUE_PATTERNS = [
    /^create\s+(an?|a)\s+\w+\s+that\b/i,          // "Create an X that..."
    /^build\s+(an?|a)\s+\w+\b/i,                  // "Build a..."
    /^make\s+(an?|a)\s+\w+\b/i,                   // "Make a..."
    /^i\s+(want|need)\s+(an?|a)\s+\w+\b/i,        // "I want a..."
    /\breceives?\s+(and\s+)?\w+\s*$/i,            // ends with "receives X"
    /\bhandles?\s+\w+\s*$/i,                      // ends with "handles X"
    /\bprocesses?\s+\w+\s*$/i,                    // ends with "processes X"
];

// NEW: Outcome/goal keywords
const OUTCOME_KEYWORDS = [
    'so that', 'in order to', 'to achieve', 'result', 'output', 'deliver',
    'damit', 'um zu', 'ergebnis', 'ausgabe', 'liefern', 'ziel'
];

export function scorePromptQuality(intent: string, language: Language): QualityScore {
    const lowerIntent = intent.toLowerCase();
    const words = lowerIntent.split(/\s+/);
    const wordCount = words.length;

    const issues: QualityScore['issues'] = [];
    const suggestions: QualityScore['suggestions'] = [];

    // ═══════════════════════════════════════════════════════════════
    // ADDITIVE SCORING - Start low and earn points
    // ═══════════════════════════════════════════════════════════════
    let score = 15; // Base score for having any input

    // ═══════════════════════════════════════════════════════════════
    // 1. LENGTH CHECK (+10 to +20)
    // ═══════════════════════════════════════════════════════════════
    if (wordCount < 5) {
        issues.push({
            id: 'too-short',
            text: {
                EN: 'Intent is too short – add much more detail about what you want to automate',
                DE: 'Absicht ist zu kurz – füge viel mehr Details hinzu, was automatisiert werden soll'
            },
            severity: 'error'
        });
    } else if (wordCount < 15) {
        score += 5;
        issues.push({
            id: 'short',
            text: {
                EN: 'Consider adding more specific details about the workflow steps',
                DE: 'Erwäge, spezifischere Details zu den Workflow-Schritten hinzuzufügen'
            },
            severity: 'warning'
        });
    } else if (wordCount < 30) {
        score += 10;
    } else if (wordCount <= 150) {
        score += 15; // Sweet spot
    } else {
        score += 10;
        issues.push({
            id: 'too-long',
            text: {
                EN: 'Very long – consider breaking into multiple workflows',
                DE: 'Sehr lang – erwäge, in mehrere Workflows aufzuteilen'
            },
            severity: 'info'
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. VAGUE PATTERN PENALTY (-15)
    // ═══════════════════════════════════════════════════════════════
    const isVague = VAGUE_PATTERNS.some(pattern => pattern.test(intent));
    if (isVague) {
        score -= 15;
        issues.push({
            id: 'vague-description',
            text: {
                EN: 'Description is too generic – specify concrete steps and services',
                DE: 'Beschreibung ist zu allgemein – konkrete Schritte und Services angeben'
            },
            severity: 'error'
        });
        suggestions.push({
            text: {
                EN: 'Instead of "Create an AI agent that...", describe: When X happens → do Y → output Z',
                DE: 'Statt "Erstelle einen AI Agent der...", beschreibe: Wenn X passiert → mache Y → Ausgabe Z'
            },
            priority: 1
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. TRIGGER DETECTION (+15)
    // ═══════════════════════════════════════════════════════════════
    let detectedTrigger: string | null = null;

    for (const [triggerType, keywords] of Object.entries(TRIGGER_KEYWORDS)) {
        if (keywords.some(kw => lowerIntent.includes(kw))) {
            detectedTrigger = triggerType;
            break;
        }
    }

    if (detectedTrigger) {
        score += 15;
    } else {
        issues.push({
            id: 'no-trigger',
            text: {
                EN: 'No trigger detected – specify what starts this workflow (webhook, email, schedule, etc.)',
                DE: 'Kein Trigger erkannt – spezifiziere, was diesen Workflow startet (Webhook, E-Mail, Zeitplan, etc.)'
            },
            severity: 'error'
        });
        suggestions.push({
            text: {
                EN: 'Start with "When a new email arrives..." or "Every hour at..."',
                DE: 'Beginne mit "Wenn eine neue E-Mail ankommt..." oder "Jede Stunde um..."'
            },
            priority: 1
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CONCRETE TOOLS DETECTION (+15)
    // ═══════════════════════════════════════════════════════════════
    const mentionedTools = CONCRETE_TOOLS.filter(tool => lowerIntent.includes(tool));
    const hasConcreteTools = mentionedTools.length > 0;

    if (hasConcreteTools) {
        score += 15;
        if (mentionedTools.length >= 2) {
            score += 5; // Bonus for multiple tools
        }
    } else {
        issues.push({
            id: 'no-tools',
            text: {
                EN: 'No specific services mentioned – name the apps/tools (Gmail, Slack, Notion, etc.)',
                DE: 'Keine spezifischen Services genannt – benenne die Apps/Tools (Gmail, Slack, Notion, etc.)'
            },
            severity: 'warning'
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. DATA FLOW DETECTION (+10)
    // ═══════════════════════════════════════════════════════════════
    const hasDataFlow = DATA_FLOW_KEYWORDS.some(kw => lowerIntent.includes(kw));

    if (hasDataFlow) {
        score += 10;
    } else if (wordCount > 15) {
        suggestions.push({
            text: {
                EN: 'Describe what happens to the data: extract, filter, transform, format...',
                DE: 'Beschreibe, was mit den Daten passiert: extrahieren, filtern, transformieren, formatieren...'
            },
            priority: 2
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. OUTPUT/ACTION DETECTION (+10)
    // ═══════════════════════════════════════════════════════════════
    const hasOutput = OUTPUT_KEYWORDS.some(kw => lowerIntent.includes(kw));

    if (hasOutput) {
        score += 10;
    } else {
        issues.push({
            id: 'no-output',
            text: {
                EN: 'No clear output action – specify what should happen (send notification, save to database, etc.)',
                DE: 'Keine klare Ausgabe-Aktion – spezifiziere, was passieren soll (Benachrichtigung senden, in Datenbank speichern, etc.)'
            },
            severity: 'warning'
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. OUTCOME/GOAL DETECTION (+5)
    // ═══════════════════════════════════════════════════════════════
    const hasOutcome = OUTCOME_KEYWORDS.some(kw => lowerIntent.includes(kw));

    if (hasOutcome) {
        score += 5;
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. AI USAGE BONUS (+5)
    // ═══════════════════════════════════════════════════════════════
    const usesAI = AI_KEYWORDS.some(kw => lowerIntent.includes(kw));
    if (usesAI) {
        score += 5;
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. ERROR HANDLING BONUS (+10)
    // ═══════════════════════════════════════════════════════════════
    const mentionsErrors = ERROR_HANDLING_KEYWORDS.some(kw => lowerIntent.includes(kw));
    if (mentionsErrors) {
        score += 10;
    } else if (wordCount > 30) {
        suggestions.push({
            text: {
                EN: 'Consider adding error handling: "If the API call fails, retry or notify via Slack"',
                DE: 'Erwäge Fehlerbehandlung hinzuzufügen: "Wenn der API-Aufruf fehlschlägt, wiederholen oder via Slack benachrichtigen"'
            },
            priority: 3
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 10. COMPLEXITY DETECTION
    // ═══════════════════════════════════════════════════════════════
    let detectedComplexity: 'simple' | 'medium' | 'complex' = 'medium';

    const complexityScore = COMPLEXITY_INDICATORS.complex.filter(kw => lowerIntent.includes(kw)).length;
    const simplicityScore = COMPLEXITY_INDICATORS.simple.filter(kw => lowerIntent.includes(kw)).length;

    if (complexityScore >= 4 || wordCount > 100) {
        detectedComplexity = 'complex';
        score += 5; // Bonus for describing complex logic
    } else if (simplicityScore >= 2 && complexityScore < 2) {
        detectedComplexity = 'simple';
    }

    // ═══════════════════════════════════════════════════════════════
    // 11. ESTIMATE NODE COUNT
    // ═══════════════════════════════════════════════════════════════
    let estimatedNodes = 3; // Base: trigger + processing + output

    if (detectedTrigger) estimatedNodes += 0; // Already counted
    if (usesAI) estimatedNodes += 2; // AI Agent + Parser
    if (complexityScore >= 2) estimatedNodes += complexityScore;
    if (hasOutput) estimatedNodes += 1;
    if (detectedComplexity === 'complex') estimatedNodes += 3;
    if (mentionedTools.length > 1) estimatedNodes += mentionedTools.length - 1;

    // Cap the estimate
    estimatedNodes = Math.min(estimatedNodes, 20);

    // ═══════════════════════════════════════════════════════════════
    // 12. SPECIFIC PATTERN SUGGESTIONS
    // ═══════════════════════════════════════════════════════════════

    // Check for fan-out without merge
    const hasBranching = /\b(if|switch|route|depending)\b/i.test(lowerIntent);
    const hasMerge = /\b(merge|consolidate|combine)\b/i.test(lowerIntent);

    if (hasBranching && !hasMerge && wordCount > 40) {
        suggestions.push({
            text: {
                EN: 'Tip: When using conditional branches, consolidate with a Merge node before output',
                DE: 'Tipp: Bei bedingten Verzweigungen vor der Ausgabe mit einem Merge-Knoten konsolidieren'
            },
            priority: 2
        });
    }

    // Check for batch processing need
    const mentionsMultiple = /\b(all|each|every|batch|bulk|alle|jede|jeder|stapel)\b/i.test(lowerIntent);
    if (mentionsMultiple && !lowerIntent.includes('batch')) {
        suggestions.push({
            text: {
                EN: 'Tip: For processing multiple items, use Split In Batches to avoid rate limits',
                DE: 'Tipp: Für die Verarbeitung mehrerer Elemente Split In Batches verwenden, um Rate-Limits zu vermeiden'
            },
            priority: 2
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 13. EXPRESSION SAFETY CHECK
    // ═══════════════════════════════════════════════════════════════
    const mentionsFields = /\b(field|data|json|variable|feld|daten)\b/i.test(lowerIntent);
    if (mentionsFields && !lowerIntent.includes('default') && !lowerIntent.includes('fallback')) {
        suggestions.push({
            text: {
                EN: 'Tip: Use fallback values in expressions: {{ $json.field || "default" }}',
                DE: 'Tipp: Fallback-Werte in Expressions verwenden: {{ $json.field || "default" }}'
            },
            priority: 3
        });
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Sort suggestions by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    return {
        score,
        issues,
        suggestions,
        estimatedNodes,
        detectedTrigger,
        detectedComplexity
    };
}

// Get display color based on score - ADJUSTED THRESHOLDS
export function getScoreColor(score: number): string {
    if (score >= 75) return 'emerald';
    if (score >= 55) return 'yellow';
    if (score >= 35) return 'orange';
    return 'red';
}

// Get score label - ADJUSTED THRESHOLDS
export function getScoreLabel(score: number, language: Language): string {
    if (language === 'DE') {
        if (score >= 75) return 'Ausgezeichnet';
        if (score >= 55) return 'Gut';
        if (score >= 35) return 'Verbesserungswürdig';
        return 'Mehr Details benötigt';
    }
    if (score >= 75) return 'Excellent';
    if (score >= 55) return 'Good';
    if (score >= 35) return 'Needs Work';
    return 'Needs More Detail';
}
