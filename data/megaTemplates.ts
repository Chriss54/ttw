import { Language } from '../types';

export interface NodeSkeleton {
  name: string;
  type: string;
  description: { EN: string; DE: string };
  configHints: string[];
  subNodes?: NodeSkeleton[];
  connectionType?: 'main' | 'ai_languageModel' | 'ai_tool' | 'ai_memory' | 'ai_embedding' | 'ai_outputParser';
  // NEW: Full detailed specification for mega prompts
  fullSpec?: {
    parameters: Record<string, string>;
    expressions?: Record<string, string>;
    systemMessage?: string;
    schema?: string;
  };
}

export interface MegaTemplate {
  id: string;
  name: { EN: string; DE: string };
  description: { EN: string; DE: string };
  keywords: string[];
  sections: string[];
  nodeSkeletons: NodeSkeleton[];
  sqlSetup?: string;
  credentialsRequired: string[];
  warnings?: { EN: string; DE: string }[];
  // NEW: Pre-built detailed sections for fallback mode
  detailedArchitecture?: { EN: string; DE: string };
  testDataExamples?: { EN: string; DE: string };
}

// ============================================================================
// GRAPH RAG TEMPLATE - Full Production Detail
// ============================================================================
const GRAPH_RAG_TEMPLATE: MegaTemplate = {
  id: 'rag-system',
  name: { EN: 'Graph RAG System', DE: 'Graph RAG-System' },
  description: {
    EN: 'Retrieval-Augmented Generation with ingestion pipeline and query agent',
    DE: 'Retrieval-Augmented Generation mit Ingestion-Pipeline und Query-Agent'
  },
  keywords: ['rag', 'vector', 'embedding', 'supabase', 'retrieval', 'documents', 'search', 'query agent', 'knowledge base', 'graph', 'classify', 'classification'],
  sections: ['ARCHITEKTUR', 'DATA INGESTION PIPELINE', 'QUERY AGENT', 'VERBINDUNGEN', 'CREDENTIALS', 'SQL SETUP'],
  credentialsRequired: ['OpenAI API', 'Supabase'],
  detailedArchitecture: {
    EN: `\`\`\`
=== DATA INGESTION PIPELINE ===

[Manual Trigger] → [Test File] → [Table Names] → [Classification Agent] → [Route to Table]
                                                         ↓
                    ┌──────────────────────────────────────┼──────────────────────────────────────┐
                    ↓                                      ↓                                      ↓
            [Message a model]                    [Message a model1]                    [Message a model2]
            (documents schema)                     (faqs schema)                      (procedures schema)
                    ↓                                      ↓                                      ↓
            [content parser]                        [Split Out]                          [Edit Fields]
                    ↓                                      ↓                                      ↓
             [HTTP Request]                        [HTTP Request1]                       [HTTP Request2]
            (OpenAI Embeddings)                   (OpenAI Embeddings)                  (OpenAI Embeddings)
                    ↓                                      ↓                                      ↓
            [Create a row]                        [Create a row1]                       [Create a row2]
            (Supabase documents)                  (Supabase faqs)                     (Supabase procedures)


=== QUERY AGENT ===

[When chat message received] → [Query Agent1]
                                     ↑
        ┌────────────────────────────┼────────────────────────────┐
        ↑                            ↑                            ↑
[OpenAI Chat Model]          [Query Memory]              [6 AI Tools]
                                                              ↓
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    ↓                    ↓                    ↓                    ↓                    ↓                    ↓
         [Vector Store -      [Vector Store -      [Vector Store -      [Query Documents    [Query FAQs      [Query Procedures
          Documents]              FAQs]            Procedures]            Table]             Table]            Table]
              ↑                    ↑                    ↑
    [OpenAI Embeddings]   [OpenAI Embeddings]   [OpenAI Embeddings]
\`\`\``,
    DE: `\`\`\`
=== DATEN-INGESTION PIPELINE ===

[Manual Trigger] → [Test-Datei] → [Tabellennamen] → [Klassifikations-Agent] → [Route zur Tabelle]
                                                         ↓
                    ┌──────────────────────────────────────┼──────────────────────────────────────┐
                    ↓                                      ↓                                      ↓
            [Nachricht an Modell]                [Nachricht an Modell1]                [Nachricht an Modell2]
            (documents Schema)                     (faqs Schema)                      (procedures Schema)
                    ↓                                      ↓                                      ↓
            [Content Parser]                        [Split Out]                          [Felder bearbeiten]
                    ↓                                      ↓                                      ↓
             [HTTP Request]                        [HTTP Request1]                       [HTTP Request2]
            (OpenAI Embeddings)                   (OpenAI Embeddings)                  (OpenAI Embeddings)
                    ↓                                      ↓                                      ↓
            [Zeile erstellen]                     [Zeile erstellen1]                    [Zeile erstellen2]
            (Supabase documents)                  (Supabase faqs)                     (Supabase procedures)


=== QUERY AGENT ===

[Bei Chat-Nachricht empfangen] → [Query Agent1]
                                     ↑
        ┌────────────────────────────┼────────────────────────────┐
        ↑                            ↑                            ↑
[OpenAI Chat Modell]         [Query Memory]              [6 AI Tools]
                                                              ↓
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    ↓                    ↓                    ↓                    ↓                    ↓                    ↓
         [Vector Store -      [Vector Store -      [Vector Store -      [Query Documents    [Query FAQs      [Query Procedures
          Documents]              FAQs]            Procedures]            Table]             Table]            Table]
              ↑                    ↑                    ↑
    [OpenAI Embeddings]   [OpenAI Embeddings]   [OpenAI Embeddings]
\`\`\``
  },
  nodeSkeletons: [
    // ========== DATA INGESTION PIPELINE ==========
    {
      name: 'Manual Trigger - Data Ingestion',
      type: 'n8n-nodes-base.manualTrigger',
      description: { EN: 'Start ingestion manually', DE: 'Ingestion manuell starten' },
      configHints: ['Standard (keine Parameter)'],
      fullSpec: { parameters: {} }
    },
    {
      name: 'Test File',
      type: 'n8n-nodes-base.set',
      description: { EN: 'Test data input', DE: 'Testdaten-Eingabe' },
      configHints: ['Ein Feld mit leerem Namen ("") vom Typ Object', 'Enthält Test-JSON-Daten'],
      fullSpec: {
        parameters: { 'Field Name': '""', 'Type': 'Object' },
        expressions: { 'value': '{ "title": "...", "content": "..." }' }
      }
    },
    {
      name: 'Table Names',
      type: 'n8n-nodes-base.set',
      description: { EN: 'Define table schemas', DE: 'Tabellen-Schemas definieren' },
      configHints: ['Include Other Fields: true', '6 Felder für 3 Tabellen + 3 Schemas'],
      fullSpec: {
        parameters: {
          'includeOtherFields': 'true',
          'table1': '{"table1":{"name":"documents","schema":"Company documentation..."}}',
          'table1 Schema': '{"table_id":"documents","schema":[{"name":"title","type":"text"},{"name":"content","type":"text"},...]}',
          'table2': '{"table2":{"name":"faqs","schema":"Frequently asked questions..."}}',
          'table2 Schema': '{"table_id":"faqs","schema":[{"name":"question","type":"text"},{"name":"answer","type":"text"},...]}',
          'table3': '{"table3":{"name":"procedures","schema":"Step-by-step instructions..."}}',
          'table3 Schema': '{"table_id":"procedures","schema":[{"name":"title","type":"text"},{"name":"steps","type":"text"},...]}',
        }
      }
    },
    {
      name: 'Data Classification Agent',
      type: '@n8n/n8n-nodes-langchain.agent',
      description: { EN: 'Classify incoming data to correct table', DE: 'Eingehende Daten zur richtigen Tabelle klassifizieren' },
      configHints: ['promptType: define', 'hasOutputParser: true'],
      fullSpec: {
        parameters: { 'promptType': 'define', 'hasOutputParser': 'true' },
        systemMessage: `You are a data classification expert. Analyze the data structure and content to determine the correct table.

**Table Schemas:**
- table1: {{ $json.table1.table1.toJsonString() }} : {{ $json["table1 Schema"].toJsonString() }}
- table2: {{ $json.table2.toJsonString() }}: {{ $json["table2 Schema"].toJsonString() }}
- table3: {{ $json.table3.toJsonString() }} : {{ $json["table3 Schema"].toJsonString() }}

**Data to classify:** 
{{ $('Test File').item.json.toJsonString() }}

Determine which table this data belongs to based on its structure and content type.`,
        schema: `{
  "type": "object",
  "properties": {
    "targetTable": {
      "type": "string",
      "enum": ["documents", "faqs", "procedures"],
      "description": "The table name where data should be inserted"
    },
    "reasoning": {
      "type": "string",
      "description": "Explanation for the classification"
    }
  },
  "required": ["targetTable", "reasoning"]
}`
      },
      subNodes: [
        { name: 'OpenAI Chat Model - Classification', type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', description: { EN: 'LLM for classification', DE: 'LLM für Klassifikation' }, configHints: ['gpt-4o-mini'], connectionType: 'ai_languageModel' },
        { name: 'Classification Schema Parser', type: '@n8n/n8n-nodes-langchain.outputParserStructured', description: { EN: 'Parse to structured output', DE: 'Strukturierte Ausgabe parsen' }, configHints: ['schemaType: manual', 'JSON schema with targetTable enum'], connectionType: 'ai_outputParser' }
      ]
    },
    {
      name: 'Route to Table',
      type: 'n8n-nodes-base.switch',
      description: { EN: 'Route based on classification', DE: 'Basierend auf Klassifikation routen' },
      configHints: ['allMatchingOutputs: true', '3 Outputs: documents, faqs, procedures', 'Condition: {{ $json.output.targetTable }} equals "tablename"']
    },
    // Documents Path
    {
      name: 'Message a model (Documents)',
      type: '@n8n/n8n-nodes-langchain.openAi',
      description: { EN: 'Parse to documents schema', DE: 'Zu documents-Schema parsen' },
      configHints: ['Model: gpt-4o-mini', 'JSON Output: true'],
      fullSpec: {
        parameters: { 'modelId': 'gpt-4o-mini', 'jsonOutput': 'true' },
        systemMessage: `Review the information provided and parse the content to fit the following schema:

"schema":[{"name":"title","type":"text"},{"name":"content","type":"text"},{"name":"category","type":"text"},{"name":"author","type":"text"},{"name":"related_faq_ids","type":"_uuid"},{"name":"related_procedure_ids","type":"_uuid"},{"name":"metadata","type":"jsonb"}]`
      }
    },
    {
      name: 'content parser',
      type: 'n8n-nodes-base.set',
      description: { EN: 'Extract content', DE: 'Inhalt extrahieren' },
      configHints: ['Field: content to upload', 'Value: {{ $json.message.content }}']
    },
    {
      name: 'HTTP Request (Embeddings)',
      type: 'n8n-nodes-base.httpRequest',
      description: { EN: 'Generate embeddings via OpenAI API', DE: 'Embeddings via OpenAI API generieren' },
      configHints: ['Method: POST', 'URL: https://api.openai.com/v1/embeddings', 'Auth: OpenAI API'],
      fullSpec: {
        parameters: {
          'method': 'POST',
          'url': 'https://api.openai.com/v1/embeddings',
          'authentication': 'predefinedCredentialType',
          'nodeCredentialType': 'openAiApi'
        },
        expressions: {
          'input': '{{ $json[\'content to upload\'].title }}: {{ $json[\'content to upload\'].content }}',
          'model': 'text-embedding-3-small'
        }
      }
    },
    {
      name: 'Create a row (Supabase)',
      type: 'n8n-nodes-base.supabase',
      description: { EN: 'Insert row with embedding', DE: 'Zeile mit Embedding einfügen' },
      configHints: ['Table: documents/faqs/procedures', 'Map all fields including embedding'],
      fullSpec: {
        parameters: { 'tableId': 'documents' },
        expressions: {
          'title': '{{ $(\'content parser\').item.json[\'content to upload\'].title }}',
          'content': '{{ $(\'content parser\').item.json[\'content to upload\'].content }}',
          'embedding': '{{ $json.data[0].embedding }}'
        }
      }
    },
    // ========== QUERY AGENT ==========
    {
      name: 'When chat message received',
      type: '@n8n/n8n-nodes-langchain.chatTrigger',
      description: { EN: 'Chat input trigger', DE: 'Chat-Eingabe Trigger' },
      configHints: ['Standard configuration']
    },
    {
      name: 'Query Agent',
      type: '@n8n/n8n-nodes-langchain.agent',
      description: { EN: 'Main query agent with tools', DE: 'Haupt-Query-Agent mit Tools' },
      configHints: ['6 Tools: 3 Vector Store + 3 Supabase Query'],
      fullSpec: {
        parameters: {},
        systemMessage: `You are an intelligent query agent with two search strategies:

**1. Vector Search (semantic):** Use for conceptual queries and natural language questions
- Search Documents: policy information, guides, documentation
- Search FAQs: common questions and answers
- Search Procedures: step-by-step instructions

**2. Direct Queries (structured):** Use after vector search to get complete records or traverse relationships
- Query Documents by ID
- Query FAQs by ID or source_document_id
- Query Procedures by ID or source_document_id

**Workflow:**
1. Use vector search to find relevant records
2. Extract IDs from results
3. Use Supabase Query tools to get complete data or follow relationships
4. Synthesize comprehensive answer
5. Always cite sources and only use the database for answers`
      },
      subNodes: [
        { name: 'OpenAI Chat Model - Query', type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', description: { EN: 'LLM', DE: 'LLM' }, configHints: ['gpt-4o-mini'], connectionType: 'ai_languageModel' },
        { name: 'Query Memory', type: '@n8n/n8n-nodes-langchain.memoryBufferWindow', description: { EN: 'Chat memory', DE: 'Chat-Speicher' }, configHints: ['Standard'], connectionType: 'ai_memory' },
        { name: 'Vector Store - Documents', type: '@n8n/n8n-nodes-langchain.vectorStoreSupabase', description: { EN: 'Semantic search documents', DE: 'Semantische Suche documents' }, configHints: ['mode: retrieve-as-tool', 'topK: 10', 'toolDescription: "Search documents table..."'], connectionType: 'ai_tool' },
        { name: 'Vector Store - FAQs', type: '@n8n/n8n-nodes-langchain.vectorStoreSupabase', description: { EN: 'Semantic search FAQs', DE: 'Semantische Suche FAQs' }, configHints: ['mode: retrieve-as-tool', 'topK: 10'], connectionType: 'ai_tool' },
        { name: 'Vector Store - Procedures', type: '@n8n/n8n-nodes-langchain.vectorStoreSupabase', description: { EN: 'Semantic search procedures', DE: 'Semantische Suche procedures' }, configHints: ['mode: retrieve-as-tool', 'topK: 10'], connectionType: 'ai_tool' },
        { name: 'Query Documents Table', type: 'n8n-nodes-base.supabaseTool', description: { EN: 'Direct query documents', DE: 'Direkte Abfrage documents' }, configHints: ['operation: getAll', 'table: documents'], connectionType: 'ai_tool' },
        { name: 'Query FAQs Table', type: 'n8n-nodes-base.supabaseTool', description: { EN: 'Direct query FAQs', DE: 'Direkte Abfrage FAQs' }, configHints: ['operation: getAll', 'table: faqs'], connectionType: 'ai_tool' },
        { name: 'Query Procedures Table', type: 'n8n-nodes-base.supabaseTool', description: { EN: 'Direct query procedures', DE: 'Direkte Abfrage procedures' }, configHints: ['operation: getAll', 'table: procedures'], connectionType: 'ai_tool' }
      ]
    }
  ],
  sqlSetup: `-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  category TEXT,
  author TEXT,
  related_faq_ids UUID[],
  related_procedure_ids UUID[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs table
CREATE TABLE faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  embedding VECTOR(1536),
  category TEXT,
  source_document_id UUID,
  related_procedure_ids UUID[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedures table
CREATE TABLE procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  steps TEXT NOT NULL,
  embedding VECTOR(1536),
  department TEXT,
  difficulty TEXT,
  source_document_id UUID,
  prerequisite_procedure_ids UUID[],
  related_faq_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON faqs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON procedures USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`,
  testDataExamples: {
    EN: `### Test Data Examples

**Document:**
\`\`\`json
{
  "title": "Remote Work Policy",
  "content": "This policy outlines the guidelines for remote work arrangements. Employees may work remotely up to 3 days per week with manager approval...",
  "category": "HR",
  "author": "HR Department"
}
\`\`\`

**FAQ:**
\`\`\`json
{
  "question": "How do I reset my password?",
  "answer": "To reset your password, click 'Forgot Password' on the login page. You will receive an email with reset instructions within 5 minutes.",
  "category": "IT Support"
}
\`\`\`

**Procedure:**
\`\`\`json
{
  "title": "New Hire Laptop Setup",
  "steps": "1. Remove laptop from shipping box and verify serial number matches asset tag\\n2. Power on and connect to WiFi network 'CompanySetup'\\n3. Run initial OS updates (approximately 30 minutes)\\n4. Install company security suite from USB drive provided by IT\\n5. Configure Outlook with employee credentials\\n6. Install required software: Slack, Zoom, Microsoft Office 365\\n7. Set up VPN client with credentials from welcome packet\\n8. Complete security training module\\n9. Return completed setup checklist to IT department",
  "department": "IT",
  "difficulty": "Easy"
}
\`\`\``,
    DE: `### Testdaten-Beispiele

**Dokument:**
\`\`\`json
{
  "title": "Remote Work Richtlinie",
  "content": "Diese Richtlinie beschreibt die Regeln für Remote-Arbeit. Mitarbeiter dürfen bis zu 3 Tage pro Woche mit Genehmigung des Vorgesetzten remote arbeiten...",
  "category": "HR",
  "author": "HR Abteilung"
}
\`\`\`

**FAQ:**
\`\`\`json
{
  "question": "Wie setze ich mein Passwort zurück?",
  "answer": "Um Ihr Passwort zurückzusetzen, klicken Sie auf 'Passwort vergessen' auf der Login-Seite. Sie erhalten innerhalb von 5 Minuten eine E-Mail mit Anweisungen.",
  "category": "IT Support"
}
\`\`\`

**Prozedur:**
\`\`\`json
{
  "title": "Laptop-Einrichtung für neue Mitarbeiter",
  "steps": "1. Laptop aus Versandkarton nehmen und Seriennummer mit Asset-Tag vergleichen\\n2. Einschalten und mit WLAN 'CompanySetup' verbinden\\n3. OS-Updates durchführen (ca. 30 Minuten)\\n4. Firmeneigene Sicherheitssoftware vom bereitgestellten USB-Stick installieren\\n5. Outlook mit Mitarbeiter-Zugangsdaten konfigurieren\\n6. Erforderliche Software installieren: Slack, Zoom, Microsoft Office 365\\n7. VPN-Client mit Zugangsdaten aus dem Willkommenspaket einrichten\\n8. Sicherheitstraining-Modul absolvieren\\n9. Ausgefüllte Setup-Checkliste an IT-Abteilung zurückgeben",
  "department": "IT",
  "difficulty": "Einfach"
}
\`\`\``
  },
  warnings: [
    { EN: '⚠️ **CRITICAL**: Use the SAME embedding model for ingestion and query! Mixing text-embedding-3-small (ingestion) with text-embedding-3-large (query) will cause poor search results.', DE: '⚠️ **KRITISCH**: Gleiches Embedding-Modell für Ingestion und Query verwenden! Mischung von text-embedding-3-small (Ingestion) mit text-embedding-3-large (Query) führt zu schlechten Suchergebnissen.' },
    { EN: '⚠️ Switch Node with `allMatchingOutputs: true` allows data to route to multiple tables if classification returns multiple matches.', DE: '⚠️ Switch Node mit `allMatchingOutputs: true` ermöglicht Routing zu mehreren Tabellen, falls Klassifikation mehrere Matches ergibt.' }
  ]
};

// ============================================================================
// OTHER TEMPLATES (Simplified for now)
// ============================================================================
const MULTI_AGENT_TEMPLATE: MegaTemplate = {
  id: 'multi-agent',
  name: { EN: 'Multi-Agent Orchestrator', DE: 'Multi-Agent Orchestrator' },
  description: {
    EN: 'Leader agent coordinating specialized worker agents',
    DE: 'Leader-Agent koordiniert spezialisierte Worker-Agents'
  },
  keywords: ['agent', 'multi-agent', 'orchestrator', 'leader', 'worker', 'coordinator', 'specialist'],
  sections: ['ARCHITEKTUR', 'LEADER AGENT', 'WORKER AGENTS', 'TOOL DEFINITIONS', 'VERBINDUNGEN'],
  credentialsRequired: ['OpenAI API'],
  nodeSkeletons: [
    { name: 'Chat Trigger', type: '@n8n/n8n-nodes-langchain.chatTrigger', description: { EN: 'User input', DE: 'Benutzereingabe' }, configHints: [] },
    {
      name: 'Leader Agent',
      type: '@n8n/n8n-nodes-langchain.agent',
      description: { EN: 'Orchestrates workers', DE: 'Orchestriert Worker' },
      configHints: ['Routing logic in system message'],
      subNodes: [
        { name: 'OpenAI Chat Model', type: '@n8n/n8n-nodes-langchain.lmChatOpenAi', description: { EN: 'LLM', DE: 'LLM' }, configHints: ['gpt-4o'], connectionType: 'ai_languageModel' },
        { name: 'Research Tool', type: '@n8n/n8n-nodes-langchain.toolWorkflow', description: { EN: 'Calls research agent', DE: 'Ruft Research-Agent auf' }, configHints: ['Workflow tool'], connectionType: 'ai_tool' },
        { name: 'Writer Tool', type: '@n8n/n8n-nodes-langchain.toolWorkflow', description: { EN: 'Calls writer agent', DE: 'Ruft Writer-Agent auf' }, configHints: ['Workflow tool'], connectionType: 'ai_tool' }
      ]
    }
  ],
  warnings: [
    { EN: '⚠️ Worker agents should be separate workflows called via Tool Workflow node', DE: '⚠️ Worker-Agents sollten separate Workflows sein, die via Tool-Workflow-Node aufgerufen werden' }
  ]
};

const ETL_PIPELINE_TEMPLATE: MegaTemplate = {
  id: 'etl-pipeline',
  name: { EN: 'ETL Pipeline', DE: 'ETL-Pipeline' },
  description: {
    EN: 'Extract-Transform-Load with error handling and batching',
    DE: 'Extract-Transform-Load mit Fehlerbehandlung und Batching'
  },
  keywords: ['etl', 'extract', 'transform', 'load', 'batch', 'data', 'pipeline', 'database', 'migration'],
  sections: ['ARCHITEKTUR', 'EXTRACT PHASE', 'TRANSFORM PHASE', 'LOAD PHASE', 'ERROR HANDLING'],
  credentialsRequired: ['Source Database', 'Target Database'],
  nodeSkeletons: [
    { name: 'Schedule Trigger', type: 'n8n-nodes-base.scheduleTrigger', description: { EN: 'Scheduled run', DE: 'Geplante Ausführung' }, configHints: ['Cron expression'] },
    { name: 'Source Query', type: 'n8n-nodes-base.postgres', description: { EN: 'Extract data', DE: 'Daten extrahieren' }, configHints: ['SELECT query'] },
    { name: 'Split In Batches', type: 'n8n-nodes-base.splitInBatches', description: { EN: 'Process in batches', DE: 'In Batches verarbeiten' }, configHints: ['Batch size: 100'] },
    { name: 'Transform', type: 'n8n-nodes-base.set', description: { EN: 'Map fields', DE: 'Felder mappen' }, configHints: ['Field mappings'] },
    { name: 'Target Insert', type: 'n8n-nodes-base.postgres', description: { EN: 'Load data', DE: 'Daten laden' }, configHints: ['INSERT/UPSERT'] },
    { name: 'Error Trigger', type: 'n8n-nodes-base.errorTrigger', description: { EN: 'Handle errors', DE: 'Fehler behandeln' }, configHints: [] }
  ],
  warnings: [
    { EN: '⚠️ Use Split In Batches for large datasets to avoid memory issues', DE: '⚠️ Split In Batches für große Datensätze verwenden' }
  ]
};

const WEBHOOK_API_TEMPLATE: MegaTemplate = {
  id: 'webhook-api',
  name: { EN: 'Webhook API', DE: 'Webhook API' },
  description: {
    EN: 'Receive, validate, process, and respond to webhook requests',
    DE: 'Webhook-Anfragen empfangen, validieren, verarbeiten und beantworten'
  },
  keywords: ['webhook', 'api', 'endpoint', 'receive', 'validate', 'respond', 'http'],
  sections: ['ARCHITEKTUR', 'RECEIVE & VALIDATE', 'PROCESS', 'RESPOND', 'ERROR RESPONSES'],
  credentialsRequired: [],
  nodeSkeletons: [
    { name: 'Webhook', type: 'n8n-nodes-base.webhook', description: { EN: 'Receive requests', DE: 'Anfragen empfangen' }, configHints: ['Path', 'Method', 'Response mode'] },
    { name: 'Validate Input', type: 'n8n-nodes-base.if', description: { EN: 'Check required fields', DE: 'Pflichtfelder prüfen' }, configHints: ['Condition checks'] },
    { name: 'Process', type: 'n8n-nodes-base.set', description: { EN: 'Transform data', DE: 'Daten transformieren' }, configHints: [] },
    { name: 'Respond to Webhook', type: 'n8n-nodes-base.respondToWebhook', description: { EN: 'Send response', DE: 'Antwort senden' }, configHints: ['JSON response', 'Status code'] }
  ],
  warnings: [
    { EN: '⚠️ Set Webhook to "Respond Using: Respond to Webhook Node" for custom responses', DE: '⚠️ Webhook auf "Antworten mit: Respond to Webhook Node" für eigene Antworten setzen' }
  ]
};

export const MEGA_TEMPLATES: MegaTemplate[] = [
  GRAPH_RAG_TEMPLATE,
  MULTI_AGENT_TEMPLATE,
  ETL_PIPELINE_TEMPLATE,
  WEBHOOK_API_TEMPLATE
];

export function detectTemplate(userIntent: string): MegaTemplate | null {
  const lowerIntent = userIntent.toLowerCase();

  // Score each template by keyword matches
  const scores = MEGA_TEMPLATES.map(template => {
    const matchCount = template.keywords.filter(kw => lowerIntent.includes(kw)).length;
    return { template, score: matchCount };
  });

  // Return template with highest score (min 2 matches required)
  const best = scores.reduce((a, b) => a.score > b.score ? a : b);
  return best.score >= 2 ? best.template : null;
}

export function getTemplateById(id: string): MegaTemplate | undefined {
  return MEGA_TEMPLATES.find(t => t.id === id);
}
