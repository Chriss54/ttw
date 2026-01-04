import React from 'react';
import { Language } from '../types';
import { QualityScore, getScoreColor, getScoreLabel } from '../services/promptQuality';
import { AlertCircle, CheckCircle, Info, Lightbulb, Layers, Zap } from 'lucide-react';

interface PromptQualityIndicatorProps {
    quality: QualityScore | null;
    language: Language;
    isVisible: boolean;
}

const UI_TEXT = {
    EN: {
        qualityScore: 'Prompt Quality',
        issues: 'Issues',
        tips: 'Suggestions',
        estimatedNodes: 'Est. Nodes',
        trigger: 'Trigger',
        complexity: 'Complexity',
        none: 'N/A'
    },
    DE: {
        qualityScore: 'Prompt-Qualität',
        issues: 'Probleme',
        tips: 'Vorschläge',
        estimatedNodes: 'Gesch. Knoten',
        trigger: 'Trigger',
        complexity: 'Komplexität',
        none: 'N/A'
    }
};

const COMPLEXITY_LABELS = {
    simple: { EN: 'Simple', DE: 'Einfach' },
    medium: { EN: 'Medium', DE: 'Mittel' },
    complex: { EN: 'Complex', DE: 'Komplex' }
};

const TRIGGER_LABELS: Record<string, { EN: string; DE: string }> = {
    webhook: { EN: 'Webhook', DE: 'Webhook' },
    email: { EN: 'Email', DE: 'E-Mail' },
    schedule: { EN: 'Schedule', DE: 'Zeitplan' },
    slack: { EN: 'Slack', DE: 'Slack' },
    sheets: { EN: 'Sheets', DE: 'Sheets' },
    chat: { EN: 'Chat', DE: 'Chat' }
};

const PromptQualityIndicator: React.FC<PromptQualityIndicatorProps> = ({ quality, language, isVisible }) => {
    const text = UI_TEXT[language];

    if (!isVisible || !quality) return null;

    const scoreColor = getScoreColor(quality.score);
    const scoreLabel = getScoreLabel(quality.score, language);

    // Color classes based on score
    const colorClasses = {
        emerald: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            barBg: 'bg-emerald-500'
        },
        yellow: {
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            text: 'text-yellow-400',
            barBg: 'bg-yellow-500'
        },
        orange: {
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            text: 'text-orange-400',
            barBg: 'bg-orange-500'
        },
        red: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-400',
            barBg: 'bg-red-500'
        }
    };

    const colors = colorClasses[scoreColor as keyof typeof colorClasses];

    return (
        <div className={`
      mt-3 p-4 rounded-xl border transition-all duration-300 animate-[fadeSlideIn_0.3s_ease-out]
      ${colors.bg} ${colors.border}
    `}>
            {/* Score Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-xs font-medium text-white/70">{text.qualityScore}</span>
                    </div>
                    <span className={`text-lg font-bold ${colors.text}`}>{quality.score}</span>
                    <span className={`text-xs ${colors.text} opacity-70`}>/ 100</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {scoreLabel}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full ${colors.barBg} transition-all duration-500 rounded-full`}
                    style={{ width: `${quality.score}%` }}
                />
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Layers className="w-3 h-3 text-white/40" />
                    <span className="text-[10px] text-white/40 uppercase">{text.estimatedNodes}:</span>
                    <span className="text-xs font-medium text-white/70">~{quality.estimatedNodes}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase">{text.trigger}:</span>
                    <span className="text-xs font-medium text-white/70">
                        {quality.detectedTrigger
                            ? TRIGGER_LABELS[quality.detectedTrigger]?.[language] || quality.detectedTrigger
                            : text.none}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase">{text.complexity}:</span>
                    <span className="text-xs font-medium text-white/70">
                        {COMPLEXITY_LABELS[quality.detectedComplexity][language]}
                    </span>
                </div>
            </div>

            {/* Issues */}
            {quality.issues.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-white/50 uppercase font-medium">{text.issues}</span>
                    </div>
                    <div className="space-y-1.5">
                        {quality.issues.map((issue) => (
                            <div
                                key={issue.id}
                                className={`
                  flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg
                  ${issue.severity === 'error' ? 'bg-red-500/10 text-red-300' :
                                        issue.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-300' :
                                            'bg-blue-500/10 text-blue-300'}
                `}
                            >
                                {issue.severity === 'error' ? (
                                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                ) : issue.severity === 'warning' ? (
                                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                )}
                                <span>{issue.text[language]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {quality.suggestions.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] text-white/50 uppercase font-medium">{text.tips}</span>
                    </div>
                    <div className="space-y-1.5">
                        {quality.suggestions.slice(0, 3).map((suggestion, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg bg-white/5 text-white/60"
                            >
                                <span className="text-white/30 shrink-0">→</span>
                                <span>{suggestion.text[language]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptQualityIndicator;
