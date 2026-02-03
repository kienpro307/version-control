import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import PromptPreviewModal from './PromptPreviewModal';
import { generateAgentPrompts } from '@/lib/promptGenerator';
import type { Project, Version, Task, Activity } from '@/lib/types';
import type { ContextDump } from '@/hooks/useContextDumps';

interface Command {
    id: string;
    label: string;
    shortcut?: string;
    action: () => void;
}

interface CommandPaletteProps {
    commands: Command[];
    onClose: () => void;
    // Extra Data for Agent Commands
    contextData?: {
        project?: Project;
        versions?: Version[];
        tasks?: Task[];
        activities?: Activity[];
        latestDump?: ContextDump | null;
    };
}

export default function CommandPalette({ commands, onClose, contextData }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [generatedPrompt, setGeneratedPrompt] = useState<{ title: string; content: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const agentCommands: Command[] = useMemo(() => {
        if (!contextData?.project) return [];
        return [
            {
                id: 'agent-summarize',
                label: 'Agent: Summarize Project',
                action: () => {
                    if (!contextData.project) return;
                    const prompt = generateAgentPrompts.summarizeProject(
                        contextData.project,
                        contextData.versions || [],
                        contextData.tasks || [],
                        contextData.activities || []
                    );
                    setGeneratedPrompt({ title: 'Project Summary', content: prompt });
                }
            },
            {
                id: 'agent-next-task',
                label: 'Agent: Suggest Next Task',
                action: () => {
                    const prompt = generateAgentPrompts.nextTaskSuggestion(
                        contextData.tasks || [],
                        contextData.latestDump?.mental_model || null
                    );
                    setGeneratedPrompt({ title: 'Next Task Suggestion', content: prompt });
                }
            }
        ];
    }, [contextData]);

    const allCommands = [...agentCommands, ...commands];

    const filteredCommands = allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    // Don't close if it's an agent command (waiting for modal)
                    if (!filteredCommands[selectedIndex].id.startsWith('agent-')) {
                        onClose();
                    }
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    };

    if (generatedPrompt) {
        return (
            <PromptPreviewModal
                title={generatedPrompt.title}
                prompt={generatedPrompt.content}
                onClose={() => {
                    setGeneratedPrompt(null);
                    onClose();
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command..."
                        className="flex-1 bg-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                    />
                </div>

                {/* Commands List */}
                <div className="max-h-64 overflow-y-auto">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                onClick={() => {
                                    cmd.action();
                                    onClose();
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${index === selectedIndex
                                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-l-2 border-blue-500 pl-[14px]'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent'
                                    } ${cmd.id.startsWith('agent-') ? 'hover:bg-purple-50 dark:hover:bg-purple-900/10' : ''}`}
                            >
                                <span className={`text-sm flex items-center gap-2 ${cmd.id.startsWith('agent-') ? 'font-medium text-purple-700 dark:text-purple-400' : ''}`}>
                                    {cmd.id.startsWith('agent-') && <Sparkles className="w-3.5 h-3.5" />}
                                    {cmd.label}
                                </span>
                                {cmd.shortcut && (
                                    <kbd className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono">
                                        {cmd.shortcut}
                                    </kbd>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                            No commands found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
