// Comprehensive n8n Node Knowledge Base
// Contains ~80 core nodes organized by category for prompt generation

export interface N8NNode {
  id: string;
  name: string;
  type: string; // Full n8n node type
  category: 'trigger' | 'ai' | 'logic' | 'action' | 'data' | 'utility';
  description: { EN: string; DE: string };
  recommended?: boolean;
  useWith?: string[]; // Commonly paired nodes
  avoidWith?: string[]; // Anti-patterns
}

export const N8N_NODES: N8NNode[] = [
  // ═══════════════════════════════════════════════════════════════
  // TRIGGERS - Starting points for workflows
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'webhook',
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    category: 'trigger',
    description: {
      EN: 'HTTP endpoint that triggers workflow on incoming requests',
      DE: 'HTTP-Endpunkt, der Workflow bei eingehenden Anfragen auslöst'
    },
    recommended: true,
    useWith: ['edit-fields', 'if', 'respond-to-webhook']
  },
  {
    id: 'schedule',
    name: 'Schedule Trigger',
    type: 'n8n-nodes-base.scheduleTrigger',
    category: 'trigger',
    description: {
      EN: 'Cron-based trigger for scheduled executions',
      DE: 'Cron-basierter Trigger für geplante Ausführungen'
    },
    recommended: true
  },
  {
    id: 'gmail-trigger',
    name: 'Gmail Trigger',
    type: 'n8n-nodes-base.gmailTrigger',
    category: 'trigger',
    description: {
      EN: 'Triggers when new email arrives in Gmail',
      DE: 'Wird ausgelöst, wenn neue E-Mail in Gmail ankommt'
    },
    useWith: ['langchain-agent', 'switch', 'gmail']
  },
  {
    id: 'slack-trigger',
    name: 'Slack Trigger',
    type: 'n8n-nodes-base.slackTrigger',
    category: 'trigger',
    description: {
      EN: 'Triggers on Slack events (messages, reactions, etc.)',
      DE: 'Wird bei Slack-Ereignissen ausgelöst (Nachrichten, Reaktionen, etc.)'
    }
  },
  {
    id: 'google-sheets-trigger',
    name: 'Google Sheets Trigger',
    type: 'n8n-nodes-base.googleSheetsTrigger',
    category: 'trigger',
    description: {
      EN: 'Triggers when rows are added or updated',
      DE: 'Wird ausgelöst, wenn Zeilen hinzugefügt oder aktualisiert werden'
    }
  },
  {
    id: 'airtable-trigger',
    name: 'Airtable Trigger',
    type: 'n8n-nodes-base.airtableTrigger',
    category: 'trigger',
    description: {
      EN: 'Triggers on new/updated Airtable records',
      DE: 'Wird bei neuen/aktualisierten Airtable-Datensätzen ausgelöst'
    }
  },
  {
    id: 'notion-trigger',
    name: 'Notion Trigger',
    type: 'n8n-nodes-base.notionTrigger',
    category: 'trigger',
    description: {
      EN: 'Triggers on Notion database changes',
      DE: 'Wird bei Notion-Datenbankänderungen ausgelöst'
    }
  },
  {
    id: 'form-trigger',
    name: 'n8n Form Trigger',
    type: 'n8n-nodes-base.formTrigger',
    category: 'trigger',
    description: {
      EN: 'Creates a form that triggers workflow on submission',
      DE: 'Erstellt ein Formular, das Workflow bei Absendung auslöst'
    }
  },
  {
    id: 'chat-trigger',
    name: 'Chat Trigger',
    type: '@n8n/n8n-nodes-langchain.chatTrigger',
    category: 'trigger',
    description: {
      EN: 'Chat interface trigger for conversational AI',
      DE: 'Chat-Schnittstellen-Trigger für konversationelle KI'
    },
    useWith: ['langchain-agent', 'memory-buffer']
  },
  {
    id: 'error-trigger',
    name: 'Error Trigger',
    type: 'n8n-nodes-base.errorTrigger',
    category: 'trigger',
    description: {
      EN: 'Triggers when another workflow fails - ESSENTIAL for error handling',
      DE: 'Wird ausgelöst, wenn ein anderer Workflow fehlschlägt - ESSENTIELL für Fehlerbehandlung'
    },
    recommended: true
  },

  // ═══════════════════════════════════════════════════════════════
  // AI / LLM NODES - Modern AI integration
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'langchain-agent',
    name: 'AI Agent',
    type: '@n8n/n8n-nodes-langchain.agent',
    category: 'ai',
    description: {
      EN: 'LangChain-powered agent for complex reasoning and tool use',
      DE: 'LangChain-basierter Agent für komplexes Reasoning und Tool-Nutzung'
    },
    recommended: true,
    useWith: ['structured-output-parser', 'memory-buffer', 'tool-workflow']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: '@n8n/n8n-nodes-langchain.lmOpenAi',
    category: 'ai',
    description: {
      EN: 'GPT models (GPT-4, GPT-4o, GPT-3.5)',
      DE: 'GPT-Modelle (GPT-4, GPT-4o, GPT-3.5)'
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: '@n8n/n8n-nodes-langchain.lmAnthropic',
    category: 'ai',
    description: {
      EN: 'Claude models (Claude 3 Opus, Sonnet, Haiku)',
      DE: 'Claude-Modelle (Claude 3 Opus, Sonnet, Haiku)'
    }
  },
  {
    id: 'ollama',
    name: 'Ollama',
    type: '@n8n/n8n-nodes-langchain.lmOllama',
    category: 'ai',
    description: {
      EN: 'Local LLM via Ollama (Llama, Mistral, etc.)',
      DE: 'Lokale LLM über Ollama (Llama, Mistral, etc.)'
    }
  },
  {
    id: 'structured-output-parser',
    name: 'Structured Output Parser',
    type: '@n8n/n8n-nodes-langchain.outputParserStructured',
    category: 'ai',
    description: {
      EN: 'Parses LLM output into structured JSON - CRITICAL for data extraction',
      DE: 'Parst LLM-Ausgabe in strukturiertes JSON - KRITISCH für Datenextraktion'
    },
    recommended: true,
    useWith: ['langchain-agent']
  },
  {
    id: 'basic-llm-chain',
    name: 'Basic LLM Chain',
    type: '@n8n/n8n-nodes-langchain.chainLlm',
    category: 'ai',
    description: {
      EN: 'Simple prompt-to-response chain',
      DE: 'Einfache Prompt-zu-Antwort-Kette'
    }
  },
  {
    id: 'summarization-chain',
    name: 'Summarization Chain',
    type: '@n8n/n8n-nodes-langchain.chainSummarization',
    category: 'ai',
    description: {
      EN: 'Summarizes long text documents',
      DE: 'Fasst lange Textdokumente zusammen'
    }
  },
  {
    id: 'text-classifier',
    name: 'Text Classifier',
    type: '@n8n/n8n-nodes-langchain.textClassifier',
    category: 'ai',
    description: {
      EN: 'Classifies text into predefined categories',
      DE: 'Klassifiziert Text in vordefinierte Kategorien'
    }
  },
  {
    id: 'memory-buffer',
    name: 'Window Buffer Memory',
    type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
    category: 'ai',
    description: {
      EN: 'Conversation memory for chat context',
      DE: 'Konversationsspeicher für Chat-Kontext'
    },
    useWith: ['langchain-agent', 'chat-trigger']
  },
  {
    id: 'embeddings-openai',
    name: 'OpenAI Embeddings',
    type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
    category: 'ai',
    description: {
      EN: 'Generate vector embeddings for semantic search',
      DE: 'Generiert Vektor-Embeddings für semantische Suche'
    }
  },
  {
    id: 'vector-store-pinecone',
    name: 'Pinecone Vector Store',
    type: '@n8n/n8n-nodes-langchain.vectorStorePinecone',
    category: 'ai',
    description: {
      EN: 'Store and retrieve embeddings from Pinecone',
      DE: 'Speichert und ruft Embeddings von Pinecone ab'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGIC NODES - Flow control and routing
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'if',
    name: 'IF',
    type: 'n8n-nodes-base.if',
    category: 'logic',
    description: {
      EN: 'Binary conditional branching (true/false)',
      DE: 'Binäre bedingte Verzweigung (wahr/falsch)'
    },
    recommended: true
  },
  {
    id: 'switch',
    name: 'Switch',
    type: 'n8n-nodes-base.switch',
    category: 'logic',
    description: {
      EN: 'Multi-branch routing based on conditions',
      DE: 'Multi-Verzweigungs-Routing basierend auf Bedingungen'
    },
    recommended: true
  },
  {
    id: 'merge',
    name: 'Merge',
    type: 'n8n-nodes-base.merge',
    category: 'logic',
    description: {
      EN: 'Consolidates multiple branches (Fan-in pattern) - CRITICAL for clean topology',
      DE: 'Konsolidiert mehrere Zweige (Fan-in-Muster) - KRITISCH für saubere Topologie'
    },
    recommended: true
  },
  {
    id: 'filter',
    name: 'Filter',
    type: 'n8n-nodes-base.filter',
    category: 'logic',
    description: {
      EN: 'Filters items based on conditions',
      DE: 'Filtert Elemente basierend auf Bedingungen'
    }
  },
  {
    id: 'split-in-batches',
    name: 'Split In Batches',
    type: 'n8n-nodes-base.splitInBatches',
    category: 'logic',
    description: {
      EN: 'Processes large datasets in chunks - ESSENTIAL for rate limiting',
      DE: 'Verarbeitet große Datensätze in Chunks - ESSENTIELL für Rate-Limiting'
    },
    recommended: true
  },
  {
    id: 'loop-over-items',
    name: 'Loop Over Items',
    type: 'n8n-nodes-base.splitInBatches',
    category: 'logic',
    description: {
      EN: 'Iterates over each item individually',
      DE: 'Iteriert über jedes Element einzeln'
    }
  },
  {
    id: 'wait',
    name: 'Wait',
    type: 'n8n-nodes-base.wait',
    category: 'logic',
    description: {
      EN: 'Pauses execution for specified time',
      DE: 'Pausiert Ausführung für bestimmte Zeit'
    }
  },
  {
    id: 'no-op',
    name: 'No Operation',
    type: 'n8n-nodes-base.noOp',
    category: 'logic',
    description: {
      EN: 'Pass-through node for organization',
      DE: 'Durchgangs-Knoten zur Organisation'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // DATA NODES - Transformation and manipulation
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'edit-fields',
    name: 'Edit Fields (Set)',
    type: 'n8n-nodes-base.set',
    category: 'data',
    description: {
      EN: 'Add, modify, or remove fields from data',
      DE: 'Felder zu Daten hinzufügen, ändern oder entfernen'
    },
    recommended: true
  },
  {
    id: 'code',
    name: 'Code',
    type: 'n8n-nodes-base.code',
    category: 'data',
    description: {
      EN: 'Custom JavaScript/Python code - USE SPARINGLY, prefer AI nodes',
      DE: 'Benutzerdefinierter JavaScript/Python-Code - SPARSAM VERWENDEN, AI-Nodes bevorzugen'
    },
    avoidWith: ['openai'] // Anti-pattern: Code + LLM instead of AI Agent
  },
  {
    id: 'aggregate',
    name: 'Aggregate',
    type: 'n8n-nodes-base.aggregate',
    category: 'data',
    description: {
      EN: 'Aggregates multiple items into one',
      DE: 'Aggregiert mehrere Elemente zu einem'
    }
  },
  {
    id: 'sort',
    name: 'Sort',
    type: 'n8n-nodes-base.sort',
    category: 'data',
    description: {
      EN: 'Sorts items by field values',
      DE: 'Sortiert Elemente nach Feldwerten'
    }
  },
  {
    id: 'limit',
    name: 'Limit',
    type: 'n8n-nodes-base.limit',
    category: 'data',
    description: {
      EN: 'Limits number of items passed through',
      DE: 'Begrenzt die Anzahl der durchgelassenen Elemente'
    }
  },
  {
    id: 'remove-duplicates',
    name: 'Remove Duplicates',
    type: 'n8n-nodes-base.removeDuplicates',
    category: 'data',
    description: {
      EN: 'Removes duplicate items based on field',
      DE: 'Entfernt doppelte Elemente basierend auf Feld'
    }
  },
  {
    id: 'html-extract',
    name: 'HTML Extract',
    type: 'n8n-nodes-base.html',
    category: 'data',
    description: {
      EN: 'Extract data from HTML using CSS selectors',
      DE: 'Extrahiert Daten aus HTML mit CSS-Selektoren'
    }
  },
  {
    id: 'xml',
    name: 'XML',
    type: 'n8n-nodes-base.xml',
    category: 'data',
    description: {
      EN: 'Parse or generate XML data',
      DE: 'XML-Daten parsen oder generieren'
    }
  },
  {
    id: 'markdown',
    name: 'Markdown',
    type: 'n8n-nodes-base.markdown',
    category: 'data',
    description: {
      EN: 'Convert between Markdown and HTML',
      DE: 'Zwischen Markdown und HTML konvertieren'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ACTION NODES - External service integrations
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'http-request',
    name: 'HTTP Request',
    type: 'n8n-nodes-base.httpRequest',
    category: 'action',
    description: {
      EN: 'Make HTTP requests to any API',
      DE: 'HTTP-Anfragen an jede API senden'
    },
    recommended: true
  },
  {
    id: 'gmail',
    name: 'Gmail',
    type: 'n8n-nodes-base.gmail',
    category: 'action',
    description: {
      EN: 'Send, read, organize Gmail messages',
      DE: 'Gmail-Nachrichten senden, lesen, organisieren'
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    type: 'n8n-nodes-base.slack',
    category: 'action',
    description: {
      EN: 'Send messages, manage channels',
      DE: 'Nachrichten senden, Kanäle verwalten'
    }
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    type: 'n8n-nodes-base.googleSheets',
    category: 'action',
    description: {
      EN: 'Read/write spreadsheet data',
      DE: 'Tabellendaten lesen/schreiben'
    }
  },
  {
    id: 'notion',
    name: 'Notion',
    type: 'n8n-nodes-base.notion',
    category: 'action',
    description: {
      EN: 'Create/update Notion pages and databases',
      DE: 'Notion-Seiten und Datenbanken erstellen/aktualisieren'
    }
  },
  {
    id: 'airtable',
    name: 'Airtable',
    type: 'n8n-nodes-base.airtable',
    category: 'action',
    description: {
      EN: 'CRUD operations on Airtable bases',
      DE: 'CRUD-Operationen auf Airtable-Basen'
    }
  },
  {
    id: 'postgres',
    name: 'Postgres',
    type: 'n8n-nodes-base.postgres',
    category: 'action',
    description: {
      EN: 'Query PostgreSQL databases',
      DE: 'PostgreSQL-Datenbanken abfragen'
    }
  },
  {
    id: 'mysql',
    name: 'MySQL',
    type: 'n8n-nodes-base.mySql',
    category: 'action',
    description: {
      EN: 'Query MySQL databases',
      DE: 'MySQL-Datenbanken abfragen'
    }
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    type: 'n8n-nodes-base.hubspot',
    category: 'action',
    description: {
      EN: 'CRM operations (contacts, deals, companies)',
      DE: 'CRM-Operationen (Kontakte, Deals, Unternehmen)'
    }
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    type: 'n8n-nodes-base.salesforce',
    category: 'action',
    description: {
      EN: 'Salesforce CRM operations',
      DE: 'Salesforce CRM-Operationen'
    }
  },
  {
    id: 'discord',
    name: 'Discord',
    type: 'n8n-nodes-base.discord',
    category: 'action',
    description: {
      EN: 'Send messages to Discord channels',
      DE: 'Nachrichten an Discord-Kanäle senden'
    }
  },
  {
    id: 'telegram',
    name: 'Telegram',
    type: 'n8n-nodes-base.telegram',
    category: 'action',
    description: {
      EN: 'Send Telegram messages and notifications',
      DE: 'Telegram-Nachrichten und Benachrichtigungen senden'
    }
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    type: 'n8n-nodes-base.twitter',
    category: 'action',
    description: {
      EN: 'Post tweets, read timeline',
      DE: 'Tweets posten, Timeline lesen'
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    type: 'n8n-nodes-base.linkedIn',
    category: 'action',
    description: {
      EN: 'Post updates, manage connections',
      DE: 'Updates posten, Verbindungen verwalten'
    }
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    type: 'n8n-nodes-base.googleDrive',
    category: 'action',
    description: {
      EN: 'Upload, download, manage files',
      DE: 'Dateien hochladen, herunterladen, verwalten'
    }
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    type: 'n8n-nodes-base.dropbox',
    category: 'action',
    description: {
      EN: 'Dropbox file operations',
      DE: 'Dropbox-Dateioperationen'
    }
  },
  {
    id: 'send-email',
    name: 'Send Email',
    type: 'n8n-nodes-base.emailSend',
    category: 'action',
    description: {
      EN: 'Send email via SMTP',
      DE: 'E-Mail über SMTP senden'
    }
  },
  {
    id: 'respond-to-webhook',
    name: 'Respond to Webhook',
    type: 'n8n-nodes-base.respondToWebhook',
    category: 'action',
    description: {
      EN: 'Send response back to webhook caller',
      DE: 'Antwort an Webhook-Aufrufer zurücksenden'
    },
    useWith: ['webhook']
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITY NODES - Helpers and tools
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'sticky-note',
    name: 'Sticky Note',
    type: 'n8n-nodes-base.stickyNote',
    category: 'utility',
    description: {
      EN: 'Documentation notes in workflow canvas',
      DE: 'Dokumentationsnotizen in Workflow-Canvas'
    }
  },
  {
    id: 'execute-workflow',
    name: 'Execute Workflow',
    type: 'n8n-nodes-base.executeWorkflow',
    category: 'utility',
    description: {
      EN: 'Call another workflow as sub-workflow',
      DE: 'Anderen Workflow als Sub-Workflow aufrufen'
    }
  },
  {
    id: 'crypto',
    name: 'Crypto',
    type: 'n8n-nodes-base.crypto',
    category: 'utility',
    description: {
      EN: 'Hash, encrypt, generate random values',
      DE: 'Hash, Verschlüsselung, Zufallswerte generieren'
    }
  },
  {
    id: 'date-time',
    name: 'Date & Time',
    type: 'n8n-nodes-base.dateTime',
    category: 'utility',
    description: {
      EN: 'Format, parse, calculate dates',
      DE: 'Daten formatieren, parsen, berechnen'
    }
  },
  {
    id: 'compression',
    name: 'Compression',
    type: 'n8n-nodes-base.compression',
    category: 'utility',
    description: {
      EN: 'Compress/decompress files (zip, gzip)',
      DE: 'Dateien komprimieren/dekomprimieren (zip, gzip)'
    }
  }
];

// Helper functions for prompt generation
export const getNodesByCategory = (category: N8NNode['category']) => 
  N8N_NODES.filter(n => n.category === category);

export const getRecommendedNodes = () => 
  N8N_NODES.filter(n => n.recommended);

export const getNodeById = (id: string) => 
  N8N_NODES.find(n => n.id === id);

export const getRelatedNodes = (nodeId: string): N8NNode[] => {
  const node = getNodeById(nodeId);
  if (!node?.useWith) return [];
  return node.useWith.map(id => getNodeById(id)).filter((n): n is N8NNode => n !== undefined);
};

// Anti-pattern detection
export const getAntiPatterns = (): { pattern: string; explanation: { EN: string; DE: string } }[] => [
  {
    pattern: 'Code + OpenAI',
    explanation: {
      EN: 'Use AI Agent with Structured Output Parser instead of Code Node + LLM for data extraction',
      DE: 'Verwende AI Agent mit Structured Output Parser statt Code Node + LLM für Datenextraktion'
    }
  },
  {
    pattern: 'Duplicate output nodes',
    explanation: {
      EN: 'Use Merge Node to consolidate branches before output nodes',
      DE: 'Verwende Merge Node, um Zweige vor Output-Nodes zu konsolidieren'
    }
  },
  {
    pattern: 'Missing error handling',
    explanation: {
      EN: 'Add Error Trigger workflow for production reliability',
      DE: 'Füge Error Trigger Workflow für Produktionszuverlässigkeit hinzu'
    }
  },
  {
    pattern: 'No rate limiting',
    explanation: {
      EN: 'Use Split In Batches for external API calls to avoid rate limits',
      DE: 'Verwende Split In Batches für externe API-Aufrufe, um Rate-Limits zu vermeiden'
    }
  }
];
