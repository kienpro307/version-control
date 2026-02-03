'use client';

import {
    Layers,
    Activity,
    Settings,
    Menu,
    X,
    Plus,
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    FileText,
    FolderPlus,
    FilePlus,
    Search,
    Pencil,
    Trash2,
    MoreHorizontal,
    Building2
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Project } from '@/lib/types';
import { createPortal } from 'react-dom';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';

interface SidebarProps {
    projects: Project[];
    selectedProjectId: string;
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string) => Promise<Project | null>;
    onUpdateProject: (id: string, name: string) => Promise<boolean>;
    onDeleteProject: (id: string) => Promise<boolean>;
    onRenameFolder: (oldPath: string, newPath: string) => Promise<boolean>;
    onOpenActivity: () => void;
    onOpenWorkflow?: () => void;
    onSetLocalPath?: (projectId: string, currentPath?: string) => void;
    width?: number;
    setWidth?: (w: number) => void;
}

type TreeNode = {
    id: string;
    name: string;
    fullPath: string;
    type: 'folder' | 'project';
    children: TreeNode[];
    projectId?: string;
    isPending?: boolean;
    progress?: number;
    taskCount?: number;
};

type ContextMenuState = {
    x: number;
    y: number;
    nodeType: 'root' | 'folder' | 'project';
    path: string;
    projectId?: string;
} | null;

