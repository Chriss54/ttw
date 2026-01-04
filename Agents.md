# Agents.md

## Übersicht / Overview

Dieses Dokument beschreibt die AI-Agenten und deren Rollen im **Workflow Prompt Architect** Projekt - einem Tool zur Generierung optimierter n8n-Workflow-Prompts.

This document describes the AI agents and their roles in the **Workflow Prompt Architect** project - a tool for generating optimized n8n workflow prompts.

---

## 🤖 Agent-Architektur / Agent Architecture

### 1. Strategy Detection Agent

**Zweck / Purpose:**  
Analysiert die Benutzerabsicht und empfiehlt die optimale Workflow-Strategie.

Analyzes user intent and recommends the optimal workflow strategy.

**Implementierung / Implementation:** `services/geminiService.ts` → `detectOptimalStrategy()`

**Modell / Model:** `gemini-3-flash-preview`

**Input:**
- `userIntent: string` - Die Beschreibung des gewünschten Workflows
- `language: Language` - 'EN' oder 'DE'

**Output:**
```typescript
{
  recommended: StrategyType,  // SPEC_SHEET oder FUNCTIONAL
  confidence: number,         // 0.0 - 1.0
  reasoning: string           // Begründung der Empfehlung
}
```

**Strategien / Strategies:**
| Strategy | Use Case | Indikatoren |
|----------|----------|-------------|
| `node-by-node` (SPEC_SHEET) | Lineare Workflows < 8 Nodes | "then", "after that", "simply" |
| `functional-grouping` (FUNCTIONAL) | Komplexe Workflows mit Verzweigungen | "if", "check whether", "validate" |

**Fallback:**  
Bei fehlendem API-Key: Keyword-basierte Analyse für Offline-Betrieb.

---

### 2. Workflow Structure Generation Agent

**Zweck / Purpose:**  
Generiert architektonische Prompts für n8n-Workflows basierend auf Benutzerabsicht und ausgewählter Strategie.

Generates architectural prompts for n8n workflows based on user intent and selected strategy.

**Implementierung / Implementation:** `services/geminiService.ts` → `generateWorkflowStructure()`

**Modell / Model:** `gemini-3-flash-preview`

**Input:**
```typescript
{
  userIntent: string,
  negativePrompt: string,      // Auszuschließende Ansätze
  strategy: StrategyType,
  language: Language,
  templateId?: string | null   // Optional: Use-Case-Template
}
```

**Output:**
```typescript
WorkflowBlock[] = [
  {
    type: 'INGESTION' | 'LOGIC' | 'STORAGE',
    content: string,           // Architektur-Beschreibung
    riskLevel: 'SAFE' | 'COMPLEX' | 'HIGH_RISK',
    nodes: NodeMetadata[],     // Empfohlene n8n-Nodes
    outputs: string[]          // Exponierte Variablen
  }
]
```

**Phasen-Instruktionen / Phase Instructions:**
| Phase | Fokus |
|-------|-------|
| **INGESTION** | Trigger-Definition, AI-Agents für Datenextraktion |
| **LOGIC** | Routing, Merge-Nodes, Error-Handling |
| **STORAGE** | Datenbank/API-Aktionen, Null-Safety |

**Kritische Standards:**
1. Moderne AI-Nodes statt Code+LLM-Pattern
2. Fan-in-Pattern mit Merge-Nodes
3. Expression-Safety: `{{ $json.field || 'default' }}`
4. Error-Handling mit Error-Trigger
5. Rate-Limiting mit Split-in-Batches

---

### 3. Block Refinement Agent

**Zweck / Purpose:**  
Verfeinert einzelne Workflow-Blöcke basierend auf Benutzer-Feedback.

Refines individual workflow blocks based on user feedback.

**Implementierung / Implementation:** `services/geminiService.ts` → `refineBlock()`

**Modell / Model:** `gemini-3-flash-preview`

**Input:**
```typescript
{
  blockType: BlockType,
  currentContent: string,
  userRefinement: string,      // Verfeinerungsanweisung
  contextBlocks: WorkflowBlock[],
  strictness: number,          // 0-100 (Spec Sheet vs Natural Language)
  compression: number,         // 0-100 (Dense vs Verbose)
  language: Language
}
```

