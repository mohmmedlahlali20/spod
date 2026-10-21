import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Workspace, Folder, Item, User, CustomFieldDefinition } from '@/types';
import { WorkspaceLayout } from '@/components/workspace/workspace-layout';
import { KanbanColumn } from '@/components/workspace/kanban-column';
import { ItemSheet } from '@/components/workspace/item-sheet';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import { ItemCard } from '@/components/workspace/item-card';
import {
    FolderKanban,
    Search,
    Filter,
    Plus,
    X,
    SlidersHorizontal,
    Check,
} from 'lucide-react';

interface BoardProps {
    workspace: Workspace;
    workspaces: Workspace[];
    activeFolder?: Folder;
    customFields: CustomFieldDefinition[];
    items: Item[];
    assignees: User[];
}

const COLUMNS = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'];

export default function WorkspaceBoard({
    workspace,
    workspaces,
    activeFolder,
    customFields = [],
    items: initialItems,
    assignees,
}: BoardProps) {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<Item | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemStatus, setNewItemStatus] = useState('Backlog');

    // Update items state if props change
    React.useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    // Sensors for DnD Kit
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const id = Number(event.active.id);
        const item = items.find((i) => i.id === id);
        if (item) setActiveDragItem(item);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const activeId = Number(active.id);
        const overId = over.id.toString();

        // Determine destination column
        let newStatus = overId;
        // If dropped onto another item card rather than column container
        if (!COLUMNS.includes(overId)) {
            const overItem = items.find((i) => i.id === Number(overId));
            if (overItem) {
                newStatus = overItem.status;
            }
        }

        const draggedItem = items.find((i) => i.id === activeId);
        if (!draggedItem || draggedItem.status === newStatus) return;

        // Optimistic UI update
        const updated = items.map((item) =>
            item.id === activeId ? { ...item, status: newStatus } : item
        );
        setItems(updated);

        // Update server
        fetch(`/items/${activeId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                    '',
            },
            body: JSON.stringify({ status: newStatus }),
        });
    };

    const handleQuickAdd = (status: string, title: string) => {
        if (!activeFolder) return;

        router.post(
            '/items',
            {
                folder_id: activeFolder.id,
                title,
                status,
                priority: 'normal',
            },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleCreateModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim() || !activeFolder) return;

        router.post(
            '/items',
            {
                folder_id: activeFolder.id,
                title: newItemTitle.trim(),
                status: newItemStatus,
                priority: 'normal',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setNewItemTitle('');
                    setQuickCreateOpen(false);
                },
            }
        );
    };

    const handleItemUpdated = (changes: Partial<Item>) => {
        if (!selectedItem) return;
        const updatedItem = { ...selectedItem, ...changes };
        setSelectedItem(updatedItem);
        setItems((prev) =>
            prev.map((i) => (i.id === selectedItem.id ? { ...i, ...changes } : i))
        );
    };

    // Filter items
    const filteredItems = items.filter((item) => {
        const matchesSearch =
            searchQuery === '' ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAssignee =
            assigneeFilter === 'all' ||
            (assigneeFilter === 'unassigned' && !item.assignee_id) ||
            item.assignee_id?.toString() === assigneeFilter;

        return matchesSearch && matchesAssignee;
    });

    return (
        <WorkspaceLayout
            workspace={workspace}
            workspaces={workspaces}
            activeFolder={activeFolder}
            onQuickCreate={() => setQuickCreateOpen(true)}
        >
            <Head title={`${workspace.name} Board - PillotArk`} />

            {/* Folder Header & Sub-toolbar */}
            <div className="border-b border-border/70 bg-card/40 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {/* Active Folder Indicator */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FolderKanban className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold text-foreground">
                                    {activeFolder?.name || 'Board'}
                                </h1>
                                <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                                    {activeFolder?.prefix || 'ENG'}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {filteredItems.length} issues in view
                            </p>
                        </div>
                    </div>

                    {/* Folder Switcher Tabs if workspace has multiple folders */}
                    {workspace.folders && workspace.folders.length > 1 && (
                        <div className="flex items-center bg-muted/60 p-1 rounded-lg ml-4">
                            {workspace.folders.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() =>
                                        router.get(`/workspace/${workspace.slug}/board?folder_id=${f.id}`)
                                    }
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                        f.id === activeFolder?.id
                                            ? 'bg-card text-foreground shadow-2xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {f.name} ({f.prefix})
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filters & Search */}
                <div className="flex items-center gap-2.5">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by title or code..."
                            className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background w-52 focus:w-64 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/60"
                        />
                    </div>

                    {/* Assignee Filter */}
                    <div className="flex items-center">
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="all">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {assignees.map((user) => (
                                <option key={user.id} value={user.id.toString()}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Kanban Columns Canvas */}
            <div className="flex-1 overflow-x-auto p-6 bg-muted/5">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex items-start gap-4 h-full min-h-[500px]">
                        {COLUMNS.map((columnStatus) => {
                            const columnItems = filteredItems.filter(
                                (item) => item.status === columnStatus
                            );

                            return (
                                <KanbanColumn
                                    key={columnStatus}
                                    status={columnStatus}
                                    items={columnItems}
                                    onItemClick={(item) => setSelectedItem(item)}
                                    onQuickAdd={handleQuickAdd}
                                />
                            );
                        })}
                    </div>

                    <DragOverlay>
                        {activeDragItem ? (
                            <ItemCard item={activeDragItem} onClick={() => {}} />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Two-Column Item Details Inspector Modal */}
            <ItemSheet
                item={selectedItem}
                open={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                folder={activeFolder}
                customFields={customFields}
                assignees={assignees}
                onItemUpdated={handleItemUpdated}
            />

            {/* Quick Create Dialog */}
            {quickCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-foreground">
                                Create New Issue
                            </h3>
                            <button
                                type="button"
                                onClick={() => setQuickCreateOpen(false)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateModalSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Issue Title
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    placeholder="Summary of the issue"
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Initial Status
                                </label>
                                <select
                                    value={newItemStatus}
                                    onChange={(e) => setNewItemStatus(e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                >
                                    {COLUMNS.map((col) => (
                                        <option key={col} value={col}>
                                            {col}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setQuickCreateOpen(false)}
                                    className="px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
                                >
                                    Create Issue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </WorkspaceLayout>
    );
}
