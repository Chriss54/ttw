import React, { useEffect, useState } from 'react';
import { StrategyType, Language } from '../types';
import { getStrategies } from '../constants';
import { Sparkles, Ban, Zap, Terminal } from 'lucide-react';
import UseCaseSelector from './UseCaseSelector';
import PromptQualityIndicator from './PromptQualityIndicator';
import { scorePromptQuality, QualityScore } from '../services/promptQuality';
import { UseCaseTemplate } from '../data/useCaseTemplates';

interface NeuralInputProps {
  intent: string;
  setIntent: (s: string) => void;
  negativePrompt: string;
  setNegativePrompt: (s: string) => void;
  selectedStrategy: StrategyType;
  setStrategy: (s: StrategyType) => void;
  onCompile: () => void;
  isGenerating: boolean;
  language: Language;
  strategyRecommendation?: {
    recommended: StrategyType;
    confidence: number;
    reasoning: string;
  } | null;
  onTemplateSelect?: (template: UseCaseTemplate) => void;
}

const UI_TEXT = {
  EN: {
    placeholder: "Describe your workflow logic naturally...",
    negativePlaceholder: "Exclusions (e.g., no python, no webhooks)...",
    compile: "Generate Blueprint",
    generating: "Processing...",
    aiRec: "AI Insight",
    use: "Apply",
    terminalTitle: "Cortex Terminal // v6.0"
  },
  DE: {
    placeholder: "Beschreibe die Workflow-Logik natürlich...",
    negativePlaceholder: "Ausschlüsse (z.B. kein Python, keine Webhooks)...",
    compile: "Blaupause Generieren",
    generating: "Verarbeite...",
    aiRec: "AI Insight",
    use: "Übernehmen",
    terminalTitle: "Cortex Terminal // v6.0"
  }
};

const NeuralInput: React.FC<NeuralInputProps> = ({
  intent,
  setIntent,
  negativePrompt,
  setNegativePrompt,
  selectedStrategy,
  setStrategy,
  onCompile,
  isGenerating,
  language,
  strategyRecommendation,
  onTemplateSelect
}) => {
  const text = UI_TEXT[language];
  const strategies = getStrategies(language);

  const [quality, setQuality] = useState<QualityScore | null>(null);
  const [showQuality, setShowQuality] = useState(false);

  useEffect(() => {
    if (intent.length < 10) {
      setShowQuality(false);
      return;
    }

    const timer = setTimeout(() => {
      const score = scorePromptQuality(intent, language);
      setQuality(score);
      setShowQuality(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [intent, language]);

  const handleTemplateSelect = (template: UseCaseTemplate) => {
    setIntent(template.intent[language]);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <UseCaseSelector
        language={language}
        onSelectTemplate={handleTemplateSelect}
      />

      <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/5">

        <div className="bg-white/5 border-b border-white/5 p-3 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3 text-white/50 text-xs font-bold uppercase tracking-widest pl-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="font-mono">{text.terminalTitle}</span>
          </div>

          <button
            onClick={onCompile}
            disabled={!intent || isGenerating}
            className={`group relative overflow-hidden rounded-md px-5 py-2 font-bold text-xs uppercase tracking-wider transition-all ${!intent || isGenerating
              ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400'}`}
          >
            <div className="relative z-10 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>{text.generating}</span>
                </>
              ) : (
                <>
                  <span>{text.compile}</span>
                  <Zap className="w-3 h-3 fill-current" />
                </>
              )}
            </div>
          </button>
        </div>

        <div className="relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder={text.placeholder}
            className="w-full h-48 bg-transparent text-white placeholder:text-white/20 resize-none outline-none text-sm md:text-base leading-relaxed font-mono p-5 focus:bg-white/[0.02] transition-colors"
          />
        </div>

        <div className="px-4 pb-2">
          <PromptQualityIndicator
            quality={quality}
            language={language}
            isVisible={showQuality}
          />
        </div>

        <div className="bg-black/20 border-t border-white/5 p-4 flex flex-col gap-4">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {strategies.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedStrategy === s.id
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {strategyRecommendation && selectedStrategy !== strategyRecommendation.recommended && (
              <div className="flex items-center gap-3 animate-[fadeSlideIn_0.3s_ease-out] bg-purple-500/5 border border-purple-500/20 rounded-md px-3 py-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-purple-300 hidden md:inline font-mono">{strategyRecommendation.reasoning.slice(0, 40)}...</span>
                <button
                  onClick={() => setStrategy(strategyRecommendation.recommended)}
                  className="text-[10px] font-bold text-purple-300 hover:text-white underline decoration-purple-500/50"
                >
                  {text.use}
                </button>
              </div>
            )}
          </div>

          <div className="relative flex items-center group">
            <div className="absolute left-3 text-white/20 group-focus-within:text-red-400 transition-colors">
              <Ban className="w-3 h-3" />
            </div>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={text.negativePlaceholder}
              className="w-full bg-black/40 border border-white/5 rounded-md py-2.5 pl-9 pr-4 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-red-500/30 focus:bg-red-900/5 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralInput;