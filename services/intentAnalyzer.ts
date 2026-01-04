// Intent Analyzer Service for Intelligent Fallback Mode
// Analyzes user intent when no API key is available

import { BlockType, Language, WorkflowBlock } from '../types';
import { getNodesByCategory, getNodeById, N8NNode } from '../data/n8nNodes';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type IntentDomain =
    | 'media-processing'   // audio, video, file conversion
    | 'email-automation'   // email handling, responses
    | 'data-sync'          // database, API, sheets sync
    | 'ai-conversational'  // chatbots, Q&A
    | 'form-handling'      // form submissions, webhooks
    | 'social-media'       // posting, scheduling
    | 'scheduling'         // cron, scheduled tasks
    | 'support-ticket'     // customer support routing
    | 'generic';           // fallback

export interface DetectedIntent {
    domain: IntentDomain;
    triggerType: string;
    triggerNode: string;
    suggestedNodes: string[];
    complexity: 'simple' | 'medium' | 'complex';
    keywords: string[];
    outputType: 'email' | 'webhook' | 'database' | 'notification' | 'file' | 'api';
}

// ═══════════════════════════════════════════════════════════════
// Keyword Mappings
// ═══════════════════════════════════════════════════════════════

const DOMAIN_KEYWORDS: Record<IntentDomain, string[]> = {
    'media-processing': [
        'mp3', 'audio', 'video', 'mp4', 'wav', 'file', 'upload', 'download',
        'convert', 'mix', 'merge', 'track', 'music', 'sound', 'media',
        'datei', 'hochladen', 'herunterladen', 'konvertieren', 'mischen'
    ],
    'email-automation': [
        'email', 'e-mail', 'gmail', 'mail', 'inbox', 'reply', 'forward', 'send mail',
        'postfach', 'antworten', 'weiterleiten', 'e-mail senden'
    ],
    'data-sync': [
        'database', 'postgres', 'mysql', 'sync', 'sheet', 'spreadsheet', 'airtable',
        'notion', 'api', 'fetch', 'store', 'save', 'record',
        'datenbank', 'synchronisieren', 'tabelle', 'speichern', 'datensatz'
    ],
    'ai-conversational': [
        'chat', 'chatbot', 'conversation', 'ai assistant', 'question', 'answer', 'bot',
        'konversation', 'assistent', 'frage', 'antwort'
    ],
    'form-handling': [
        'form', 'formular', 'submit', 'submission', 'input', 'webhook', 'eingabe',
        'absenden', 'übermittlung'
    ],
    'social-media': [
        'twitter', 'linkedin', 'facebook', 'instagram', 'post', 'tweet', 'social',
        'posten', 'soziale medien'
    ],
    'scheduling': [
        'schedule', 'cron', 'every day', 'daily', 'hourly', 'morning', 'evening',
        'zeitplan', 'täglich', 'stündlich', 'morgens', 'abends', 'jeden tag'
    ],
    'support-ticket': [
        'support', 'ticket', 'helpdesk', 'customer', 'issue', 'problem', 'route',
        'kunde', 'anfrage', 'weiterleiten'
    ],
    'generic': []
};

const TRIGGER_MAPPINGS: Record<IntentDomain, { type: string; nodeId: string }> = {
    'media-processing': { type: 'Form/Webhook', nodeId: 'form-trigger' },
    'email-automation': { type: 'Gmail Trigger', nodeId: 'gmail-trigger' },
    'data-sync': { type: 'Schedule', nodeId: 'schedule' },
    'ai-conversational': { type: 'Chat Trigger', nodeId: 'chat-trigger' },
    'form-handling': { type: 'Form Trigger', nodeId: 'form-trigger' },
    'social-media': { type: 'Schedule', nodeId: 'schedule' },
    'scheduling': { type: 'Schedule Trigger', nodeId: 'schedule' },
    'support-ticket': { type: 'Webhook/Email', nodeId: 'webhook' },
    'generic': { type: 'Webhook', nodeId: 'webhook' }
};

