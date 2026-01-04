import React, { useState } from 'react';
import { WorkflowBlock, Language, NodeMetadata } from '../types';
import { Activity, ShieldCheck, AlertTriangle, Hexagon, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface HoloGraphProps {
  blocks: WorkflowBlock[];
  language: Language;
  onQuickFix?: (node: NodeMetadata, blockId: string) => void;
}

const UI_TEXT = {
  EN: {
    title: "System Topology",
    safe: "Secure",
    vague: "Vague",
    risk: "Risk",
    waiting: "Awaiting Input...",
    quickFix: "Quick Fix",
    riskExplanation: "Why this is flagged:",
    suggestedFix: "Suggested fix:"
  },
  DE: {
    title: "System Topologie",
    safe: "Sicher",
    vague: "Vage",
    risk: "Risiko",
    waiting: "Warte auf Input...",
    quickFix: "Schnell Beheben",
    riskExplanation: "Warum markiert:",
    suggestedFix: "Lösungsvorschlag:"
  }
};

// Default risk explanations for nodes without custom ones
const getDefaultRiskExplanation = (risk: 'LOW' | 'MED' | 'HIGH', nodeType: string, language: Language): { explanation: string; fix: string } => {
  const explanations = {
    HIGH: {
      EN: {
        explanation: `External API dependency without error handling configured. May cause workflow failures.`,
        fix: `Add "Retry on Fail" in node settings and connect to Error Trigger.`
      },
      DE: {
        explanation: `Externe API-Abhängigkeit ohne konfigurierte Fehlerbehandlung. Kann Workflow-Fehler verursachen.`,
        fix: `"Retry on Fail" in den Node-Einstellungen aktivieren und mit Error Trigger verbinden.`
      }
    },
    MED: {
      EN: {
        explanation: `Node processes external data without explicit validation or fallback values.`,
        fix: `Use expression fallbacks: {{ $json.field || "default" }}`
      },
      DE: {
        explanation: `Node verarbeitet externe Daten ohne explizite Validierung oder Fallback-Werte.`,
        fix: `Expression-Fallbacks nutzen: {{ $json.field || "default" }}`
      }
    },
    LOW: {
      EN: { explanation: `Node is properly configured with safe defaults.`, fix: `` },
      DE: { explanation: `Node ist korrekt mit sicheren Standardwerten konfiguriert.`, fix: `` }
    }
  };
  return explanations[risk][language];
};

const HoloGraph: React.FC<HoloGraphProps> = ({ blocks, language, onQuickFix }) => {
  const text = UI_TEXT[language];
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const allNodes = blocks.flatMap((block, blockIndex) =>
    block.nodes.map((node, nodeIndex) => ({
      ...node,
      blockType: block.type,
      id: `${block.id}-${nodeIndex}`,
      blockId: block.id
    }))
  );

  const toggleNode = (nodeId: string, risk: 'LOW' | 'MED' | 'HIGH') => {
    if (risk === 'LOW') return;
    setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <Hexagon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium uppercase tracking-widest">{text.title}</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] text-white uppercase font-medium">{text.safe}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            <span className="text-[10px] text-white uppercase font-medium">{text.vague}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            <span className="text-[10px] text-white uppercase font-medium">{text.risk}</span>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 overflow-y-auto relative p-6">
        {allNodes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-white/20 text-sm font-mono animate-pulse">{text.waiting}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 relative min-h-full">
            {/* Central Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none"></div>

            {allNodes.map((node, i) => {
              const isExpanded = expandedNodeId === node.id;
              const hasRisk = node.risk !== 'LOW';
              const defaultInfo = getDefaultRiskExplanation(node.risk, node.type, language);
              const explanation = node.riskExplanation?.[language] || defaultInfo.explanation;
              const fix = node.riskFix?.[language] || defaultInfo.fix;

              return (
                <div key={node.id} className="relative z-10 w-full max-w-[280px]">
                  {/* Node Card */}
                  <div
                    onClick={() => toggleNode(node.id, node.risk)}
                    className={`
                          relative p-4 rounded-xl border backdrop-blur-md transition-all duration-300
                          ${hasRisk ? 'cursor-pointer' : ''}
                          ${node.risk === 'HIGH'
                        ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                        : node.risk === 'MED'
                          ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                          : 'bg-white/5 border-white/10 hover:border-emerald-500/30 hover:bg-white/10'}
                          ${isExpanded ? 'ring-1 ring-white/20' : ''}
                       `}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{node.type.split('.').pop()}</span>
                      <div className="flex items-center gap-1">
                        {node.risk === 'HIGH' ? (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        ) : node.risk === 'MED' ? (
                          <Activity className="w-3 h-3 text-yellow-400" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-400/50" />
                        )}
                        {hasRisk && (
                          isExpanded
                            ? <ChevronUp className="w-3 h-3 text-white/40" />
                            : <ChevronDown className="w-3 h-3 text-white/40" />
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-white/90">
                      {node.name}
                    </div>
                  </div>

                  {/* Inline Tooltip - Expands BELOW the node */}
                  {isExpanded && hasRisk && (
                    <div className={`
                         mt-2 p-4 rounded-xl border animate-[fadeSlideIn_0.2s_ease-out]
                         ${node.risk === 'HIGH'
                        ? 'bg-red-950/90 border-red-500/30'
                        : 'bg-yellow-950/90 border-yellow-500/30'}
                       `}>
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        {node.risk === 'HIGH' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Activity className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className={`text-xs font-medium uppercase tracking-wide ${node.risk === 'HIGH' ? 'text-red-300' : 'text-yellow-300'
                          }`}>
                          {node.risk === 'HIGH' ? text.risk : text.vague}
                        </span>
                      </div>

                      {/* Explanation */}
                      <div className="mb-3">
                        <span className="text-[10px] text-white/40 uppercase tracking-wide">{text.riskExplanation}</span>
                        <p className="text-xs text-white/80 mt-1 leading-relaxed">{explanation}</p>
                      </div>

                      {/* Fix suggestion */}
                      {fix && (
                        <div className="mb-3">
                          <span className="text-[10px] text-white/40 uppercase tracking-wide">{text.suggestedFix}</span>
                          <p className="text-xs text-emerald-300/90 mt-1 font-mono leading-relaxed break-all">{fix}</p>
                        </div>
                      )}

                      {/* Quick Fix button */}
                      {onQuickFix && fix && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickFix(node, node.blockId);
                          }}
                          className={`
                               w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                               ${node.risk === 'HIGH'
                              ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/30'}
                             `}
                        >
                          <Zap className="w-3 h-3" />
                          {text.quickFix}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Terminator */}
            <div className="w-3 h-3 rounded-full border-2 border-white/10 bg-black z-10 mt-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoloGraph;