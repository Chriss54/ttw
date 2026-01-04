import React, { useState, useEffect, useRef } from 'react';
import NeuralInput from './components/NeuralInput';
import BlockDeck from './components/BlockDeck';
import HoloGraph from './components/HoloGraph';
import ValidateFixButton from './components/ValidateFixButton';
import MegaArchitect from './components/MegaArchitect';
import { AppState, StrategyType, WorkflowBlock, Language } from './types';
import { INITIAL_BLOCKS } from './constants';
import { generateWorkflowStructure, detectOptimalStrategy } from './services/geminiService';
import { validateAllBlocks, applyAllFixes, ValidationResult } from './services/promptValidator';
import { Layers, Copy, Check, AlertTriangle, XCircle, Globe, Zap, Camera, Lock, Rocket } from 'lucide-react';
import { UseCaseTemplate } from './data/useCaseTemplates';
// @ts-ignore - imported via importmap
import html2canvas from 'html2canvas';

const UI_TEXT = {
  EN: {
    subtitle: "Architect",
    characters: "CHARS",
    copied: "COPIED",
    copy: "COPY PROMPT",
    copyShort: "COPY",
    screenshot: "SCREENSHOT",
    errorHeader: "Connection Refused"
  },
  DE: {
    subtitle: "Architekt",
    characters: "ZEICHEN",
    copied: "KOPIERT",
    copy: "KOPIEREN",
    copyShort: "KOPIEREN",
    screenshot: "SCREENSHOT",
    errorHeader: "Verbindung Abgelehnt"
  }
};

