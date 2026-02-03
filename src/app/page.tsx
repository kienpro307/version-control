'use client';

import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Search, Command, Menu, CheckSquare, X, Clock, Brain } from 'lucide-react';
import VersionSection from '@/components/VersionSection';
import CreateVersionModal from '@/components/CreateVersionModal';
import CommandPalette from '@/components/CommandPalette';
import TaskDrawer from '@/components/TaskDrawer';
import Sidebar from '@/components/Sidebar';
import ChangelogModal from '@/components/ChangelogModal';
import ActivityDrawer from '@/components/ActivityDrawer';
import ContextDumpModal from '@/components/ContextDumpModal';
import ContextBanner from '@/components/ContextBanner';
import WorkflowPanel from '@/components/WorkflowPanel';
import AICommandBar from '@/components/AICommandBar';
import {
  useProjects,
  useVersions,
  useTasks,
  useSettings,
  useActivities,
  useContextDumps,
  useAILogs
} from '@/hooks';
import { parseAICommand } from '@/lib/commandParser';
import { executeCommand } from '@/lib/commandExecutor';
import { supabase } from '@/lib/supabase';
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
  const { projects, createProject: apiCreateProject, updateProject: apiUpdateProject, deleteProject: apiDeleteProject, renameFolder: apiRenameFolder, updateProjectLocalPath, loading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { settings, updateLastProject: apiUpdateLastProject } = useSettings();

  // Local state for selection (though we try to sync with stats/settings)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(256);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarWidth');
    if (saved) {
      const w = Number(saved);
      if (!isNaN(w) && w >= 200 && w <= 600) setSidebarWidth(w);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Hooks dependent on selectedProjectId
  const {
    versions,
    createVersion: apiCreateVersion,
    updateVersion: apiUpdateVersion,
    deleteVersion: apiDeleteVersion,
    setActiveVersion: apiSetActiveVersion,
    loading: versionsLoading,
    hasMore: hasMoreVersions,
    loadMore: loadMoreVersions,
    isValidating: versionsValidating,
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
    loadMoreTasks,
    getVersionPaginationState,
  } = useTasks(selectedProjectId || null);
  const { activities, loading: activitiesLoading, updateActivity } = useActivities(selectedProjectId || null);
  const { logs: aiLogs, loading: aiLogsLoading, logAICommand } = useAILogs();
  const { latestDump, createContextDump, markAsRead, getUnreadDump } = useContextDumps(selectedProjectId || null);

  // --- UI State ---
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragTaskId, setActiveDragTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [changelogVersion, setChangelogVersion] = useState<Version | null>(null);
  const [showContextDumpModal, setShowContextDumpModal] = useState(false);
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);
  const [showAICommandBar, setShowAICommandBar] = useState(false);
  const [workflowLocation, setWorkflowLocation] = useState<'office' | 'home'>('office');

  // Bulk Actions State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // --- Dnd Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 }, // Slight delay to prevent accidents
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // eslint-disable-line @typescript-eslint/no-explicit-any
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
            setShowAICommandBar(prev => !prev);
          }
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(prev => !prev);
          break;
        case 'escape':
          setShowProjectDropdown(false);
          setShowCommandPalette(false);
          setShowAICommandBar(false);
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



  const handleAddTask = async (content: string, versionId: string | null) => {
    await apiCreateTask(content, versionId); // Hook handles SetTasks
  };

  const handleCreateVersion = async (name: string, migratePending: boolean) => {
    const newVersion = await apiCreateVersion(name, migratePending);
    if (newVersion) {
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
    { id: 'agent-dump', label: 'Agent: Context Dump', shortcut: '/agent', action: () => setShowContextDumpModal(true) },
    { id: 'ai-command', label: 'AI Command Bar', shortcut: 'Cmd+K', action: () => setShowAICommandBar(true) },
  ];
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragTaskId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Find task objects
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    // Check if over is a container (Version ID)
    const isOverContainer = versions.some(v => v.id === over.id) || over.id === 'unassigned';
    const overVersionId = isOverContainer ? over.id as string : null;

    if (!activeTask) return;

    // Case 1: Over another Task
    if (overTask) {
      if (activeTask.versionId !== overTask.versionId) {
        // Moving to different version
        apiMoveTask(activeTask.id, 0, overTask.versionId);
      }
    }
    // Case 2: Over a Version Container (Empty column drop)
    else if (overVersionId) {
      if (activeTask.versionId !== overVersionId) {
        apiMoveTask(activeTask.id, 0, overVersionId);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTaskId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    const isOverContainer = versions.some(v => v.id === over.id) || over.id === 'unassigned';
    const overVersionId = isOverContainer ? over.id as string : null;

    if (activeTask) {
      if (overTask && activeTask.id !== overTask.id) {
        if (activeTask.versionId === overTask.versionId) {
          apiReorderTask(activeTask.id, overTask.position, activeTask.versionId);
          apiReorderTask(overTask.id, activeTask.position, overTask.versionId);
        } else {
          apiReorderTask(activeTask.id, overTask.position + 1, overTask.versionId);
        }
      } else if (overVersionId) {
        // Dropped on container
        if (activeTask.versionId !== overVersionId) {
          // Append to end
          const tasksInVersion = tasks.filter(t => t.versionId === overVersionId);
          const newPos = tasksInVersion.length > 0 ? Math.max(...tasksInVersion.map(t => t.position)) + 1 : 0;
          apiReorderTask(activeTask.id, newPos, overVersionId);
        }
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

  const handleAIExecute = async (input: string) => {
    const command = parseAICommand(input);
    const startTime = performance.now();

    // Execute
    const result = await executeCommand(command, supabase);
    const endTime = performance.now();

    // Log
    await logAICommand(
      input,
      command.action,
      result,
      result.success ? 'success' : 'failure',
      endTime - startTime
    );

    if (result.success) {
      if (command.action === 'update_progress') {
        refetchProjects();
      }
      // Assuming commandExecutor handles data updates, we might need more granular refetching here
      // For now, simpler is better.
    } else {
      throw new Error(result.message);
    }
  };

  // --- Render ---

  if (projectsLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 selection:bg-green-100 dark:selection:bg-green-900 selection:text-green-900 dark:selection:text-green-100">

      {/* Sidebar */}
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={apiCreateProject}
        onUpdateProject={apiUpdateProject}
        onDeleteProject={apiDeleteProject}
        onRenameFolder={apiRenameFolder}
        onOpenActivity={() => setShowActivityDrawer(true)}
        onOpenWorkflow={() => {
          setWorkflowLocation('office');
          setShowWorkflowPanel(true);
        }}
        onSetLocalPath={async (projectId, currentPath) => {
          const newPath = window.prompt('Set local path for project:', currentPath || '');
          if (newPath !== null && newPath !== currentPath) {
            await updateProjectLocalPath(projectId, newPath);
          }
        }}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />


      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col lg:pl-[var(--sidebar-width)] transition-all duration-75 ease-out"
        style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
      >

        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200">
          <AICommandBar
            isOpen={showAICommandBar}
            onClose={() => setShowAICommandBar(false)}
            onExecute={handleAIExecute}
          />
          <div className="max-w-5xl mx-auto px-4 py-3 h-16 flex items-center justify-between">
            {/* Left: Breadcrumb / Project Name */}
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold">
                  {selectedProject?.name.charAt(0) || 'P'}
                </div>
                <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg sm:text-xl truncate max-w-[150px] sm:max-w-xs transition-all">
                  {selectedProject?.name || 'Select Project'}
                </h1>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3 ml-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-xl relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-10 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-slate-400"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 opacity-100">
                    <span className="text-xs">/</span>
                  </kbd>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm hover:shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Version</span>
                </button>
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="sm:hidden flex items-center justify-center w-9 h-9 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1" />

                <button
                  onClick={() => setShowContextDumpModal(true)}
                  className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  title="Context Dump"
                >
                  <Brain className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowActivityDrawer(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Activity Log"
                >
                  <Clock className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowShortcuts(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Shortcuts (?)"
                >
                  <Command className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Context Banner */}
        {getUnreadDump() && selectedProject && (
          <ContextBanner
            dump={getUnreadDump()!}
            onDismiss={() => markAsRead(getUnreadDump()!.id)}
            onContinue={() => {
              markAsRead(getUnreadDump()!.id);
              // Could open a modal or do something else here
            }}
          />
        )}

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Stats Ribbon */}
          {!searchQuery && (
            <div className="flex items-center gap-8 mb-8 px-1">
              <div className="flex items-baseline gap-2.5 group cursor-default">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-amber-600 transition-colors">{stats.pending}</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-amber-600/80 transition-colors">pending</span>
              </div>
              <div className="h-8 w-px bg-slate-200/60 dark:bg-slate-700/60" />
              <div className="flex items-baseline gap-2.5 group cursor-default">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-green-600 transition-colors">{stats.done}</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-green-600/80 transition-colors">completed</span>
              </div>
              <div className="h-8 w-px bg-slate-200/60 dark:bg-slate-700/60" />
              <div className="flex items-baseline gap-2.5 group cursor-default">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-blue-600 transition-colors">{stats.released}</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide group-hover:text-blue-600/80 transition-colors">released</span>
              </div>
            </div>
          )}

          {/* Search Results Header */}
          {searchQuery && (
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">
                Search results for &quot;{searchQuery}&quot;
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Version Sections */}
          <div className="space-y-2">
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
                    <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                    <div className="relative w-24 h-24 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl flex items-center justify-center border border-white/60 dark:border-slate-700 transform group-hover:-translate-y-2 transition-transform duration-300">
                      <Package className="w-10 h-10 text-green-600/80 group-hover:text-green-600 transition-colors" />
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -right-4 -bottom-2 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center border border-slate-50 dark:border-slate-700 transform rotate-12 group-hover:rotate-6 transition-transform duration-300 delay-75">
                      <div className="w-6 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full" />
                    </div>
                    <div className="absolute -left-3 -top-2 w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md flex items-center justify-center transform -rotate-6 group-hover:-rotate-12 transition-transform duration-300 delay-100">
                      <Plus className="w-4 h-4 text-green-400" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">No versions found</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed text-sm">
                    Create your first version to start tracking tasks and releases for <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedProject?.name}</span>.
                  </p>

                  {!searchQuery && (
                    <button
                      onClick={() => setShowVersionModal(true)}
                      className="group relative px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/30 hover:bg-green-700 active:scale-95 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Create Version
                      </span>
                    </button>
                  )}
                </div>
              )}

              {displayVersions.map(version => {
                const paginationState = getVersionPaginationState(version.id);
                return (
                  <div key={version.id}>
                    <VersionSection
                      version={version}
                      tasks={tasksByVersion[version.id]?.filter(t => !searchQuery || t.content.toLowerCase().includes(searchQuery.toLowerCase())) || []}
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
                      onLoadMore={() => loadMoreTasks(version.id)}
                      hasMore={paginationState.hasMore}
                      isLoadingMore={paginationState.loading}
                    />
                  </div>
                );
              })}

              {/* Unassigned Section */}
              {tasksByVersion.unassigned.length > 0 && (
                (!searchQuery || tasksByVersion.unassigned.some(t => t.content.toLowerCase().includes(searchQuery.toLowerCase()))) && (() => {
                  const paginationState = getVersionPaginationState(null);
                  return (
                    <div>
                      <VersionSection
                        version={{ id: 'unassigned', projectId: selectedProjectId, name: 'Unassigned', isActive: false, createdAt: '' }}
                        tasks={tasksByVersion.unassigned.filter(t => !searchQuery || t.content.toLowerCase().includes(searchQuery.toLowerCase()))}
                        onAddTask={(content: string) => handleAddTask(content, null)}
                        onToggleDone={apiToggleDone}
                        onUpdateTask={apiUpdateTask}
                        onDeleteTask={apiDeleteTask}
                        onOpenTask={task => setSelectedTask(task)}
                        isUnassigned
                        isSelectionMode={isSelectionMode}
                        selectedTaskIds={selectedTaskIds}
                        onToggleSelectTask={toggleTaskSelection}
                        onLoadMore={() => loadMoreTasks(null)}
                        hasMore={paginationState.hasMore}
                        isLoadingMore={paginationState.loading}
                      />
                    </div>
                  );
                })()
              )}
            </DndContext>

            {/* Load More Button */}
            {hasMoreVersions && !searchQuery && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreVersions}
                  disabled={versionsValidating}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {versionsValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more versions'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Keyboard Hints (Footer) */}
          {!searchQuery && (
            <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-help" title="Press N">
                <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">N</kbd>
                New Task
              </span>
              <span className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-help" title="Press V">
                <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">V</kbd>
                New Version
              </span>
              <span className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-help" title="Press /">
                <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">/</kbd>
                Search
              </span>
              <span className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-help" title="Press ?">
                <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 min-w-[20px] text-center shadow-[0_1px_0_rgba(0,0,0,0.1)]">?</kbd>
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
          contextData={{
            project: selectedProject,
            versions: versions,
            tasks: tasks,
            activities: activities,
            latestDump: latestDump
          }}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showProjectDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowProjectDropdown(false); }} />
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
        onUpdateActivity={updateActivity}
        aiLogs={aiLogs}
        aiLogsLoading={aiLogsLoading}
        onRunCommand={handleAIExecute}
      />

      {/* Changelog Modal */}
      {changelogVersion && (
        <ChangelogModal
          version={changelogVersion}
          tasks={tasksByVersion[changelogVersion.id] || []}
          onClose={() => setChangelogVersion(null)}
          onRelease={handleReleaseVersion}
          onSaveChangelog={async (changelog) => {
            const success = await apiUpdateVersion(changelogVersion.id, { changelog });
            return success;
          }}
        />
      )}

      {/* Context Dump Modal */}
      {showContextDumpModal && selectedProject && (
        <ContextDumpModal
          projectName={selectedProject.name}
          latestDump={latestDump}
          onSave={createContextDump}
          onClose={() => setShowContextDumpModal(false)}
        />
      )}

      {/* Workflow Panel */}
      <WorkflowPanel
        isOpen={showWorkflowPanel}
        onClose={() => setShowWorkflowPanel(false)}
        workspaceLocation={workflowLocation}
        projectName={selectedProject?.name}
        pendingTasksCount={tasks.filter(t => !t.isDone).length}
        completedTodayCount={tasks.filter(t => t.isDone && t.doneAt && new Date(t.doneAt).toDateString() === new Date().toDateString()).length}
        hasUnreadContextDump={latestDump ? !latestDump.is_read : false}
        lastActivityTime={activities[0]?.created_at ? new Date(activities[0].created_at).toLocaleTimeString() : undefined}
        onOpenContextDump={() => {
          setShowWorkflowPanel(false);
          setShowContextDumpModal(true);
        }}
        onOpenActivityLog={() => {
          setShowWorkflowPanel(false);
          setShowActivityDrawer(true);
        }}
        onMarkContextRead={() => latestDump && markAsRead(latestDump.id)}
      />

      {/* AI Command Bar */}
      <AICommandBar
        isOpen={showAICommandBar}
        onClose={() => setShowAICommandBar(false)}
        onExecute={async (command) => {
          console.log('[AI Command] Executing:', command);
          // Mock delay
          await new Promise(resolve => setTimeout(resolve, 1500));
        }}
      />

      {/* Floating Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:ml-32 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="text-sm font-semibold flex items-center gap-2">
            <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Keyboard Shortcuts</h3>
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
              <span className="text-slate-600 dark:text-slate-400">{desc}</span>
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-xs">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
