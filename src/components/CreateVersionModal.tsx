'use client';

import { useState } from 'react';
import { X, Check, Package } from 'lucide-react';

interface CreateVersionModalProps {
    onClose: () => void;
    onCreate: (name: string, migratePending: boolean) => void;
}

export default function CreateVersionModal({ onClose, onCreate }: CreateVersionModalProps) {
    const [name, setName] = useState('');

    const handleCreate = (migratePending: boolean) => {
        if (name.trim()) {
            onCreate(name.trim(), migratePending);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Create Version</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate(false)}
                        placeholder="e.g., v1.0.0"
                        autoFocus
                        className="w-full px-4 py-3 text-lg font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />

                    <div className="mt-4 space-y-3">
                        {/* Secondary - outlined */}
                        <button
                            onClick={() => handleCreate(false)}
                            disabled={!name.trim()}
                            className="w-full flex items-center justify-center gap-2 px-4 min-h-12 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Create Empty Version
                        </button>

                        {/* Primary - filled with shadow */}
                        <button
                            onClick={() => handleCreate(true)}
                            disabled={!name.trim()}
                            className="w-full flex items-center justify-center gap-2 px-4 min-h-12 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 active:bg-emerald-800 dark:active:bg-emerald-800 transition-all shadow-md hover:shadow-lg active:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            <Check className="w-5 h-5" />
                            Create & Migrate Pending Tasks
                        </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                        "Migrate" will move all pending tasks to this new version
                    </p>
                </div>
            </div>
        </div>
    );
}
