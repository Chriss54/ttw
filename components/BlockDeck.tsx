import React, { useState, useRef, useEffect } from 'react';
import { WorkflowBlock, BlockType, Language } from '../types';
import { Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle2, SlidersHorizontal, Copy, Check, Zap, ChevronDown, ChevronUp, Plus, Code2, Edit3, Save } from 'lucide-react';
import { refineBlock, addLineToBlock } from '../services/geminiService';
import { getBlockTitle } from '../constants';
import { getBlockIssues, applySingleFix, ValidationIssue } from '../services/promptValidator';

interface BlockDeckProps {
  blocks: WorkflowBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<WorkflowBlock[]>>;
  language: Language;
}

type EditMode = 'add' | 'refine' | 'expert';

const UI_TEXT = {
  EN: {
    waiting: "// Waiting for blueprint generation...",
    addPlaceholder: "Add instruction (e.g. 'Error handling for retry')...",
    refinePlaceholder: "Refine logic (e.g. 'Add debounce node')...",
    add: "Add",
    refine: "Refine",
    expert: "Expert",
    apply: "Apply",
    riskDetected: "Risk Detected",
    issuesFound: "Issues Found",
    quickFix: "Quick Fix",
    showIssues: "Show Issues",
    hideIssues: "Hide Issues",
    expertModeHint: "Direct edit mode • ESC to cancel • Click outside to save",
    addAtStart: "↑ Start",
    addAtEnd: "↓ End"
  },
  DE: {
    waiting: "// Warte auf Blaupausen-Generierung...",
    addPlaceholder: "Anweisung hinzufügen (z.B. 'Fehlerbehandlung für Retry')...",
    refinePlaceholder: "Logik verfeinern (z.B. 'Debounce hinzufügen')...",
    add: "Hinzufügen",
    refine: "Verfeinern",
    expert: "Experte",
    apply: "Anwenden",
    riskDetected: "Risiko Erkannt",
    issuesFound: "Probleme Gefunden",
    quickFix: "Schnell Beheben",
    showIssues: "Probleme Zeigen",
    hideIssues: "Probleme Verbergen",
    expertModeHint: "Direkter Bearbeitungsmodus • ESC zum Abbrechen • Klick außerhalb zum Speichern",
    addAtStart: "↑ Anfang",
    addAtEnd: "↓ Ende"
  }
};

const BlockDeck: React.FC<BlockDeckProps> = ({ blocks, setBlocks, language }) => {
  const toggleLock = (id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, locked: !b.locked } : b));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {blocks.map((block, index) => (
        <SingleBlock
          key={block.id}
          block={block}
          index={index}
          toggleLock={toggleLock}
          allBlocks={blocks}
          setBlocks={setBlocks}
          updateBlockContent={(id, content) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))}
          language={language}
        />
      ))}
    </div>
  );
};

