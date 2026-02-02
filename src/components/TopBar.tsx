'use client';

import { Search, Bell, Plus, User } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
    onSearch: (query: string) => void;
    searchQuery: string;
}

export default function TopBar({ onSearch, searchQuery }: TopBarProps) {
    return (
        <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shadow-sm/50">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-auto lg:mx-0 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search or go to..."
                    className="w-full pl-9 pr-10 py-1.5 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-700 
            focus:bg-white focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
                    <kbd className="h-5 flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
                        /
                    </kbd>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-4">
                {/* Quick Add */}
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all active:scale-95">
                    <Plus size={16} />
                    <span>New</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                {/* User Avatar */}
                <button className="ml-1 flex items-center gap-2 p-1 hover:bg-slate-100 rounded-full pl-1 pr-3 transition-colors">
                    <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center border border-amber-200">
                        <User size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden lg:block">User</span>
                </button>
            </div>
        </header>
    );
}
