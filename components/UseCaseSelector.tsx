import React, { useState } from 'react';
import { Language } from '../types';
import { USE_CASE_TEMPLATES, getAllCategories, getCategoryLabel, getTemplatesByCategory, UseCaseTemplate } from '../data/useCaseTemplates';
import { ChevronDown, Sparkles, Zap, Layers, Clock } from 'lucide-react';

interface UseCaseSelectorProps {
    language: Language;
    onSelectTemplate: (template: UseCaseTemplate) => void;
}

const UI_TEXT = {
    EN: {
        placeholder: 'Quick Start: Select a Template',
        nodes: 'nodes',
        useThis: 'Use Template'
    },
    DE: {
        placeholder: 'Schnellstart: Vorlage wählen',
        nodes: 'Knoten',
        useThis: 'Vorlage nutzen'
    }
};

const COMPLEXITY_COLORS = {
    simple: 'emerald',
    medium: 'yellow',
    complex: 'purple'
};

const COMPLEXITY_LABELS = {
    simple: { EN: 'Simple', DE: 'Einfach' },
    medium: { EN: 'Medium', DE: 'Mittel' },
    complex: { EN: 'Complex', DE: 'Komplex' }
};

const UseCaseSelector: React.FC<UseCaseSelectorProps> = ({ language, onSelectTemplate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<UseCaseTemplate['category'] | null>(null);
    const [hoveredTemplate, setHoveredTemplate] = useState<UseCaseTemplate | null>(null);

    const text = UI_TEXT[language];
    const categories = getAllCategories();

    const handleSelect = (template: UseCaseTemplate) => {
        onSelectTemplate(template);
        setIsOpen(false);
        setSelectedCategory(null);
    };

    return (
        <div className="relative w-full mb-4">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          border transition-all duration-200
          ${isOpen
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'}
        `}
            >
                <div className="flex items-center gap-3">
                    <Sparkles className={`w-4 h-4 ${isOpen ? 'text-purple-400' : 'text-white/40'}`} />
                    <span className="text-sm font-medium">{text.placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-[fadeSlideIn_0.2s_ease-out]">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">

                        {/* Category Tabs */}
                        <div className="flex flex-wrap gap-1 p-3 border-b border-white/5 bg-white/[0.02]">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                    className={`
                    px-3 py-1.5 rounded-lg text-[11px] font-medium uppercase tracking-wide transition-all
                    ${selectedCategory === cat
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                            : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white'}
                  `}
                                >
                                    {getCategoryLabel(cat, language)}
                                </button>
                            ))}
                        </div>

                        {/* Templates List */}
                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {(selectedCategory
                                ? getTemplatesByCategory(selectedCategory)
                                : USE_CASE_TEMPLATES
                            ).map((template) => (
                                <div
                                    key={template.id}
                                    onMouseEnter={() => setHoveredTemplate(template)}
                                    onMouseLeave={() => setHoveredTemplate(null)}
                                    className="group relative p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                    onClick={() => handleSelect(template)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                                                    {template.name[language]}
                                                </span>
                                                <span className={`
                          px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                          bg-${COMPLEXITY_COLORS[template.complexity]}-500/10 
                          text-${COMPLEXITY_COLORS[template.complexity]}-400
                          border border-${COMPLEXITY_COLORS[template.complexity]}-500/20
                        `}>
                                                    {COMPLEXITY_LABELS[template.complexity][language]}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-white/40 line-clamp-2">
                                                {template.description[language]}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="flex items-center gap-1 text-[10px] text-white/30">
                                                <Layers className="w-3 h-3" />
                                                <span>~{template.estimatedNodes} {text.nodes}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSelect(template); }}
                                                className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-[10px] font-medium transition-all hover:bg-purple-500/30"
                                            >
                                                {text.useThis}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Suggested Nodes Preview */}
                                    {hoveredTemplate?.id === template.id && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {template.suggestedNodes.slice(0, 5).map((nodeId) => (
                                                <span
                                                    key={nodeId}
                                                    className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/50 font-mono"
                                                >
                                                    {nodeId}
                                                </span>
                                            ))}
                                            {template.suggestedNodes.length > 5 && (
                                                <span className="px-1.5 py-0.5 text-[9px] text-white/30">
                                                    +{template.suggestedNodes.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UseCaseSelector;
