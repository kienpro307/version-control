import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Flag, CheckCircle2, Circle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Task } from '@/lib/types';

interface TaskDrawerProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskDrawer({ task, isOpen, onClose, onUpdate }: TaskDrawerProps) {
    const [description, setDescription] = useState('');
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        if (task) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDescription(task.description || '');
        }
    }, [task]);

    if (!task) return null;

    const handleSaveDescription = () => {
        if (task && description !== task.description) {
            onUpdate(task.id, { description });
        }
    };

    const toggleStatus = () => {
        onUpdate(task.id, { isDone: !task.isDone });
    };

    const handlePriorityChange = (priority: Task['priority']) => {
        onUpdate(task.id, { priority });
    };

    const priorityColors = {
        none: 'bg-slate-100 text-slate-600',
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleStatus}
                                className={`flex-shrink-0 transition-colors ${task.isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
                            >
                                {task.isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                                {task.id.slice(0, 8)}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                value={task.content}
                                onChange={(e) => onUpdate(task.id, { content: e.target.value })}
                                className="w-full text-xl font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:ring-0 p-0 placeholder-slate-300 dark:placeholder-slate-600"
                                placeholder="Task title"
                            />
                        </div>

                        {/* Priority & Meta */}
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Flag className="w-3 h-3" /> Priority
                                </span>
                                <select
                                    value={task.priority || 'none'}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onChange={(e) => handlePriorityChange(e.target.value as any)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-full cursor-pointer border-none focus:ring-0 ${priorityColors[task.priority || 'none']}`}
                                >
                                    <option value="none">None</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Created
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</span>
                                <button
                                    onClick={() => setIsPreview(!isPreview)}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    {isPreview ? 'Edit' : 'Preview'}
                                </button>
                            </div>

                            {isPreview ? (
                                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl min-h-[150px] border border-slate-100 dark:border-slate-800">
                                    <ReactMarkdown>
                                        {description || '*No description provided*'}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleSaveDescription}
                                    placeholder="Add a detailed description... (Markdown supported)"
                                    className="w-full h-40 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-y placeholder-slate-400"
                                />
                            )}
                        </div>

                        {/* Labels (Placeholder for now, can implement tag input later) */}
                        <div className="space-y-3">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Labels
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex flex-wrap gap-2 items-center">
                                    {(task.labels || []).map(label => (
                                        <span key={label} className="group flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700">
                                            {label}
                                            <button
                                                onClick={() => {
                                                    const newLabels = (task.labels || []).filter(l => l !== label);
                                                    onUpdate(task.id, { labels: newLabels });
                                                }}
                                                className="hover:text-red-500 rounded-full focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}

                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            placeholder="+ Label"
                                            className="w-20 px-2 py-1 text-xs bg-transparent border border-dashed border-slate-300 dark:border-slate-600 rounded-full focus:w-32 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all placeholder-slate-400 text-slate-600 dark:text-slate-300"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && !(task.labels || []).includes(val)) {
                                                        onUpdate(task.id, { labels: [...(task.labels || []), val] });
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
