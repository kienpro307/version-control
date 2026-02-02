'use client';

import { useState } from 'react';
import { X, Brain, Sparkles, MapPin, Copy, Check } from 'lucide-react';
import { ContextDump, CreateContextDumpInput } from '@/hooks/useContextDumps';

interface ContextDumpModalProps {
    projectName: string;
    latestDump?: ContextDump | null;
    onSave: (input: CreateContextDumpInput) => Promise<ContextDump | null>;
    onClose: () => void;
}

export default function ContextDumpModal({
    projectName,
    latestDump,
    onSave,
    onClose
}: ContextDumpModalProps) {
    const [mentalModel, setMentalModel] = useState(latestDump?.mental_model || '');
    const [nextStepPrompt, setNextStepPrompt] = useState(latestDump?.next_step_prompt || '');
    const [workspaceLocation, setWorkspaceLocation] = useState<'office' | 'home'>(
        latestDump?.workspace_location || 'office'
    );
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave({
            mental_model: mentalModel,
            next_step_prompt: nextStepPrompt,
            workspace_location: workspaceLocation
        });
        setSaving(false);
        onClose();
    };

    const generatePromptForAgent = () => {
        return `# Context: ${projectName}

## Current Mental Model
${mentalModel || '(không có)'}

## Next Step
${nextStepPrompt || '(không có)'}

## Location
Working from: ${workspaceLocation === 'office' ? 'Office' : 'Home'}

---
Hãy giúp tôi tiếp tục công việc dựa trên context này.`;
    };

    const handleCopyPrompt = async () => {
        await navigator.clipboard.writeText(generatePromptForAgent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white dark:from-slate-900 dark:to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Context Dump</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{projectName} • Lưu trạng thái não bộ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Workspace Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <MapPin className="w-4 h-4" />
                            Đang làm việc từ đâu?
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => setWorkspaceLocation('office')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${workspaceLocation === 'office'
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                🏢 Office
                            </button>
                            <button
                                onClick={() => setWorkspaceLocation('home')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${workspaceLocation === 'home'
                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-2 border-green-500'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                🏠 Home
                            </button>
                        </div>
                    </div>

                    {/* Mental Model */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Brain className="w-4 h-4" />
                            Mental Model
                            <span className="text-xs text-slate-400 font-normal">(Đang nghĩ gì? Đang kẹt ở đâu?)</span>
                        </label>
                        <textarea
                            value={mentalModel}
                            onChange={e => setMentalModel(e.target.value)}
                            placeholder="Ví dụ: Đang refactor CoreNetworking module, kẹt ở vấn đề dependency với AuthService..."
                            className="w-full h-24 sm:h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none text-sm sm:text-base"
                        />
                    </div>

                    {/* Next Step Prompt */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Sparkles className="w-4 h-4" />
                            Next Step Prompt
                            <span className="text-xs text-slate-400 font-normal">(Prompt mồi cho Agent phiên sau)</span>
                        </label>
                        <textarea
                            value={nextStepPrompt}
                            onChange={e => setNextStepPrompt(e.target.value)}
                            placeholder="Ví dụ: Tiếp tục implement unit tests cho AuthService, focus vào edge cases..."
                            className="w-full h-24 sm:h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none text-sm sm:text-base"
                        />
                    </div>

                    {/* Last Dump Info */}
                    {latestDump && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                                Context trước đó
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                {new Date(latestDump.created_at).toLocaleString('vi-VN')} • từ {latestDump.workspace_location === 'office' ? '🏢 Office' : '🏠 Home'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
                    <button
                        onClick={handleCopyPrompt}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${copied
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Prompt for Agent'}
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {saving ? 'Saving...' : '💾 Save Context'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
