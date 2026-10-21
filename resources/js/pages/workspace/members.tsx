import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Workspace, MemberUser } from '@/types';
import { WorkspaceLayout } from '@/components/workspace/workspace-layout';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import {
    Users,
    MoreHorizontal,
    Shield,
    ShieldAlert,
    CheckCircle2,
    Lock,
    Search,
    AlertTriangle,
    X,
    UserCheck,
    Check,
} from 'lucide-react';

interface MembersProps {
    workspace: Workspace;
    workspaces: Workspace[];
    privateWorkspaces: Workspace[];
    members: MemberUser[];
}

export default function WorkspaceMembers({
    workspace,
    workspaces,
    privateWorkspaces,
    members: initialMembers,
}: MembersProps) {
    const [members, setMembers] = useState<MemberUser[]>(initialMembers);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

    // Suspend Modal
    const [suspendModalUser, setSuspendModalUser] = useState<MemberUser | null>(null);
    const [suspendReason, setSuspendReason] = useState('Violation of team security policies');

    // Reactivate Modal
    const [reactivateModalUser, setReactivateModalUser] = useState<MemberUser | null>(null);

    // Debounce timers for auto-saving workspace multi-select
    const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const [savingUserId, setSavingUserId] = useState<number | null>(null);

    useEffect(() => {
        setMembers(initialMembers);
    }, [initialMembers]);

    // Handle private workspace badge toggle with debounced auto-save
    const toggleWorkspaceAccess = (memberId: number, targetWorkspaceId: number) => {
        const member = members.find((m) => m.id === memberId);
        if (!member) return;

        const currentIds = member.workspace_ids || [];
        const newIds = currentIds.includes(targetWorkspaceId)
            ? currentIds.filter((id) => id !== targetWorkspaceId)
            : [...currentIds, targetWorkspaceId];

        // Optimistically update local state
        setMembers((prev) =>
            prev.map((m) =>
                m.id === memberId
                    ? {
                          ...m,
                          workspace_ids: newIds,
                          workspaces: privateWorkspaces.filter((w) => newIds.includes(w.id)),
                      }
                    : m
            )
        );

        // Clear existing debounce timer for this user
        if (saveTimers.current[memberId]) {
            clearTimeout(saveTimers.current[memberId]);
        }

        setSavingUserId(memberId);

        // Debounced auto-save (500ms)
        saveTimers.current[memberId] = setTimeout(async () => {
            try {
                await fetch(`/members/${memberId}/workspaces`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                            '',
                    },
                    body: JSON.stringify({ workspace_ids: newIds }),
                });
            } catch (err) {
                console.error('Failed to auto-save workspace assignments', err);
            } finally {
                setSavingUserId(null);
            }
        }, 500);
    };

    const confirmSuspend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!suspendModalUser) return;

        router.put(
            `/members/${suspendModalUser.id}/suspend`,
            { reason: suspendReason },
            {
                onSuccess: () => {
                    setSuspendModalUser(null);
                    setSuspendReason('');
                },
            }
        );
    };

    const confirmReactivate = () => {
        if (!reactivateModalUser) return;

        router.put(
            `/members/${reactivateModalUser.id}/reactivate`,
            {},
            {
                onSuccess: () => {
                    setReactivateModalUser(null);
                },
            }
        );
    };

    const filteredMembers = members.filter((m) => {
        const matchesSearch =
            searchQuery === '' ||
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && !m.is_banned) ||
            (statusFilter === 'suspended' && m.is_banned);

        return matchesSearch && matchesStatus;
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <WorkspaceLayout workspace={workspace} workspaces={workspaces}>
            <Head title={`Team Members - ${workspace.name}`} />

            {/* Sub-header */}
            <div className="border-b border-border/70 bg-card/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Workspace Members</h1>
                        <p className="text-xs text-muted-foreground">
                            Manage user permissions, private workspace access, and suspension status.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search members..."
                            className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background w-52 focus:w-64 focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="suspended">Suspended Only</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className="p-6 flex-1 bg-muted/5 overflow-auto">
                <div className="max-w-6xl mx-auto bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <th className="py-3 px-5">Member</th>
                                <th className="py-3 px-5">Role</th>
                                <th className="py-3 px-5">Private Workspaces</th>
                                <th className="py-3 px-5">Status</th>
                                <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 text-xs">
                            {filteredMembers.map((member) => (
                                <tr
                                    key={member.id}
                                    className={`hover:bg-muted/20 transition-colors ${
                                        member.is_banned ? 'bg-red-500/5' : ''
                                    }`}
                                >
                                    {/* Member info */}
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-border/60">
                                                {getInitials(member.name)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                    <span>{member.name}</span>
                                                    {member.is_banned && (
                                                        <span className="text-[10px] bg-red-500/15 text-red-600 px-1.5 py-0.2 rounded font-medium">
                                                            Suspended
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role Badge */}
                                    <td className="py-3.5 px-5">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                member.role === 'admin'
                                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                                    : 'bg-muted text-muted-foreground border border-border/60'
                                            }`}
                                        >
                                            <Shield className="h-3 w-3" />
                                            <span className="capitalize">{member.role}</span>
                                        </span>
                                    </td>

                                    {/* Private Workspace Multi-Select Badges with debounced auto-save */}
                                    <td className="py-3.5 px-5">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {privateWorkspaces.length > 0 ? (
                                                privateWorkspaces.map((pw) => {
                                                    const isAssigned = (member.workspace_ids || []).includes(pw.id);
                                                    return (
                                                        <button
                                                            key={pw.id}
                                                            type="button"
                                                            onClick={() => toggleWorkspaceAccess(member.id, pw.id)}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                                                                isAssigned
                                                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold'
                                                                    : 'bg-muted/60 text-muted-foreground/60 border border-border/40 hover:text-muted-foreground hover:bg-muted'
                                                            }`}
                                                            title={`Click to ${isAssigned ? 'remove' : 'grant'} access`}
                                                        >
                                                            <Lock className="h-2.5 w-2.5" />
                                                            <span>{pw.name}</span>
                                                            {isAssigned && <Check className="h-2.5 w-2.5 ml-0.5" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground">
                                                    None available
                                                </span>
                                            )}

                                            {savingUserId === member.id && (
                                                <span className="text-[10px] text-muted-foreground animate-pulse ml-1">
                                                    Saving...
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status Pill */}
                                    <td className="py-3.5 px-5">
                                        {member.is_banned ? (
                                            <div className="inline-flex flex-col">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 border border-red-500/30 w-fit">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                    <span>Suspended</span>
                                                </span>
                                                {member.ban_reason && (
                                                    <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[180px] truncate" title={member.ban_reason}>
                                                        {member.ban_reason}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span>Active</span>
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions Dropdown */}
                                    <td className="py-3.5 px-5 text-right">
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger asChild>
                                                <button
                                                    type="button"
                                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Portal>
                                                <DropdownMenu.Content
                                                    className="z-50 w-48 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
                                                    sideOffset={5}
                                                    align="end"
                                                >
                                                    {member.is_banned ? (
                                                        <DropdownMenu.Item
                                                            onClick={() => setReactivateModalUser(member)}
                                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            <span>Reactivate Account</span>
                                                        </DropdownMenu.Item>
                                                    ) : (
                                                        <DropdownMenu.Item
                                                            onClick={() => setSuspendModalUser(member)}
                                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-500/10 cursor-pointer"
                                                        >
                                                            <ShieldAlert className="h-3.5 w-3.5" />
                                                            <span>Suspend Account</span>
                                                        </DropdownMenu.Item>
                                                    )}

                                                    <DropdownMenu.Item
                                                        onClick={() => router.post(`/switch-user/${member.id}`)}
                                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted cursor-pointer"
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                                                        <span>Switch to this user</span>
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Suspend Account Confirmation Modal */}
            <Dialog.Root open={!!suspendModalUser} onOpenChange={(open) => !open && setSuspendModalUser(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-200" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 fade-in-0">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <Dialog.Title className="text-base font-bold text-foreground">
                                    Suspend Account
                                </Dialog.Title>
                                <p className="text-xs text-muted-foreground">
                                    {suspendModalUser?.name} ({suspendModalUser?.email})
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Suspending this account will immediately terminate any active user sessions via the EnsureUserIsNotBanned middleware, invalidate authorization tokens, and block further access.
                        </p>

                        <form onSubmit={confirmSuspend} className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Reason for Suspension
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="e.g. Violation of security guidelines"
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSuspendModalUser(null)}
                                    className="px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                                >
                                    Confirm Suspension
                                </button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Reactivate Account Confirmation Modal */}
            <Dialog.Root open={!!reactivateModalUser} onOpenChange={(open) => !open && setReactivateModalUser(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-200" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 fade-in-0">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <Dialog.Title className="text-base font-bold text-foreground">
                                    Reactivate Account
                                </Dialog.Title>
                                <p className="text-xs text-muted-foreground">
                                    {reactivateModalUser?.name} ({reactivateModalUser?.email})
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This will clear the account suspension record, allowing {reactivateModalUser?.name} to sign in again and access team workspaces.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-3">
                            <button
                                type="button"
                                onClick={() => setReactivateModalUser(null)}
                                className="px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmReactivate}
                                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                                Reactivate Account
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </WorkspaceLayout>
    );
}