const OUTPUT_KEYWORDS: Record<DetectedIntent['outputType'], string[]> = {
    'email': ['email', 'e-mail', 'mail', 'send email', 'gmail', 'senden', 'e-mail senden'],
    'webhook': ['respond', 'response', 'return', 'api', 'antwort', 'zurück'],
    'database': ['store', 'save', 'database', 'record', 'speichern', 'datenbank'],
    'notification': ['notify', 'slack', 'discord', 'telegram', 'benachrichtigen'],
    'file': ['download', 'file', 'export', 'herunterladen', 'datei', 'exportieren'],
    'api': ['api', 'http', 'request', 'call', 'anfrage', 'aufrufen']
};

// ═══════════════════════════════════════════════════════════════
// Core Analysis Functions
// ═══════════════════════════════════════════════════════════════

export function analyzeIntent(userIntent: string): DetectedIntent {
    const lowerIntent = userIntent.toLowerCase();
    const words = lowerIntent.split(/\s+/);

    // Detect domain by keyword matching
    let detectedDomain: IntentDomain = 'generic';
    let maxMatches = 0;
    let matchedKeywords: string[] = [];

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        const matches = keywords.filter(kw => lowerIntent.includes(kw));
        if (matches.length > maxMatches) {
            maxMatches = matches.length;
            detectedDomain = domain as IntentDomain;
            matchedKeywords = matches;
        }
    }

    // Override trigger if explicitly mentioned
    const triggerInfo = detectExplicitTrigger(lowerIntent) || TRIGGER_MAPPINGS[detectedDomain];

    // Detect output type
    const outputType = detectOutputType(lowerIntent);

    // Detect complexity
    const complexity = detectComplexity(lowerIntent, words.length);

    // Build suggested nodes based on domain
    const suggestedNodes = buildSuggestedNodes(detectedDomain, outputType);

    return {
        domain: detectedDomain,
        triggerType: triggerInfo.type,
        triggerNode: triggerInfo.nodeId,
        suggestedNodes,
        complexity,
        keywords: matchedKeywords,
        outputType
    };
}

function detectExplicitTrigger(intent: string): { type: string; nodeId: string } | null {
    if (intent.includes('form') || intent.includes('formular')) {
        return { type: 'Form Trigger', nodeId: 'form-trigger' };
    }
    if (intent.includes('webhook')) {
        return { type: 'Webhook', nodeId: 'webhook' };
    }
    if (intent.includes('schedule') || intent.includes('every') || intent.includes('täglich') || intent.includes('daily')) {
        return { type: 'Schedule Trigger', nodeId: 'schedule' };
    }
    if (intent.includes('gmail') || intent.includes('email trigger') || intent.includes('when email')) {
        return { type: 'Gmail Trigger', nodeId: 'gmail-trigger' };
    }
    if (intent.includes('chat')) {
        return { type: 'Chat Trigger', nodeId: 'chat-trigger' };
    }
    return null;
}

function detectOutputType(intent: string): DetectedIntent['outputType'] {
    for (const [outputType, keywords] of Object.entries(OUTPUT_KEYWORDS)) {
        if (keywords.some(kw => intent.includes(kw))) {
            return outputType as DetectedIntent['outputType'];
        }
    }
    return 'notification'; // default
}

function detectComplexity(intent: string, wordCount: number): 'simple' | 'medium' | 'complex' {
    const complexIndicators = ['if', 'check', 'validate', 'route', 'branch', 'multiple', 'retry'];
    const hasComplexity = complexIndicators.some(ind => intent.includes(ind));

    if (wordCount > 100 || hasComplexity) return 'complex';
    if (wordCount > 50) return 'medium';
    return 'simple';
}