const SingleBlock: React.FC<{
  block: WorkflowBlock;
  index: number;
  toggleLock: (id: string) => void;
  allBlocks: WorkflowBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<WorkflowBlock[]>>;
  updateBlockContent: (id: string, content: string) => void;
  language: Language;
}> = ({ block, index, toggleLock, allBlocks, setBlocks, updateBlockContent, language }) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [strictness, setStrictness] = useState(50);
  const [compression, setCompression] = useState(50);
  const [copied, setCopied] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('add');
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [expertContent, setExpertContent] = useState('');
  const [addPosition, setAddPosition] = useState<'start' | 'end'>('end');

  const contentRef = useRef<HTMLDivElement>(null);

  const text = UI_TEXT[language];
  const displayTitle = getBlockTitle(block.type, language);

  // Get validation issues for this block
  const blockIssues = block.content && block.content.trim().length > 10
    ? getBlockIssues(block, allBlocks, language)
    : [];
  const hasIssues = blockIssues.length > 0;
  const blockingIssues = blockIssues.filter(i => i.severity === 'BLOCKING');

  // Handle Expert Mode
  useEffect(() => {
    if (isExpertMode) {
      setExpertContent(block.content);
    }
  }, [isExpertMode, block.content]);

  // Handle click outside for Expert Mode save
  useEffect(() => {
    if (!isExpertMode) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        // Save on click outside
        updateBlockContent(block.id, expertContent);
        setIsExpertMode(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel without saving
        setIsExpertMode(false);
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Save with Ctrl+S
        updateBlockContent(block.id, expertContent);
        setIsExpertMode(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpertMode, expertContent, block.id, updateBlockContent]);

  const handleCopyBlock = () => {
    const blockContent = `[${block.type} LAYER]\n${block.content}`;
    navigator.clipboard.writeText(blockContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setIsProcessing(true);
    const newContent = await addLineToBlock(
      block.type,
      block.content,
      inputValue,
      addPosition,
      language
    );
    updateBlockContent(block.id, newContent);
    setInputValue('');
    setIsProcessing(false);
  };

  const handleRefine = async () => {
    if (!inputValue.trim()) return;
    setIsProcessing(true);
    const newContent = await refineBlock(
      block.type,
      block.content,
      inputValue,
      allBlocks,
      strictness,
      compression,
      language
    );
    updateBlockContent(block.id, newContent);
    setInputValue('');
    setIsProcessing(false);
    setShowControls(false);
  };

  const handleApply = async () => {
    if (editMode === 'add') {
      await handleAdd();
    } else if (editMode === 'refine') {
      await handleRefine();
    }
  };

  const handleQuickFix = (issue: ValidationIssue) => {
    const fixedBlocks = applySingleFix(allBlocks, issue, language);
    setBlocks(fixedBlocks);
  };

  const handleExpertToggle = () => {
    if (isExpertMode) {
      // Save and exit
      updateBlockContent(block.id, expertContent);
      setIsExpertMode(false);
    } else {
      // Enter expert mode
      setIsExpertMode(true);
      setShowControls(false);
    }
  };

  const isLocked = block.locked;
  const isHighRisk = block.riskLevel === 'HIGH_RISK' || blockingIssues.length > 0;

  return (
    <div className="relative group">
      {/* Connector Line Logic (Visual only) */}
      {index < 2 && (
        <div className="absolute left-[26px] -bottom-6 w-px h-6 bg-white/10 z-0"></div>
      )}

      <div className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-sm
        ${isLocked
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : isHighRisk
            ? 'bg-red-500/5 border-red-500/20'
            : hasIssues
              ? 'bg-yellow-500/5 border-yellow-500/20'
              : 'bg-white/5 border-white/10 hover:border-white/20'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-black
                ${block.type === BlockType.INGESTION ? 'bg-blue-500 text-black' :
                block.type === BlockType.LOGIC ? 'bg-purple-500 text-black' :
                  'bg-emerald-400 text-black'}
            `}>
              {index + 1}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">{displayTitle}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Issue badges */}
            {hasIssues && !isLocked && (
              <button
                onClick={() => setShowIssues(!showIssues)}
                className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${blockingIssues.length > 0
                  ? 'bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20'
                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 hover:bg-yellow-500/20'
                  }`}
              >
                <AlertTriangle className="w-3 h-3" />
                {blockIssues.length} {blockIssues.length === 1 ? 'Issue' : 'Issues'}
                {showIssues ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Expert Mode Toggle */}
            {!isLocked && block.content && (
              <button
                onClick={handleExpertToggle}
                className={`p-2 rounded-lg transition-colors ${isExpertMode ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                title={text.expert}
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}

            {!isLocked && !isExpertMode && (
              <button
                onClick={() => setShowControls(!showControls)}
                className={`p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors ${showControls ? 'text-white bg-white/10' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleCopyBlock}
              disabled={!block.content}
              className={`p-2 rounded-lg transition-colors ${copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 hover:text-white hover:bg-white/10'} ${!block.content ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={language === 'DE' ? 'Block kopieren' : 'Copy block'}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleLock(block.id)}
              className={`p-2 rounded-lg transition-colors ${isLocked ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Issues Panel */}
        {showIssues && hasIssues && !isLocked && (
          <div className="border-b border-white/10 bg-black/30 p-4 animate-[fadeSlideIn_0.2s_ease-out]">
            <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
              {text.issuesFound}
            </h4>
            <div className="space-y-2">
              {blockIssues.map(issue => (
                <div
                  key={issue.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg ${issue.severity === 'BLOCKING'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-yellow-500/10 border border-yellow-500/20'
                    }`}
                >
                  <div className="flex items-start gap-2 flex-1">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${issue.severity === 'BLOCKING' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    <span className={`text-xs ${issue.severity === 'BLOCKING' ? 'text-red-200' : 'text-yellow-200'
                      }`}>
                      {issue.description[language]}
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuickFix(issue)}
                    className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${issue.severity === 'BLOCKING'
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                      }`}
                  >
                    <Zap className="w-3 h-3" />
                    {text.quickFix}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 min-h-[120px]" ref={contentRef}>
          {isExpertMode ? (
            <div className="relative">
              <textarea
                value={expertContent}
                onChange={(e) => setExpertContent(e.target.value)}
                className="w-full min-h-[200px] bg-black/50 border border-emerald-500/30 rounded-lg p-4 font-mono text-xs sm:text-sm text-white/90 whitespace-pre-wrap leading-loose focus:outline-none focus:border-emerald-500/50 resize-y"
                autoFocus
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400/60">{text.expertModeHint}</span>
                <button
                  onClick={() => {
                    updateBlockContent(block.id, expertContent);
                    setIsExpertMode(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <pre className="font-mono text-xs sm:text-sm text-white/70 whitespace-pre-wrap leading-loose">
              {block.content || <span className="text-white/20 italic">{text.waiting}</span>}
            </pre>
          )}

          {/* Chips */}
          {block.outputs.length > 0 && !isExpertMode && (
            <div className="mt-6 flex flex-wrap gap-2">
              {block.outputs.map(out => (
                <span key={out} className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/50 font-mono">
                  {out}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Edit Panel - Add/Refine/Expert modes */}
        {showControls && !isLocked && !isExpertMode && (
          <div className="border-t border-white/10 bg-black/20 p-4 animate-[fadeSlideIn_0.2s_ease-out]">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setEditMode('add')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editMode === 'add'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <Plus className="w-3 h-3" />
                {text.add}
              </button>
              <button
                onClick={() => setEditMode('refine')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editMode === 'refine'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <RefreshCw className="w-3 h-3" />
                {text.refine}
              </button>
            </div>

            {/* Input Row */}
            <div className="flex gap-2">
              {editMode === 'add' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setAddPosition('start')}
                    className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-colors ${addPosition === 'start'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    title="Add at start"
                  >
                    {text.addAtStart}
                  </button>
                  <button
                    onClick={() => setAddPosition('end')}
                    className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-colors ${addPosition === 'end'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    title="Add at end"
                  >
                    {text.addAtEnd}
                  </button>
                </div>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                placeholder={editMode === 'add' ? text.addPlaceholder : text.refinePlaceholder}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:border-white/30 outline-none"
              />
              <button
                onClick={handleApply}
                disabled={isProcessing || !inputValue.trim()}
                className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${editMode === 'add'
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                    : 'bg-white text-black hover:bg-white/90'
                  }`}
              >
                {editMode === 'add' ? (
                  <>
                    <Plus className={`w-3 h-3 ${isProcessing ? 'animate-pulse' : ''}`} />
                    {text.add}
                  </>
                ) : (
                  <>
                    <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                    {text.refine}
                  </>
                )}
              </button>
            </div>

            {/* Sliders for Refine mode */}
            {editMode === 'refine' && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-medium mb-1 block">Detail Level</label>
                  <input
                    type="range" min="0" max="100"
                    value={strictness} onChange={(e) => setStrictness(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-medium mb-1 block">Compression</label>
                  <input
                    type="range" min="0" max="100"
                    value={compression} onChange={(e) => setCompression(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockDeck;