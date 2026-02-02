'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Circle, CheckCircle2, Trash2, Pencil, Maximize2, FileText } from 'lucide-react';
import { Version, Task } from '@/lib/types';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface VersionSectionProps {
    version: Version;
    tasks: Task[];
    isExpanded: boolean;
    onToggle: () => void;
    onAddTask: (content: string) => void;
    onToggleDone: (taskId: string, isDone: boolean) => void;
    onUpdateTask: (taskId: string, content: string) => void;
    onDeleteTask: (taskId: string) => void;
    onOpenTask: (task: Task) => void;
    onGenerateChangelog?: () => void;
    isUnassigned?: boolean;
    isSelectionMode?: boolean;
    selectedTaskIds?: Set<string>;
    onToggleSelectTask?: (taskId: string) => void;
}

export default function VersionSection({
    version,
    tasks,
    isExpanded,
    onToggle,
    onAddTask,
    onToggleDone,
    onUpdateTask,
    onDeleteTask,
    onOpenTask,
    onGenerateChangelog,
    isUnassigned = false,
    isSelectionMode = false,
    selectedTaskIds = new Set(),
    onToggleSelectTask = () => { },
}: VersionSectionProps) {
    const [newTaskContent, setNewTaskContent] = useState('');

    const handleAddTask = () => {
        if (newTaskContent.trim()) {
            onAddTask(newTaskContent.trim());
            setNewTaskContent('');
        }
    };

    // Sort already handled by parent hook, but re-sort locally if needed for done status
    const sortedTasks = [...tasks];

    const doneCount = tasks.filter(t => t.isDone).length;
    const totalCount = tasks.length;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const borderColor = isUnassigned
        ? 'border-l-amber-500'
        : version.isActive
            ? 'border-l-emerald-500'
            : 'border-l-slate-400';

    return (
        <div className={`bg-white border border-l-4 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${borderColor} ${isUnassigned ? 'border-amber-200' : version.isActive ? 'border-emerald-200' : 'border-slate-200'}`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isUnassigned ? 'bg-amber-50/50 hover:bg-amber-50' : version.isActive ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-slate-50/50 hover:bg-slate-50'}`}
            >
                <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </span>

                <span className={`font-mono font-semibold ${isUnassigned ? 'text-amber-700' : version.isActive ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {version.name}
                </span>

                {version.isActive && !isUnassigned && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">🚀 Active</span>
                )}
                {!version.isActive && !isUnassigned && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">✅ Released</span>
                )}
                {isUnassigned && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">📋 Backlog</span>
                )}

                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className={`text-xs font-medium ${progressPercent === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {progressPercent}%
                        </span>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">
                        {doneCount}/{totalCount}
                    </span>

                    {/* Changelog Button - only for non-active, non-unassigned versions */}
                    {!version.isActive && !isUnassigned && onGenerateChangelog && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onGenerateChangelog();
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Generate Changelog"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </button>

            {/* Task Table */}
            {isExpanded && (
                <div className="border-t border-slate-100">
                    {sortedTasks.length > 0 ? (
                        <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            <div className="divide-y divide-slate-100">
                                {sortedTasks.map(task => (
                                    <SortableTaskRow
                                        key={task.id}
                                        task={task}
                                        onToggleDone={onToggleDone}
                                        onUpdate={onUpdateTask}
                                        onDelete={onDeleteTask}
                                        onOpen={onOpenTask}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedTaskIds.has(task.id)}
                                        onToggleSelect={() => onToggleSelectTask(task.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">
                            No tasks in this version
                        </div>
                    )}

                    {/* Add Task Input */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
                        <Plus className="w-4 h-4 text-slate-400" />
                        <input
                            data-add-task
                            type="text"
                            value={newTaskContent}
                            onChange={e => setNewTaskContent(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            placeholder="Add task..."
                            className="flex-1 bg-transparent text-sm placeholder-slate-400 focus:outline-none"
                        />
                        {newTaskContent && (
                            <button
                                onClick={handleAddTask}
                                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm"
                            >
                                Add Task
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface TaskRowProps {
    task: Task;
    onToggleDone: (taskId: string, isDone: boolean) => void;
    onUpdate: (taskId: string, content: string) => void;
    onDelete: (taskId: string) => void;
    onOpen: (task: Task) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

function SortableTaskRow(props: TaskRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const, // Fix type error if needed
    };

    return (
        <div ref={setNodeRef} style={style} className="group/sortable flex relative bg-white">
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 absolute left-0 top-0 bottom-0 z-10 opacity-0 group-hover/sortable:opacity-100 transition-opacity"
            >
                <GripVertical size={14} />
            </div>
            <div className={`flex-1 ${!props.isSelectionMode ? 'pl-6' : ''}`}>
                <TaskRow {...props} />
            </div>
        </div>
    );
}

function TaskRow({ task, onToggleDone, onUpdate, onDelete, onOpen, isSelectionMode, isSelected, onToggleSelect }: TaskRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editContent.trim() && editContent !== task.content) {
            onUpdate(task.id, editContent.trim());
        } else {
            setEditContent(task.content);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setEditContent(task.content);
            setIsEditing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    // Prevent drag listeners from interfering with inputs/buttons
    // dnd-kit handles this mostly, but good to be safe with drag handle separation (done above)

    return (
        <div className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>

            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="flex-shrink-0 mr-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                </div>
            )}

            {!isSelectionMode && (
                <button
                    onClick={() => onToggleDone(task.id, !task.isDone)}
                    className={`
                        flex-shrink-0 flex items-center justify-center
                        w-11 h-11 -ml-2 rounded-lg
                        transition-all duration-150 ease-out
                        active:scale-90
                        ${task.isDone
                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                        }
                    `}
                    title={task.isDone ? 'Mark as pending' : 'Mark as done'}
                >
                    {task.isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
            )}

            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <span
                    onDoubleClick={() => setIsEditing(true)}
                    className={`flex-1 text-sm cursor-text ${task.isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                >
                    {task.content}
                </span>
            )}

            <span className="text-xs text-slate-400 hidden sm:block">
                {formatDate(task.doneAt || task.createdAt)}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onOpen(task)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-all"
                    title="Open Details"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-all"
                    title="Edit (E)"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(task.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