function buildSuggestedNodes(domain: IntentDomain, outputType: DetectedIntent['outputType']): string[] {
    const nodes: string[] = [];

    // Domain-specific nodes
    switch (domain) {
        case 'media-processing':
            nodes.push('http-request', 'code', 'edit-fields');
            break;
        case 'email-automation':
            nodes.push('langchain-agent', 'structured-output-parser', 'gmail');
            break;
        case 'data-sync':
            nodes.push('postgres', 'google-sheets', 'edit-fields', 'merge');
            break;
        case 'ai-conversational':
            nodes.push('langchain-agent', 'memory-buffer', 'structured-output-parser');
            break;
        case 'form-handling':
            nodes.push('edit-fields', 'if', 'respond-to-webhook');
            break;
        case 'social-media':
            nodes.push('switch', 'twitter', 'linkedin');
            break;
        case 'scheduling':
            nodes.push('http-request', 'edit-fields');
            break;
        case 'support-ticket':
            nodes.push('langchain-agent', 'switch', 'slack');
            break;
        default:
            nodes.push('edit-fields', 'if');
    }

    // Output-specific nodes
    switch (outputType) {
        case 'email':
            nodes.push('gmail', 'send-email');
            break;
        case 'webhook':
            nodes.push('respond-to-webhook');
            break;
        case 'database':
            nodes.push('postgres', 'airtable');
            break;
        case 'notification':
            nodes.push('slack', 'discord');
            break;
        case 'file':
            nodes.push('google-drive', 'http-request');
            break;
        case 'api':
            nodes.push('http-request', 'respond-to-webhook');
            break;
    }

    return [...new Set(nodes)]; // deduplicate
}

// ═══════════════════════════════════════════════════════════════
// Fallback Block Generation
// ═══════════════════════════════════════════════════════════════

export function buildFallbackBlocks(
    userIntent: string,
    language: Language
): Partial<WorkflowBlock>[] {
    const intent = analyzeIntent(userIntent);
    const isDe = language === 'DE';

    // Get actual node info
    const triggerNode = getNodeById(intent.triggerNode);
    const triggerName = triggerNode?.name || 'Webhook';

    // Build contextual descriptions
    const ingestionContent = buildIngestionContent(intent, triggerName, isDe);
    const logicContent = buildLogicContent(intent, isDe);
    const storageContent = buildStorageContent(intent, isDe);

    return [
        {
            type: BlockType.INGESTION,
            content: ingestionContent.text,
            riskLevel: 'SAFE',
            outputs: ingestionContent.outputs,
            nodes: ingestionContent.nodes
        },
        {
            type: BlockType.LOGIC,
            content: logicContent.text,
            riskLevel: intent.complexity === 'complex' ? 'COMPLEX' : 'SAFE',
            outputs: logicContent.outputs,
            nodes: logicContent.nodes
        },
        {
            type: BlockType.STORAGE,
            content: storageContent.text,
            riskLevel: 'SAFE',
            outputs: [],
            nodes: storageContent.nodes
        }
    ];
}

interface BlockContent {
    text: string;
    outputs: string[];
    nodes: { name: string; type: string; risk: 'LOW' | 'MED' | 'HIGH' }[];
}

