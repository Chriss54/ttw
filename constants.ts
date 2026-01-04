import { StrategyType, BlockType, Language } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-FIX TEMPLATES (Bilingual)
// ═══════════════════════════════════════════════════════════════════════════

export const AUTO_FIX_TEMPLATES = {
  RETRY_POLICY: {
    EN: '\n**Retry Policy:** Enable "Retry on Fail" with Max Retries: 3, Wait Between Tries: 5000ms.',
    DE: '\n**Retry-Richtlinie:** "Bei Fehler wiederholen" aktivieren mit Max. Wiederholungen: 3, Wartezeit: 5000ms.'
  },
  ERROR_HANDLER: {
    EN: '\n**Error Handling:** Add Error Trigger node. On failure, log error details and route to notification channel (e.g., Slack, Email).',
    DE: '\n**Fehlerbehandlung:** Error Trigger Node hinzufügen. Bei Fehler Details loggen und an Benachrichtigungskanal weiterleiten (z.B. Slack, E-Mail).'
  },
  MERGE_CONSOLIDATION: {
    EN: '\n**Branch Consolidation:** Use Merge Node (Mode: "Wait for All") to consolidate all branches before final output.',
    DE: '\n**Zweig-Konsolidierung:** Merge Node (Modus: "Auf alle warten") verwenden, um alle Zweige vor der Ausgabe zusammenzuführen.'
  },
  FALLBACK_PATTERN: {
    EN: '{{ $json.{field} || \'default_value\' }}',
    DE: '{{ $json.{field} || \'Standardwert\' }}'
  },
  CREDENTIAL_REMINDER: {
    EN: '\n**Required Integration:** Ensure {nodeName} credentials are configured in n8n before execution.',
    DE: '\n**Erforderliche Integration:** Sicherstellen, dass {nodeName}-Zugangsdaten in n8n konfiguriert sind.'
  }
};

export const getStrategies = (lang: Language) => [
  {
    id: StrategyType.SPEC_SHEET,
    label: lang === 'EN' ? 'Node-by-Node Spec' : 'Knoten-Spezifikation',
    description: lang === 'EN' ? 'High precision. Forces technical documentation style.' : 'Hohe Präzision. Erzwingt technischen Dokumentationsstil.',
    icon: 'FileCode'
  },
  {
    id: StrategyType.FUNCTIONAL,
    label: lang === 'EN' ? 'Functional Grouping' : 'Funktionale Gruppierung',
    description: lang === 'EN' ? 'Organized by capability (Ingestion -> Logic -> Storage).' : 'Organisiert nach Fähigkeit (Ingestion -> Logik -> Speicher).',
    icon: 'Layers'
  }
];

export const STRATEGIES = getStrategies('EN'); // Fallback for backward compatibility if needed, though we will use the function

export const getBlockTitle = (type: BlockType, lang: Language) => {
  if (lang === 'DE') {
    switch (type) {
      case BlockType.INGESTION: return 'Ingestions-Ebene';
      case BlockType.LOGIC: return 'Verarbeitungs-Logik';
      case BlockType.STORAGE: return 'Speicher & Output';
    }
  }
  switch (type) {
    case BlockType.INGESTION: return 'Ingestion Layer';
    case BlockType.LOGIC: return 'Processing Logic';
    case BlockType.STORAGE: return 'Storage & Output';
  }
};

export const INITIAL_BLOCKS = [
  {
    id: 'b1',
    type: BlockType.INGESTION,
    title: 'Ingestion Layer',
    content: '',
    locked: false,
    riskLevel: 'SAFE',
    outputs: [],
    inputs: [],
    nodes: []
  },
  {
    id: 'b2',
    type: BlockType.LOGIC,
    title: 'Processing Logic',
    content: '',
    locked: false,
    riskLevel: 'SAFE',
    outputs: [],
    inputs: [],
    nodes: []
  },
  {
    id: 'b3',
    type: BlockType.STORAGE,
    title: 'Storage & Output',
    content: '',
    locked: false,
    riskLevel: 'SAFE',
    outputs: [],
    inputs: [],
    nodes: []
  }
];