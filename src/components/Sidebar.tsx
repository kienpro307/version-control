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
    MoreHorizontal
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Project } from '@/lib/types';
import { createPortal } from 'react-dom';

interface SidebarProps {
    projects: Project[];
    selectedProjectId: string;
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string) => Promise<Project | null>;
    onUpdateProject: (id: string, name: string) => Promise<boolean>;
    onDeleteProject: (id: string) => Promise<boolean>;
    onOpenActivity: () => void;
}

type TreeNode = {
    id: string;
    name: string;
    fullPath: string;
    type: 'folder' | 'project';
    children: TreeNode[];
    projectId?: string;
    isPending?: boolean; // For empty folders that don't have projects yet
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
    onOpenActivity
}: SidebarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

    // Pending folders = folders created by user but don't have any projects yet
    const [pendingFolders, setPendingFolders] = useState<string[]>([]);

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

    // Build Tree (includes pending folders)
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

        // Add pending folders first
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

        // Add projects
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
                        projectId: project.id
                    });
                } else {
                    const folder = getFolder(currentLevel, part, currentPath);
                    folder.isPending = false; // If it has a project, it's no longer pending
                    currentLevel = folder.children;
                }
            });
        });

        // Remove pending folders that now have projects
        const existingFolderPaths = new Set<string>();
        const collectFolderPaths = (nodes: TreeNode[]) => {
            nodes.forEach(n => {
                if (n.type === 'folder' && !n.isPending) {
                    existingFolderPaths.add(n.fullPath);
                }
                collectFolderPaths(n.children);
            });
        };
        collectFolderPaths(root);

        // Recursive sort: Folders first, then Files
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

    // Clean up pending folders when they get real projects
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

        setPendingFolders(prev => prev.filter(f => !projectPrefixes.has(f)));
    }, [projects]);

    const toggleFolder = (path: string) => {
        setCollapsedFolders(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const handleCreate = async () => {
        if (!creationState.value.trim()) {
            setCreationState({ ...creationState, active: false });
            return;
        }

        const name = creationState.value.trim();
        const finalName = creationState.parentPath
            ? `${creationState.parentPath}/${name}`
            : name;

        if (creationState.type === 'project') {
            const newProject = await onCreateProject(finalName);
            if (newProject) {
                onSelectProject(newProject.id);
            }
        } else {
            // Create a pending folder
            setPendingFolders(prev => [...prev, finalName]);
            // Expand the new folder
            setCollapsedFolders(prev => ({ ...prev, [finalName]: false }));
            // Keep creation state to prompt for first project
            setCreationState({
                active: true,
                type: 'project',
                parentPath: finalName,
                value: ''
            });
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

    const handleDelete = async (projectId: string, projectName: string) => {
        if (confirm(`Delete project "${projectName}"? This will also delete all versions and tasks.`)) {
            await onDeleteProject(projectId);
        }
    };

    const handleDeleteFolder = async (folderPath: string) => {
        const projectsInFolder = projects.filter(p => p.name.startsWith(folderPath + '/') || p.name === folderPath);

        // If it's a pending folder with no projects
        if (projectsInFolder.length === 0) {
            setPendingFolders(prev => prev.filter(f => !f.startsWith(folderPath)));
            return;
        }

        if (confirm(`Delete folder "${folderPath}" and all ${projectsInFolder.length} projects inside?`)) {
            for (const p of projectsInFolder) {
                await onDeleteProject(p.id);
            }
            // Also remove from pending
            setPendingFolders(prev => prev.filter(f => !f.startsWith(folderPath)));
        }
    };

    const openContextMenu = (e: React.MouseEvent, nodeType: 'root' | 'folder' | 'project', path: string, projectId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeType, path, projectId });
    };

    return (
        <>
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg"
            >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-40 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col font-sans
            `}>
                {/* Header */}
                <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
                    <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mr-3 ring-1 ring-emerald-500/20">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-100 text-lg leading-tight block">MVM</span>
                        <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Workspace</span>
                    </div>

                    <button
                        onClick={(e) => openContextMenu(e, 'root', '')}
                        className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Add Project or Folder"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 pt-4 pb-2">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* Tree */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {/* Root-level creation input */}
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
                        />
                    ))}

                    {projects.length === 0 && pendingFolders.length === 0 && !creationState.active && (
                        <div className="px-4 py-8 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
                                <FolderPlus className="w-6 h-6 text-slate-600" />
                            </div>
                            <p className="text-slate-500 text-xs mb-3">No projects yet</p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setCreationState({ active: true, type: 'project', parentPath: '', value: '' })}
                                    className="text-emerald-500 text-xs font-medium hover:underline flex items-center justify-center gap-1"
                                >
                                    <FilePlus size={12} /> New Project
                                </button>
                                <button
                                    onClick={() => setCreationState({ active: true, type: 'folder', parentPath: '', value: '' })}
                                    className="text-slate-400 text-xs hover:text-slate-300 flex items-center justify-center gap-1"
                                >
                                    <FolderPlus size={12} /> New Folder
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={onOpenActivity}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-all"
                    >
                        <Activity className="w-4 h-4" />
                        <span>Activity</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-lg transition-all">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeType={contextMenu.nodeType}
                    onClose={() => setContextMenu(null)}
                    onNewProject={() => {
                        setCreationState({ active: true, type: 'project', parentPath: contextMenu.path, value: '' });
                        // Auto-expand the folder if creating inside it
                        if (contextMenu.path) {
                            setCollapsedFolders(prev => ({ ...prev, [contextMenu.path]: false }));
                        }
                        setContextMenu(null);
                    }}
                    onNewFolder={() => {
                        setCreationState({ active: true, type: 'folder', parentPath: contextMenu.path, value: '' });
                        // Auto-expand the folder if creating inside it
                        if (contextMenu.path) {
                            setCollapsedFolders(prev => ({ ...prev, [contextMenu.path]: false }));
                        }
                        setContextMenu(null);
                    }}
                    onRename={() => {
                        if (contextMenu.nodeType === 'project' && contextMenu.projectId) {
                            const project = projects.find(p => p.id === contextMenu.projectId);
                            if (project) {
                                const nameParts = project.name.split('/');
                                setRenameState({
                                    active: true,
                                    projectId: project.id,
                                    currentName: project.name,
                                    value: nameParts[nameParts.length - 1]
                                });
                            }
                        }
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        if (contextMenu.nodeType === 'project' && contextMenu.projectId) {
                            handleDelete(contextMenu.projectId, contextMenu.path);
                        } else if (contextMenu.nodeType === 'folder') {
                            handleDeleteFolder(contextMenu.path);
                        }
                        setContextMenu(null);
                    }}
                />
            )}
        </>
    );
}

// --- Subcomponents ---

function TreeNodeItem({
    node, level, selectedProjectId, onSelectProject, collapsedFolders, onToggleFolder, onContextMenu, searchQuery, creationState, setCreationState, onCreateSubmit, renameState, setRenameState, onRenameSubmit
}: {
    node: TreeNode;
    level: number;
    selectedProjectId: string;
    onSelectProject: (id: string) => void;
    collapsedFolders: Record<string, boolean>;
    onToggleFolder: (path: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeType: 'root' | 'folder' | 'project', path: string, projectId?: string) => void;
    searchQuery: string;
    creationState: any;
    setCreationState: any;
    onCreateSubmit: () => void;
    renameState: any;
    setRenameState: any;
    onRenameSubmit: () => void;
}) {
    const isExpanded = !collapsedFolders[node.fullPath];
    const isSelected = node.type === 'project' && node.projectId === selectedProjectId;
    const isRenaming = renameState.active && renameState.projectId === node.projectId;
    const matchesSearch = !searchQuery || node.fullPath.toLowerCase().includes(searchQuery.toLowerCase());
    const isCreatingInside = creationState.active && creationState.parentPath === node.fullPath;

    if (node.type === 'folder') {
        return (
            <div>
                <button
                    onClick={() => onToggleFolder(node.fullPath)}
                    onContextMenu={(e) => onContextMenu(e, 'folder', node.fullPath)}
                    className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors select-none group
                        ${searchQuery ? 'bg-slate-800/50' : 'hover:bg-slate-800'}
                        ${node.isPending ? 'text-slate-500 italic' : 'text-slate-400 hover:text-slate-200'}
                    `}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className={node.isPending ? 'text-amber-500/60' : 'text-emerald-500/80 group-hover:text-emerald-400'}>
                        {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                    </span>
                    <span className="truncate flex-1">{node.name}</span>
                    {node.isPending && (
                        <span className="text-[10px] text-amber-500/60 font-normal">(empty)</span>
                    )}
                    <span
                        onClick={(e) => onContextMenu(e, 'folder', node.fullPath)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                    >
                        <MoreHorizontal size={12} />
                    </span>
                </button>

                {isExpanded && (
                    <div>
                        {isCreatingInside && (
                            <CreationInput
                                type={creationState.type}
                                value={creationState.value}
                                onChange={(v: string) => setCreationState((prev: any) => ({ ...prev, value: v }))}
                                onSubmit={onCreateSubmit}
                                onCancel={() => setCreationState((prev: any) => ({ ...prev, active: false }))}
                                indent={level + 1}
                            />
                        )}

                        {node.children.length === 0 && !isCreatingInside && node.isPending && (
                            <div
                                className="text-[10px] text-slate-600 py-2 cursor-pointer hover:text-slate-400 transition-colors"
                                style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}
                                onClick={() => setCreationState({ active: true, type: 'project', parentPath: node.fullPath, value: '' })}
                            >
                                + Add first project...
                            </div>
                        )}

                        {node.children.map(child => (
                            <TreeNodeItem
                                key={child.id}
                                node={child}
                                level={level + 1}
                                selectedProjectId={selectedProjectId}
                                onSelectProject={onSelectProject}
                                collapsedFolders={collapsedFolders}
                                onToggleFolder={onToggleFolder}
                                onContextMenu={onContextMenu}
                                searchQuery={searchQuery}
                                creationState={creationState}
                                setCreationState={setCreationState}
                                onCreateSubmit={onCreateSubmit}
                                renameState={renameState}
                                setRenameState={setRenameState}
                                onRenameSubmit={onRenameSubmit}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (!matchesSearch && searchQuery) return null;

    if (isRenaming) {
        return (
            <div className="px-2 py-1" style={{ paddingLeft: `${level * 12 + 28}px` }}>
                <RenameInput
                    value={renameState.value}
                    onChange={(v: string) => setRenameState((prev: any) => ({ ...prev, value: v }))}
                    onSubmit={onRenameSubmit}
                    onCancel={() => setRenameState({ active: false, projectId: '', currentName: '', value: '' })}
                />
            </div>
        );
    }

    return (
        <button
            onClick={() => onSelectProject(node.projectId!)}
            onContextMenu={(e) => onContextMenu(e, 'project', node.fullPath, node.projectId)}
            className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all group relative
                ${isSelected
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
            `}
            style={{ paddingLeft: `${level * 12 + 28}px` }}
        >
            <FileText size={14} className={`shrink-0 ${isSelected ? 'text-emerald-500' : 'opacity-50 group-hover:opacity-100'}`} />
            <span className="truncate flex-1">{node.name}</span>
            {isSelected && <div className="absolute right-8 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
            <span
                onClick={(e) => onContextMenu(e, 'project', node.fullPath, node.projectId)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
            >
                <MoreHorizontal size={12} />
            </span>
        </button>
    );
}

function CreationInput({ type, value, onChange, onSubmit, onCancel, indent }: any) {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);

    return (
        <div className="px-2 py-1" style={{ paddingLeft: `${indent * 12 + 8}px` }}>
            <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1.5 ring-1 ring-emerald-500/50 animate-in fade-in duration-200">
                {type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <FileText size={14} className="text-slate-400" />}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') onSubmit();
                        if (e.key === 'Escape') onCancel();
                    }}
                    onBlur={() => { if (!value) onCancel(); }}
                    placeholder={type === 'folder' ? 'Folder name...' : 'Project name...'}
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
            </div>
            <div className="text-[10px] text-slate-600 mt-1 ml-6">
                {type === 'folder' ? 'Enter to create folder' : 'Enter to create project'} • Esc to cancel
            </div>
        </div>
    );
}

function RenameInput({ value, onChange, onSubmit, onCancel }: any) {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

    return (
        <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 ring-1 ring-blue-500/50 animate-in fade-in duration-200">
            <Pencil size={14} className="text-blue-400" />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') onSubmit();
                    if (e.key === 'Escape') onCancel();
                }}
                onBlur={onSubmit}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
        </div>
    );
}

function ContextMenu({ x, y, nodeType, onClose, onNewProject, onNewFolder, onRename, onDelete }: any) {
    if (typeof document === 'undefined') return null;

    // Adjust position to stay within viewport
    const menuWidth = 192;
    const menuHeight = nodeType === 'root' ? 100 : 160;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

    return createPortal(
        <>
            <div className="fixed inset-0 z-[100]" onClick={onClose} />
            <div
                className="fixed z-[101] bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-1 w-48 animate-in zoom-in-95 duration-100"
                style={{ top: adjustedY, left: adjustedX }}
            >
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-700/50">
                    {nodeType === 'root' ? 'Workspace' : nodeType === 'folder' ? 'Folder' : 'Project'}
                </div>

                {/* Create Options - available for root and folder */}
                {(nodeType === 'root' || nodeType === 'folder') && (
                    <>
                        <button
                            onClick={onNewProject}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-emerald-600 hover:text-white rounded transition-colors text-left"
                        >
                            <FilePlus size={14} /> New Project
                        </button>
                        <button
                            onClick={onNewFolder}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-amber-600 hover:text-white rounded transition-colors text-left"
                        >
                            <FolderPlus size={14} /> New Folder
                        </button>
                    </>
                )}

                {/* Divider */}
                {(nodeType === 'project' || nodeType === 'folder') && (nodeType === 'folder' ? true : true) && (
                    <div className="border-t border-slate-700/50 my-1" />
                )}

                {/* Edit/Delete Options */}
                {nodeType === 'project' && (
                    <button
                        onClick={onRename}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-blue-600 hover:text-white rounded transition-colors text-left"
                    >
                        <Pencil size={14} /> Rename
                    </button>
                )}

                {(nodeType === 'project' || nodeType === 'folder') && (
                    <button
                        onClick={onDelete}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors text-left"
                    >
                        <Trash2 size={14} /> Delete {nodeType === 'folder' ? 'Folder' : 'Project'}
                    </button>
                )}
            </div>
        </>,
        document.body
    );
}
