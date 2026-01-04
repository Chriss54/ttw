import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";
import { MegaTemplate, detectTemplate, MEGA_TEMPLATES } from "../data/megaTemplates";

// Helper to get client safely
const getAiClient = () => {
    let apiKey: string | undefined;
    try {
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Environment access blocked", e);
    }

    if (!apiKey) {
        console.warn("No API KEY found - Running in Detailed Fallback Mode");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

interface GenerationProgress {
    phase: 'detecting' | 'architecture' | 'nodes' | 'setup' | 'assembling' | 'complete';
    progress: number;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * Main entry point for mega prompt generation
 */
export async function generateMegaPrompt(
    userIntent: string,
    language: Language,
    onProgress?: ProgressCallback
): Promise<string> {
    const client = getAiClient();

    onProgress?.({ phase: 'detecting', progress: 5 });

    // Step 1: Detect matching template
    const template = detectTemplate(userIntent);

    onProgress?.({ phase: 'architecture', progress: 15 });

    // Step 2: Generate architecture section
    const architecture = await generateArchitectureSection(userIntent, template, language, client);

    onProgress?.({ phase: 'nodes', progress: 40 });

    // Step 3: Generate detailed node specifications
    const nodeSpecs = await generateNodeDetails(userIntent, template, language, client);

    onProgress?.({ phase: 'setup', progress: 70 });

    // Step 4: Generate setup & warnings
    const setup = generateSetupSection(template, language);

    onProgress?.({ phase: 'assembling', progress: 90 });

    // Step 5: Assemble mega prompt
    const megaPrompt = assembleMegaPrompt(userIntent, template, architecture, nodeSpecs, setup, language);

    onProgress?.({ phase: 'complete', progress: 100 });

    return megaPrompt;
}

/**
 * Generate ASCII architecture diagram
 */
async function generateArchitectureSection(
    userIntent: string,
    template: MegaTemplate | null,
    language: Language,
    client: GoogleGenAI | null
): Promise<string> {
    // Use pre-built detailed architecture if available
    if (template?.detailedArchitecture) {
        return template.detailedArchitecture[language];
    }

    if (!client) {
        return generateFallbackArchitecture(template, language);
    }

    const templateHint = template
        ? `Base this on the ${template.name.EN} pattern with nodes: ${template.nodeSkeletons.map(n => n.name).join(', ')}`
        : 'Create a custom architecture based on the requirements';

    const langInstruction = language === 'DE' ? 'Output in German.' : 'Output in English.';

    const prompt = `
    Create a DETAILED ASCII architecture diagram for an n8n workflow.
    ${langInstruction}
    
    User requirement: ${userIntent}
    ${templateHint}
    
    Rules:
    1. Use [Node Name] for nodes with descriptive names
    2. Use → for main connections
    3. Use ↓ and ↑ for vertical flow
    4. Use --[connection_type]--> for AI connections (ai_tool, ai_memory, ai_languageModel, ai_outputParser, ai_embedding)
    5. Group related nodes visually with clear sections (=== SECTION NAME ===)
    6. Show ALL parallel branches clearly with proper alignment
    7. Include sub-nodes for AI Agents (OpenAI models, memory, tools)
    8. Make the diagram at least 30 lines with full detail
    
    Return ONLY the ASCII diagram wrapped in \`\`\` code blocks.
  `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        return response.text || generateFallbackArchitecture(template, language);
    } catch (e) {
        console.error("Architecture generation error", e);
        return generateFallbackArchitecture(template, language);
    }
}

function generateFallbackArchitecture(template: MegaTemplate | null, language: Language): string {
    if (!template) {
        return '```\n[Trigger] → [Process] → [Output]\n```';
    }

    const nodes = template.nodeSkeletons.filter(n => !n.connectionType);
    const mainFlow = nodes.slice(0, 5).map(n => `[${n.name}]`).join(' → ');

    return `\`\`\`
=== ${template.name[language].toUpperCase()} ===

${mainFlow}
    ↓
[Weitere Nodes je nach Konfiguration...]
\`\`\``;
}

/**
 * Generate EXHAUSTIVE node specifications
 */
async function generateNodeDetails(
    userIntent: string,
    template: MegaTemplate | null,
    language: Language,
    client: GoogleGenAI | null
): Promise<string> {
    // Always use detailed fallback for templates - it's more reliable
    if (template) {
        return generateDetailedFallbackNodeSpecs(template, language);
    }

    if (!client) {
        return language === 'DE'
            ? '### Nodes\n\n_Wähle ein Template oder verwende einen API-Schlüssel für detaillierte Node-Spezifikationen._'
            : '### Nodes\n\n_Select a template or use an API key for detailed node specifications._';
    }

    const langInstruction = language === 'DE' ? 'Output in German.' : 'Output in English.';

    const prompt = `
    Generate EXTREMELY DETAILED n8n node specifications for this workflow requirement.
    ${langInstruction}
    
    User requirement: ${userIntent}
    
    For EACH node, provide ALL of the following in markdown format:

    ### Node N: [Name]
    **Typ:** Full n8n node type (e.g., @n8n/n8n-nodes-langchain.agent)
    **Name:** \`Display Name\`
    
    **Konfiguration:**
    - Exact parameter values in a table
    
    **Expressions:** (if applicable)
    | Field | Expression |
    |-------|------------|
    | fieldName | {{ $json.field }} |
    
    **System Message/Prompt:** (for AI nodes - show FULL text)
    \`\`\`
    Full prompt text here...
    \`\`\`
    
    **JSON Schema:** (for structured output parsers)
    \`\`\`json
    { ... }
    \`\`\`
    
    **Sub-Nodes:** (for AI Agents)
    - List each connected model, memory, tool with its connection type
    
    ---

    Generate at least 15 nodes with FULL details. Do not abbreviate.
  `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        return response.text || '';
    } catch (e) {
        console.error("Node details generation error", e);
        return '';
    }
}

/**
 * Generate DETAILED fallback node specifications from template
 */
function generateDetailedFallbackNodeSpecs(template: MegaTemplate, language: Language): string {
    const sections: string[] = [];
    let nodeIndex = 1;

    const headers = {
        type: language === 'DE' ? 'Typ' : 'Type',
        config: language === 'DE' ? 'Konfiguration' : 'Configuration',
        expressions: language === 'DE' ? 'Expressions' : 'Expressions',
        systemMessage: language === 'DE' ? 'System Message/Prompt' : 'System Message/Prompt',
        schema: language === 'DE' ? 'Output Schema' : 'Output Schema',
        subNodes: language === 'DE' ? 'Sub-Nodes (AI-Verbindungen)' : 'Sub-Nodes (AI Connections)'
    };

    // Helper to generate detailed node section
    function generateNodeSection(node: typeof template.nodeSkeletons[0], index: number): string {
        let section = `
### Node ${index}: ${node.name}
**${headers.type}:** ${node.type}  
**Name:** \`${node.name}\`

**${headers.config}:**
`;
        // Add config hints
        if (node.configHints && node.configHints.length > 0) {
            section += node.configHints.map(h => `- ${h}`).join('\n') + '\n';
        } else {
            section += '- Standard (keine besonderen Parameter)\n';
        }

        // Add expressions if available
        if (node.fullSpec?.expressions) {
            section += `\n**${headers.expressions}:**\n| Field | Value |\n|-------|-------|\n`;
            for (const [field, value] of Object.entries(node.fullSpec.expressions)) {
                section += `| ${field} | \`${value}\` |\n`;
            }
        }

        // Add system message if available
        if (node.fullSpec?.systemMessage) {
            section += `\n**${headers.systemMessage}:**\n\`\`\`\n${node.fullSpec.systemMessage}\n\`\`\`\n`;
        }

        // Add schema if available
        if (node.fullSpec?.schema) {
            section += `\n**${headers.schema}:**\n\`\`\`json\n${node.fullSpec.schema}\n\`\`\`\n`;
        }

        // Add sub-nodes if available
        if (node.subNodes && node.subNodes.length > 0) {
            section += `\n**${headers.subNodes}:**\n`;
            for (const sub of node.subNodes) {
                section += `\n#### ${sub.name}\n`;
                section += `**${headers.type}:** ${sub.type}  \n`;
                section += `**Verbindung:** \`${sub.connectionType}\` → ${node.name}  \n`;
                if (sub.configHints.length > 0) {
                    section += `**${headers.config}:** ${sub.configHints.join(', ')}\n`;
                }
            }
        }

        section += '\n---';
        return section;
    }

    // Process main nodes (not sub-nodes)
    for (const node of template.nodeSkeletons) {
        if (node.connectionType) continue; // Skip pure sub-nodes (they're included under parents)

        sections.push(generateNodeSection(node, nodeIndex));
        nodeIndex++;
    }

    return sections.join('\n');
}

/**
 * Generate setup section (SQL, credentials, warnings, test data)
 */
function generateSetupSection(template: MegaTemplate | null, language: Language): string {
    if (!template) {
        return language === 'DE'
            ? '## Setup\n\nKeine speziellen Setup-Anforderungen.'
            : '## Setup\n\nNo special setup requirements.';
    }

    const headers = {
        cred: language === 'DE' ? 'ERFORDERLICHE CREDENTIALS' : 'REQUIRED CREDENTIALS',
        sql: language === 'DE' ? 'DATENBANK SETUP (SQL)' : 'DATABASE SETUP (SQL)',
        warnings: language === 'DE' ? 'WICHTIGE HINWEISE' : 'IMPORTANT NOTES',
        testData: language === 'DE' ? 'TESTDATEN-BEISPIELE' : 'TEST DATA EXAMPLES'
    };

    let setup = '';

    // Credentials
    if (template.credentialsRequired.length > 0) {
        setup += `## ${headers.cred}\n\n`;
        template.credentialsRequired.forEach((cred, i) => {
            setup += `${i + 1}. **${cred}**\n`;
            if (cred === 'OpenAI API') {
                setup += `   - ${language === 'DE' ? 'Für alle LLM-Calls (gpt-4o-mini)' : 'For all LLM calls (gpt-4o-mini)'}\n`;
                setup += `   - ${language === 'DE' ? 'Für Embedding-Generierung (text-embedding-3-small)' : 'For embedding generation (text-embedding-3-small)'}\n`;
            }
            if (cred === 'Supabase') {
                setup += `   - ${language === 'DE' ? 'Für alle Tabellen-Operationen (Create, Query)' : 'For all table operations (Create, Query)'}\n`;
                setup += `   - ${language === 'DE' ? 'Für Vector Store Zugriff' : 'For Vector Store access'}\n`;
            }
        });
        setup += '\n---\n\n';
    }

    // SQL Setup
    if (template.sqlSetup) {
        setup += `## ${headers.sql}\n\n\`\`\`sql\n${template.sqlSetup}\n\`\`\`\n\n---\n\n`;
    }

    // Warnings
    if (template.warnings && template.warnings.length > 0) {
        setup += `## ${headers.warnings}\n\n`;
        template.warnings.forEach(w => {
            setup += `${w[language]}\n\n`;
        });
        setup += '---\n\n';
    }

    // Test Data Examples
    if (template.testDataExamples) {
        setup += template.testDataExamples[language];
        setup += '\n\n---\n\n';
    }

    return setup;
}

/**
 * Generate detailed connections section
 */
function generateConnectionsSection(template: MegaTemplate | null, language: Language): string {
    if (!template) {
        return language === 'DE'
            ? '_Verbindungen basierend auf der Architektur oben erstellen._'
            : '_Create connections based on the architecture above._';
    }

    const headers = {
        main: language === 'DE' ? 'Hauptverbindungen (main connections)' : 'Main Connections',
        ai: language === 'DE' ? 'AI-Verbindungen' : 'AI Connections'
    };

    let connections = `### ${headers.main}\n\`\`\`\n`;

    // Build main flow connections
    const mainNodes = template.nodeSkeletons.filter(n => !n.connectionType);

    // Group nodes by logical sections
    const ingestionNodes = mainNodes.filter(n =>
        n.name.includes('Trigger') || n.name.includes('Test') || n.name.includes('Table') ||
        n.name.includes('Classif') || n.name.includes('Route') || n.name.includes('Message') ||
        n.name.includes('parser') || n.name.includes('HTTP') || n.name.includes('Create')
    );

    const queryNodes = mainNodes.filter(n =>
        n.name.includes('chat') || n.name.includes('Query Agent')
    );

    if (ingestionNodes.length > 0) {
        connections += `// Data Ingestion Pipeline\n`;
        connections += ingestionNodes.slice(0, 4).map(n => n.name).join(' → ') + '\n\n';
        connections += `Route to Table:\n`;
        connections += `  Output 0 (documents) → Message a model (Documents)\n`;
        connections += `  Output 1 (faqs) → Message a model (FAQs)\n`;
        connections += `  Output 2 (procedures) → Message a model (Procedures)\n\n`;
        connections += `Message a model → content parser → HTTP Request → Create a row\n`;
    }

    if (queryNodes.length > 0) {
        connections += `\n// Query Pipeline\n`;
        connections += queryNodes.map(n => n.name).join(' → ') + '\n';
    }

    connections += `\`\`\`\n`;

    // AI connections
    const aiAgents = template.nodeSkeletons.filter(n => n.type.includes('agent') && n.subNodes);
    if (aiAgents.length > 0) {
        connections += `\n### ${headers.ai}\n\`\`\`\n`;
        for (const agent of aiAgents) {
            connections += `// ${agent.name}\n`;
            for (const sub of agent.subNodes || []) {
                connections += `${sub.name} --[${sub.connectionType}]--> ${agent.name}\n`;
            }
            connections += '\n';
        }
        connections += `\`\`\``;
    }

    return connections;
}

/**
 * Assemble all sections into final mega prompt
 */
function assembleMegaPrompt(
    userIntent: string,
    template: MegaTemplate | null,
    architecture: string,
    nodeSpecs: string,
    setup: string,
    language: Language
): string {
    const workflowName = template?.name[language] || (language === 'DE' ? 'Benutzerdefinierter Workflow' : 'Custom Workflow');

    const headers = {
        overview: language === 'DE' ? 'Übersicht' : 'Overview',
        architecture: language === 'DE' ? 'ARCHITEKTUR' : 'ARCHITECTURE',
        nodes: language === 'DE' ? 'NODE-SPEZIFIKATIONEN' : 'NODE SPECIFICATIONS',
        connections: language === 'DE' ? 'VERBINDUNGEN' : 'CONNECTIONS'
    };

    const templateNote = template
        ? `\n**${language === 'DE' ? 'Basierend auf Template' : 'Based on template'}:** ${template.name[language]}\n`
        : '';

    const megaPrompt = `# n8n Workflow Builder Prompt: ${workflowName}

## Workflow-Name
\`${workflowName}\`

## ${headers.overview}
${userIntent}
${templateNote}
---

## ${headers.architecture}

${architecture}

---

## ${headers.nodes}

${nodeSpecs}

---

${setup}

## ${headers.connections}

${generateConnectionsSection(template, language)}

---

## STICKY NOTES (Optional)

${language === 'DE'
            ? `4 Sticky Notes für Dokumentation:
1. **"Query Agent - With Table Traversal"** (beim Query-Bereich)
2. **"Multi-Table Document Ingestion"** (beim Ingestion-Bereich)
3. **SQL Commands für Supabase** (mit CREATE TABLE Statements)
4. **RAG System Overview** (mit Architektur-Diagramm und Setup-Checklist)`
            : `4 Sticky Notes for documentation:
1. **"Query Agent - With Table Traversal"** (near Query section)
2. **"Multi-Table Document Ingestion"** (near Ingestion section)
3. **SQL Commands for Supabase** (with CREATE TABLE Statements)
4. **RAG System Overview** (with Architecture diagram and Setup Checklist)`}
`;

    return megaPrompt;
}

/**
 * Get available templates for UI display
 */
export function getAvailableTemplates(): { id: string; name: { EN: string; DE: string }; description: { EN: string; DE: string } }[] {
    return MEGA_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description
    }));
}
