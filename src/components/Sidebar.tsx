'use client';

import {
    LayoutDashboard,
    Layers,
    CheckSquare,
    Activity,
    Settings,
    HelpCircle,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

import { Project } from '@/lib/types';
import { Plus } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    projects: Project[];
    selectedProjectId: string;
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string) => Promise<Project | null>;
}

export default function Sidebar({
    activeTab,
    onTabChange,
    projects,
    selectedProjectId,
    onSelectProject,
    onCreateProject
}: SidebarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const navItems = [
        { id: 'projects', label: 'Projects', icon: LayoutDashboard },
        { id: 'versions', label: 'Versions', icon: Layers },
        { id: 'tasks', label: 'To-Do List', icon: CheckSquare },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const handleTabClick = (id: string) => {
        onTabChange(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Menu Trigger */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-white rounded-md shadow-sm border border-slate-200"
            >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-50 border-r border-slate-200 z-40 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
                {/* Logo Area */}
                <div className="h-14 flex items-center px-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <Layers className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg tracking-tight">MVM</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Your Work</div>

                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
                  ${isActive
                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50'
                                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'}
                `}
                            >
                                <item.icon className={`
                  w-4.5 h-4.5 transition-colors
                  ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}
                `} />
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="px-3 mt-auto mb-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex justify-between items-center">
                        <span>Projects</span>
                        <button
                            onClick={() => setIsCreatingProject(!isCreatingProject)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {isCreatingProject && (
                        <div className="px-3 mb-2">
                            <input
                                autoFocus
                                type="text"
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                onKeyDown={async e => {
                                    if (e.key === 'Enter' && newProjectName.trim()) {
                                        await onCreateProject(newProjectName.trim());
                                        setNewProjectName('');
                                        setIsCreatingProject(false);
                                    }
                                    if (e.key === 'Escape') setIsCreatingProject(false);
                                }}
                                placeholder="New Project..."
                                className="w-full text-sm px-2 py-1 border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    )}

                    <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                        {projects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => {
                                    onSelectProject(project.id);
                                    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors truncate
                                     ${project.id === selectedProjectId
                                        ? 'bg-white text-emerald-700 font-medium shadow-sm border border-slate-100'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                                 `}
                            >
                                {project.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-200/60 bg-white/30">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100/50">
                        <HelpCircle size={16} />
                        <span>Help & Support</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
