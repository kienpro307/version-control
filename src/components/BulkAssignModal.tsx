'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Plus, CheckSquare, Square, ChevronDown } from 'lucide-react';
import type { Task, Version } from '@/lib/types';

interface BulkAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    versions: Version[];
    onAssign: (taskIds: string[], versionId: string) => Promise<void>;
    onCreateVersion: (name: string) => Promise<Version | null>;
    preSelectedTaskIds?: Set<string>;
    preSelectedVersionId?: string | null;
}

export default function BulkAssignModal({
    isOpen,
    onClose,
    tasks,
    versions,
    onAssign,
    onCreateVersion,
    preSelectedTaskIds,
    preSelectedVersionId,
}: BulkAssignModalProps) {
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
        preSelectedTaskIds || new Set()
    );
    const [selectedVersionId, setSelectedVersionId] = useState<string>(
        preSelectedVersionId || versions[0]?.id || ''
    );
    const [isCreatingVersion, setIsCreatingVersion] = useState(false);
    const [newVersionName, setNewVersionName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const lastClickedIndex = useRef<number | null>(null);

    if (!isOpen) return null;

    // Shift+Click range selection
    const handleTaskClick = (taskId: string, index: number, event: React.MouseEvent) => {
        if (event.shiftKey && lastClickedIndex.current !== null) {
            const start = Math.min(lastClickedIndex.current, index);
            const end = Math.max(lastClickedIndex.current, index);
            const rangeTaskIds = tasks.slice(start, end + 1).map(t => t.id);

            setSelectedTaskIds(prev => {
                const next = new Set(prev);
                rangeTaskIds.forEach(id => next.add(id));
                return next;
            });
        } else {
            setSelectedTaskIds(prev => {
                const next = new Set(prev);
                if (next.has(taskId)) {
                    next.delete(taskId);
                } else {
                    next.add(taskId);
                }
                return next;
            });
        }
        lastClickedIndex.current = index;
    };

    const handleSelectAll = () => {
        setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    };

    const handleDeselectAll = () => {
        setSelectedTaskIds(new Set());
    };

    const handleAssign = async () => {
        if (selectedTaskIds.size === 0 || !selectedVersionId) return;

        setIsLoading(true);
        try {
            await onAssign(Array.from(selectedTaskIds), selectedVersionId);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateVersion = async () => {
        if (!newVersionName.trim()) return;

        setIsLoading(true);
        try {
            const newVersion = await onCreateVersion(newVersionName.trim());
            if (newVersion) {
                setSelectedVersionId(newVersion.id);
                setIsCreatingVersion(false);
                setNewVersionName('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const selectedVersion = versions.find(v => v.id === selectedVersionId);

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        Assign Tasks to Version
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {/* Version Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Select Version
                        </label>

                        {isCreatingVersion ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newVersionName}
                                    onChange={e => setNewVersionName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateVersion()}
                                    placeholder="Enter version name..."
                                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100"
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreateVersion}
                                    disabled={!newVersionName.trim() || isLoading}
                                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreatingVersion(false);
                                        setNewVersionName('');
                                    }}
                                    className="px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        {selectedVersion?.name || 'Select a version'}
                                        {selectedVersion?.isActive && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded">
                                                Active
                                            </span>
                                        )}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>

                                {showVersionDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {versions.map(version => (
                                            <button
                                                key={version.id}
                                                onClick={() => {
                                                    setSelectedVersionId(version.id);
                                                    setShowVersionDropdown(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${selectedVersionId === version.id ? 'bg-slate-50 dark:bg-slate-700' : ''
                                                    }`}
                                            >
                                                {version.name}
                                                {version.isActive && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded">
                                                        Active
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                        <div className="border-t border-slate-200 dark:border-slate-700">
                                            <button
                                                onClick={() => {
                                                    setIsCreatingVersion(true);
                                                    setShowVersionDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create New Version
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Task List */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Done Tasks (Unassigned): {tasks.length} tasks
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={handleDeselectAll}
                                    className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">
                            💡 Tip: Shift+Click to select a range
                        </div>

                        {tasks.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                No done tasks without a version
                            </div>
                        ) : (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                {tasks.map((task, index) => {
                                    const isSelected = selectedTaskIds.has(task.id);
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={e => handleTaskClick(task.id, index, e)}
                                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors select-none ${isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                {isSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                )}
                                            </div>
                                            <span className={`text-sm flex-1 ${isSelected
                                                ? 'text-slate-800 dark:text-slate-100'
                                                : 'text-slate-600 dark:text-slate-400'
                                                }`}>
                                                {task.content}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedTaskIds.size} selected
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={selectedTaskIds.size === 0 || !selectedVersionId || isLoading}
                            className="px-5 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isLoading ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