function buildIngestionContent(intent: DetectedIntent, triggerName: string, isDe: boolean): BlockContent {
    const domain = intent.domain;

    // Domain-specific ingestion instructions
    const domainInstructions: Record<IntentDomain, { en: string; de: string; outputs: string[] }> = {
        'media-processing': {
            en: `1. **${triggerName}**: Accept file uploads (MP3, video files, etc.).\n2. **Edit Fields**: Extract file metadata (filename, size, format).\n3. **HTTP Request**: If external processing needed, send to processing API.\n- CONSTRAINT: Validate file types before processing.`,
            de: `1. **${triggerName}**: Datei-Uploads akzeptieren (MP3, Video-Dateien, etc.).\n2. **Edit Fields**: Datei-Metadaten extrahieren (Dateiname, Größe, Format).\n3. **HTTP Request**: Bei Bedarf externer Verarbeitung an Processing-API senden.\n- CONSTRAINT: Dateitypen vor Verarbeitung validieren.`,
            outputs: ['json.file', 'json.metadata', 'json.format']
        },
        'email-automation': {
            en: `1. **${triggerName}**: Listen for incoming emails.\n2. **AI Agent (LangChain)**: Connect a \`Structured Output Parser\`. Extract \`sender\`, \`subject\`, \`urgency\`, and \`intent\` from email body.\n- CONSTRAINT: Do NOT use regex. Use the Agent for robust extraction.`,
            de: `1. **${triggerName}**: Auf eingehende E-Mails lauschen.\n2. **AI Agent (LangChain)**: Verbinde einen \`Structured Output Parser\`. Extrahiere \`sender\`, \`subject\`, \`urgency\` und \`intent\` aus dem E-Mail-Body.\n- CONSTRAINT: KEINE Regex verwenden. Nutze den Agenten für robuste Extraktion.`,
            outputs: ['json.sender', 'json.subject', 'json.urgency', 'json.intent']
        },
        'data-sync': {
            en: `1. **${triggerName}**: Run on schedule or webhook trigger.\n2. **HTTP Request/Database**: Fetch source data.\n3. **Edit Fields**: Normalize and transform data structure.\n- CONSTRAINT: Use batch processing for large datasets.`,
            de: `1. **${triggerName}**: Nach Zeitplan oder Webhook-Trigger ausführen.\n2. **HTTP Request/Datenbank**: Quelldaten abrufen.\n3. **Edit Fields**: Datenstruktur normalisieren und transformieren.\n- CONSTRAINT: Batch-Verarbeitung für große Datensätze verwenden.`,
            outputs: ['json.data', 'json.recordCount']
        },
        'ai-conversational': {
            en: `1. **${triggerName}**: Accept chat messages.\n2. **AI Agent**: Process conversation with memory context.\n3. **Window Buffer Memory**: Maintain conversation history (last 10 messages).\n- CONSTRAINT: Use structured output for any data extraction.`,
            de: `1. **${triggerName}**: Chat-Nachrichten akzeptieren.\n2. **AI Agent**: Konversation mit Memory-Kontext verarbeiten.\n3. **Window Buffer Memory**: Konversationsverlauf pflegen (letzte 10 Nachrichten).\n- CONSTRAINT: Strukturierten Output für jede Datenextraktion verwenden.`,
            outputs: ['json.response', 'json.sessionId']
        },
        'form-handling': {
            en: `1. **${triggerName}**: Receive form submissions.\n2. **Edit Fields**: Validate and normalize input fields.\n3. **IF Node**: Check for required fields (name, email).\n- CONSTRAINT: Always validate input before processing.`,
            de: `1. **${triggerName}**: Formular-Übermittlungen empfangen.\n2. **Edit Fields**: Eingabefelder validieren und normalisieren.\n3. **IF Node**: Auf erforderliche Felder prüfen (Name, E-Mail).\n- CONSTRAINT: Eingaben immer vor Verarbeitung validieren.`,
            outputs: ['json.formData', 'json.isValid']
        },
        'social-media': {
            en: `1. **${triggerName}**: Check for scheduled posts.\n2. **Edit Fields**: Format content for each platform.\n3. **Switch Node**: Route to appropriate platform node.\n- CONSTRAINT: Respect character limits per platform.`,
            de: `1. **${triggerName}**: Auf geplante Posts prüfen.\n2. **Edit Fields**: Inhalt für jede Plattform formatieren.\n3. **Switch Node**: An entsprechende Plattform-Node routen.\n- CONSTRAINT: Zeichenlimits pro Plattform beachten.`,
            outputs: ['json.content', 'json.platform']
        },
        'scheduling': {
            en: `1. **${triggerName}**: Execute on defined schedule.\n2. **HTTP Request**: Fetch or trigger external systems.\n3. **Edit Fields**: Prepare data for processing.\n- CONSTRAINT: Include timeout handling for external calls.`,
            de: `1. **${triggerName}**: Nach definiertem Zeitplan ausführen.\n2. **HTTP Request**: Externe Systeme abrufen oder triggern.\n3. **Edit Fields**: Daten für Verarbeitung vorbereiten.\n- CONSTRAINT: Timeout-Handling für externe Aufrufe einschließen.`,
            outputs: ['json.result', 'json.timestamp']
        },
        'support-ticket': {
            en: `1. **${triggerName}**: Listen for support requests.\n2. **AI Agent (LangChain)**: Classify ticket by \`category\`, \`severity\`, and \`sentiment\`.\n3. **Structured Output Parser**: Ensure consistent classification format.\n- CONSTRAINT: Use AI for classification, not regex.`,
            de: `1. **${triggerName}**: Auf Support-Anfragen lauschen.\n2. **AI Agent (LangChain)**: Ticket nach \`category\`, \`severity\` und \`sentiment\` klassifizieren.\n3. **Structured Output Parser**: Konsistentes Klassifikationsformat sicherstellen.\n- CONSTRAINT: KI für Klassifikation verwenden, keine Regex.`,
            outputs: ['json.category', 'json.severity', 'json.sentiment']
        },
        'generic': {
            en: `1. **${triggerName}**: Accept incoming requests.\n2. **Edit Fields**: Extract and normalize relevant data.\n- CONSTRAINT: Validate all inputs before processing.`,
            de: `1. **${triggerName}**: Eingehende Anfragen akzeptieren.\n2. **Edit Fields**: Relevante Daten extrahieren und normalisieren.\n- CONSTRAINT: Alle Eingaben vor Verarbeitung validieren.`,
            outputs: ['json.data']
        }
    };

    const instruction = domainInstructions[domain] || domainInstructions['generic'];
    const triggerNode = getNodeById(intent.triggerNode);

    const nodes: BlockContent['nodes'] = [
        { name: triggerName, type: triggerNode?.type || 'n8n-nodes-base.webhook', risk: 'LOW' }
    ];

    // Add domain-specific nodes
    if (domain === 'email-automation' || domain === 'support-ticket' || domain === 'ai-conversational') {
        nodes.push({ name: 'AI Agent', type: '@n8n/n8n-nodes-langchain.agent', risk: 'LOW' });
    }
    if (domain === 'media-processing' || domain === 'data-sync') {
        nodes.push({ name: 'Edit Fields', type: 'n8n-nodes-base.set', risk: 'LOW' });
    }

    return {
        text: isDe ? instruction.de : instruction.en,
        outputs: instruction.outputs,
        nodes
    };
}

