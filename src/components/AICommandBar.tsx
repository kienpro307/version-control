import { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Loader2, X } from 'lucide-react';

interface AICommandBarProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (command: string) => Promise<void>;
}

export default function AICommandBar({ isOpen, onClose, onExecute }: AICommandBarProps) {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            // Reset state on open
            // eslint-disable-next-line
            setStatus('idle');
            // eslint-disable-next-line
            setInput('');
            // eslint-disable-next-line
            setErrorMessage('');
        }
    }, [isOpen]);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || status === 'loading') return;

        setStatus('loading');
        try {
            await onExecute(input);
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setInput('');
            }, 1000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMessage('Failed to execute command. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Main Bar */}
            <div className="relative w-full max-w-2xl transform transition-all animate-in fade-in slide-in-from-top-4 duration-200">
                <div className={`
          relative overflow-hidden rounded-2xl shadow-2xl
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
          border border-white/20 dark:border-slate-700/50
          transition-all duration-300
          ${status === 'error' ? 'ring-2 ring-red-500/50' : 'ring-1 ring-slate-200 dark:ring-slate-800'}
        `}>

                    {/* Glowing gradient border effect (optional visual flair) */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="relative flex items-center">
                        <div className="pl-5 pr-3 text-purple-600 dark:text-purple-400">
                            {status === 'loading' ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Sparkles className="w-6 h-6" />
                            )}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setInput(e.target.value);
                                if (status === 'error') setStatus('idle');
                            }}
                            placeholder="Ask AI to do something..."
                            className="w-full bg-transparent py-5 pr-14 text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                            autoComplete="off"
                        />

                        <div className="absolute right-3 flex items-center gap-2">
                            {input.trim() && status !== 'loading' && (
                                <button
                                    type="submit"
                                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">
                                <span className="text-[10px]">ESC</span>
                            </div>
                        </div>
                    </form>

                    {/* Progress/State Bar */}
                    {(status === 'loading' || status === 'success') && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                            <div
                                className={`h-full transition-all duration-300 ease-out ${status === 'success' ? 'w-full bg-green-500' : 'w-2/3 bg-purple-500 animate-pulse'
                                    }`}
                            />
                        </div>
                    )}
                </div>

                {/* Helper Text / Feedback */}
                <div className="mt-3 ml-1">
                    {status === 'error' ? (
                        <p className="text-sm text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                            {errorMessage}
                        </p>
                    ) : (
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span>Try: &quot;Update the progress of PDFReader to 80%&quot;</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span>&quot;Create a new dark mode version&quot;</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
