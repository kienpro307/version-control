import { useRef, useEffect } from 'react';
import { X, Clock, GitCommit, FilePlus, CheckCircle2, Trash2, Edit2, Archive, Activity as ActivityIcon, Package } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';

interface ActivityDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activities: Activity[];
    loading: boolean;
}

export default function ActivityDrawer({ isOpen, onClose, activities, loading }: ActivityDrawerProps) {
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
            case 'create_version': return <GitCommit className="w-4 h-4 text-purple-500" />;
            case 'release_version': return <Archive className="w-4 h-4 text-green-600" />;
            case 'update_version': return <Edit2 className="w-4 h-4 text-indigo-500" />;
            default: return <ActivityIcon className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
            )}

            <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-500" />
                            Activity Log
                        </h2>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
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
                                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-1">
                                            {date}
                                        </div>
                                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
                                            {items.map((activity) => (
                                                <div key={activity.id} className="relative pl-6">
                                                    <div className="absolute -left-[9px] top-0 bg-white p-0.5 rounded-full border border-slate-200">
                                                        {getIcon(activity.action_type)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-800">
                                                            {activity.description || 'Performed an action'}
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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
