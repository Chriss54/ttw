// Use-Case Templates for common n8n automation patterns
// Pre-built workflow intents that users can select to jumpstart prompt generation

import { Language } from '../types';

export interface UseCaseTemplate {
    id: string;
    name: { EN: string; DE: string };
    category: 'email' | 'sales' | 'ai' | 'data-sync' | 'social' | 'productivity' | 'support';
    description: { EN: string; DE: string };
    intent: { EN: string; DE: string };
    suggestedNodes: string[];
    complexity: 'simple' | 'medium' | 'complex';
    estimatedNodes: number;
    icon: string; // Lucide icon name
}

export const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
    // ═══════════════════════════════════════════════════════════════
    // EMAIL AUTOMATION
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'email-triage',
        name: {
            EN: 'Email Triage & Auto-Response',
            DE: 'E-Mail-Triage & Auto-Antwort'
        },
        category: 'email',
        description: {
            EN: 'Categorize incoming emails by urgency and topic, draft AI responses',
            DE: 'Eingehende E-Mails nach Dringlichkeit und Thema kategorisieren, KI-Antworten entwerfen'
        },
        intent: {
            EN: 'When a new email arrives in Gmail, use AI to extract the sender name, subject, and determine the urgency level (critical, high, normal, low). Categorize the email by topic (support, sales, partnership, spam). If urgency is critical or high, send an immediate Slack notification to the appropriate channel. Draft a professional response using AI that matches the detected language of the email. Store the categorization in a Google Sheet for tracking.',
            DE: 'Wenn eine neue E-Mail in Gmail ankommt, verwende KI, um Absendername, Betreff und Dringlichkeitsstufe (kritisch, hoch, normal, niedrig) zu extrahieren. Kategorisiere die E-Mail nach Thema (Support, Vertrieb, Partnerschaft, Spam). Bei kritischer oder hoher Dringlichkeit sende eine sofortige Slack-Benachrichtigung an den entsprechenden Kanal. Entwirf eine professionelle Antwort mit KI, die der erkannten Sprache der E-Mail entspricht. Speichere die Kategorisierung in einem Google Sheet zur Nachverfolgung.'
        },
        suggestedNodes: ['gmail-trigger', 'langchain-agent', 'structured-output-parser', 'switch', 'slack', 'gmail', 'google-sheets'],
        complexity: 'medium',
        estimatedNodes: 8,
        icon: 'Mail'
    },
    {
        id: 'email-summary',
        name: {
            EN: 'Daily Email Digest',
            DE: 'Tägliche E-Mail-Zusammenfassung'
        },
        category: 'email',
        description: {
            EN: 'Summarize all emails received in the last 24 hours',
            DE: 'Alle E-Mails der letzten 24 Stunden zusammenfassen'
        },
        intent: {
            EN: 'Every morning at 8 AM, fetch all unread emails from the last 24 hours. Use AI to summarize each email into 2-3 sentences, extracting key action items. Group summaries by sender importance (internal team, clients, external). Create a formatted digest and send it as a Slack message or email. Mark summarized emails as read.',
            DE: 'Jeden Morgen um 8 Uhr alle ungelesenen E-Mails der letzten 24 Stunden abrufen. Verwende KI, um jede E-Mail in 2-3 Sätzen zusammenzufassen und wichtige Aktionspunkte zu extrahieren. Gruppiere Zusammenfassungen nach Absenderwichtigkeit (internes Team, Kunden, extern). Erstelle einen formatierten Digest und sende ihn als Slack-Nachricht oder E-Mail. Markiere zusammengefasste E-Mails als gelesen.'
        },
        suggestedNodes: ['schedule', 'gmail', 'summarization-chain', 'aggregate', 'slack'],
        complexity: 'medium',
        estimatedNodes: 7,
        icon: 'FileText'
    },

    // ═══════════════════════════════════════════════════════════════
    // SALES & LEAD MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'lead-capture',
        name: {
            EN: 'Webhook Lead Capture → CRM',
            DE: 'Webhook Lead-Erfassung → CRM'
        },
        category: 'sales',
        description: {
            EN: 'Capture form submissions and create CRM contacts with enrichment',
            DE: 'Formular-Eingaben erfassen und CRM-Kontakte mit Anreicherung erstellen'
        },
        intent: {
            EN: 'When a webhook receives a form submission, validate the email format and check for required fields (name, email, company). Use Edit Fields to normalize the data. Check if the contact already exists in HubSpot. If new, create a new contact with lead source tracking. If existing, update the contact with new information. Send a Slack notification to the sales channel with lead details. Respond to the webhook with a success message.',
            DE: 'Wenn ein Webhook eine Formular-Übermittlung empfängt, validiere das E-Mail-Format und prüfe auf erforderliche Felder (Name, E-Mail, Firma). Verwende Edit Fields zur Datennormalisierung. Prüfe, ob der Kontakt bereits in HubSpot existiert. Wenn neu, erstelle einen neuen Kontakt mit Lead-Quellen-Tracking. Wenn vorhanden, aktualisiere den Kontakt mit neuen Informationen. Sende eine Slack-Benachrichtigung an den Sales-Kanal mit Lead-Details. Antworte dem Webhook mit einer Erfolgsmeldung.'
        },
        suggestedNodes: ['webhook', 'edit-fields', 'if', 'hubspot', 'slack', 'respond-to-webhook'],
        complexity: 'simple',
        estimatedNodes: 6,
        icon: 'UserPlus'
    },
    {
        id: 'lead-scoring',
        name: {
            EN: 'AI Lead Scoring',
            DE: 'KI Lead-Scoring'
        },
        category: 'sales',
        description: {
            EN: 'Score leads based on behavior and profile using AI',
            DE: 'Leads basierend auf Verhalten und Profil mit KI bewerten'
        },
        intent: {
            EN: 'When a new lead is created in HubSpot, fetch their company information and recent activity. Use AI to analyze the lead profile and assign a score from 1-100 based on: company size, industry fit, engagement level, and budget indicators. Categorize into hot, warm, or cold. Update the HubSpot contact with the score and category. If hot lead, immediately notify the sales rep via Slack with a personalized outreach suggestion generated by AI.',
            DE: 'Wenn ein neuer Lead in HubSpot erstellt wird, rufe Unternehmensinformationen und letzte Aktivitäten ab. Verwende KI, um das Lead-Profil zu analysieren und einen Score von 1-100 zuzuweisen basierend auf: Unternehmensgröße, Brancheneignung, Engagement-Level und Budget-Indikatoren. Kategorisiere in heiß, warm oder kalt. Aktualisiere den HubSpot-Kontakt mit Score und Kategorie. Bei heißem Lead sofort den Sales-Rep via Slack benachrichtigen mit einem von KI generierten personalisierten Outreach-Vorschlag.'
        },
        suggestedNodes: ['hubspot-trigger', 'http-request', 'langchain-agent', 'structured-output-parser', 'hubspot', 'switch', 'slack'],
        complexity: 'complex',
        estimatedNodes: 10,
        icon: 'TrendingUp'
    },

    // ═══════════════════════════════════════════════════════════════
    // AI & CONTENT
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'content-generator',
        name: {
            EN: 'AI Content Generator',
            DE: 'KI Content-Generator'
        },
        category: 'ai',
        description: {
            EN: 'Generate blog posts, social media content from topics',
            DE: 'Blog-Posts und Social-Media-Inhalte aus Themen generieren'
        },
        intent: {
            EN: 'When a new row is added to a Google Sheet with a topic and target platform, use AI to generate appropriate content. For blog posts, generate a 500-word article with SEO-friendly structure. For LinkedIn, create a professional 300-character post. For Twitter/X, create a punchy 280-character tweet with hashtags. Store the generated content back in the sheet. Send a notification when complete.',
            DE: 'Wenn eine neue Zeile zu einem Google Sheet mit Thema und Zielplattform hinzugefügt wird, verwende KI, um passenden Content zu generieren. Für Blog-Posts generiere einen 500-Wort-Artikel mit SEO-freundlicher Struktur. Für LinkedIn erstelle einen professionellen 300-Zeichen-Post. Für Twitter/X erstelle einen prägnanten 280-Zeichen-Tweet mit Hashtags. Speichere den generierten Content zurück im Sheet. Sende eine Benachrichtigung bei Fertigstellung.'
        },
        suggestedNodes: ['google-sheets-trigger', 'switch', 'langchain-agent', 'google-sheets', 'slack'],
        complexity: 'medium',
        estimatedNodes: 8,
        icon: 'PenTool'
    },
    {
        id: 'chatbot',
        name: {
            EN: 'AI Chatbot with Memory',
            DE: 'KI Chatbot mit Gedächtnis'
        },
        category: 'ai',
        description: {
            EN: 'Conversational AI assistant with context memory',
            DE: 'Konversationeller KI-Assistent mit Kontext-Gedächtnis'
        },
        intent: {
            EN: 'Create a chat interface that responds to user messages using an AI Agent. The agent should have access to window buffer memory to remember the last 10 messages of the conversation. Connect tools that allow the agent to: search a knowledge base, create support tickets, and look up order status. The agent should respond in the same language the user writes in. Log all conversations to a database for analytics.',
            DE: 'Erstelle eine Chat-Schnittstelle, die auf Benutzernachrichten mit einem AI Agent antwortet. Der Agent sollte Zugriff auf Window Buffer Memory haben, um die letzten 10 Nachrichten der Konversation zu speichern. Verbinde Tools, die dem Agenten erlauben: Wissensdatenbank durchsuchen, Support-Tickets erstellen und Bestellstatus abfragen. Der Agent sollte in der gleichen Sprache antworten, in der der Benutzer schreibt. Protokolliere alle Konversationen in einer Datenbank für Analytics.'
        },
        suggestedNodes: ['chat-trigger', 'langchain-agent', 'memory-buffer', 'vector-store-pinecone', 'postgres'],
        complexity: 'complex',
        estimatedNodes: 12,
        icon: 'MessageSquare'
    },
    {
        id: 'document-qa',
        name: {
            EN: 'Document Q&A (RAG)',
            DE: 'Dokument-Fragen & Antworten (RAG)'
        },
        category: 'ai',
        description: {
            EN: 'Answer questions about uploaded documents using embeddings',
            DE: 'Fragen zu hochgeladenen Dokumenten mit Embeddings beantworten'
        },
        intent: {
            EN: 'When a PDF is uploaded via webhook, extract the text content and split it into chunks. Generate embeddings for each chunk using OpenAI and store them in Pinecone with metadata. When a question is asked via a separate webhook, retrieve relevant chunks using similarity search and use an AI Agent to generate an answer based on the retrieved context. Include source references in the response.',
            DE: 'Wenn ein PDF über Webhook hochgeladen wird, extrahiere den Textinhalt und teile ihn in Chunks. Generiere Embeddings für jeden Chunk mit OpenAI und speichere sie in Pinecone mit Metadaten. Wenn eine Frage über einen separaten Webhook gestellt wird, rufe relevante Chunks mittels Ähnlichkeitssuche ab und verwende einen AI Agent, um eine Antwort basierend auf dem abgerufenen Kontext zu generieren. Füge Quellenverweise in die Antwort ein.'
        },
        suggestedNodes: ['webhook', 'embeddings-openai', 'vector-store-pinecone', 'langchain-agent', 'respond-to-webhook'],
        complexity: 'complex',
        estimatedNodes: 10,
        icon: 'FileSearch'
    },

    // ═══════════════════════════════════════════════════════════════
    // DATA SYNC
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'database-sync',
        name: {
            EN: 'Database ↔ Sheet Sync',
            DE: 'Datenbank ↔ Sheet Sync'
        },
        category: 'data-sync',
        description: {
            EN: 'Bidirectional sync between database and Google Sheets',
            DE: 'Bidirektionale Synchronisation zwischen Datenbank und Google Sheets'
        },
        intent: {
            EN: 'Every 15 minutes, check for new or updated records in a Postgres database that haven\'t been synced. For each record, check if it exists in Google Sheets by matching the unique ID. If new, append a row. If existing, update the corresponding row. Conversely, check for manual edits in the Sheet and update the database accordingly. Use a sync_timestamp column to track last synchronization. Handle conflicts by preferring the most recent change.',
            DE: 'Alle 15 Minuten auf neue oder aktualisierte Datensätze in einer Postgres-Datenbank prüfen, die noch nicht synchronisiert wurden. Für jeden Datensatz prüfen, ob er in Google Sheets existiert durch Abgleich der eindeutigen ID. Wenn neu, Zeile anhängen. Wenn vorhanden, entsprechende Zeile aktualisieren. Umgekehrt auf manuelle Änderungen im Sheet prüfen und Datenbank entsprechend aktualisieren. Eine sync_timestamp-Spalte zur Nachverfolgung der letzten Synchronisation verwenden. Konflikte durch Bevorzugung der neuesten Änderung behandeln.'
        },
        suggestedNodes: ['schedule', 'postgres', 'google-sheets', 'if', 'merge', 'edit-fields'],
        complexity: 'complex',
        estimatedNodes: 12,
        icon: 'RefreshCw'
    },
    {
        id: 'api-aggregator',
        name: {
            EN: 'Multi-API Data Aggregator',
            DE: 'Multi-API Daten-Aggregator'
        },
        category: 'data-sync',
        description: {
            EN: 'Combine data from multiple APIs into unified dataset',
            DE: 'Daten aus mehreren APIs in einheitlichen Datensatz kombinieren'
        },
        intent: {
            EN: 'On schedule, fetch data from three different APIs: customer data from Salesforce, usage metrics from our product API, and billing info from Stripe. Use the customer ID as the linking key. Merge all data sources into a unified record per customer. Calculate derived metrics like lifetime value and engagement score. Store the enriched dataset in Airtable. If any API call fails, use cached data and log the error.',
            DE: 'Nach Zeitplan Daten von drei verschiedenen APIs abrufen: Kundendaten von Salesforce, Nutzungsmetriken von unserer Produkt-API und Abrechnungsinfos von Stripe. Verwende die Kunden-ID als Verknüpfungsschlüssel. Alle Datenquellen in einen einheitlichen Datensatz pro Kunde zusammenführen. Abgeleitete Metriken wie Lifetime Value und Engagement Score berechnen. Den angereicherten Datensatz in Airtable speichern. Bei Fehlschlag eines API-Aufrufs gecachte Daten verwenden und Fehler protokollieren.'
        },
        suggestedNodes: ['schedule', 'salesforce', 'http-request', 'merge', 'edit-fields', 'airtable', 'error-trigger'],
        complexity: 'complex',
        estimatedNodes: 14,
        icon: 'Layers'
    },

    // ═══════════════════════════════════════════════════════════════
    // SOCIAL MEDIA
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'social-scheduler',
        name: {
            EN: 'Social Media Scheduler',
            DE: 'Social Media Planer'
        },
        category: 'social',
        description: {
            EN: 'Schedule and post content across multiple platforms',
            DE: 'Inhalte plattformübergreifend planen und posten'
        },
        intent: {
            EN: 'Every hour, check Google Sheets for posts scheduled for the current hour. For each scheduled post, check the target platform (Twitter, LinkedIn, or both). Adapt the content length and format for each platform using AI if needed. Post to the respective platform. Update the sheet to mark as posted with the post URL. If posting fails, retry once after 5 minutes, then mark as failed and notify via Slack.',
            DE: 'Jede Stunde Google Sheets auf Posts prüfen, die für die aktuelle Stunde geplant sind. Für jeden geplanten Post die Zielplattform prüfen (Twitter, LinkedIn oder beide). Bei Bedarf Inhaltslänge und Format mit KI für jede Plattform anpassen. Auf der jeweiligen Plattform posten. Das Sheet aktualisieren und als gepostet markieren mit Post-URL. Bei Fehlschlag nach 5 Minuten einmal wiederholen, dann als fehlgeschlagen markieren und via Slack benachrichtigen.'
        },
        suggestedNodes: ['schedule', 'google-sheets', 'switch', 'twitter', 'linkedin', 'wait', 'slack'],
        complexity: 'medium',
        estimatedNodes: 10,
        icon: 'Share2'
    },

    // ═══════════════════════════════════════════════════════════════
    // SUPPORT & TICKETS
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'support-ticket-router',
        name: {
            EN: 'Support Ticket Auto-Router',
            DE: 'Support-Ticket Auto-Router'
        },
        category: 'support',
        description: {
            EN: 'Automatically categorize and route support tickets',
            DE: 'Support-Tickets automatisch kategorisieren und routen'
        },
        intent: {
            EN: 'When a new support email arrives or a form is submitted via webhook, use AI to analyze the content and extract: issue category (billing, technical, general), severity (critical, high, medium, low), product area, and customer sentiment. Route to the appropriate team channel in Slack. For critical issues, also create an urgent ticket in the ticketing system and page the on-call engineer. Send an auto-acknowledgment email to the customer with expected response time based on severity.',
            DE: 'Wenn eine neue Support-E-Mail ankommt oder ein Formular über Webhook übermittelt wird, verwende KI, um den Inhalt zu analysieren und zu extrahieren: Problemkategorie (Abrechnung, technisch, allgemein), Schweregrad (kritisch, hoch, mittel, niedrig), Produktbereich und Kundenstimmung. An den entsprechenden Team-Kanal in Slack weiterleiten. Bei kritischen Problemen zusätzlich ein dringendes Ticket im Ticketsystem erstellen und den Bereitschaftsingenieur benachrichtigen. Eine automatische Bestätigungs-E-Mail an den Kunden senden mit erwarteter Antwortzeit basierend auf dem Schweregrad.'
        },
        suggestedNodes: ['gmail-trigger', 'webhook', 'merge', 'langchain-agent', 'structured-output-parser', 'switch', 'slack', 'http-request', 'gmail'],
        complexity: 'complex',
        estimatedNodes: 12,
        icon: 'Headphones'
    },

    // ═══════════════════════════════════════════════════════════════
    // PRODUCTIVITY
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'meeting-followup',
        name: {
            EN: 'Meeting Notes → Action Items',
            DE: 'Meeting-Notizen → Aktionspunkte'
        },
        category: 'productivity',
        description: {
            EN: 'Extract action items from meeting transcripts and create tasks',
            DE: 'Aktionspunkte aus Meeting-Transkripten extrahieren und Aufgaben erstellen'
        },
        intent: {
            EN: 'When a meeting transcript is added to a Notion database, use AI to analyze the content and extract: key discussion points, decisions made, action items with owners and due dates, and follow-up meeting needs. Create tasks in Airtable or Notion for each action item, assigned to the identified owner. Send a summary to the meeting channel in Slack. If no owner is identified for an action item, assign it to the meeting organizer.',
            DE: 'Wenn ein Meeting-Transkript zu einer Notion-Datenbank hinzugefügt wird, verwende KI, um den Inhalt zu analysieren und zu extrahieren: wichtige Diskussionspunkte, getroffene Entscheidungen, Aktionspunkte mit Verantwortlichen und Fälligkeitsdaten und Bedarf an Folgemeetings. Erstelle Aufgaben in Airtable oder Notion für jeden Aktionspunkt, zugewiesen an den identifizierten Verantwortlichen. Sende eine Zusammenfassung an den Meeting-Kanal in Slack. Wenn kein Verantwortlicher für einen Aktionspunkt identifiziert wird, weise ihn dem Meeting-Organisator zu.'
        },
        suggestedNodes: ['notion-trigger', 'langchain-agent', 'structured-output-parser', 'loop-over-items', 'airtable', 'slack'],
        complexity: 'medium',
        estimatedNodes: 9,
        icon: 'ClipboardList'
    },
    {
        id: 'daily-standup',
        name: {
            EN: 'Automated Daily Standup',
            DE: 'Automatisiertes Daily Standup'
        },
        category: 'productivity',
        description: {
            EN: 'Collect standup updates and compile team summary',
            DE: 'Standup-Updates sammeln und Team-Zusammenfassung erstellen'
        },
        intent: {
            EN: 'Every weekday at 9 AM, send a Slack message to each team member asking for their standup update (yesterday\'s accomplishments, today\'s plan, blockers). Wait until 10 AM to collect responses. Compile all responses into a formatted summary. Use AI to identify any cross-team dependencies or blockers that need attention. Post the compiled standup to the team channel. Store historical standups in a database for tracking.',
            DE: 'Jeden Werktag um 9 Uhr eine Slack-Nachricht an jedes Teammitglied senden mit Bitte um Standup-Update (gestrige Erfolge, heutiger Plan, Blocker). Bis 10 Uhr auf Antworten warten. Alle Antworten in einer formatierten Zusammenfassung kompilieren. KI verwenden, um teamübergreifende Abhängigkeiten oder Blocker zu identifizieren, die Aufmerksamkeit benötigen. Das kompilierte Standup im Team-Kanal posten. Historische Standups in einer Datenbank zur Nachverfolgung speichern.'
        },
        suggestedNodes: ['schedule', 'slack', 'wait', 'aggregate', 'langchain-agent', 'postgres'],
        complexity: 'medium',
        estimatedNodes: 10,
        icon: 'Users'
    }
];

// Helper functions
export const getTemplatesByCategory = (category: UseCaseTemplate['category']) =>
    USE_CASE_TEMPLATES.filter(t => t.category === category);

export const getTemplateById = (id: string) =>
    USE_CASE_TEMPLATES.find(t => t.id === id);

export const getAllCategories = (): UseCaseTemplate['category'][] =>
    [...new Set(USE_CASE_TEMPLATES.map(t => t.category))];

export const getCategoryLabel = (category: UseCaseTemplate['category'], lang: Language): string => {
    const labels: Record<UseCaseTemplate['category'], { EN: string; DE: string }> = {
        'email': { EN: 'Email Automation', DE: 'E-Mail-Automatisierung' },
        'sales': { EN: 'Sales & CRM', DE: 'Vertrieb & CRM' },
        'ai': { EN: 'AI & Content', DE: 'KI & Content' },
        'data-sync': { EN: 'Data Sync', DE: 'Daten-Sync' },
        'social': { EN: 'Social Media', DE: 'Social Media' },
        'productivity': { EN: 'Productivity', DE: 'Produktivität' },
        'support': { EN: 'Customer Support', DE: 'Kundensupport' }
    };
    return labels[category][lang];
};
