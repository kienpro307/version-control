import { useState } from 'react';
import { X, Clock, GitCommit, FilePlus, CheckCircle2, Trash2, Edit2, Archive, Activity as ActivityIcon, Package, Pencil, Save, XCircle, Plus } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';

interface ActivityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activities: Activity[];
    loading: boolean;
    onUpdateActivity?: (activityId: string, updates: { diff_summary?: string }) => Promise<{ error: any }>;
}

export default function ActivityDrawer({ isOpen, onClose, activities, loading, onUpdateActivity }: ActivityDrawerProps) {
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    // Group activities by date
    const groupedActivities = activities.reduce((acc, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(activity);
        return acc;
    }, {} as Record<string, Activity[]>);

    const getIcon = (action: string) => {
        switch (action) {
            case 'create_task': return <FilePlus className="w-4 h-4 text-emerald-500" />;
            case 'create_project': return <Package className="w-4 h-4 text-indigo-600" />;
            case 'complete_task': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'reopen_task': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'delete_task': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'create_version': return <GitCommit className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
            case 'release_version': return <Archive className="w-4 h-4 text-green-600 dark:text-green-500" />;
            case 'update_version': return <Edit2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
            default: return <ActivityIcon className="w-4 h-4 text-slate-400" />;
        }
    };

    const handleStartEdit = (activity: Activity) => {
        setEditingActivityId(activity.id);
        setEditValue(activity.diff_summary || '');
    };

    const handleCancelEdit = () => {
        setEditingActivityId(null);
        setEditValue('');
    };

    const handleSave = async (activityId: string) => {
        if (!onUpdateActivity) return;

        setSaving(true);
        const { error } = await onUpdateActivity(activityId, { diff_summary: editValue || undefined });
        setSaving(false);

        if (!error) {
            setEditingActivityId(null);
            setEditValue('');
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
            )}

            <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            Activity Log
                        </h2>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading && activities.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No activity recorded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedActivities).map(([date, items]) => (
                                    <div key={date}>
                                        <div className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-1">
                                            {date}
                                        </div>
                                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6 pb-2">
                                            {items.map((activity) => {
                                                const isEditing = editingActivityId === activity.id;

                                                return (
                                                    <div key={activity.id} className="relative pl-6">
                                                        <div className="absolute -left-[9px] top-0 bg-white dark:bg-slate-900 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                                            {getIcon(activity.action_type)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                                    {activity.description || 'Performed an action'}
                                                                </div>
                                                                {onUpdateActivity && !isEditing && (
                                                                    <button
                                                                        onClick={() => handleStartEdit(activity)}
                                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
                                                                        title={activity.diff_summary ? 'Edit summary' : 'Add summary'}
                                                                    >
                                                                        {activity.diff_summary ? (
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        ) : (
                                                                            <Plus className="w-3.5 h-3.5" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-400 mt-1">
                                                                {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>

                                                            {isEditing ? (
                                                                <div className="mt-2 space-y-2">
                                                                    <textarea
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        placeholder="Describe the logic changes made in this activity..."
                                                                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
                                                                        rows={4}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            disabled={saving}
                                                                            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                                                                        >
                                                                            <XCircle className="w-3.5 h-3.5" />
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSave(activity.id)}
                                                                            disabled={saving}
                                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-1 disabled:opacity-50"
                                                                        >
                                                                            <Save className="w-3.5 h-3.5" />
                                                                            {saving ? 'Saving...' : 'Save'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : activity.diff_summary && (
                                                                <div className="mt-2 p-2 bg-slate-900 rounded-md overflow-x-auto">
                                                                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                                                                        {activity.diff_summary}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