export default function Sidebar({
    projects,
    selectedProjectId,
    onSelectProject,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    onRenameFolder,
    onOpenActivity,
    onOpenWorkflow,
    onSetLocalPath,
    width = 256,
    setWidth
}: SidebarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
    const [pendingFolders, setPendingFolders] = useState<string[]>([]);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing && setWidth) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth >= 200 && newWidth <= 600) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing, setWidth]
    );

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Creation State
    const [creationState, setCreationState] = useState<{
        active: boolean;
        type: 'folder' | 'project';
        parentPath: string;
        value: string;
    }>({ active: false, type: 'project', parentPath: '', value: '' });

    // Rename State
    const [renameState, setRenameState] = useState<{
        active: boolean;
        projectId: string;
        currentName: string;
        value: string;
    }>({ active: false, projectId: '', currentName: '', value: '' });

    // Folder Rename State
    const [folderRenameState, setFolderRenameState] = useState<{
        active: boolean;
        folderPath: string;
        value: string;
    }>({ active: false, folderPath: '', value: '' });

    // Build Tree
    const tree = useMemo(() => {
        const root: TreeNode[] = [];
        const getFolder = (nodes: TreeNode[], name: string, currentPath: string, isPending = false): TreeNode => {
            let node = nodes.find(n => n.name === name && n.type === 'folder');
            if (!node) {
                node = {
                    id: `folder-${currentPath}`,
                    name,
                    fullPath: currentPath,
                    type: 'folder',
                    children: [],
                    isPending
                };
                nodes.push(node);
            }
            return node;
        };

        pendingFolders.forEach(folderPath => {
            const parts = folderPath.split('/');
            let currentLevel = root;
            let currentPath = '';
            parts.forEach((part) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const folder = getFolder(currentLevel, part, currentPath, true);
                currentLevel = folder.children;
            });
        });

        const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
        sortedProjects.forEach(project => {
            const parts = project.name.split('/');
            let currentLevel = root;
            let currentPath = '';
            parts.forEach((part, index) => {
                const isLast = index === parts.length - 1;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (isLast) {
                    currentLevel.push({
                        id: project.id,
                        name: part,
                        fullPath: project.name,
                        type: 'project',
                        children: [],
                        projectId: project.id,
                        progress: project.progress,
                        taskCount: project.incompleteTaskCount
                    });
                } else {
                    const folder = getFolder(currentLevel, part, currentPath);
                    folder.isPending = false;
                    currentLevel = folder.children;
                }
            });
        });

        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(root);
        return root;
    }, [projects, pendingFolders]);

    useEffect(() => {
        const projectPrefixes = new Set<string>();
        projects.forEach(p => {
            const parts = p.name.split('/');
            let path = '';
            parts.slice(0, -1).forEach(part => {
                path = path ? `${path}/${part}` : part;
                projectPrefixes.add(path);
            });
        });
        // eslint-disable-next-line
        setPendingFolders(prev => {
            const next = prev.filter(f => !projectPrefixes.has(f));
            return next.length !== prev.length ? next : prev;
        });
    }, [projects]);

    const handleDeleteFolder = async (folderPath: string) => {
        const projectsInFolder = projects.filter(p => p.name.startsWith(folderPath + '/') || p.name === folderPath);

        const message = projectsInFolder.length > 0
            ? `Delete folder "${folderPath}" and all ${projectsInFolder.length} projects inside?`
            : `Delete empty folder "${folderPath}"?`;

        if (confirm(message)) {
            for (const p of projectsInFolder) {
                await onDeleteProject(p.id);
            }
            // eslint-disable-next-line
            setPendingFolders(prev => prev.filter(f => f !== folderPath && !f.startsWith(folderPath + '/')));
        }
    };

    const toggleFolder = (path: string) => {
        setCollapsedFolders(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const handleCreate = async () => {
        if (!creationState.value.trim()) {
            setCreationState({ ...creationState, active: false });
            return;
        }
        const name = creationState.value.trim();
        const finalName = creationState.parentPath ? `${creationState.parentPath}/${name}` : name;

        if (creationState.type === 'project') {
            const newProject = await onCreateProject(finalName);
            if (newProject) onSelectProject(newProject.id);
        } else {
            setPendingFolders(prev => [...prev, finalName]);
            setCollapsedFolders(prev => ({ ...prev, [finalName]: false }));
            setCreationState({ active: true, type: 'project', parentPath: finalName, value: '' });
            return;
        }
        setCreationState({ ...creationState, active: false, value: '' });
    };

    const handleRename = async () => {
        if (!renameState.value.trim() || renameState.value === renameState.currentName) {
            setRenameState({ active: false, projectId: '', currentName: '', value: '' });
            return;
        }
        const parts = renameState.currentName.split('/');
        parts[parts.length - 1] = renameState.value.trim();
        const newName = parts.join('/');
        await onUpdateProject(renameState.projectId, newName);
        setRenameState({ active: false, projectId: '', currentName: '', value: '' });
    };

    const handleFolderRename = async () => {
        if (!folderRenameState.value.trim()) {
            setFolderRenameState({ active: false, folderPath: '', value: '' });
            return;
        }
        const parts = folderRenameState.folderPath.split('/');
        parts[parts.length - 1] = folderRenameState.value.trim();
        const newPath = parts.join('/');
        if (newPath !== folderRenameState.folderPath) {
            await onRenameFolder(folderRenameState.folderPath, newPath);
        }
        setFolderRenameState({ active: false, folderPath: '', value: '' });
    };

    const handleDelete = async (projectId: string, projectName: string) => {
        if (confirm(`Delete project "${projectName}"?`)) {
            await onDeleteProject(projectId);
        }
    };



    const openContextMenu = (e: React.MouseEvent, nodeType: 'root' | 'folder' | 'project', path: string, projectId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeType, path, projectId });
    };


    // DnD Logic
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find active project
        const project = projects.find(p => p.id === activeId);
        if (!project) return;

        let newPath = '';

        if (overId === 'root-drop-zone') {
            // Drop to root
            newPath = project.name.split('/').pop() || '';
        } else if (overId.startsWith('folder-')) {
            // Drop into folder
            const folderPath = overId.replace('folder-', '');
            const projectName = project.name.split('/').pop();
            newPath = `${folderPath}/${projectName}`;
        } else {
            return; // Dropped on something else (or another project - implementation detail: maybe support reordering later)
        }

        if (newPath && newPath !== project.name) {
            await onUpdateProject(project.id, newPath);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg"
            >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Overlay with Transition */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <aside
                ref={sidebarRef}
                className={`
                fixed top-0 left-0 h-full bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 z-40 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col font-sans select-none
                w-[85%] lg:w-[var(--desktop-width)]
            `}
                style={{ '--desktop-width': `${width}px` } as React.CSSProperties}
            >
                {/* Resizer Handle */}
                <div
                    className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-green-500/20 transition-colors z-50 opacity-0 hover:opacity-100"
                    onMouseDown={startResizing}
                />
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    {/* Header */}
                    <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
                        <div className="w-8 h-8 bg-white dark:bg-slate-900 text-green-600 dark:text-green-500 rounded-xl flex items-center justify-center mr-3 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-tight block">MVM</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium tracking-wide uppercase">Workspace</span>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                            <ThemeToggle />
                            <button
                                onClick={(e) => openContextMenu(e, 'root', '')}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-3 pt-4 pb-2">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Tree */}
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent relative">
                        {/* Root Drop Zone */}
                        <RootDropZone>
                            {/* Creation Input */}
                            {creationState.active && !creationState.parentPath && (
                                <CreationInput
                                    type={creationState.type}
                                    value={creationState.value}
                                    onChange={(v: string) => setCreationState(prev => ({ ...prev, value: v }))}
                                    onSubmit={handleCreate}
                                    onCancel={() => setCreationState(prev => ({ ...prev, active: false }))}
                                    indent={0}
                                />
                            )}

                            {tree.map(node => (
                                <TreeNodeItem
                                    key={node.id}
                                    node={node}
                                    level={0}
                                    selectedProjectId={selectedProjectId}
                                    onSelectProject={onSelectProject}
                                    collapsedFolders={collapsedFolders}
                                    onToggleFolder={toggleFolder}
                                    onContextMenu={openContextMenu}
                                    searchQuery={searchQuery}
                                    creationState={creationState}
                                    setCreationState={setCreationState}
                                    onCreateSubmit={handleCreate}
                                    renameState={renameState}
                                    setRenameState={setRenameState}
                                    onRenameSubmit={handleRename}
                                    folderRenameState={folderRenameState}
                                    setFolderRenameState={setFolderRenameState}
                                    onFolderRenameSubmit={handleFolderRename}
                                />
                            ))}

                            {/* Empty State */}
                            {projects.length === 0 && pendingFolders.length === 0 && !creationState.active && (
                                <div className="px-4 py-8 text-center pointer-events-none">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 dark:bg-slate-800/50 flex items-center justify-center">
                                        <FolderPlus className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">No projects yet</p>
                                    <div className="flex flex-col gap-2 pointer-events-auto">
                                        <button onClick={() => setCreationState({ active: true, type: 'project', parentPath: '', value: '' })} className="text-green-500 text-xs font-medium hover:underline flex items-center justify-center gap-1"><FilePlus size={12} /> New Project</button>
                                        <button onClick={() => setCreationState({ active: true, type: 'folder', parentPath: '', value: '' })} className="text-slate-400 dark:text-slate-500 text-xs hover:text-slate-300 dark:hover:text-slate-400 flex items-center justify-center gap-1"><FolderPlus size={12} /> New Folder</button>
                                    </div>
                                </div>
                            )}

                            {/* Filling empty space to make dropping to root easy */}
                            <div className="h-full min-h-[50px]" />
                        </RootDropZone>
                    </div>

                    <DragOverlay>
                        {activeDragId ? (
                            <div className="px-3 py-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-green-500/30 text-green-600 dark:text-green-500 text-sm font-medium flex items-center gap-2 opacity-90 ring-1 ring-slate-200 dark:ring-slate-700">
                                <FileText size={14} />
                                <span>Moving project...</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    {onOpenWorkflow && (
                        <button onClick={onOpenWorkflow} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all mb-1">
                            <Building2 className="w-4 h-4" />
                            <span>Daily Workflow</span>
                        </button>
                    )}
                    <button onClick={onOpenActivity} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-all"><Activity className="w-4 h-4" /><span>Activity</span></button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-all"><Settings className="w-4 h-4" /><span>Settings</span></button>
                </div>
            </aside>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeType={contextMenu.nodeType}
                    onClose={() => setContextMenu(null)}
                    onNewProject={() => {
                        setCreationState({ active: true, type: 'project', parentPath: contextMenu.path, value: '' });
                        if (contextMenu.path) setCollapsedFolders(prev => ({ ...prev, [contextMenu.path]: false }));
                        setContextMenu(null);
                    }}
                    onNewFolder={() => {
                        setCreationState({ active: true, type: 'folder', parentPath: contextMenu.path, value: '' });
                        if (contextMenu.path) setCollapsedFolders(prev => ({ ...prev, [contextMenu.path]: false }));
                        setContextMenu(null);
                    }}
                    onRename={() => {
                        if (contextMenu.nodeType === 'project' && contextMenu.projectId) {
                            const project = projects.find(p => p.id === contextMenu.projectId);
                            if (project) {
                                const nameParts = project.name.split('/');
                                setRenameState({ active: true, projectId: project.id, currentName: project.name, value: nameParts[nameParts.length - 1] });
                            }
                        } else if (contextMenu.nodeType === 'folder') {
                            const folderName = contextMenu.path.split('/').pop() || '';
                            setFolderRenameState({ active: true, folderPath: contextMenu.path, value: folderName });
                        }
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        if (contextMenu.nodeType === 'project' && contextMenu.projectId) handleDelete(contextMenu.projectId, contextMenu.path);
                        else if (contextMenu.nodeType === 'folder') handleDeleteFolder(contextMenu.path);
                        setContextMenu(null);
                    }}
                    onSetLocalPath={contextMenu.nodeType === 'project' && onSetLocalPath && contextMenu.projectId ? () => {
                        onSetLocalPath(contextMenu.projectId!, projects.find(p => p.id === contextMenu.projectId)?.localPath);
                        setContextMenu(null);
                    } : undefined}
                />
            )}
        </>
    );
}

