import React, { useState } from 'react';
import { Workspace, Folder, User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    FolderKanban,
    ChevronDown,
    Lock,
    Globe,
    Plus,
    LogOut,
    UserCheck,
    Search,
    ShieldAlert,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface WorkspaceLayoutProps {
    workspace: Workspace;
    workspaces: Workspace[];
    activeFolder?: Folder;
    children: React.ReactNode;
    onQuickCreate?: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
    workspace,
    workspaces,
    activeFolder,
    children,
    onQuickCreate,
}) => {
    const { auth, flash } = usePage<{
        auth?: { user?: User | null };
        flash?: { success?: string; error?: string };
    }>().props;

    const currentUser = auth?.user;

    const switchUser = (userId: number) => {
        router.post(`/switch-user/${userId}`);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 selection:text-primary">
            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-border/80 bg-card/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    {/* Brand */}
                    <Link
                        href={`/workspace/${workspace.slug}/board`}
                        className="flex items-center gap-2 font-bold text-foreground hover:opacity-90 transition-opacity"
                    >
                        <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs font-mono text-sm">
                            P
                        </div>
                        <span className="tracking-tight text-base font-semibold">PillotArk</span>
                    </Link>

                    {/* Workspace Selector Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-medium text-foreground transition-colors"
                            >
                                <span className="flex items-center gap-1.5">
                                    {workspace.is_private ? (
                                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                                    ) : (
                                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                                    )}
                                    <span className="font-semibold">{workspace.name}</span>
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="z-50 w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
                                sideOffset={6}
                            >
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                                    Workspaces
                                </div>
                                {workspaces.map((w) => (
                                    <DropdownMenu.Item key={w.id} asChild>
                                        <Link
                                            href={`/workspace/${w.slug}/board`}
                                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                                w.id === workspace.id
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {w.is_private ? (
                                                    <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                ) : (
                                                    <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                )}
                                                <span>{w.name}</span>
                                            </div>
                                            {w.is_private && (
                                                <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.2 rounded font-medium">
                                                    Private
                                                </span>
                                            )}
                                        </Link>
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    {/* Navigation Tabs */}
                    <nav className="flex items-center gap-1 text-xs">
                        <Link
                            href={`/workspace/${workspace.slug}/board`}
                            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                                window.location.pathname.includes('/board')
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span>Board</span>
                        </Link>

                        <Link
                            href={`/workspace/${workspace.slug}/members`}
                            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                                window.location.pathname.includes('/members')
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                        >
                            <Users className="h-3.5 w-3.5" />
                            <span>Members</span>
                        </Link>
                    </nav>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    {onQuickCreate && (
                        <button
                            type="button"
                            onClick={onQuickCreate}
                            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create</span>
                        </button>
                    )}

                    {/* Dev Switch User / User Menu */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full border border-border/80 hover:bg-muted transition-colors text-xs"
                            >
                                <span className="font-medium text-foreground">
                                    {currentUser?.name || 'Ada Admin'}
                                </span>
                                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                                    {(currentUser?.name || 'Ada')[0]}
                                </div>
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="z-50 w-64 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
                                sideOffset={6}
                                align="end"
                            >
                                <div className="px-2.5 py-1.5 border-b border-border/60">
                                    <div className="text-xs font-semibold text-foreground">
                                        {currentUser?.name || 'Ada Admin'}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate">
                                        {currentUser?.email || 'ada@example.com'}
                                    </div>
                                </div>

                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2 pb-1">
                                    Switch Account (Test Permissions)
                                </div>

                                <DropdownMenu.Item
                                    onClick={() => switchUser(1)}
                                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-muted cursor-pointer"
                                >
                                    <span>Ada Admin (Admin)</span>
                                    <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                                </DropdownMenu.Item>

                                <DropdownMenu.Item
                                    onClick={() => switchUser(2)}
                                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-muted cursor-pointer"
                                >
                                    <span>Morgan Member (Member)</span>
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                </DropdownMenu.Item>

                                <DropdownMenu.Item
                                    onClick={() => switchUser(3)}
                                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-muted text-red-500 cursor-pointer"
                                >
                                    <span>Alex Suspended (Banned)</span>
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                </DropdownMenu.Item>

                                <DropdownMenu.Separator className="h-px bg-border my-1" />

                                <DropdownMenu.Item asChild>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>Log out</span>
                                    </Link>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>
            </header>

            {/* Flash Alerts if any */}
            {flash?.success && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-5 py-2 text-xs font-medium flex items-center justify-between">
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.error && (
                <div className="bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 px-5 py-2 text-xs font-medium flex items-center justify-between">
                    <span>{flash.error}</span>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        </div>
    );
};