function buildLogicContent(intent: DetectedIntent, isDe: boolean): BlockContent {
    const domain = intent.domain;

    const domainLogic: Record<IntentDomain, { en: string; de: string; outputs: string[] }> = {
        'media-processing': {
            en: `1. **Code Node**: Process files (mixing, conversion, transformation).\n2. **IF Node**: Validate processing result.\n3. **Error handling**: If processing fails, notify user.\n- TIP: Use external APIs for heavy media processing.`,
            de: `1. **Code Node**: Dateien verarbeiten (Mischen, Konvertierung, Transformation).\n2. **IF Node**: Verarbeitungsergebnis validieren.\n3. **Error Handling**: Bei Fehlschlag Benutzer benachrichtigen.\n- TIPP: Externe APIs für aufwändige Medienverarbeitung nutzen.`,
            outputs: ['json.processedFile', 'json.status']
        },
        'email-automation': {
            en: `1. **Switch Node**: Route based on \`json.intent\` (Support vs Sales vs Info).\n2. **AI Agent**: Draft response in detected language.\n3. **Merge Node**: Consolidate branches before output.\n- CONSTRAINT: Do NOT duplicate output nodes.`,
            de: `1. **Switch Node**: Route basierend auf \`json.intent\` (Support vs Sales vs Info).\n2. **AI Agent**: Antwort in erkannter Sprache entwerfen.\n3. **Merge Node**: Zweige vor Output konsolidieren.\n- CONSTRAINT: Output-Nodes NICHT duplizieren.`,
            outputs: ['json.response_draft']
        },
        'data-sync': {
            en: `1. **Merge Node**: Combine data from multiple sources.\n2. **Edit Fields**: Calculate derived fields.\n3. **IF Node**: Check for conflicts or missing data.\n- CONSTRAINT: Use fallback values for null fields.`,
            de: `1. **Merge Node**: Daten aus mehreren Quellen kombinieren.\n2. **Edit Fields**: Abgeleitete Felder berechnen.\n3. **IF Node**: Auf Konflikte oder fehlende Daten prüfen.\n- CONSTRAINT: Fallback-Werte für Null-Felder verwenden.`,
            outputs: ['json.mergedData', 'json.hasConflicts']
        },
        'ai-conversational': {
            en: `1. **AI Agent**: Generate context-aware response.\n2. **Structured Output Parser**: Parse any structured data from response.\n3. **IF Node**: Route special commands (e.g., /help, /close).\n- CONSTRAINT: Maintain conversation context via Memory.`,
            de: `1. **AI Agent**: Kontextbewusste Antwort generieren.\n2. **Structured Output Parser**: Strukturierte Daten aus Antwort parsen.\n3. **IF Node**: Spezielle Befehle routen (z.B. /help, /close).\n- CONSTRAINT: Konversationskontext via Memory pflegen.`,
            outputs: ['json.aiResponse', 'json.parsed']
        },
        'form-handling': {
            en: `1. **IF Node**: Validate form data completeness.\n2. **Edit Fields**: Transform data for storage format.\n3. **Merge Node**: Handle success/error paths.\n- CONSTRAINT: Always respond to webhook.`,
            de: `1. **IF Node**: Vollständigkeit der Formulardaten validieren.\n2. **Edit Fields**: Daten für Speicherformat transformieren.\n3. **Merge Node**: Erfolgs-/Fehlerpfade handhaben.\n- CONSTRAINT: Immer auf Webhook antworten.`,
            outputs: ['json.transformedData']
        },
        'social-media': {
            en: `1. **Switch Node**: Route by target platform.\n2. **AI Agent**: Adapt content length/style per platform.\n3. **Merge Node**: Consolidate before status update.\n- CONSTRAINT: Respect API rate limits.`,
            de: `1. **Switch Node**: Nach Zielplattform routen.\n2. **AI Agent**: Inhaltslänge/-stil pro Plattform anpassen.\n3. **Merge Node**: Vor Statusupdate konsolidieren.\n- CONSTRAINT: API Rate-Limits beachten.`,
            outputs: ['json.adaptedContent', 'json.platform']
        },
        'scheduling': {
            en: `1. **IF Node**: Check if action is needed.\n2. **Split In Batches**: Process large datasets.\n3. **Wait Node**: Add delays between API calls.\n- CONSTRAINT: Implement retry logic for failures.`,
            de: `1. **IF Node**: Prüfen, ob Aktion erforderlich.\n2. **Split In Batches**: Große Datensätze verarbeiten.\n3. **Wait Node**: Verzögerungen zwischen API-Aufrufen.\n- CONSTRAINT: Retry-Logik für Fehler implementieren.`,
            outputs: ['json.processed', 'json.batchId']
        },
        'support-ticket': {
            en: `1. **Switch Node**: Route by \`json.severity\` (Critical/High/Normal).\n2. **AI Agent**: Draft initial response.\n3. **Merge Node**: Consolidate routing branches.\n- CONSTRAINT: Critical tickets must trigger immediate notification.`,
            de: `1. **Switch Node**: Nach \`json.severity\` routen (Kritisch/Hoch/Normal).\n2. **AI Agent**: Erste Antwort entwerfen.\n3. **Merge Node**: Routing-Zweige konsolidieren.\n- CONSTRAINT: Kritische Tickets müssen sofortige Benachrichtigung auslösen.`,
            outputs: ['json.routedTo', 'json.draftResponse']
        },
        'generic': {
            en: `1. **IF Node**: Basic conditional logic.\n2. **Edit Fields**: Data transformation.\n3. **Merge Node**: Consolidate branches.\n- CONSTRAINT: Use expression safety: \`{{ $json.field || 'default' }}\`.`,
            de: `1. **IF Node**: Grundlegende bedingte Logik.\n2. **Edit Fields**: Datentransformation.\n3. **Merge Node**: Zweige konsolidieren.\n- CONSTRAINT: Expression-Sicherheit nutzen: \`{{ $json.field || 'default' }}\`.`,
            outputs: ['json.result']
        }
    };

    const logic = domainLogic[domain] || domainLogic['generic'];

    const nodes: BlockContent['nodes'] = [];

    if (domain === 'media-processing') {
        nodes.push({ name: 'Code', type: 'n8n-nodes-base.code', risk: 'MED' });
    }
    if (['email-automation', 'support-ticket', 'ai-conversational', 'social-media'].includes(domain)) {
        nodes.push({ name: 'Switch', type: 'n8n-nodes-base.switch', risk: 'LOW' });
        nodes.push({ name: 'AI Agent', type: '@n8n/n8n-nodes-langchain.agent', risk: 'MED' });
    }
    nodes.push({ name: 'Merge', type: 'n8n-nodes-base.merge', risk: 'LOW' });

    return {
        text: isDe ? logic.de : logic.en,
        outputs: logic.outputs,
        nodes
    };
}

