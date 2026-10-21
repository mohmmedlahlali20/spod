import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
    Item,
    User,
    Folder,
    CustomFieldDefinition,
    Attachment,
    PriorityLevel,
    ActivityEntry,
} from '@/types';
import { router } from '@inertiajs/react';
import {
    X,
    ExternalLink,
    Calendar,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Trash2,
    Paperclip,
    Upload,
    Download,
    Eye,
    MessageSquare,
    History,
    Plus,
    UserCheck,
    Mail,
    Phone,
    FileText,
    Clock,
    AlertCircle,
    Check,
} from 'lucide-react';
import { TiptapEditor } from './tiptap-editor';
import { PriorityIcon } from './item-card';
import { FilePreviewModal } from './file-preview-modal';
import { formatDate, formatDateTime } from '@/lib/utils';

interface ItemSheetProps {
    item: Item | null;
    open: boolean;
    onClose: () => void;
    folder?: Folder;
    customFields?: CustomFieldDefinition[];
    assignees: User[];
    onItemUpdated: (updatedItem: Partial<Item>) => void;
}

export const ItemSheet: React.FC<ItemSheetProps> = ({
    item,
    open,
    onClose,
    folder,
    customFields = [],
    assignees,
    onItemUpdated,
}) => {
    if (!item) return null;

    const [title, setTitle] = useState(item.title);
    const [status, setStatus] = useState(item.status);
    const [priority, setPriority] = useState<PriorityLevel>(item.priority);
    const [assigneeId, setAssigneeId] = useState<number | ''>(item.assignee_id || '');
    const [startDate, setStartDate] = useState(item.start_date || '');
    const [dueDate, setDueDate] = useState(item.due_date || '');
    const [fieldsData, setFieldsData] = useState<Record<string, any>>(item.fields_data || {});

    // Subitems
    const [subtasks, setSubtasks] = useState(item.subtasks || []);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState<Attachment[]>(item.attachments || []);
    const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Activity & Comments
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentsList, setCommentsList] = useState<Array<{ id: number; author: string; text: string; date: string }>>([]);

    // UI state
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

    // Sync when item changes
    useEffect(() => {
        setTitle(item.title);
        setStatus(item.status);
        setPriority(item.priority);
        setAssigneeId(item.assignee_id || '');
        setStartDate(item.start_date || '');
        setDueDate(item.due_date || '');
        setFieldsData(item.fields_data || {});
        setSubtasks(item.subtasks || []);
        setAttachments(item.attachments || []);
        loadActivity(item.id);
    }, [item.id]);

    const loadActivity = async (itemId: number) => {
        setLoadingActivity(true);
        try {
            const res = await fetch(`/items/${itemId}/activity`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (err) {
            console.error('Failed to load activity', err);
        } finally {
            setLoadingActivity(false);
        }
    };

    // Auto-save item attributes
    const saveField = (key: string, value: any) => {
        setSaveStatus('saving');
        onItemUpdated({ [key]: value });

        router.put(
            `/items/${item.id}`,
            { [key]: value },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSaveStatus('saved');
                    loadActivity(item.id);
                },
                onError: () => {
                    setSaveStatus('saved');
                },
            }
        );
    };

    const handleTitleBlur = () => {
        if (title.trim() && title !== item.title) {
            saveField('title', title.trim());
        }
    };

    const handleDescriptionSave = (contentJson: string) => {
        saveField('description', contentJson);
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        saveField('status', newStatus);
    };

    const handlePriorityChange = (newPriority: PriorityLevel) => {
        setPriority(newPriority);
        saveField('priority', newPriority);
    };

    const handleAssigneeChange = (newId: string) => {
        const id = newId === '' ? null : Number(newId);
        setAssigneeId(newId === '' ? '' : Number(newId));
        saveField('assignee_id', id);
    };

    const handleCustomFieldChange = (key: string, val: any) => {
        const updated = { ...fieldsData, [key]: val };
        setFieldsData(updated);
        saveField('fields_data', updated);
    };

    // Subtasks handling
    const toggleSubtask = (subtaskId: number, currentStatus: string) => {
        const newSubStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
        const updated = subtasks.map((st) =>
            st.id === subtaskId ? { ...st, status: newSubStatus } : st
        );
        setSubtasks(updated);

        router.put(
            `/items/${subtaskId}`,
            { status: newSubStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    loadActivity(item.id);
                },
            }
        );
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        router.post(
            `/items/${item.id}/subtasks`,
            {
                title: newSubtaskTitle.trim(),
                priority: 'normal',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setNewSubtaskTitle('');
                    setIsAddingSubtask(false);
                    loadActivity(item.id);
                },
            }
        );
    };

    // Attachments handling
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        router.post(`/items/${item.id}/attachments`, formData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                loadActivity(item.id);
            },
        });
    };

    const handleDeleteAttachment = (mediaId: number) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;

        router.delete(`/items/${item.id}/attachments/${mediaId}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setAttachments((prev) => prev.filter((a) => a.id !== mediaId));
                loadActivity(item.id);
            },
        });
    };

    // Comments handling
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const commentText = newComment.trim();
        setNewComment('');

        try {
            const res = await fetch(`/items/${item.id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                        '',
                },
                body: JSON.stringify({ comment: commentText }),
            });

            if (res.ok) {
                setCommentsList((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        author: 'You',
                        text: commentText,
                        date: 'Just now',
                    },
                ]);
                loadActivity(item.id);
            }
        } catch (err) {
            console.error('Error posting comment', err);
        }
    };

    // Delete item
    const handleDeleteItem = () => {
        if (confirm(`Are you sure you want to delete ${item.code}? This action cannot be undone.`)) {
            router.delete(`/items/${item.id}`, {
                onSuccess: () => onClose(),
            });
        }
    };

    const completedSubCount = subtasks.filter((s) => s.status === 'Done').length;
    const progressPercent = subtasks.length > 0 ? Math.round((completedSubCount / subtasks.length) * 100) : 0;

    return (
        <>
            <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
                        {/* Centered Constrained Modal */}
                        <Dialog.Content className="max-w-5xl xl:max-w-6xl w-full mx-auto my-auto max-h-[90vh] rounded-xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200">
                            {/* Top Bar: Breadcrumb path, creation date, full page link, close X */}
                            <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/70 bg-muted/20 select-none">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-semibold uppercase tracking-wider text-foreground/80">
                                        {folder?.name || 'Workspace'}
                                    </span>
                                    <span>/</span>
                                    <span className="font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                                        {item.code}
                                    </span>
                                    <span className="text-border">|</span>
                                    <span className="flex items-center gap-1 text-[11px]">
                                        <Clock className="h-3 w-3" />
                                        <span>Created {formatDateTime(item.created_at)}</span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => window.open(window.location.href, '_blank')}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        title="Open full page"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                    <Dialog.Close asChild>
                                        <button
                                            type="button"
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            title="Close (Esc)"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </Dialog.Close>
                                </div>
                            </div>

                            {/* 2-Column Layout */}
                            <div className="flex flex-1 overflow-hidden">
                                {/* Left Work Area (65% width) */}
                                <div className="w-[65%] flex-1 overflow-y-auto p-6 space-y-6 border-r border-border/50">
                                    {/* Bold auto-resizing heading for title */}
                                    <div>
                                        <textarea
                                            rows={1}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onBlur={handleTitleBlur}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            placeholder="Issue title"
                                            className="w-full text-xl font-bold tracking-tight bg-transparent border-0 focus:ring-0 p-0 text-foreground resize-none outline-none leading-snug placeholder:text-muted-foreground/40 hover:bg-muted/10 rounded transition-colors"
                                        />
                                    </div>

                                    {/* Jira Tiptap Description Editor */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Description
                                        </label>
                                        <TiptapEditor
                                            initialContent={item.description}
                                            onSave={handleDescriptionSave}
                                        />
                                    </div>

                                    {/* Subitems checklist card with progress bar */}
                                    <div className="border border-border/80 rounded-xl p-4 bg-card/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Subtasks
                                                </h4>
                                                <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    {completedSubCount}/{subtasks.length} completed
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setIsAddingSubtask(true)}
                                                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                <span>Add subtask</span>
                                            </button>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-300"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>

                                        {/* Checklist */}
                                        <div className="space-y-1.5 pt-1">
                                            {subtasks.map((sub) => {
                                                const isDone = sub.status === 'Done';
                                                return (
                                                    <div
                                                        key={sub.id}
                                                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40"
                                                    >
                                                        {/* Circular check toggle */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSubtask(sub.id, sub.status)}
                                                            className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                                                                isDone
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                    : 'border-muted-foreground/60 hover:border-primary'
                                                            }`}
                                                        >
                                                            {isDone && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                                        </button>

                                                        {/* Monospace Code badge */}
                                                        <span className="font-mono text-[11px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                                            {sub.code}
                                                        </span>

                                                        {/* Strikethrough styling */}
                                                        <span
                                                            className={`text-xs flex-1 truncate transition-colors ${
                                                                isDone
                                                                    ? 'line-through text-muted-foreground/70'
                                                                    : 'text-foreground font-medium'
                                                            }`}
                                                        >
                                                            {sub.title}
                                                        </span>

                                                        <PriorityIcon priority={sub.priority} className="opacity-70" />
                                                    </div>
                                                );
                                            })}

                                            {/* Inline add input */}
                                            {isAddingSubtask && (
                                                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-2">
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={newSubtaskTitle}
                                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                        placeholder="What needs to be done?"
                                                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-primary/50 bg-background outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAddingSubtask(false);
                                                            setNewSubtaskTitle('');
                                                        }}
                                                        className="px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>

                                    {/* Attachments 2-column grid */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Attachments ({attachments.length})
                                                </h4>
                                            </div>

                                            <div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    id="file-upload-input"
                                                />
                                                <label
                                                    htmlFor="file-upload-input"
                                                    className="cursor-pointer text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                                >
                                                    <Upload className="h-3.5 w-3.5" />
                                                    <span>Upload file</span>
                                                </label>
                                            </div>
                                        </div>

                                        {attachments.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {attachments.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="group bg-card border border-border/80 rounded-xl p-3 flex items-center gap-3 hover:border-primary/50 transition-all shadow-2xs"
                                                    >
                                                        <div
                                                            onClick={() => setPreviewFile(file)}
                                                            className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden border border-border/40"
                                                        >
                                                            {file.mime_type?.startsWith('image/') ? (
                                                                <img
                                                                    src={file.url}
                                                                    alt={file.file_name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <FileText className="h-5 w-5 text-primary" />
                                                            )}
                                                        </div>

                                                        <div
                                                            onClick={() => setPreviewFile(file)}
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                        >
                                                            <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                                {file.file_name}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {file.human_size || `${Math.round(file.size / 1024)} KB`}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPreviewFile(file)}
                                                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                title="Preview"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </button>
                                                            <a
                                                                href={file.url}
                                                                download
                                                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                title="Download"
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAttachment(file.id)}
                                                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border border-dashed border-border/80 rounded-xl p-5 text-center text-xs text-muted-foreground">
                                                No attachments yet. Drop files or click "Upload file" to attach.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Sidebar (35% width, w-80 lg:w-96) */}
                                <div className="w-[35%] w-80 lg:w-96 border-l border-border/60 bg-muted/10 p-5 space-y-5 overflow-y-auto flex flex-col justify-between">
                                    <div className="space-y-5">
                                        {/* Collapsible Jira Accordion ("Details") */}
                                        <Collapsible.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
                                            <Collapsible.Trigger className="w-full flex items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                                                <span>Details</span>
                                                {detailsOpen ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </Collapsible.Trigger>

                                            <Collapsible.Content className="pt-3 space-y-3.5">
                                                {/* Status Row */}
                                                <div className="grid grid-cols-3 items-center text-xs">
                                                    <span className="text-muted-foreground font-medium">Status</span>
                                                    <div className="col-span-2">
                                                        <select
                                                            value={status}
                                                            onChange={(e) => handleStatusChange(e.target.value)}
                                                            className="w-full text-xs font-medium py-1 px-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                        >
                                                            <option value="Backlog">Backlog</option>
                                                            <option value="Todo">To Do</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="In Review">In Review</option>
                                                            <option value="Done">Done</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Priority Row */}
                                                <div className="grid grid-cols-3 items-center text-xs">
                                                    <span className="text-muted-foreground font-medium">Priority</span>
                                                    <div className="col-span-2">
                                                        <select
                                                            value={priority}
                                                            onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
                                                            className="w-full text-xs font-medium py-1 px-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none capitalize"
                                                        >
                                                            <option value="urgent">🔴 Urgent</option>
                                                            <option value="high">🟠 High</option>
                                                            <option value="normal">🟡 Normal</option>
                                                            <option value="low">🔵 Low</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Assignee Row */}
                                                <div className="grid grid-cols-3 items-center text-xs">
                                                    <span className="text-muted-foreground font-medium">Assignee</span>
                                                    <div className="col-span-2">
                                                        <select
                                                            value={assigneeId}
                                                            onChange={(e) => handleAssigneeChange(e.target.value)}
                                                            className="w-full text-xs font-medium py-1 px-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {assignees.map((user) => (
                                                                <option key={user.id} value={user.id}>
                                                                    {user.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Dates Rows */}
                                                <div className="grid grid-cols-3 items-center text-xs">
                                                    <span className="text-muted-foreground font-medium">Start Date</span>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => {
                                                                setStartDate(e.target.value);
                                                                saveField('start_date', e.target.value || null);
                                                            }}
                                                            className="w-full text-xs py-1 px-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 items-center text-xs">
                                                    <span className="text-muted-foreground font-medium">Due Date</span>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="date"
                                                            value={dueDate}
                                                            onChange={(e) => {
                                                                setDueDate(e.target.value);
                                                                saveField('due_date', e.target.value || null);
                                                            }}
                                                            className="w-full text-xs py-1 px-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dynamic custom fields (e.g. condidat_mail, condidat_phone, condidat_disponibilte) */}
                                                {customFields.map((field) => {
                                                    const value = fieldsData[field.key] || '';
                                                    return (
                                                        <div key={field.id} className="grid grid-cols-3 items-center text-xs">
                                                            <span className="text-muted-foreground font-medium truncate" title={field.name}>
                                                                {field.name}
                                                            </span>
                                                            <div className="col-span-2">
                                                                {field.type === 'email' ? (
                                                                    <div className="relative">
                                                                        <Mail className="h-3 w-3 absolute left-2 top-2 text-muted-foreground" />
                                                                        <input
                                                                            type="email"
                                                                            value={value}
                                                                            onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                                                            placeholder="candidate@example.com"
                                                                            className="w-full text-xs py-1 pl-7 pr-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                                        />
                                                                    </div>
                                                                ) : field.type === 'phone' ? (
                                                                    <div className="relative">
                                                                        <Phone className="h-3 w-3 absolute left-2 top-2 text-muted-foreground" />
                                                                        <input
                                                                            type="tel"
                                                                            value={value}
                                                                            onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                                                            placeholder="+1 (555) 000-0000"
                                                                            className="w-full text-xs py-1 pl-7 pr-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                                        />
                                                                    </div>
                                                                ) : field.type === 'file' ? (
                                                                    <div className="flex items-center gap-1.5 p-1 border border-border rounded-md bg-background text-xs truncate">
                                                                        <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                        <span className="truncate text-muted-foreground">
                                                                            {value || 'No file selected'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={value}
                                                                        onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                                                        placeholder={`Enter ${field.name.toLowerCase()}`}
                                                                        className="w-full text-xs py-1 px-2 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </Collapsible.Content>
                                        </Collapsible.Root>

                                        {/* Activity & Comments Tabs */}
                                        <Tabs.Root defaultValue="activity" className="pt-2">
                                            <Tabs.List className="flex border-b border-border text-xs mb-3">
                                                <Tabs.Trigger
                                                    value="activity"
                                                    className="px-3 py-1.5 font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                                                >
                                                    <History className="h-3.5 w-3.5" />
                                                    <span>Activity</span>
                                                </Tabs.Trigger>
                                                <Tabs.Trigger
                                                    value="comments"
                                                    className="px-3 py-1.5 font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    <span>Comments</span>
                                                </Tabs.Trigger>
                                            </Tabs.List>

                                            {/* Human-readable Activity Tab */}
                                            <Tabs.Content value="activity" className="space-y-3">
                                                {loadingActivity ? (
                                                    <div className="text-xs text-muted-foreground animate-pulse py-2">
                                                        Loading audit history...
                                                    </div>
                                                ) : activities.length > 0 ? (
                                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                                        {activities.map((act) => (
                                                            <div key={act.id} className="text-xs space-y-1 bg-card/50 p-2 rounded-lg border border-border/40">
                                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                                    <span className="font-semibold text-foreground">
                                                                        {act.causer.name}
                                                                    </span>
                                                                    <span>{act.created_at}</span>
                                                                </div>
                                                                <div className="text-foreground/90 font-medium">
                                                                    {act.description}
                                                                </div>
                                                                {act.changes && act.changes.length > 0 && (
                                                                    <div className="space-y-0.5 pt-1 border-t border-border/30 text-[11px]">
                                                                        {act.changes.map((ch, idx) => (
                                                                            <div key={idx} className="text-muted-foreground flex items-center gap-1">
                                                                                <span className="font-medium text-foreground">{ch.field}:</span>
                                                                                <span className="line-through opacity-70">{ch.old || 'none'}</span>
                                                                                <span>→</span>
                                                                                <span className="text-primary font-medium">{ch.new}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-muted-foreground py-2">
                                                        No activity recorded yet.
                                                    </div>
                                                )}
                                            </Tabs.Content>

                                            {/* Comments Tab */}
                                            <Tabs.Content value="comments" className="space-y-3">
                                                <form onSubmit={handleAddComment} className="space-y-2">
                                                    <textarea
                                                        rows={2}
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Write a comment..."
                                                        className="w-full text-xs p-2 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                                                    />
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="submit"
                                                            disabled={!newComment.trim()}
                                                            className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-2xs"
                                                        >
                                                            Comment
                                                        </button>
                                                    </div>
                                                </form>

                                                {/* Comments history */}
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {commentsList.map((comm) => (
                                                        <div key={comm.id} className="text-xs p-2 rounded-lg bg-card border border-border/40 space-y-1">
                                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                                <span className="font-semibold text-foreground">{comm.author}</span>
                                                                <span>{comm.date}</span>
                                                            </div>
                                                            <p className="text-foreground">{comm.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Tabs.Content>
                                        </Tabs.Root>
                                    </div>

                                    {/* Footer with "All changes saved" checkmark and red ghost Delete button */}
                                    <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            {saveStatus === 'saving' ? (
                                                <>
                                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                                                    <span>Saving changes...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span className="text-[11px]">All changes saved</span>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleDeleteItem}
                                            className="px-2.5 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-1"
                                            title="Delete issue"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Dialog.Content>
                    </Dialog.Overlay>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Interactive File Preview Lightbox */}
            <FilePreviewModal
                file={previewFile}
                open={!!previewFile}
                onClose={() => setPreviewFile(null)}
            />
        </>
    );
};