const App: React.FC = () => {
  const [intent, setIntent] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [strategy, setStrategy] = useState<StrategyType>(StrategyType.SPEC_SHEET);
  const [blocks, setBlocks] = useState<WorkflowBlock[]>(INITIAL_BLOCKS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('EN');
  const [ignoreLimit, setIgnoreLimit] = useState(false);
  const [megaMode, setMegaMode] = useState(false);
  const [strategyRecommendation, setStrategyRecommendation] = useState<{
    recommended: StrategyType,
    confidence: number,
    reasoning: string
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<UseCaseTemplate | null>(null);

  // Validation state
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showFixToast, setShowFixToast] = useState<{ count: number } | null>(null);

  // Handle template selection
  const handleTemplateSelect = (template: UseCaseTemplate) => {
    setSelectedTemplate(template);
  };

  // Ref is now on the root container to capture everything
  const printRef = useRef<HTMLDivElement>(null);

  const text = UI_TEXT[language];

  // Calculate real-time character count from all blocks
  const totalCharacters = blocks.reduce((acc, block) => acc + (block.content?.length || 0), 0);
  const standardMax = 5000;

  const effectiveMax = ignoreLimit ? Math.max(totalCharacters * 1.2, standardMax) : standardMax;
  const progressPercentage = Math.min((totalCharacters / effectiveMax) * 100, 100);

  // Automatic Strategy Detection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (intent.length > 50) {
        detectOptimalStrategy(intent, language).then(setStrategyRecommendation);
      } else {
        setStrategyRecommendation(null);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [intent, language]);

  // Real-time validation (debounced 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only validate if there's actual content
      const hasContent = blocks.some(b => b.content && b.content.trim().length > 10);
      if (hasContent) {
        const result = validateAllBlocks(blocks, language);
        setValidationResult(result);
      } else {
        setValidationResult(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [blocks, language]);

  // Validate and fix handler
  const handleValidateAndFix = () => {
    setIsValidating(true);

    const result = validateAllBlocks(blocks, language);

    if (result.issues.length === 0) {
      setValidationResult(result);
      setIsValidating(false);
      return;
    }

    if (result.fixableCount > 0) {
      const fixedBlocks = applyAllFixes(blocks, result.issues, language);
      setBlocks(fixedBlocks);

      // Show toast
      setShowFixToast({ count: result.fixableCount });
      setTimeout(() => setShowFixToast(null), 3000);

      // Re-validate after fixes
      const newResult = validateAllBlocks(fixedBlocks, language);
      setValidationResult(newResult);
    } else {
      setValidationResult(result);
    }

    setIsValidating(false);
  };

  const handleCompile = async () => {
    setIsGenerating(true);
    setError(null);
    setBlocks(prev => prev.map(b => ({ ...b, content: '', nodes: [] })));

    try {
      const generatedData = await generateWorkflowStructure(intent, negativePrompt, strategy, language);

      const newBlocks = INITIAL_BLOCKS.map(initBlock => {
        const genData = generatedData.find(g => g.type === initBlock.type);
        return {
          ...initBlock,
          content: genData?.content || 'No instructions generated.',
          nodes: genData?.nodes || [],
          riskLevel: genData?.riskLevel || 'SAFE',
          outputs: genData?.outputs || [],
          id: initBlock.id
        } as WorkflowBlock;
      });

      setBlocks(newBlocks);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Critical System Failure");
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if copy is blocked
  const isCopyBlocked = validationResult?.blockingCount ? validationResult.blockingCount > 0 : false;

  const copyPrompt = () => {
    if (isCopyBlocked) return;
    const fullPrompt = blocks.map(b => `[${b.type} LAYER]\n${b.content}`).join('\n\n');
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshot = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        backgroundColor: '#000000',
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // --- 1. Expand Input Text Areas ---
          const textareas = clonedDoc.getElementsByTagName('textarea');
          for (let i = 0; i < textareas.length; i++) {
            const ta = textareas[i];
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
            ta.style.overflow = 'visible';
          }

          // --- 2. Expand Scrollable Containers to Full Height ---
          const appContainer = clonedDoc.getElementById('app-container');
          const leftPanel = clonedDoc.getElementById('left-panel');
          const mainScroll = clonedDoc.getElementById('main-scroll-area');
          const rightPanel = clonedDoc.getElementById('right-panel');

          if (appContainer) {
            appContainer.style.height = 'auto';
            appContainer.style.overflow = 'visible';
            // Ensure background covers expanded height
            appContainer.style.backgroundColor = '#000000';
          }

          if (leftPanel) {
            leftPanel.style.height = 'auto';
            leftPanel.style.overflow = 'visible';
            leftPanel.style.flex = 'none'; // Unset flex constraint
            leftPanel.style.width = 'auto'; // Let it take natural width in column
          }

          if (mainScroll) {
            mainScroll.style.height = 'auto';
            mainScroll.style.overflow = 'visible';
          }

          if (rightPanel) {
            // Force right panel display even if hidden on smaller screens
            rightPanel.style.display = 'block';
            rightPanel.style.height = 'auto';
            rightPanel.style.overflow = 'visible';
            rightPanel.style.flex = 'none';

            // Find the internal scrollable div of HoloGraph and expand it
            const graphScroll = rightPanel.querySelector('.overflow-y-auto');
            if (graphScroll && graphScroll instanceof HTMLElement) {
              graphScroll.style.height = 'auto';
              graphScroll.style.overflow = 'visible';
            }
          }

          // --- 3. Hide UI Elements (Header Actions) ---
          const headerActions = clonedDoc.getElementById('header-actions');
          if (headerActions) headerActions.style.display = 'none';

          const header = clonedDoc.querySelector('header');
          if (header && header instanceof HTMLElement) {
            header.style.position = 'static'; // Unstick header so it sits at top
          }
        }
      });

      const filename = `workflow-prompt-${new Date().toISOString().slice(0, 10)}.png`;

      // Method: Convert to blob and use saveAs-style download
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Screenshot conversion failed.");
            return;
          }

          // Create object URL directly from blob (more compatible)
          const url = URL.createObjectURL(blob);

          // Create and configure link with explicit attributes
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.type = 'image/png'; // Explicit MIME type

          // Set additional attributes for better browser compatibility
          link.setAttribute('download', filename);

          // Critical: these styles help with some browser quirks
          link.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';

          // Add to document
          document.body.appendChild(link);

          // Use click() for broader compatibility
          link.click();

          // Cleanup after delay
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 500);
        },
        'image/png',
        1.0
      );
    } catch (err) {
      console.error("Screenshot failed:", err);
      setError("Screenshot generation failed. Please try again.");
    }
  };

  return (
    <div
      id="app-container"
      ref={printRef}
      className="h-[100dvh] bg-black text-white font-sans overflow-hidden flex flex-col md:flex-row"
    >

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 animate-[fadeSlideIn_0.3s_ease-out]">
          <div className="bg-red-950/90 border border-red-500/50 text-red-200 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-1">{text.errorHeader}</h3>
              <p className="font-mono text-xs opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-white/50 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Fix Success Toast */}
      {showFixToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 animate-[fadeSlideIn_0.3s_ease-out]">
          <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">
                {language === 'DE'
                  ? `${showFixToast.count} Problem${showFixToast.count !== 1 ? 'e' : ''} behoben!`
                  : `Fixed ${showFixToast.count} issue${showFixToast.count !== 1 ? 's' : ''}!`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL: Editor */}
      <div id="left-panel" className="flex-1 h-full flex flex-col relative overflow-hidden bg-black">

        {/* Header - Glassmorphism */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Zap className="text-black w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm tracking-tight hidden sm:block">Workflow Prompt</span>
              <span className="font-medium text-sm tracking-tight sm:hidden">Architect</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest hidden sm:block">{text.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* Header Actions (Moved from FAB to avoid bottom overlays) */}
            <div id="header-actions" className="flex items-center gap-2 mr-2">
              {/* Validate & Fix Button - Hero Feature */}
              <ValidateFixButton
                validationResult={validationResult}
                onValidateAndFix={handleValidateAndFix}
                isValidating={isValidating}
                language={language}
              />

              {/* Copy Button - with blocking protection */}
              <button
                onClick={copyPrompt}
                disabled={isCopyBlocked}
                title={isCopyBlocked
                  ? (language === 'DE'
                    ? `${validationResult?.blockingCount} blockierende Probleme müssen zuerst behoben werden`
                    : `${validationResult?.blockingCount} blocking issues must be fixed first`)
                  : undefined
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${isCopyBlocked
                  ? 'bg-red-500/10 text-red-400/60 border-red-500/20 cursor-not-allowed'
                  : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400 hover:text-black'
                  }`}
              >
                {isCopyBlocked
                  ? <Lock className="w-3 h-3" />
                  : copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />
                }
                <span className="hidden lg:inline">
                  {isCopyBlocked
                    ? (language === 'DE' ? 'Gesperrt' : 'Blocked')
                    : copied ? text.copied : text.copy
                  }
                </span>
                <span className="lg:hidden">
                  {isCopyBlocked ? '🔒' : copied ? text.copied : text.copyShort}
                </span>
              </button>

              <button
                onClick={handleScreenshot}
                className="p-1.5 rounded-lg bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10 transition-colors"
                title={text.screenshot}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            {/* Mega Mode Toggle */}
            <button
              onClick={() => setMegaMode(m => !m)}
              className={`flex items-center gap-2 text-xs font-medium border rounded-full px-3 py-1.5 transition-all ${megaMode
                  ? 'bg-gradient-to-r from-purple-600/20 to-amber-600/20 border-purple-500/30 text-purple-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
            >
              {megaMode ? (
                <>
                  <Rocket className="w-3 h-3 text-purple-400" />
                  <span>MEGA</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>STD</span>
                </>
              )}
            </button>

            <button
              onClick={() => setLanguage(l => l === 'EN' ? 'DE' : 'EN')}
              className="flex items-center gap-2 text-xs font-medium bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors"
            >
              <Globe className="w-3 h-3 text-white/50" />
              <span className={language === 'EN' ? 'text-white' : 'text-white/40'}>EN</span>
              <span className="text-white/20">|</span>
              <span className={language === 'DE' ? 'text-white' : 'text-white/40'}>DE</span>
            </button>

            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="flex flex-col items-end">
                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-mono text-white/80 mt-1">
                  {totalCharacters} / {standardMax}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content - Added pb-48 for scroll safety against overlays */}
        {megaMode ? (
          <MegaArchitect language={language} />
        ) : (
          <main id="main-scroll-area" className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth pb-48">
            <NeuralInput
              intent={intent}
              setIntent={setIntent}
              negativePrompt={negativePrompt}
              setNegativePrompt={setNegativePrompt}
              selectedStrategy={strategy}
              onTemplateSelect={handleTemplateSelect}
              setStrategy={setStrategy}
              onCompile={handleCompile}
              isGenerating={isGenerating}
              language={language}
              strategyRecommendation={strategyRecommendation}
            />

            <div className="flex items-center gap-4 opacity-50">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Blueprint</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            <BlockDeck blocks={blocks} setBlocks={setBlocks} language={language} />

            <div className="h-20"></div> {/* Spacer */}
          </main>
        )}
      </div>

      {/* RIGHT PANEL: Visualization - Hidden in Mega Mode */}
      {!megaMode && (
        <div id="right-panel" className="hidden lg:block w-[400px] border-l border-white/10 bg-black h-full relative">
          <HoloGraph blocks={blocks} language={language} />
        </div>
      )}

    </div>
  );
};

export default App;