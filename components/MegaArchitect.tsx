import React, { useState } from 'react';
import { Language } from '../types';
import { generateMegaPrompt, getAvailableTemplates, ProgressCallback } from '../services/megaPromptService';
import { detectTemplate } from '../data/megaTemplates';
import { Rocket, Copy, Check, Download, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface MegaArchitectProps {
    language: Language;
}

const UI_TEXT = {
    EN: {
        title: 'MEGA ARCHITECT',
        subtitle: 'Generate Production-Ready Workflow Specifications',
        placeholder: 'Describe your complex workflow...\n\nExample: "RAG system with Supabase. 3 tables: documents, faqs, procedures. Auto-classification of incoming data based on content. Vector search for semantic queries. Query agent with chat interface that can search all tables and follow relationships."',
        generate: 'GENERATE MEGA PROMPT',
        generating: 'GENERATING...',
        copy: 'COPY',
        copied: 'COPIED',
        download: 'DOWNLOAD',
        characters: 'characters',
        templateDetected: 'Template Detected',
        noTemplate: 'Custom workflow (no template match)',
        availableTemplates: 'Available Templates',
        phaseDetecting: 'Detecting pattern...',
        phaseArchitecture: 'Generating architecture...',
        phaseNodes: 'Specifying nodes...',
        phaseSetup: 'Adding setup & warnings...',
        phaseAssembling: 'Assembling mega prompt...',
        phaseComplete: 'Complete!'
    },
    DE: {
        title: 'MEGA ARCHITEKT',
        subtitle: 'Produktionsreife Workflow-Spezifikationen generieren',
        placeholder: 'Beschreibe deinen komplexen Workflow...\n\nBeispiel: "RAG-System mit Supabase. 3 Tabellen: documents, faqs, procedures. Auto-Klassifizierung eingehender Daten basierend auf Inhalt. Vektor-Suche für semantische Abfragen. Query-Agent mit Chat-Interface, das alle Tabellen durchsuchen und Beziehungen verfolgen kann."',
        generate: 'MEGA PROMPT GENERIEREN',
        generating: 'GENERIERE...',
        copy: 'KOPIEREN',
        copied: 'KOPIERT',
        download: 'HERUNTERLADEN',
        characters: 'Zeichen',
        templateDetected: 'Template erkannt',
        noTemplate: 'Eigener Workflow (kein Template-Match)',
        availableTemplates: 'Verfügbare Templates',
        phaseDetecting: 'Muster erkennen...',
        phaseArchitecture: 'Architektur generieren...',
        phaseNodes: 'Nodes spezifizieren...',
        phaseSetup: 'Setup & Warnungen hinzufügen...',
        phaseAssembling: 'Mega Prompt zusammenstellen...',
        phaseComplete: 'Fertig!'
    }
};

const MegaArchitect: React.FC<MegaArchitectProps> = ({ language }) => {
    const [intent, setIntent] = useState('');
    const [output, setOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState<{ phase: string; progress: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const text = UI_TEXT[language];
    const templates = getAvailableTemplates();

    // Detect template as user types
    const detectedTemplate = intent.length > 20 ? detectTemplate(intent) : null;

    const handleGenerate = async () => {
        if (!intent.trim()) return;

        setIsGenerating(true);
        setError(null);
        setOutput('');

        const progressCallback: ProgressCallback = ({ phase, progress: prog }) => {
            const phaseText = {
                detecting: text.phaseDetecting,
                architecture: text.phaseArchitecture,
                nodes: text.phaseNodes,
                setup: text.phaseSetup,
                assembling: text.phaseAssembling,
                complete: text.phaseComplete
            }[phase] || phase;

            setProgress({ phase: phaseText, progress: prog });
        };

        try {
            const megaPrompt = await generateMegaPrompt(intent, language, progressCallback);
            setOutput(megaPrompt);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
            setProgress(null);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mega-workflow-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                            {text.title}
                        </h1>
                        <p className="text-xs text-white/50">{text.subtitle}</p>
                    </div>
                </div>

                {/* Available Templates Pills */}
                <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">{text.availableTemplates}</p>
                    <div className="flex flex-wrap gap-2">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setIntent(t.description[language])}
                                className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-purple-300 transition-all"
                            >
                                {t.name[language]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Input Section */}
                <div className="flex-1 p-6 flex flex-col">
                    {/* Intent Input */}
                    <textarea
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder={text.placeholder}
                        className="flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 resize-none font-mono text-sm"
                    />

                    {/* Template Detection Indicator */}
                    {intent.length > 20 && (
                        <div className={`mt-3 flex items-center gap-2 text-sm ${detectedTemplate ? 'text-purple-400' : 'text-white/40'}`}>
                            {detectedTemplate ? (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>{text.templateDetected}: <strong>{detectedTemplate.name[language]}</strong></span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{text.noTemplate}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Progress Indicator */}
                    {progress && (
                        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-purple-300">{progress.phase}</span>
                                <span className="text-xs text-white/50">{progress.progress}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-300"
                                    style={{ width: `${progress.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={!intent.trim() || isGenerating}
                        className={`mt-4 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${!intent.trim() || isGenerating
                                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-amber-600 text-white hover:from-purple-500 hover:to-amber-500 shadow-lg shadow-purple-900/30'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {text.generating}
                            </>
                        ) : (
                            <>
                                <Rocket className="w-4 h-4" />
                                {text.generate}
                            </>
                        )}
                    </button>
                </div>

                {/* Output Section */}
                <div className="flex-1 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
                    {/* Output Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-white/50">OUTPUT</span>
                            {output && (
                                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                                    {output.length.toLocaleString()} {text.characters}
                                </span>
                            )}
                        </div>
                        {output && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? text.copied : text.copy}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 text-white/60 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <Download className="w-3 h-3" />
                                    {text.download}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Output Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {output ? (
                            <pre className="text-sm text-white/80 font-mono whitespace-pre-wrap break-words leading-relaxed">
                                {output}
                            </pre>
                        ) : (
                            <div className="h-full flex items-center justify-center text-white/20">
                                <div className="text-center">
                                    <Rocket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">{language === 'DE' ? 'Mega Prompt wird hier angezeigt' : 'Mega prompt will appear here'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MegaArchitect;