function buildStorageContent(intent: DetectedIntent, isDe: boolean): BlockContent {
    const outputType = intent.outputType;

    const outputInstructions: Record<DetectedIntent['outputType'], { en: string; de: string; nodes: BlockContent['nodes'] }> = {
        'email': {
            en: `1. **Gmail/Send Email**: Send result to user.\n- Use expression: \`{{ $json.email || 'fallback@example.com' }}\` for safety.\n2. **Error handling**: If send fails, retry or log error.`,
            de: `1. **Gmail/E-Mail senden**: Ergebnis an Benutzer senden.\n- Verwende Ausdruck: \`{{ $json.email || 'fallback@example.com' }}\` zur Sicherheit.\n2. **Error Handling**: Bei Fehlschlag wiederholen oder Fehler loggen.`,
            nodes: [{ name: 'Gmail', type: 'n8n-nodes-base.gmail', risk: 'MED' }]
        },
        'webhook': {
            en: `1. **Respond to Webhook**: Return result to caller.\n- Include status code and structured response body.\n2. **Graceful degradation**: Return partial data if some fields are missing.`,
            de: `1. **Respond to Webhook**: Ergebnis an Aufrufer zurücksenden.\n- Statuscode und strukturierten Response-Body einschließen.\n2. **Graceful Degradation**: Teildaten zurückgeben, wenn Felder fehlen.`,
            nodes: [{ name: 'Respond to Webhook', type: 'n8n-nodes-base.respondToWebhook', risk: 'LOW' }]
        },
        'database': {
            en: `1. **Postgres/Airtable**: Upsert record.\n- Use expression: \`{{ $json.id || 'generated-' + $now.toMillis() }}\` for ID safety.\n2. **Error Trigger**: Set up error workflow for database failures.`,
            de: `1. **Postgres/Airtable**: Datensatz upserten.\n- Verwende Ausdruck: \`{{ $json.id || 'generated-' + $now.toMillis() }}\` für ID-Sicherheit.\n2. **Error Trigger**: Error-Workflow für Datenbankfehler einrichten.`,
            nodes: [{ name: 'Postgres', type: 'n8n-nodes-base.postgres', risk: 'LOW' }]
        },
        'notification': {
            en: `1. **Slack/Discord**: Send notification to channel.\n- Use graceful degradation if optional fields are missing.\n2. **Format message**: Use markdown for rich formatting.`,
            de: `1. **Slack/Discord**: Benachrichtigung an Channel senden.\n- Graceful Degradation verwenden, wenn optionale Felder fehlen.\n2. **Nachricht formatieren**: Markdown für Rich-Formatting nutzen.`,
            nodes: [{ name: 'Slack', type: 'n8n-nodes-base.slack', risk: 'LOW' }]
        },
        'file': {
            en: `1. **Google Drive/HTTP Request**: Upload or return file.\n- Include download link in response.\n2. **Cleanup**: Delete temporary files after processing.`,
            de: `1. **Google Drive/HTTP Request**: Datei hochladen oder zurückgeben.\n- Download-Link in Antwort einschließen.\n2. **Cleanup**: Temporäre Dateien nach Verarbeitung löschen.`,
            nodes: [{ name: 'Google Drive', type: 'n8n-nodes-base.googleDrive', risk: 'LOW' }]
        },
        'api': {
            en: `1. **HTTP Request**: Call external API with results.\n- Use Retry on Fail for resilience.\n2. **Respond to Webhook**: Return API response to original caller.`,
            de: `1. **HTTP Request**: Externe API mit Ergebnissen aufrufen.\n- Retry on Fail für Resilienz nutzen.\n2. **Respond to Webhook**: API-Antwort an ursprünglichen Aufrufer zurücksenden.`,
            nodes: [{ name: 'HTTP Request', type: 'n8n-nodes-base.httpRequest', risk: 'MED' }]
        }
    };

    const output = outputInstructions[outputType] || outputInstructions['notification'];

    return {
        text: isDe ? output.de : output.en,
        outputs: [],
        nodes: output.nodes
    };
}
