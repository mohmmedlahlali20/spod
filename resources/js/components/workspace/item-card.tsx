import React from 'react';
import { Item, PriorityLevel } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CheckSquare,
    Bookmark,
    ChevronsUp,
    ChevronUp,
    Equal,
    ChevronDown,
    GitFork,
    ChevronRight,
    Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ItemCardProps {
    item: Item;
    onClick: (item: Item) => void;
}

export const PriorityIcon: React.FC<{ priority: PriorityLevel; className?: string }> = ({ priority, className }) => {
    switch (priority) {
        case 'urgent':
            return (
                <span title="Urgent">
                    <ChevronsUp className={`h-4 w-4 text-red-500 ${className || ''}`} />
                </span>
            );
        case 'high':
            return (
                <span title="High">
                    <ChevronUp className={`h-4 w-4 text-orange-500 ${className || ''}`} />
                </span>
            );
        case 'normal':
            return (
                <span title="Normal">
                    <Equal className={`h-4 w-4 text-amber-500 ${className || ''}`} />
                </span>
            );
        case 'low':
            return (
                <span title="Low">
                    <ChevronDown className={`h-4 w-4 text-blue-500 ${className || ''}`} />
                </span>
            );
        default:
            return <Equal className={`h-4 w-4 text-muted-foreground ${className || ''}`} />;
    }
};

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id.toString(),
        data: { item },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    // Subitem check
    const isSubitem = !!item.parent_id && !!item.parent;
    // Issue type icon: green Bookmark for story/parent or blue CheckSquare for task
    const isStory = !item.parent_id && (item.subtasks_count > 0 || item.code.includes('ENG-12'));

    // Initials for avatar
    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(item)}
            className="group bg-card rounded-xl border border-border/60 shadow-xs hover:shadow-md p-3.5 space-y-2 cursor-pointer transition-all hover:border-border duration-150 relative select-none"
        >
            {/* Parent Indicator if subitem */}
            {isSubitem && item.parent && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                    <span className="text-primary font-semibold">↳</span>
                    <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                        {item.parent.code}
                    </span>
                    <span className="truncate max-w-[170px]">{item.parent.title}</span>
                </div>
            )}

            {/* Title */}
            <div className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
            </div>

            {/* Due date if available */}
            {item.due_date && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due {formatDate(item.due_date)}</span>
                </div>
            )}

            {/* Subtasks row if subtasks exist */}
            {item.subtasks_count > 0 && (
                <div className="flex items-center justify-between text-[11px] bg-muted/30 dark:bg-muted/15 px-2 py-1 rounded-md text-muted-foreground border border-border/30">
                    <div className="flex items-center gap-1.5">
                        <GitFork className="h-3 w-3 text-primary" />
                        <span className="font-medium">Subtasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded text-[10px]">
                            {item.completed_subtasks_count}/{item.subtasks_count}
                        </span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/70" />
                    </div>
                </div>
            )}

            {/* Bottom row: type icon + code on left; priority + avatar on right */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                    {isStory ? (
                        <span title="Story">
                            <Bookmark className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600/20" />
                        </span>
                    ) : (
                        <span title="Task">
                            <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                        </span>
                    )}
                    <span className="text-xs font-mono font-medium text-muted-foreground tracking-tight">
                        {item.code}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <PriorityIcon priority={item.priority} />

                    {item.assignee ? (
                        <div
                            title={item.assignee.name}
                            className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center ring-1 ring-border/50"
                        >
                            {getInitials(item.assignee.name)}
                        </div>
                    ) : (
                        <div
                            title="Unassigned"
                            className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground text-[9px] flex items-center justify-center"
                        >
                            ?
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
