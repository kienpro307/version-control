'use client';

import { X, Brain, ArrowRight } from 'lucide-react';
import { ContextDump } from '@/hooks/useContextDumps';

interface ContextBannerProps {
    dump: ContextDump;
    onDismiss: () => void;
    onContinue: () => void;
}

export default function ContextBanner({ dump, onDismiss, onContinue }: ContextBannerProps) {
    const isFromOffice = dump.workspace_location === 'office';
    const timeAgo = getTimeAgo(new Date(dump.created_at));

    return (
        <div className={`mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl border-2 animate-in fade-in slide-in-from-top-4 duration-300 ${isFromOffice
            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
            : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
            }`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 justify-between">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isFromOffice
                        ? 'bg-blue-100 dark:bg-blue-900/40'
                        : 'bg-green-100 dark:bg-green-900/40'
                        }`}>
                        <Brain className={`w-5 h-5 ${isFromOffice
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-600 dark:text-green-400'
                            }`} />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isFromOffice
                                ? 'bg-blue-200/50 text-blue-800 dark:text-blue-200'
                                : 'bg-green-200/50 text-green-800 dark:text-green-200'
                                }`}>
                                Welcome Back
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                from <strong>{dump.workspace_location || 'unknown'}</strong> • {timeAgo}
                            </span>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 leading-snug">
                            {(dump.mental_model || 'No details').split('\n')[0].substring(0, 100)}...
                        </h3>

                        {dump.next_step_prompt && (
                            <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 mr-1">👉 Next Step:</span>
                                {dump.next_step_prompt}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/50 dark:border-slate-700/50 ml-0 sm:ml-4">
                    <button
                        onClick={onContinue}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${isFromOffice
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        Resume
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDismiss}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'hôm qua';
    return `${diffDays} ngày trước`;
}
