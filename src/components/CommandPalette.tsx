'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface Command {
    id: string;
    label: string;
    shortcut?: string;
    action: () => void;
}

interface CommandPaletteProps {
    commands: Command[];
    onClose: () => void;
}

export default function CommandPalette({ commands, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCommands = commands.filter(cmd =>
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
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command..."
                        className="flex-1 bg-transparent text-slate-700 placeholder-slate-400 focus:outline-none"
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
                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-sm">{cmd.label}</span>
                                {cmd.shortcut && (
                                    <kbd className="px-2 py-0.5 text-xs bg-slate-100 rounded text-slate-500 font-mono">
                                        {cmd.shortcut}
                                    </kbd>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">
                            No commands found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
