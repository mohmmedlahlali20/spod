import React, { useState } from 'react';
import { Item } from '@/types';
import { ItemCard } from './item-card';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanColumnProps {
    status: string;
    items: Item[];
    onItemClick: (item: Item) => void;
    onQuickAdd: (status: string, title: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    status,
    items,
    onItemClick,
    onQuickAdd,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim()) {
            onQuickAdd(status, newTitle.trim());
            setNewTitle('');
            setIsAdding(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsAdding(false);
            setNewTitle('');
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`w-72 shrink-0 bg-muted/40 dark:bg-muted/20 rounded-xl p-2.5 flex flex-col transition-colors duration-150 ${
                isOver ? 'ring-2 ring-primary/40 bg-muted/60' : ''
            }`}
        >
            {/* Header with status title, count badge, and options menu */}
            <div className="flex items-center justify-between px-1 py-1.5 mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {status}
                    </h3>
                    <span className="bg-background text-foreground/80 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-2xs border border-border/40">
                        {items.length}
                    </span>
                </div>

                <button
                    type="button"
                    className="h-6 w-6 rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            {/* Drag-and-drop card stack */}
            <div className="space-y-2.5 min-h-[40px]">
                <SortableContext
                    items={items.map((i) => i.id.toString())}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item) => (
                        <ItemCard key={item.id} item={item} onClick={onItemClick} />
                    ))}
                </SortableContext>

                {/* Inline Quick Add Input if active */}
                {isAdding ? (
                    <form onSubmit={handleCreate} className="bg-card rounded-xl border border-primary/40 p-3 shadow-xs space-y-2">
                        <textarea
                            autoFocus
                            rows={2}
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What needs to be done?"
                            className="w-full text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground/60"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewTitle('');
                                }}
                                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-xs"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Compact dashed centered + button directly beneath the last card in the column flow (never pinned to the bottom via mt-auto) */
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="h-8 w-full border border-dashed border-border/80 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors gap-1.5 text-xs font-medium"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create issue</span>
                    </button>
                )}
            </div>
        </div>
    );
};