**Features:**
- **Dependency Injection:** Berücksichtigt gesperrte Kontext-Blöcke
- **Modernisierung:** Ersetzt Legacy-Patterns automatisch
- **Optimierung:** Reduziert Node-Anzahl durch Merge-Nodes

---

## 📚 Knowledge Bases

### N8N Node Knowledge Base

**Pfad / Path:** `data/n8nNodes.ts`

**Struktur:**
```typescript
interface N8NNode {
  id: string;
  name: string;
  type: string;              // Voller n8n-Node-Typ
  category: 'trigger' | 'ai' | 'logic' | 'action' | 'data' | 'utility';
  description: { EN: string; DE: string };
  recommended?: boolean;
  useWith?: string[];        // Empfohlene Kombinationen
  avoidWith?: string[];      // Anti-Patterns
}
```

**Kategorien:**
| Kategorie | Nodes | Beispiele |
|-----------|-------|-----------|
| **Trigger** | 10+ | Webhook, Schedule, Gmail Trigger |
| **AI** | 10+ | AI Agent, Structured Output Parser |
| **Logic** | 8+ | IF, Switch, Merge, Split In Batches |
| **Data** | 9+ | Edit Fields, Code, Aggregate |
| **Action** | 18+ | HTTP Request, Slack, Postgres |
| **Utility** | 5+ | Execute Workflow, Crypto |

**Anti-Patterns:**
- ❌ Code + OpenAI → ✅ AI Agent + Structured Output Parser
- ❌ Duplicate Output Nodes → ✅ Merge Node
- ❌ Missing Error Handling → ✅ Error Trigger
- ❌ No Rate Limiting → ✅ Split In Batches

---

### Use Case Templates

**Pfad / Path:** `data/useCaseTemplates.ts`

**Struktur:**
```typescript
interface UseCaseTemplate {
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
```

**Verfügbare Templates:**
- Email-Automatisierung
- CRM-Integration
- Social Media Automation
- Data Processing Pipelines
- Custom API Integrations

---

## 🔧 Services

### Prompt Quality Service

**Pfad / Path:** `services/promptQuality.ts`

**Funktionen:**
- Qualitätsbewertung (0-100 Score)
- Issue-Erkennung (Errors, Warnings, Info)
- Verbesserungsvorschläge
- Komplexitäts-Schätzung
- Trigger-Erkennung

---

## 🏗️ Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (App.tsx)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │NeuralInput  │  │ BlockDeck   │  │     HoloGraph       │  │
│  │             │  │             │  │  (Visualization)    │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
├─────────┼────────────────┼──────────────────────────────────┤
│         │                │                                   │
│         v                v                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Gemini Service (Agents)                 │   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌───────────┐ │   │
│  │  │Strategy Agent  │ │Structure Agent │ │Refine Agent│ │   │
│  │  └────────────────┘ └────────────────┘ └───────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                │                                   │
│         v                v                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Knowledge Bases                       │   │
│  │  ┌────────────────┐ ┌────────────────────────────┐   │   │
│  │  │ N8N Nodes DB   │ │   Use Case Templates       │   │   │
│  │  └────────────────┘ └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Verwendung / Usage

### API-Key Konfiguration

```bash
# .env.local
GEMINI_API_KEY=your_api_key_here
```

### Agent-Aufruf Beispiel

```typescript
import { generateWorkflowStructure, detectOptimalStrategy } from './services/geminiService';

// 1. Strategie erkennen
const strategyRec = await detectOptimalStrategy(
  "Wenn eine E-Mail ankommt, prüfe ob sie dringend ist",
  'DE'
);

// 2. Workflow generieren
const blocks = await generateWorkflowStructure(
  userIntent,
  "Keine Code-Nodes verwenden",
  strategyRec.recommended,
  'DE'
);
```

---

## 🚀 Zukünftige Erweiterungen / Future Extensions

- [ ] Multi-Agent-Orchestrierung für komplexe Workflows
- [ ] RAG-Integration mit n8n-Dokumentation
- [ ] Automatische Workflow-Validierung
- [ ] Export direkt zu n8n JSON-Format
- [ ] Collaborative Editing mit mehreren Agents

---

## 📄 Lizenz / License

MIT License - Workflow Prompt Architect © 2024
