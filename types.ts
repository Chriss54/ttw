export enum BlockType {
  INGESTION = 'INGESTION',
  LOGIC = 'LOGIC',
  STORAGE = 'STORAGE',
}

export type Language = 'EN' | 'DE';

export interface WorkflowBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string; // The specific prompt part
  locked: boolean;
  riskLevel: 'SAFE' | 'COMPLEX' | 'HIGH_RISK';
  outputs: string[]; // Variables exposed by this block
  inputs: string[]; // Variables required by this block
  nodes: NodeMetadata[];
}

export interface NodeMetadata {
  name: string;
  type: string; // e.g., 'n8n-nodes-base.webhook'
  risk: 'LOW' | 'MED' | 'HIGH';
  riskExplanation?: { EN: string; DE: string };
  riskFix?: { EN: string; DE: string };
}

export enum StrategyType {
  SPEC_SHEET = 'SPEC_SHEET',
  CONSTRAINT_FIRST = 'CONSTRAINT_FIRST',
  FUNCTIONAL = 'FUNCTIONAL',
}

export interface AppState {
  rawIntent: string;
  strategy: StrategyType;
  blocks: WorkflowBlock[];
  isGenerating: boolean;
  globalTokenCount: number;
  selectedTemplateId: string | null;
}

// Re-export for convenience (actual implementation in data/useCaseTemplates.ts)
export interface UseCaseTemplateType {
  id: string;
  name: { EN: string; DE: string };
  category: string;
  description: { EN: string; DE: string };
  intent: { EN: string; DE: string };
  suggestedNodes: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedNodes: number;
  icon: string;
}

// Re-export for convenience (actual implementation in services/promptQuality.ts)
export interface QualityScoreType {
  score: number;
  issues: Array<{ id: string; text: { EN: string; DE: string }; severity: 'error' | 'warning' | 'info' }>;
  suggestions: Array<{ text: { EN: string; DE: string }; priority: number }>;
  estimatedNodes: number;
  detectedTrigger: string | null;
  detectedComplexity: 'simple' | 'medium' | 'complex';
}