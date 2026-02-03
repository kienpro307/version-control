import { useState } from 'react';
import { X, Clock, GitCommit, FilePlus, CheckCircle2, Trash2, Edit2, Archive, Activity as ActivityIcon, Package, Pencil, Save, XCircle, Plus, Bot } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';
import { AILog } from '@/lib/types';

interface ActivityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activities: Activity[];
    loading: boolean;
    onUpdateActivity?: (activityId: string, updates: { diff_summary?: string }) => Promise<{ error: any }>;
    aiLogs?: AILog[];
    aiLogsLoading?: boolean;
    onRunCommand?: (command: string) => Promise<void>;
}

export default function ActivityDrawer({
    isOpen,
    onClose,
    activities,
    loading,
    onUpdateActivity,
    aiLogs = [],
    aiLogsLoading = false,
    onRunCommand
}: ActivityDrawerProps) {
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'system' | 'ai'>('all');

    const allItems = [
        ...activities.map(a => ({ ...a, itemType: 'activity' as const, dateVal: new Date(a.created_at) })),
        ...aiLogs.map(l => ({ ...l, itemType: 'ai' as const, dateVal: new Date(l.created_at) }))
    ].sort((a, b) => b.dateVal.getTime() - a.dateVal.getTime());

    const filteredItems = allItems.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'system') return item.itemType === 'activity';
        if (activeTab === 'ai') return item.itemType === 'ai';
        return true;
    });

    // Group items by date
    const groupedItems = filteredItems.reduce((acc, item) => {
        const dateStr = item.dateVal.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(item);
        return acc;
    }, {} as Record<string, typeof filteredItems>);

    const getIcon = (item: typeof filteredItems[0]) => {
        if (item.itemType === 'ai') return <Bot className="text-purple-500" size={18} />;

        // Activity logic
        const act = item as Activity;
        switch (act.action_type) {
            case 'create_project': return <Package className="text-blue-500" size={18} />;
            case 'create_version': return <GitCommit className="text-purple-500" size={18} />;
            case 'create_task': return <FilePlus className="text-green-500" size={18} />;
            case 'complete_task': return <CheckCircle2 className="text-green-600" size={18} />;
            case 'delete_task': return <Trash2 className="text-red-500" size={18} />;
            case 'update_task': return <Edit2 className="text-amber-500" size={18} />;
            case 'archive_version': return <Archive className="text-slate-500" size={18} />;
            default: return <ActivityIcon className="text-slate-400" size={18} />;
        }
    };

    const handleStartEdit = (activityFn: Activity) => {
        setEditingActivityId(activityFn.id);
        setEditValue(activityFn.diff_summary || '');
    };

    const handleSaveEdit = async (activityId: string) => {
        if (!onUpdateActivity) return;
        setSaving(true);
        await onUpdateActivity(activityId, { diff_summary: editValue });
        setSaving(false);
        setEditingActivityId(null);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`
                    fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <ActivityIcon className="text-slate-500" size={20} />
                        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Activity Log</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 pb-2 flex gap-4 border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        All
                        {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'system' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        System
                        {activeTab === 'system' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'ai' ? 'text-green-600 dark:text-green-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        AI Logs
                        {activeTab === 'ai' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500" />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading || aiLogsLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <Clock className="animate-spin mr-2" size={20} />
                            Loading activity...
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            No activity found
                        </div>
                    ) : (
                        Object.entries(groupedItems).map(([date, items]) => (
                            <div key={date} className="relative">
                                <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10 py-2 mb-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 inline-block px-2 py-1 rounded">
                                        {date}
                                    </h3>
                                </div>
                                <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="relative group">
                                            {/* Timeline dot */}
                                            <div className="absolute -left-[31px] top-1 p-1 bg-white dark:bg-slate-900 ring-4 ring-white dark:ring-slate-900 rounded-full">
                                                {getIcon(item)}
                                            </div>

                                            {item.itemType === 'ai' ? (
                                                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 capitalize">{(item as AILog).status}</span>
                                                        <span className="text-xs text-slate-400">{item.dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-words mb-2">
                                                        $ {(item as AILog).command}
                                                    </p>
                                                    {(item as AILog).result != null && (
                                                        <div className="text-xs text-slate-500 font-mono bg-white dark:bg-slate-950 p-2 rounded border border-purple-100 dark:border-purple-800/20 mb-2">
                                                            {JSON.stringify((item as AILog).result).slice(0, 100)}
                                                            {JSON.stringify((item as AILog).result).length > 100 ? '...' : ''}
                                                        </div>
                                                    )}
                                                    {onRunCommand && (
                                                        <button
                                                            onClick={() => onRunCommand((item as AILog).command)}
                                                            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium mt-1"
                                                        >
                                                            <Pencil size={10} />
                                                            Run Again
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                                {(item as Activity).description}
                                                            </p>
                                                            {/* Diff Summary */}
                                                            {editingActivityId === item.id ? (
                                                                <div className="mt-2 space-y-2">
                                                                    <textarea
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-green-500"
                                                                        rows={3}
                                                                        placeholder="Add a summary of changes..."
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleSaveEdit(item.id)}
                                                                            disabled={saving}
                                                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <Save size={12} />
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingActivityId(null)}
                                                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                                                        >
                                                                            <XCircle size={12} />
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="mt-1 group/summary">
                                                                    {(item as Activity).diff_summary ? (
                                                                        <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                                            {(item as Activity).diff_summary}
                                                                        </p>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleStartEdit(item as Activity)}
                                                                            className="text-xs text-slate-400 hover:text-green-500 flex items-center gap-1 opacity-0 group-hover/summary:opacity-100 transition-opacity"
                                                                        >
                                                                            <Plus size={12} /> Add summary
                                                                        </button>
                                                                    )}

                                                                    {/* Edit button for existing summary */}
                                                                    {(item as Activity).diff_summary && (
                                                                        <button
                                                                            onClick={() => handleStartEdit(item as Activity)}
                                                                            className="absolute top-0 right-0 p-1 text-slate-400 hover:text-green-500 opacity-0 group-hover/summary:opacity-100 transition-opacity"
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-4">
                                                            {item.dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
