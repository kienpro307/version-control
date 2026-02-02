'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, ChevronDown, Plus, Search, Command, Menu, CheckSquare, X, Clock } from 'lucide-react';
import VersionSection from '@/components/VersionSection';
import CreateVersionModal from '@/components/CreateVersionModal';
import CommandPalette from '@/components/CommandPalette';
import TaskDrawer from '@/components/TaskDrawer';
import Sidebar from '@/components/Sidebar';
import ChangelogModal from '@/components/ChangelogModal';
import ActivityDrawer from '@/components/ActivityDrawer';
import {
  useProjects,
  useVersions,
  useTasks,
  useSettings,
  useActivities
} from '@/hooks';
import type { Task, Version } from '@/lib/types';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export default function Home() {
  // --- Supabase Hooks ---
  const { projects, createProject: apiCreateProject, updateProject: apiUpdateProject, deleteProject: apiDeleteProject, loading: projectsLoading } = useProjects();
  const { settings, updateLastProject: apiUpdateLastProject } = useSettings();

  // Local state for selection (though we try to sync with stats/settings)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Hooks dependent on selectedProjectId
  const {
    versions,
    createVersion: apiCreateVersion,
    updateVersion: apiUpdateVersion,
    deleteVersion: apiDeleteVersion,
    setActiveVersion: apiSetActiveVersion,
    loading: versionsLoading
  } = useVersions(selectedProjectId || null);
  const {
    tasks,
    createTask: apiCreateTask,
    toggleDone: apiToggleDone,
    updateTask: apiUpdateTask,
    deleteTask: apiDeleteTask,
    reorderTask: apiReorderTask,
    moveTask: apiMoveTask,
    updateTaskDetails: apiUpdateTaskDetails,
  } = useTasks(selectedProjectId || null);
  const { activities, loading: activitiesLoading } = useActivities(selectedProjectId || null);

  // --- UI State ---
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [activeDragTaskId, setActiveDragTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [changelogVersion, setChangelogVersion] = useState<Version | null>(null);

  // Bulk Actions State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // --- Dnd Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 }, // Slight delay to prevent accidents
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Effects ---

  // 1. Auto-select project logic (Load from settings or default to first)
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      if (settings.lastProjectId && projects.some(p => p.id === settings.lastProjectId)) {
        setSelectedProjectId(settings.lastProjectId);
      } else {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [projects, selectedProjectId, settings]);

  // 2. Persist selection to Settings (Supabase)
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== settings.lastProjectId) {
      apiUpdateLastProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  // 3. Auto-expand active versions
  useEffect(() => {
    const activeVersionIds = versions
      .filter(v => v.isActive)
      .map(v => v.id);
    setExpandedVersions(new Set([...activeVersionIds, 'unassigned']));
  }, [versions, selectedProjectId]); // Re-run when versions change (e.g. after fetch)

  // 4. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('[data-add-task]')?.focus();
          break;
        case 'v':
          e.preventDefault();
          setShowVersionModal(true);
          break;
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="Search"]')?.focus();
          break;
        case 'k':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="Search"]')?.focus();
          }
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(prev => !prev);
          break;
        case 'escape':
          setShowProjectDropdown(false);
          setShowCommandPalette(false);
          setShowShortcuts(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Derived Data ---

  // Filtered Versions (already sorted by hook, but double check sort if needed)
  const filteredVersions = useMemo(() => {
    // Hooks return data for selectedProjectId, so just sort
    return [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [versions]);

  const tasksByVersion = useMemo(() => {
    const grouped: Record<string, Task[]> = { unassigned: [] };
    filteredVersions.forEach(v => { grouped[v.id] = []; });

    tasks.forEach(task => {
      if (task.versionId && grouped[task.versionId]) {
        grouped[task.versionId].push(task);
      } else {
        grouped.unassigned.push(task);
      }
    });
    return grouped;
  }, [tasks, filteredVersions]);

  // Search filtering
  const displayVersions = useMemo(() => {
    if (!searchQuery.trim()) return filteredVersions;

    const searchLower = searchQuery.toLowerCase();
    const matchingTaskIds = new Set(
      tasks
        .filter(t => t.content.toLowerCase().includes(searchLower))
        .map(t => t.id)
    );

    return filteredVersions.filter(v => {
      const versionTasks = tasksByVersion[v.id] || [];
      return versionTasks.some(t => matchingTaskIds.has(t.id));
    });
  }, [filteredVersions, tasks, searchQuery, tasksByVersion]);

  // Auto-expand on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const allVersionIds = displayVersions.map(v => v.id);
      setExpandedVersions(new Set([...allVersionIds, 'unassigned']));
    }
  }, [searchQuery, displayVersions]);

  // const selectedProject = projects.find(p => p.id === selectedProjectId); // Moved down

  // Stats
  const stats = useMemo(() => {
    // Tasks from hook are already filtered by selectedProjectId
    const pending = tasks.filter(t => !t.isDone).length;
    const done = tasks.filter(t => t.isDone).length;

    // "Released" = completed tasks in INACTIVE versions
    const inactiveVersionIds = new Set(
      versions.filter(v => !v.isActive).map(v => v.id)
    );
    const released = tasks.filter(
      t => t.isDone && t.versionId && inactiveVersionIds.has(t.versionId)
    ).length;

    return { pending, done, released };
  }, [tasks, versions]);

  // --- Actions ---

  const toggleVersion = (versionId: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(versionId)) next.delete(versionId);
      else next.add(versionId);
      return next;
    });
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setShowProjectDropdown(false);
  };

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      const newProject = await apiCreateProject(newProjectName.trim());
      if (newProject) {
        setSelectedProjectId(newProject.id);
        setNewProjectName('');
        setShowAddProject(false);
        setShowProjectDropdown(false);
      }
    }
  };

  const handleAddTask = async (content: string, versionId: string | null) => {
    await apiCreateTask(content, versionId); // Hook handles SetTasks
  };

  const handleCreateVersion = async (name: string, migratePending: boolean) => {
    const newVersion = await apiCreateVersion(name, migratePending);
    if (newVersion) {
      setExpandedVersions(prev => new Set([...prev, newVersion.id]));
      setShowVersionModal(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      projects,
      versions,
      tasks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-version-manager-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Commands
  const commands = [
    { id: 'add-task', label: 'Add Task', shortcut: 'N', action: () => document.querySelector<HTMLInputElement>('[data-add-task]')?.focus() },
    { id: 'add-version', label: 'Create Version', shortcut: 'V', action: () => setShowVersionModal(true) },
    { id: 'export', label: 'Export JSON', shortcut: 'Ctrl+E', action: handleExport },
    { id: 'shortcuts', label: 'Show Shortcuts', shortcut: '?', action: () => setShowShortcuts(true) },
  ];

  // --- Dnd Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragTaskId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Find task objects
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    if (!activeTask || !overTask) return;

    if (activeTask.versionId !== overTask.versionId) {
      // Moving to different version
      // We use MoveTask to update local state optimistically
      // Logic: activeTask.versionId = overTask.versionId
      // Dnd-kit logic:
      // We need to insert it into the new list.
      // For visual, we just change the versionId.
      // We rely on 'moveTask' hook

      // Logic: activeTask.versionId = overTask.versionId
      // Dnd-kit logic:
      // We need to insert it into the new list.
      // For visual, we just change the versionId.
      // We rely on 'moveTask' hook

      apiMoveTask(activeTask.id, 0, overTask.versionId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTaskId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    if (activeTask && overTask && activeTask.id !== overTask.id) {
      if (activeTask.versionId === overTask.versionId) {
        apiReorderTask(activeTask.id, overTask.position, activeTask.versionId);
        apiReorderTask(overTask.id, activeTask.position, overTask.versionId);
      } else {
        apiReorderTask(activeTask.id, overTask.position + 1, overTask.versionId);
      }
    }
  };

  // Bulk Actions Handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedTaskIds.size} tasks?`)) {
      for (const id of Array.from(selectedTaskIds)) {
        await apiDeleteTask(id);
      }
      clearSelection();
    }
  };

  const handleBulkToggleDone = async (isDone: boolean) => {
    for (const id of Array.from(selectedTaskIds)) {
      await apiToggleDone(id, isDone);
    }
    clearSelection();
  };

  const handleReleaseVersion = async () => {
    if (changelogVersion && apiUpdateVersion) {
      await apiUpdateVersion(changelogVersion.id, { isActive: false });
      setChangelogVersion(null);
    }
  };

  // --- Render ---

  if (projectsLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">

      {/* Sidebar */}
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={apiCreateProject}
        onUpdateProject={apiUpdateProject}
        onDeleteProject={apiDeleteProject}
        onOpenActivity={() => setShowActivityDrawer(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">

        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-200">
          <div className="max-w-5xl mx-auto px-4 py-3 h-16 flex items-center justify-between">
            {/* Left: Breadcrumb / Project Name */}
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                  {selectedProject?.name.charAt(0) || 'P'}
                </div>
                <h1 className="font-bold text-slate-800 text-lg sm:text-xl truncate max-w-[150px] sm:max-w-xs transition-all">
                  {selectedProject?.name || 'Select Project'}
                </h1>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3 ml-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-xl relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-10 py-2 bg-slate-100 border-none rounded-lg text-sm text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
                    <span className="text-xs">/</span>
                  </kbd>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm hover:shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Version</span>
                </button>
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="sm:hidden flex items-center justify-center w-9 h-9 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1" />

                <button
                  onClick={() => setShowActivityDrawer(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Activity Log"
                >
                  <Clock className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowShortcuts(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Shortcuts (?)"
                >
                  <Command className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Stats Ribbon */}
          {!searchQuery && (
            <div className="flex items-center gap-8 mb-8 px-1">
              <div className="flex items-baseline gap-2.5 group cursor-default">
                <span className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors">{stats.pending}</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-amber-600/80 transition-colors">pending</span>
              </div>
              <div className="h-8 w-px bg-slate-200/60" />
              <div className="flex items-baseline gap-2.5 group cursor-default">
                <span className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors">{stats.done}</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-emerald-600/80 transition-colors">completed</span>
              </div>
              <div className="h-8 w-px bg-slate-200/60" />
              <div className="flex items-baseline gap-2.5 group cursor-default">
                <span className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{stats.released}</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-blue-600/80 transition-colors">released</span>
              </div>
            </div>
          )}

          {/* Search Results Header */}
          {searchQuery && (
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">
                Search results for "{searchQuery}"
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Clear search
              </button>
            </div>
          )}

          {/* View Toggle & Content */}
          <div className="flex items-center justify-end mb-4 px-1">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Board
              </button>
            </div>
          </div>

          {/* Version Sections */}
          <div className={viewMode === 'board' ? "flex gap-4 overflow-x-auto pb-4 items-start h-[calc(100vh-250px)]" : "space-y-4"}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {displayVersions.length === 0 && tasksByVersion.unassigned.length === 0 && !versionsLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                  <div className="relative mb-8 group cursor-pointer" onClick={() => setShowVersionModal(true)}>
                    <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                    <div className="relative w-24 h-24 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl flex items-center justify-center border border-white/60 transform group-hover:-translate-y-2 transition-transform duration-300">
                      <Package className="w-10 h-10 text-emerald-600/80 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -right-4 -bottom-2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-50 transform rotate-12 group-hover:rotate-6 transition-transform duration-300 delay-75">
                      <div className="w-6 h-1.5 bg-slate-100 rounded-full" />
                    </div>
                    <div className="absolute -left-3 -top-2 w-8 h-8 bg-emerald-50 rounded-lg shadow-md flex items-center justify-center transform -rotate-6 group-hover:-rotate-12 transition-transform duration-300 delay-100">
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-3">No versions found</h3>
                  <p className="text-slate-500 max-w-sm mb-8 leading-relaxed text-sm">
                    Create your first version to start tracking tasks and releases for <span className="font-semibold text-slate-700">{selectedProject?.name}</span>.
                  </p>

                  {!searchQuery && (
                    <button
                      onClick={() => setShowVersionModal(true)}
                      className="group relative px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Create Version
                      </span>
                    </button>
                  )}
                </div>
              )}

              {displayVersions.map(version => (
                <div key={version.id} className={viewMode === 'board' ? "min-w-[320px] max-w-[320px] flex-shrink-0" : ""}>
                  <VersionSection
                    version={version}
                    tasks={tasksByVersion[version.id]?.filter(t => !searchQuery || t.content.toLowerCase().includes(searchQuery.toLowerCase())) || []}
                    isExpanded={viewMode === 'board' ? true : expandedVersions.has(version.id)}
                    onToggle={() => toggleVersion(version.id)}
                    onAddTask={(content: string) => handleAddTask(content, version.id)}
                    onToggleDone={apiToggleDone}
                    onUpdateTask={apiUpdateTask}
                    onDeleteTask={apiDeleteTask}
                    onOpenTask={task => setSelectedTask(task)}
                    onGenerateChangelog={() => setChangelogVersion(version)}
                    onDeleteVersion={apiDeleteVersion}
                    onSetActiveVersion={apiSetActiveVersion}
                    onUpdateVersion={apiUpdateVersion}
                    isSelectionMode={isSelectionMode}
                    selectedTaskIds={selectedTaskIds}
                    onToggleSelectTask={toggleTaskSelection}
                  />
                </div>
              ))}

              {/* Unassigned Section */}
              {tasksByVersion.unassigned.length > 0 && (
                (!searchQuery || tasksByVersion.unassigned.some(t => t.content.toLowerCase().includes(searchQuery.toLowerCase()))) && (
                  <div className={viewMode === 'board' ? "min-w-[320px] max-w-[320px] flex-shrink-0" : ""}>
                    <VersionSection
                      version={{ id: 'unassigned', projectId: selectedProjectId, name: 'Unassigned', isActive: false, createdAt: '' }}
                      tasks={tasksByVersion.unassigned.filter(t => !searchQuery || t.content.toLowerCase().includes(searchQuery.toLowerCase()))}
                      isExpanded={viewMode === 'board' ? true : expandedVersions.has('unassigned')}
                      onToggle={() => toggleVersion('unassigned')}
                      onAddTask={(content: string) => handleAddTask(content, null)}
                      onToggleDone={apiToggleDone}
                      onUpdateTask={apiUpdateTask}
                      onDeleteTask={apiDeleteTask}
                      onOpenTask={task => setSelectedTask(task)}
                      isUnassigned
                      isSelectionMode={isSelectionMode}
                      selectedTaskIds={selectedTaskIds}
                      onToggleSelectTask={toggleTaskSelection}
                    />
                  </div>
                )
              )}
            </DndContext>
          </div>

          {/* Keyboard Hints (Footer) */}
          {!searchQuery && (
            <div className="mt-12 pt-8 border-t border-slate-200/60 flex justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors cursor-help" title="Press N">
                <kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">N</kbd>
                New Task
              </span>
              <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors cursor-help" title="Press V">
                <kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">V</kbd>
                New Version
              </span>
              <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors cursor-help" title="Press /">
                <kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">/</kbd>
                Search
              </span>
              <span className="flex items-center gap-1.5 hover:text-slate-600 transition-colors cursor-help" title="Press ?">
                <kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">?</kbd>
                Shortcuts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showVersionModal && (
        <CreateVersionModal
          onClose={() => setShowVersionModal(false)}
          onCreate={handleCreateVersion}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          commands={commands}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showProjectDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowProjectDropdown(false); setShowAddProject(false); }} />
      )}

      {/* Task Drawer */}
      <TaskDrawer
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={async (id, updates) => {
          await apiUpdateTaskDetails(id, updates);
          setSelectedTask(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
        }}
      />

      <ActivityDrawer
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
        activities={activities}
        loading={activitiesLoading}
      />

      {/* Changelog Modal */}
      {changelogVersion && (
        <ChangelogModal
          version={changelogVersion}
          tasks={tasksByVersion[changelogVersion.id] || []}
          onClose={() => setChangelogVersion(null)}
          onRelease={handleReleaseVersion}
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:ml-32 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="text-sm font-semibold flex items-center gap-2">
            <div className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedTaskIds.size}
            </div>
            Selected
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkToggleDone(true)} className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-sm transition-colors">Mark Done</button>
            <button onClick={() => handleBulkToggleDone(false)} className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-sm transition-colors">Mark Pending</button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 hover:bg-red-900/50 text-red-200 hover:text-red-100 rounded-lg text-sm transition-colors">Delete</button>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <button onClick={clearSelection} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-800 mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          {[
            ['N', 'Add new task'],
            ['V', 'Create version'],
            ['/', 'Open command palette'],
            ['?', 'Toggle shortcuts'],
            ['/', 'Focus search'],
            ['E / Enter', 'Edit task'],
            ['Delete', 'Delete task'],
            ['Esc', 'Close / Cancel'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-slate-600">{desc}</span>
              <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
