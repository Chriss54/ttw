import React from 'react';
import { Zap, Check, AlertTriangle, Shield } from 'lucide-react';
import { ValidationResult } from '../services/promptValidator';
import { Language } from '../types';

interface ValidateFixButtonProps {
    validationResult: ValidationResult | null;
    onValidateAndFix: () => void;
    isValidating: boolean;
    language: Language;
}

const UI_TEXT = {
    EN: {
        validate: 'Validate',
        fixing: 'Fixing...',
        fixIssues: 'Fix {count} Issues',
        validated: 'Validated',
        noContent: 'No Content',
        blocking: '{count} blocking',
        warning: '{count} warnings'
    },
    DE: {
        validate: 'Validieren',
        fixing: 'Behebe...',
        fixIssues: '{count} Probleme beheben',
        validated: 'Validiert',
        noContent: 'Kein Inhalt',
        blocking: '{count} blockierend',
        warning: '{count} Warnungen'
    }
};

const ValidateFixButton: React.FC<ValidateFixButtonProps> = ({
    validationResult,
    onValidateAndFix,
    isValidating,
    language
}) => {
    const text = UI_TEXT[language];

    // Determine button state and styling
    const getButtonState = () => {
        if (isValidating) {
            return {
                label: text.fixing,
                icon: <Zap className="w-3 h-3 animate-pulse" />,
                className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
                disabled: true
            };
        }

        if (!validationResult) {
            return {
                label: text.validate,
                icon: <Shield className="w-3 h-3" />,
                className: 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white',
                disabled: false
            };
        }

        if (validationResult.isValid) {
            return {
                label: text.validated,
                icon: <Check className="w-3 h-3" />,
                className: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
                disabled: false
            };
        }

        if (validationResult.blockingCount > 0) {
            return {
                label: text.fixIssues.replace('{count}', String(validationResult.fixableCount)),
                icon: <AlertTriangle className="w-3 h-3" />,
                className: 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse hover:bg-red-500/30',
                disabled: false
            };
        }

        // Only warnings
        return {
            label: text.fixIssues.replace('{count}', String(validationResult.fixableCount)),
            icon: <Zap className="w-3 h-3" />,
            className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30',
            disabled: false
        };
    };

    const state = getButtonState();

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onValidateAndFix}
                disabled={state.disabled}
                className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border 
          transition-all text-xs font-medium
          ${state.className}
          ${state.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        `}
            >
                {state.icon}
                <span className="hidden sm:inline">{state.label}</span>
                <span className="sm:hidden">
                    {validationResult?.isValid ? '✓' : validationResult?.fixableCount ? `⚡${validationResult.fixableCount}` : '⚡'}
                </span>
            </button>

            {/* Issue count tooltip/badge */}
            {validationResult && !validationResult.isValid && (
                <div className="hidden lg:flex items-center gap-1 text-[10px]">
                    {validationResult.blockingCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            {text.blocking.replace('{count}', String(validationResult.blockingCount))}
                        </span>
                    )}
                    {validationResult.warningCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            {text.warning.replace('{count}', String(validationResult.warningCount))}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ValidateFixButton;
