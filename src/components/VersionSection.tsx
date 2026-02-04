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
    onCreateSubtask?: (parentId: string, content: string) => void;
    onToggleDone: (taskId: string, isDone: boolean, activeVersionId?: string | null) => void;
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
}

export default function VersionSection({
    version,
    tasks,
    onAddTask,
    onCreateSubtask,
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
}: VersionSectionProps) {
    const [newTaskContent, setNewTaskContent] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(version.name);
    const menuRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

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

    // Filter only root tasks (parentId is null or undefined)
    const rootTasks = tasks.filter(t => !t.parentId);
    // Helper to get subtasks of a parent
    const getSubtasks = (parentId: string) => tasks.filter(t => t.parentId === parentId);

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
                className={`w-full px-5 py-3 transition-colors relative flex items-center gap-4 ${isUnassigned ? 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20' : version.isActive ? 'bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' : 'bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
            >
                {/* 1. Drag Handle / Status Indicator (Left most) */}

                {/* 2. Main Title Column */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-0.5">
                        {isEditingName ? (
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={handleKeyDownName}
                                className="font-semibold text-base text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span
                                className={`font-semibold text-sm truncate cursor-pointer hover:underline decoration-slate-300 underline-offset-2 ${isUnassigned ? 'text-amber-700 dark:text-amber-500' : version.isActive ? 'text-emerald-700 dark:text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}
                                onDoubleClick={() => {
                                    if (!isUnassigned && onUpdateVersion) setIsEditingName(true);
                                }}
                                title={!isUnassigned && onUpdateVersion ? "Double click to rename" : ""}
                            >
                                {version.name}
                            </span>
                        )}

                        {/* Status Badges - Inline with title for better scanability */}
                        {version.isActive && !isUnassigned && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-md uppercase tracking-wide ring-1 ring-emerald-500/20">Active</span>
                        )}
                        {!version.isActive && !isUnassigned && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md uppercase tracking-wide ring-1 ring-slate-500/10">Released</span>
                        )}
                        {isUnassigned && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-md uppercase tracking-wide ring-1 ring-amber-500/20">Backlog</span>
                        )}
                    </div>

                    {/* Sub-meta row */}
                    {!isUnassigned && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <span>Created {new Date(version.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                    )}
                </div>

                {/* 3. Metrics & Actions Column (Right aligned) */}
                <div className="flex items-center gap-6 shrink-0">
                    {/* Progress/Count */}
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{doneCount}/{totalCount}</div>
                        </div>
                        {/* Simple circular progress or just text is fine, keeping text for now mostly */}
                        <div className={`w-1.5 h-1.5 rounded-full ${doneCount === totalCount && totalCount > 0 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    </div>

                    {/* Menu Button */}
                    <div className="relative flex items-center" ref={menuRef}>
                        {!isUnassigned && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                        {!version.isActive && onSetActiveVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSetActiveVersion(version.id); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"
                                            >
                                                <Rocket className="w-4 h-4" /> Set as Active
                                            </button>
                                        )}
                                        {onGenerateChangelog && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onGenerateChangelog(); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" /> View Changelog
                                            </button>
                                        )}
                                        {onUpdateVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                            >
                                                <Pencil className="w-4 h-4" /> Rename Version
                                            </button>
                                        )}
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                        {onDeleteVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete version?')) onDeleteVersion(version.id); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
            </div>

            {/* Task Table - Always visible */}
            <div ref={setNodeRef} className="border-t border-slate-100 dark:border-slate-800/60 min-h-[50px] bg-white dark:bg-slate-900/50">
                {rootTasks.length > 0 ? (
                    <SortableContext items={rootTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {rootTasks.map(task => (
                                <div key={task.id}>
                                    <SortableTaskRow
                                        task={task}
                                        onToggleDone={onToggleDone}
                                        onUpdate={onUpdateTask}
                                        onDelete={onDeleteTask}
                                        onOpen={onOpenTask}
                                        onCreateSubtask={onCreateSubtask}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedTaskIds.has(task.id)}
                                        onToggleSelect={() => onToggleSelectTask(task.id)}
                                        depth={0}
                                    />
                                    {/* Render subtasks */}
                                    {getSubtasks(task.id).map(subtask => (
                                        <SortableTaskRow
                                            key={subtask.id}
                                            task={subtask}
                                            onToggleDone={onToggleDone}
                                            onUpdate={onUpdateTask}
                                            onDelete={onDeleteTask}
                                            onOpen={onOpenTask}
                                            onCreateSubtask={onCreateSubtask}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedTaskIds.has(subtask.id)}
                                            onToggleSelect={() => onToggleSelectTask(subtask.id)}
                                            depth={1}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                ) : (
                    <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No tasks in this version
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
    onToggleDone: (taskId: string, isDone: boolean, activeVersionId?: string | null) => void;
    onUpdate: (taskId: string, content: string) => void;
    onDelete: (taskId: string) => void;
    onOpen: (task: Task) => void;
    onCreateSubtask?: (parentId: string, content: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    depth?: number;
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

function TaskRow({ task, onToggleDone, onUpdate, onDelete, onOpen, onCreateSubtask, isSelectionMode, isSelected, onToggleSelect, depth = 0 }: TaskRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [newSubtaskContent, setNewSubtaskContent] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const subtaskInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (isAddingSubtask && subtaskInputRef.current) {
            subtaskInputRef.current.focus();
        }
    }, [isAddingSubtask]);

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

    const handleAddSubtask = () => {
        if (newSubtaskContent.trim() && onCreateSubtask) {
            onCreateSubtask(task.id, newSubtaskContent.trim());
            setNewSubtaskContent('');
            setIsAddingSubtask(false);
        }
    };

    const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddSubtask();
        if (e.key === 'Escape') {
            setNewSubtaskContent('');
            setIsAddingSubtask(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const indentStyle = { paddingLeft: `${depth * 28}px` };

    return (
        <>
            <div style={indentStyle} className={`group flex items-center min-h-[40px] px-5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${depth > 0 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>

                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <div className="flex-shrink-0 mr-3">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelect}
                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 cursor-pointer bg-white dark:bg-slate-800"
                        />
                    </div>
                )}

                {!isSelectionMode && (
                    <button
                        onClick={() => onToggleDone(task.id, !task.isDone)}
                        className={`
                        flex-shrink-0 flex items-center justify-center
                        w-6 h-6 -ml-1 rounded-full
                        transition-all duration-200 ease-out border
                        active:scale-95
                        ${task.isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'bg-transparent border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500 hover:text-emerald-500/20'
                            }
                    `}
                        title={task.isDone ? 'Mark as pending' : 'Mark as done'}
                    >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${task.isDone ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
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
                        className="flex-1 px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                ) : (
                    <span
                        onDoubleClick={() => setIsEditing(true)}
                        className={`flex-1 text-sm cursor-text transition-colors mx-3 select-text
                            ${task.isDone ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100 font-medium'}
                            `}
                    >
                        {task.content}
                    </span>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono mr-2 hidden sm:block">
                        {formatDate(task.doneAt || task.createdAt)}
                    </span>

                    {/* Add Subtask button - only for parent tasks (depth 0) */}
                    {depth === 0 && onCreateSubtask && (
                        <button
                            onClick={() => setIsAddingSubtask(true)}
                            className="flex items-center justify-center w-7 h-7 rounded text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                            title="Add Subtask"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onOpen(task)}
                        className="flex items-center justify-center w-7 h-7 rounded text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        title="Open Details"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center w-7 h-7 rounded text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        title="Edit (E)"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="flex items-center justify-center w-7 h-7 rounded text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {/* Subtask input row */}
            {isAddingSubtask && (
                <div style={{ paddingLeft: `${(depth + 1) * 24}px` }} className="flex items-center gap-2 px-4 py-1 bg-green-50/50 dark:bg-green-900/10 border-l-2 border-green-400 dark:border-green-600">
                    <Plus className="w-4 h-4 text-green-600 dark:text-green-500" />
                    <input
                        ref={subtaskInputRef}
                        type="text"
                        value={newSubtaskContent}
                        onChange={e => setNewSubtaskContent(e.target.value)}
                        onKeyDown={handleSubtaskKeyDown}
                        onBlur={() => {
                            if (!newSubtaskContent.trim()) setIsAddingSubtask(false);
                        }}
                        placeholder="Add subtask..."
                        className="flex-1 bg-white dark:bg-slate-900 border border-green-300 dark:border-green-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-100"
                    />
                    {newSubtaskContent && (
                        <button
                            onClick={handleAddSubtask}
                            className="px-2 py-1 text-xs font-semibold bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600"
                        >
                            Add
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
