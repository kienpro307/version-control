'use client';

import { useState, useMemo } from 'react';
import {
    X,
    CheckCircle2,
    Circle,
    Building2,
    Home,
    Brain,
    ListChecks,
    Activity,
    Sparkles,
    Clock,
    ChevronRight
} from 'lucide-react';

interface WorkflowPanelProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceLocation: 'office' | 'home';
    // Data
    projectName?: string;
    pendingTasksCount: number;
    completedTodayCount: number;
    hasUnreadContextDump: boolean;
    lastActivityTime?: string;
    // Actions
    onOpenContextDump: () => void;
    onOpenActivityLog: () => void;
    onMarkContextRead?: () => void;
}

interface ChecklistItem {
    id: string;
    label: string;
    description?: string;
    completed: boolean;
    action?: () => void;
    icon: React.ReactNode;
}

export default function WorkflowPanel({
    isOpen,
    onClose,
    workspaceLocation,
    projectName,
    pendingTasksCount,
    completedTodayCount,
    hasUnreadContextDump,
    lastActivityTime,
    onOpenContextDump,
    onOpenActivityLog,
    onMarkContextRead,
}: WorkflowPanelProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        setCheckedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Office Workflow - Before Leaving
    const officeChecklist: ChecklistItem[] = useMemo(() => [
        {
            id: 'context-dump',
            label: 'Create Context Dump',
            description: 'Save your mental model for the next session',
            completed: checkedItems.has('context-dump'),
            action: onOpenContextDump,
            icon: <Brain className="w-4 h-4" />,
        },
        {
            id: 'update-tasks',
            label: 'Update Task Status',
            description: `${completedTodayCount} completed, ${pendingTasksCount} pending`,
            completed: checkedItems.has('update-tasks') || completedTodayCount > 0,
            icon: <ListChecks className="w-4 h-4" />,
        },
        {
            id: 'review-activities',
            label: 'Review Activities',
            description: 'Check activity log for completeness',
            completed: checkedItems.has('review-activities'),
            action: onOpenActivityLog,
            icon: <Activity className="w-4 h-4" />,
        },
    ], [checkedItems, completedTodayCount, pendingTasksCount, onOpenContextDump, onOpenActivityLog]);

    // Home Workflow - Welcome Back
    const homeChecklist: ChecklistItem[] = useMemo(() => [
        {
            id: 'load-context',
            label: hasUnreadContextDump ? 'Read Context Dump' : 'Context Already Read',
            description: hasUnreadContextDump ? 'Load your previous session context' : 'You\'re up to date!',
            completed: !hasUnreadContextDump,
            action: hasUnreadContextDump ? onMarkContextRead : undefined,
            icon: <Brain className="w-4 h-4" />,
        },
        {
            id: 'check-activities',
            label: 'Check Recent Activities',
            description: lastActivityTime ? `Last activity: ${lastActivityTime}` : 'No recent activities',
            completed: checkedItems.has('check-activities'),
            action: onOpenActivityLog,
            icon: <Clock className="w-4 h-4" />,
        },
        {
            id: 'plan-next',
            label: 'Plan Next Actions',
            description: `${pendingTasksCount} tasks waiting`,
            completed: checkedItems.has('plan-next'),
            icon: <Sparkles className="w-4 h-4" />,
        },
    ], [checkedItems, hasUnreadContextDump, lastActivityTime, pendingTasksCount, onMarkContextRead, onOpenActivityLog]);

    const checklist = workspaceLocation === 'office' ? officeChecklist : homeChecklist;
    const allCompleted = checklist.every(item => item.completed || checkedItems.has(item.id));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${workspaceLocation === 'office'
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${workspaceLocation === 'office'
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-amber-100 dark:bg-amber-900/30'
                            }`}>
                            {workspaceLocation === 'office'
                                ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                : <Home className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            }
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {workspaceLocation === 'office' ? 'Before Leaving Office' : 'Welcome Back!'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {projectName || 'No project selected'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Checklist */}
                <div className="p-4 space-y-2">
                    {checklist.map((item, index) => {
                        const isCompleted = item.completed || checkedItems.has(item.id);
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${isCompleted
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                onClick={() => {
                                    if (item.action) item.action();
                                    toggleItem(item.id);
                                }}
                            >
                                {/* Step Number / Check */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {isCompleted
                                        ? <CheckCircle2 className="w-5 h-5" />
                                        : <span className="text-sm font-medium">{index + 1}</span>
                                    }
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                                        }`}>
                                        {item.label}
                                    </div>
                                    {item.description && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {item.description}
                                        </div>
                                    )}
                                </div>

                                {/* Icon */}
                                <div className={`flex-shrink-0 ${isCompleted ? 'text-emerald-500' : 'text-slate-400'
                                    }`}>
                                    {item.action ? <ChevronRight className="w-4 h-4" /> : item.icon}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    {allCompleted ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">All done! You're ready to go.</span>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                            Complete the checklist above before {workspaceLocation === 'office' ? 'leaving' : 'starting'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