// --- Subcomponents ---

function RootDropZone({ children }: { children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'root-drop-zone',
    });

    return (
        <div ref={setNodeRef} className={`min-h-full transition-colors ${isOver ? 'bg-green-50/50' : ''}`}>
            {children}
            {isOver && (
                <div className="absolute inset-0 border-2 border-dashed border-green-300 rounded-lg pointer-events-none z-10 m-2 bg-green-50/50 flex items-center justify-center">
                    <span className="text-green-600 font-medium text-sm">Drop to move to Root</span>
                </div>
            )}
        </div>
    );
}

interface TreeNodeItemProps {
    node: TreeNode;
    level: number;
    selectedProjectId: string;
    onSelectProject: (id: string) => void;
    collapsedFolders: Record<string, boolean>;
    onToggleFolder: (path: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeType: 'root' | 'folder' | 'project', path: string, projectId?: string) => void;
    searchQuery: string;
    creationState: {
        active: boolean;
        type: 'folder' | 'project';
        parentPath: string;
        value: string;
    };
    setCreationState: React.Dispatch<React.SetStateAction<{
        active: boolean;
        type: 'folder' | 'project';
        parentPath: string;
        value: string;
    }>>;
    onCreateSubmit: () => void;
    renameState: {
        active: boolean;
        projectId: string;
        currentName: string;
        value: string;
    };
    setRenameState: React.Dispatch<React.SetStateAction<{
        active: boolean;
        projectId: string;
        currentName: string;
        value: string;
    }>>;
    onRenameSubmit: () => void;
    folderRenameState: {
        active: boolean;
        folderPath: string;
        value: string;
    };
    setFolderRenameState: React.Dispatch<React.SetStateAction<{
        active: boolean;
        folderPath: string;
        value: string;
    }>>;
    onFolderRenameSubmit: () => void;
}

