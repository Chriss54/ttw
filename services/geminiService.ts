import { GoogleGenAI } from "@google/genai";
import { BlockType, StrategyType, WorkflowBlock, Language } from "../types";
import { N8N_NODES, getNodesByCategory, getRecommendedNodes, getAntiPatterns } from "../data/n8nNodes";
import { UseCaseTemplate, getTemplateById } from "../data/useCaseTemplates";
import { buildFallbackBlocks } from "./intentAnalyzer";

// Helper to get client safely
const getAiClient = () => {
  let apiKey: string | undefined;
  try {
    // Safety check for browser environments where process might not be defined
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment access blocked", e);
  }

  if (!apiKey) {
    console.warn("No API KEY found - Running in Simulation Mode");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const detectOptimalStrategy = async (
  userIntent: string,
  language: Language
): Promise<{
  recommended: StrategyType,
  confidence: number,
  reasoning: string
}> => {
  const client = getAiClient();

  // Fallback: simple keyword analysis if no API key
  if (!client) {
    const branchingKeywords = ['wenn', 'falls', 'if', 'sonst', 'else', 'oder', 'prüfen', 'check', 'validieren', 'validate', 'verfügbar', 'available', 'route', 'switch'];
    const hasBranching = branchingKeywords.some(kw => userIntent.toLowerCase().includes(kw));

    return {
      recommended: hasBranching ? StrategyType.FUNCTIONAL : StrategyType.SPEC_SHEET,
      confidence: 0.6,
      reasoning: language === 'DE'
        ? 'Fallback-Analyse basierend auf Schlüsselwörtern (Logik erkannt).'
        : 'Fallback detection based on keywords (Logic detected).'
    };
  }

  const langInstruction = language === 'DE'
    ? "Output reasoning in German."
    : "Output reasoning in English.";

  const systemPrompt = `
    You are a workflow architecture analyzer for n8n.
    Analyze the user's business problem and determine the OPTIMAL n8n workflow strategy.
    ${langInstruction}

    STRATEGY OPTIONS:

    1. **node-by-node** (Maps to SPEC_SHEET)
       - Best for: LINEAR workflows (A -> B -> C)
       - Best for: Simple data transformations
       - Best for: < 8 nodes
       - Best for: No conditional branching
       - Indicators: "then", "after that", "simply", "just"
       
    2. **functional-grouping** (Maps to FUNCTIONAL)
       - Best for: CONDITIONAL workflows (if/else, routing)
       - Best for: Multi-branch logic
       - Best for: Validation + decision trees
       - Best for: > 10 nodes
       - Indicators: "if", "check whether", "validate", "depending on", "available/unavailable"

    ANALYSIS STEPS:
    1. Count decision points (if/else, routing needs)
    2. Identify validation requirements
    3. Estimate node count
    4. Detect branching complexity

    Return JSON:
    {
      "recommended": "node-by-node" | "functional-grouping",
      "confidence": 0.0-1.0,
      "reasoning": "Brief explanation in 1 sentence"
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userIntent,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    const result = JSON.parse(response.text || '{}');

    // Map string response to Enum
    const strategyMap: Record<string, StrategyType> = {
      'node-by-node': StrategyType.SPEC_SHEET,
      'functional-grouping': StrategyType.FUNCTIONAL
    };

    return {
      recommended: strategyMap[result.recommended] || StrategyType.FUNCTIONAL,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'Analysis completed'
    };
  } catch (e) {
    console.error("Strategy detection error", e);
    return {
      recommended: StrategyType.FUNCTIONAL,
      confidence: 0.5,
      reasoning: 'Defaulting to functional grouping due to analysis error.'
    };
  }
};

export const generateWorkflowStructure = async (
  userIntent: string,
  negativePrompt: string,
  strategy: StrategyType,
  language: Language,
  templateId?: string | null
): Promise<Partial<WorkflowBlock>[]> => {
  const client = getAiClient();

  // Get template context if available
  const template = templateId ? getTemplateById(templateId) : null;

  // Build node recommendations based on intent and template
  const triggerNodes = getNodesByCategory('trigger').slice(0, 8);
  const aiNodes = getNodesByCategory('ai').slice(0, 6);
  const logicNodes = getNodesByCategory('logic').slice(0, 6);
  const recommendedNodes = getRecommendedNodes();
  const antiPatterns = getAntiPatterns();

  // Intelligent fallback for demo if no API key
  // Uses intent analysis to generate contextually relevant blocks
  if (!client) {
    console.log("Demo Mode: Generating intelligent fallback based on user intent");
    return new Promise(resolve => setTimeout(() => {
      const blocks = buildFallbackBlocks(userIntent, language);
      resolve(blocks);
    }, 1500));
  }

  const templateContext = template ? `
    TEMPLATE CONTEXT:
    Name: ${template.name[language]}
    Suggested Nodes: ${template.suggestedNodes.join(', ')}
    Complexity: ${template.complexity}
    Estimated Nodes: ${template.estimatedNodes}
  ` : '';

  const nodeKnowledge = `
    AVAILABLE N8N NODES (Prioritize these):
    
    TRIGGERS:
    ${triggerNodes.map(n => `- ${n.name} (${n.type}): ${n.description[language]}`).join('\n    ')}
    
    AI/LLM NODES (Modern - USE THESE):
    ${aiNodes.map(n => `- ${n.name} (${n.type}): ${n.description[language]}${n.recommended ? ' [RECOMMENDED]' : ''}`).join('\n    ')}
    
    LOGIC NODES:
    ${logicNodes.map(n => `- ${n.name} (${n.type}): ${n.description[language]}`).join('\n    ')}
    
    ANTI-PATTERNS TO AVOID:
    ${antiPatterns.map(ap => `- ${ap.pattern}: ${ap.explanation[language]}`).join('\n    ')}
  `;

  const langInstruction = language === 'DE'
    ? "OUTPUT LANGUAGE: GERMAN (Deutsch). All generated descriptions, explanations, and node names must be in German."
    : "OUTPUT LANGUAGE: ENGLISH. All generated descriptions and content must be in English.";

  const systemPrompt = `
    You are an elite n8n Systems Architect with deep knowledge of n8n's 500+ nodes.
    Strategy: ${strategy}
    ${langInstruction}
    
    ${templateContext}
    
    ${nodeKnowledge}
    
    Goal: Generate high-performance ARCHITECTURAL PROMPTS that force n8n's AI to build modern, efficient workflows.
    
    ### NEGATIVE PROMPT (EXCLUSIONS):
    User exclusions: ${negativePrompt || 'None'}. 
    NEVER use these approaches/tools. Strictly adhere to these constraints.
    
    ### CRITICAL MODERN STANDARDS (MUST FOLLOW):
    1. **Modern AI Nodes**:
       - FORBID "Code Node" + "OpenAI Node" patterns for extraction/classification.
       - MANDATE usage of "@n8n/n8n-nodes-langchain.agent" connected to a "Structured Output Parser" for all extraction/classification tasks.
    
    2. **Branching & Merging**:
       - "Fan-in" Pattern: If multiple branches lead to a similar output (e.g., logging), EXPLICITLY instruct to use a "Merge Node" to consolidate branches before the output node.
       - Anti-Pattern: "Do NOT create duplicate output nodes for each branch."
    
    3. **Expression Safety**:
       - Instruct to use fallback patterns in expressions: "{{ $json.field || 'default_value' }}".
    
    4. **Error Handling** (CRITICAL FOR PRODUCTION):
       - Include Error Trigger node recommendation for error handling.
       - Suggest "Retry on Fail" setting for external API calls.
       - Recommend Split In Batches for large dataset processing.
    
    5. **Context & Localization**:
       - DETECT the language of the 'User Intent'.
       - INSTRUCT the workflow to generate content (emails, slack messages) in that detected language.
    
    ### PHASE INSTRUCTIONS:
    - **INGESTION**: Define triggers. Use AI Agents for immediate structured data extraction/normalization. Specify exact trigger type.
    - **LOGIC**: Define routing. Use Merge nodes to simplify topology. Minimize total node count. Include error handling.
    - **STORAGE**: Define database/API actions. Ensure null-safety in mappings. Include retry logic for external calls.
    
    ### OUTPUT FORMAT:
    For each node mentioned, include:
    - Node name and n8n type (from the AVAILABLE NODES list)
    - Configuration hints
    - Risk level (LOW/MED/HIGH based on external dependencies)
    
    Strictly Output JSON format:
    [
      {
        "type": "INGESTION",
        "content": "Description of nodes and configuration rules...",
        "riskLevel": "SAFE" | "COMPLEX" | "HIGH_RISK",
        "nodes": [{ "name": "Node Name", "type": "node-type", "risk": "LOW"|"MED"|"HIGH" }],
        "outputs": ["variable names exposed by this layer"]
      },
      ...
    ]
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userIntent,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Generation Error", e);
    throw new Error("Neural Link Severed: " + (e instanceof Error ? e.message : "Unknown API Error"));
  }
};

export const refineBlock = async (
  blockType: BlockType,
  currentContent: string,
  userRefinement: string,
  contextBlocks: WorkflowBlock[],
  strictness: number,
  compression: number,
  language: Language
): Promise<string> => {
  const client = getAiClient();

  if (!client) {
    return new Promise(resolve => setTimeout(() => resolve(currentContent + "\n- Refined: " + userRefinement), 1000));
  }

  // Find locked context (Dependency Injection)
  const lockedContext = contextBlocks
    .filter(b => b.locked && b.type !== blockType)
    .map(b => `[LOCKED ${b.type}]: ${b.content} (Outputs: ${b.outputs.join(', ')})`)
    .join('\n');

  const langInstruction = language === 'DE'
    ? "OUTPUT LANGUAGE: GERMAN (Deutsch)."
    : "OUTPUT LANGUAGE: ENGLISH.";

  const systemPrompt = `
    You are a Surgical Prompt Engineer for n8n, specializing in Modern Agentic Patterns.
    Task: Rewrite the ${blockType} section.
    ${langInstruction}
    
    Constraints:
    1. Strictness Level: ${strictness}/100 (100 = Spec Sheet, 0 = Natural Language).
    2. Compression Level: ${compression}/100 (100 = Dense/Imperative, 0 = Verbose).
    3. **Modernization**: Replace legacy patterns (Code+LLM) with "AI Agent + Structured Output Parser".
    4. **Optimization**: Consolidate branches using Merge nodes. Reduce node count.
    5. **Safety**: Enforce {{ variable || 'fallback' }} syntax.
    6. MUST adhere to LOCKED CONTEXT inputs. Do not hallucinate variables not present in Locked Context.
    
    LOCKED CONTEXT:
    ${lockedContext}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Original Content: ${currentContent}\nUser Refinement Request: ${userRefinement}`,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    return response.text || currentContent;
  } catch (e) {
    console.error("Refinement Error", e);
    return currentContent;
  }
};

