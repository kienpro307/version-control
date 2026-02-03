'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Circle, CheckCircle2, Trash2, Pencil, Maximize2, FileText, MoreVertical, Rocket } from 'lucide-react';
import { Version, Task } from '@/lib/types';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface VersionSectionProps {
    version: Version;
    tasks: Task[];
    onAddTask: (content: string) => void;
    onToggleDone: (taskId: string, isDone: boolean) => void;
    onUpdateTask: (taskId: string, content: string) => void;
    onDeleteTask: (taskId: string) => void;
    onOpenTask: (task: Task) => void;
    onGenerateChangelog?: () => void;
    onDeleteVersion?: (id: string) => void;
    onSetActiveVersion?: (id: string) => void;
    onUpdateVersion?: (id: string, updates: Partial<Version>) => void;
    isUnassigned?: boolean;
    isSelectionMode?: boolean;
    selectedTaskIds?: Set<string>;
    onToggleSelectTask?: (taskId: string) => void;
    onLoadMore?: () => Promise<boolean>;
    hasMore?: boolean;
    isLoadingMore?: boolean;
}

export default function VersionSection({
    version,
    tasks,
    onAddTask,
    onToggleDone,
    onUpdateTask,
    onDeleteTask,
    onOpenTask,
    onGenerateChangelog,
    onDeleteVersion,
    onSetActiveVersion,
    onUpdateVersion,
    isUnassigned = false,
    isSelectionMode = false,
    selectedTaskIds = new Set(),
    onToggleSelectTask = () => { },
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
}: VersionSectionProps) {
    const [newTaskContent, setNewTaskContent] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(version.name);
    const menuRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { setNodeRef } = useDroppable({
        id: version.id,
    });

    // Focus name input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    // Intersection Observer for lazy loading
    const handleLoadMore = useCallback(async () => {
        if (onLoadMore && hasMore && !isLoadingMore) {
            await onLoadMore();
        }
    }, [onLoadMore, hasMore, isLoadingMore]);

    useEffect(() => {
        if (!loadMoreRef.current || !hasMore || !onLoadMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    handleLoadMore();
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, onLoadMore, handleLoadMore]);

    const handleAddTask = () => {
        if (newTaskContent.trim()) {
            onAddTask(newTaskContent.trim());
            setNewTaskContent('');
        }
    };

    const handleSaveName = () => {
        if (editName.trim() && editName !== version.name && onUpdateVersion) {
            onUpdateVersion(version.id, { name: editName.trim() });
        } else {
            setEditName(version.name);
        }
        setIsEditingName(false);
    };

    const handleKeyDownName = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveName();
        if (e.key === 'Escape') {
            setEditName(version.name);
            setIsEditingName(false);
        }
    };

    // Sort already handled by parent hook, but re-sort locally if needed for done status
    const sortedTasks = [...tasks];

    const doneCount = tasks.filter(t => t.isDone).length;
    const totalCount = tasks.length;
    // const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const borderColor = isUnassigned
        ? 'border-l-amber-500'
        : version.isActive
            ? 'border-l-emerald-500'
            : 'border-l-slate-400';

    return (
        <div className={`bg-white dark:bg-slate-900 border border-l-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${borderColor} ${isUnassigned ? 'border-amber-200 dark:border-amber-900/50' : version.isActive ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
            {/* Header */}
            <div
                className={`w-full px-4 py-1.5 transition-colors relative ${isUnassigned ? 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20' : version.isActive ? 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
            >
                {/* Main Header Row */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        {isEditingName ? (
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={handleKeyDownName}
                                className="font-mono font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span
                                className={`font-mono font-semibold truncate block text-xs ${isUnassigned ? 'text-amber-700 dark:text-amber-500' : version.isActive ? 'text-emerald-700 dark:text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}
                                onDoubleClick={() => {
                                    if (!isUnassigned && onUpdateVersion) setIsEditingName(true);
                                }}
                                title={!isUnassigned && onUpdateVersion ? "Double click to rename" : ""}
                            >
                                {version.name}
                            </span>
                        )}
                    </div>

                    {/* Menu Button (Always visible on right for Board, or desktop List) */}
                    <div className="shrink-0 relative" ref={menuRef}>
                        {!isUnassigned && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                        {!version.isActive && onSetActiveVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSetActiveVersion(version.id); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"
                                            >
                                                <Rocket className="w-4 h-4" /> Set as Active
                                            </button>
                                        )}
                                        {onGenerateChangelog && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onGenerateChangelog(); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-xs font-medium text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" /> View Changelog
                                            </button>
                                        )}
                                        {onUpdateVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                            >
                                                <Pencil className="w-4 h-4" /> Rename Version
                                            </button>
                                        )}
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                        {onDeleteVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete version?')) onDeleteVersion(version.id); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete Version
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Meta Row (Badges, Date) */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-2">
                        {version.isActive && !isUnassigned && (
                            <span className="px-1.5 py-0 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full uppercase tracking-wide">Active</span>
                        )}
                        {!version.isActive && !isUnassigned && (
                            <span className="px-1.5 py-0 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full uppercase tracking-wide">Released</span>
                        )}
                        {isUnassigned && (
                            <span className="px-1.5 py-0 text-[9px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full uppercase tracking-wide">Backlog</span>
                        )}

                        {!isUnassigned && (
                            <span className="px-1.5 py-0 text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-white/50 dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-800" title={new Date(version.createdAt).toLocaleString()}>
                                {new Date(version.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                        )}
                    </div>

                    {/* Task count */}
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{doneCount}/{totalCount}</span>
                </div>
            </div>

            {/* Task Table - Always visible */}
            <div ref={setNodeRef} className="border-t border-slate-100 dark:border-slate-800 min-h-[50px]">
                {sortedTasks.length > 0 ? (
                    <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div>
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
                    <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No tasks in this version
                    </div>
                )}

                {/* Load More Trigger & Indicator */}
                {hasMore && onLoadMore && (
                    <div ref={loadMoreRef} className="px-4 py-3 flex items-center justify-center border-t border-slate-100 dark:border-slate-800">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-transparent rounded-full animate-spin" />
                                Loading more tasks...
                            </div>
                        ) : (
                            <button
                                onClick={handleLoadMore}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                                Load more tasks
                            </button>
                        )}
                    </div>
                )}

                {/* Add Task Input */}
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <Plus className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                        data-add-task
                        type="text"
                        value={newTaskContent}
                        onChange={e => setNewTaskContent(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                        placeholder="Add task..."
                        className="flex-1 bg-transparent text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none dark:text-slate-200"
                    />
                    {newTaskContent && (
                        <button
                            onClick={handleAddTask}
                            className="px-3 py-1 text-xs font-semibold bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 transition-all shadow-sm"
                        >
                            Add Task
                        </button>
                    )}
                </div>
            </div>
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
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className="group/sortable flex relative bg-white dark:bg-slate-900">
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 absolute left-0 top-0 bottom-0 z-10 opacity-0 group-hover/sortable:opacity-100 transition-opacity"
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
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className={`group flex items-center gap-2 px-4 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>

            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="flex-shrink-0 mr-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer bg-white dark:bg-slate-800"
                    />
                </div>
            )}

            {!isSelectionMode && (
                <button
                    onClick={() => onToggleDone(task.id, !task.isDone)}
                    className={`
                        flex-shrink-0 flex items-center justify-center
                        w-7 h-7 -ml-1 rounded-md
                        transition-all duration-150 ease-out
                        active:scale-90
                        ${task.isDone
                            ? 'text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            : 'text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }
                    `}
                    title={task.isDone ? 'Mark as pending' : 'Mark as done'}
                >
                    {task.isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
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
                    className="flex-1 px-2 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
            ) : (
                <span
                    onDoubleClick={() => setIsEditing(true)}
                    className="flex-1 text-xs cursor-text text-slate-700 dark:text-slate-300 font-medium"
                >
                    {task.content}
                </span>
            )}

            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                {formatDate(task.doneAt || task.createdAt)}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onOpen(task)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 transition-all"
                    title="Open Details"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 transition-all"
                    title="Edit (E)"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(task.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 transition-all"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