function TreeNodeItem({
    node, level, selectedProjectId, onSelectProject, collapsedFolders, onToggleFolder, onContextMenu, searchQuery, creationState, setCreationState, onCreateSubmit, renameState, setRenameState, onRenameSubmit, folderRenameState, setFolderRenameState, onFolderRenameSubmit
}: TreeNodeItemProps) {
    const isExpanded = !collapsedFolders[node.fullPath];
    const isSelected = node.type === 'project' && node.projectId === selectedProjectId;
    const isRenaming = renameState.active && renameState.projectId === node.projectId;
    const isFolderRenaming = folderRenameState.active && folderRenameState.folderPath === node.fullPath;
    const matchesSearch = !searchQuery || node.fullPath.toLowerCase().includes(searchQuery.toLowerCase());
    const isCreatingInside = creationState.active && creationState.parentPath === node.fullPath;

    // Draggable Hook
    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: node.projectId || node.id,
        disabled: node.type !== 'project' || isRenaming
    });

    // Droppable Hook (Only for folders)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: node.id,
        disabled: node.type !== 'folder'
    });

    // Combine refs if needed (currently separate elements)

    if (node.type === 'folder') {
        if (isFolderRenaming) {
            return (
                <div className="px-2 py-1" style={{ paddingLeft: `${level * 12 + 8}px` }}>
                    <RenameInput
                        value={folderRenameState.value}
                        onChange={(v: string) => setFolderRenameState(prev => ({ ...prev, value: v }))}
                        onSubmit={onFolderRenameSubmit}
                        onCancel={() => setFolderRenameState({ active: false, folderPath: '', value: '' })}
                    />
                </div>
            );
        }
        return (
            <div ref={setDropRef} className={`rounded-lg transition-colors ${isOver ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800' : ''}`}>
                <button
                    onClick={() => onToggleFolder(node.fullPath)}
                    onContextMenu={(e) => onContextMenu(e, 'folder', node.fullPath)}
                    className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors select-none group text-left
                        ${searchQuery ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}
                        ${node.isPending ? 'text-slate-400 italic' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}
                    `}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className={node.isPending ? 'text-amber-500/60' : 'text-slate-400 dark:text-slate-500 group-hover:text-green-500 transition-colors'}>
                        {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                    </span>
                    <span className="truncate flex-1 text-sm">{node.name}</span>
                    {node.isPending && <span className="text-[10px] text-amber-500/60 font-normal">(empty)</span>}
                    {/* Inline Add Buttons */}
                    <span
                        onClick={(e) => { e.stopPropagation(); setCreationState({ active: true, type: 'folder', parentPath: node.fullPath, value: '' }); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded text-amber-500 transition-all"
                        title="New Folder"
                    ><FolderPlus size={14} /></span>
                    <span
                        onClick={(e) => { e.stopPropagation(); setCreationState({ active: true, type: 'project', parentPath: node.fullPath, value: '' }); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-500 transition-all"
                        title="New Project"
                    ><FilePlus size={14} /></span>
                    <span onClick={(e) => onContextMenu(e, 'folder', node.fullPath)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 transition-all"><MoreHorizontal size={14} /></span>
                </button>

                {isExpanded && (
                    <div>
                        {isCreatingInside && <CreationInput type={creationState.type} value={creationState.value} onChange={(v: string) => setCreationState(prev => ({ ...prev, value: v }))} onSubmit={onCreateSubmit} onCancel={() => setCreationState(prev => ({ ...prev, active: false }))} indent={level + 1} />}
                        {node.children.length === 0 && !isCreatingInside && node.isPending && (
                            <div className="text-xs text-slate-400 py-2 cursor-pointer hover:text-green-600 transition-colors" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }} onClick={() => setCreationState({ active: true, type: 'project', parentPath: node.fullPath, value: '' })}>+ Add first project...</div>
                        )}
                        {node.children.map((child) => (
                            <TreeNodeItem key={child.id} node={child} level={level + 1} selectedProjectId={selectedProjectId} onSelectProject={onSelectProject} collapsedFolders={collapsedFolders} onToggleFolder={onToggleFolder} onContextMenu={onContextMenu} searchQuery={searchQuery} creationState={creationState} setCreationState={setCreationState} onCreateSubmit={onCreateSubmit} renameState={renameState} setRenameState={setRenameState} onRenameSubmit={onRenameSubmit} folderRenameState={folderRenameState} setFolderRenameState={setFolderRenameState} onFolderRenameSubmit={onFolderRenameSubmit} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (!matchesSearch && searchQuery) return null;

    if (isRenaming) {
        return <div className="px-2 py-1" style={{ paddingLeft: `${level * 12 + 28}px` }}><RenameInput value={renameState.value} onChange={(v: string) => setRenameState(prev => ({ ...prev, value: v }))} onSubmit={onRenameSubmit} onCancel={() => setRenameState({ active: false, projectId: '', currentName: '', value: '' })} /></div>;
    }

    return (
        <div ref={setDragRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.5 : 1 }}>
            <button
                onClick={() => onSelectProject(node.projectId!)}
                onContextMenu={(e) => onContextMenu(e, 'project', node.fullPath, node.projectId)}
                className={`
                    w-full flex flex-col gap-0.5 px-2 py-1.5 rounded-lg text-sm transition-all group relative text-left
                    ${isSelected ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 font-semibold shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}
                `}
                style={{ paddingLeft: `${level * 12 + 28}px` }}
            >
                <div className="flex items-center gap-2 w-full">
                    <FileText size={14} className={`shrink-0 ${isSelected ? 'text-green-500' : 'opacity-70 group-hover:opacity-100 text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate flex-1">{node.name}</span>
                    {node.taskCount !== undefined && node.taskCount > 0 && (
                        <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-1.5 rounded-full ml-2">
                            {node.taskCount}
                        </span>
                    )}
                    {isSelected && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-green-500" />}
                    <span onClick={(e) => onContextMenu(e, 'project', node.fullPath, node.projectId)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 transition-all ml-auto"><MoreHorizontal size={14} /></span>
                </div>
            </button>
        </div>
    );
}

interface CreationInputProps {
    type: 'folder' | 'project';
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    indent: number;
}

function CreationInput({ type, value, onChange, onSubmit, onCancel, indent }: CreationInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    return (
        <div className="px-2 py-1" style={{ paddingLeft: `${indent * 12 + 8}px` }}>
            <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 ring-1 ring-green-500/50 shadow-sm animate-in fade-in duration-200">
                {type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <FileText size={14} className="text-slate-400" />}
                <input ref={inputRef} type="text" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') onCancel(); }} onBlur={() => { if (!value) onCancel(); }} placeholder={type === 'folder' ? 'Folder name...' : 'Project name...'} className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 ml-6">{type === 'folder' ? 'Enter to create folder' : 'Enter to create project'} • Esc to cancel</div>
        </div>
    );
}

interface RenameInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

function RenameInput({ value, onChange, onSubmit, onCancel }: RenameInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
    return (
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1 ring-1 ring-blue-500/50 shadow-sm animate-in fade-in duration-200">
            <Pencil size={14} className="text-blue-500" />
            <input ref={inputRef} type="text" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') onCancel(); }} onBlur={onSubmit} className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none" />
        </div>
    );
}

interface ContextMenuProps {
    x: number;
    y: number;
    nodeType: 'root' | 'folder' | 'project';
    onClose: () => void;
    onNewProject: () => void;
    onNewFolder: () => void;
    onRename: () => void;
    onDelete: () => void;
    onSetLocalPath?: () => void;
    path?: string;
    projectId?: string;
}

function ContextMenu({ x, y, nodeType, onClose, onNewProject, onNewFolder, onRename, onDelete, onSetLocalPath }: ContextMenuProps) {
    if (typeof document === 'undefined') return null;
    const menuWidth = 192;
    const menuHeight = nodeType === 'root' ? 100 : 160;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
    return createPortal(
        <>
            <div className="fixed inset-0 z-[100]" onClick={onClose} />
            <div className="fixed z-[101] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-1 w-48 animate-in zoom-in-95 duration-100 ring-1 ring-slate-200 dark:ring-slate-800" style={{ top: adjustedY, left: adjustedX }}>
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-100 dark:border-slate-800">{nodeType === 'root' ? 'Workspace' : nodeType === 'folder' ? 'Folder' : 'Project'}</div>
                {(nodeType === 'root' || nodeType === 'folder') && (<><button onClick={onNewProject} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 rounded transition-colors text-left"><FilePlus size={14} /> New Project</button><button onClick={onNewFolder} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 rounded transition-colors text-left"><FolderPlus size={14} /> New Folder</button></>)}
                {(nodeType === 'project' || nodeType === 'folder') && <div className="border-t border-slate-100 dark:border-slate-800 my-1" />}
                {(nodeType === 'project' || nodeType === 'folder') && <button onClick={onRename} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded transition-colors text-left"><Pencil size={14} /> Rename</button>}
                {nodeType === 'project' && onSetLocalPath && <button onClick={onSetLocalPath} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-700 dark:hover:text-cyan-400 rounded transition-colors text-left"><Folder size={14} /> Set Local Path</button>}
                {(nodeType === 'project' || nodeType === 'folder') && <button onClick={onDelete} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 rounded transition-colors text-left"><Trash2 size={14} /> Delete {nodeType === 'folder' ? 'Folder' : 'Project'}</button>}
            </div>
        </>,
        document.body
    );
}