export const addLineToBlock = async (
  blockType: BlockType,
  currentContent: string,
  lineToAdd: string,
  position: 'start' | 'end',
  language: Language
): Promise<string> => {
  const client = getAiClient();

  if (!client) {
    // Simple fallback: just append/prepend the line
    const formattedLine = `- ${lineToAdd}`;
    if (position === 'start') {
      const lines = currentContent.split('\n');
      // Find first content line after header
      const headerEndIndex = lines.findIndex((l, i) => i > 0 && l.trim() && !l.startsWith('#'));
      if (headerEndIndex > 0) {
        lines.splice(headerEndIndex, 0, formattedLine);
        return lines.join('\n');
      }
      return formattedLine + '\n' + currentContent;
    }
    return currentContent + '\n' + formattedLine;
  }

  const langInstruction = language === 'DE'
    ? "OUTPUT LANGUAGE: GERMAN (Deutsch)."
    : "OUTPUT LANGUAGE: ENGLISH.";

  const systemPrompt = `
    You are a precise n8n workflow prompt editor.
    Task: Add a SINGLE new instruction to the ${blockType} block.
    ${langInstruction}
    
    RULES:
    1. Format the new line to match the EXISTING style (numbered list, bullet points, or bold headers).
    2. Place it ${position === 'start' ? 'at the beginning of the instructions (after any headers)' : 'at the end of the instructions'}.
    3. Do NOT rewrite or modify ANY existing content.
    4. Do NOT add explanations or commentary.
    5. Just return the FULL updated block content with the new line inserted.
    
    User wants to add: "${lineToAdd}"
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Block Content:\n${currentContent}`,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    return response.text || currentContent + '\n- ' + lineToAdd;
  } catch (e) {
    console.error("Add Line Error", e);
    // Fallback: simple append
    return currentContent + '\n- ' + lineToAdd;
  }
};