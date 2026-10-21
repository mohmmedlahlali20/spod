import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import * as Popover from '@radix-ui/react-popover';
import {
    Bold,
    Italic,
    Code,
    List,
    ListOrdered,
    Link as LinkIcon,
    Smile,
    Sparkles,
    Undo2,
    Redo2,
    Check,
    X,
} from 'lucide-react';

interface TiptapEditorProps {
    initialContent?: string | null;
    onSave: (contentJson: string) => void;
    onCancel?: () => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
    initialContent,
    onSave,
    onCancel,
}) => {
    const [isDirty, setIsDirty] = useState(false);
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
    const [aiPromptOpen, setAiPromptOpen] = useState(false);

    // Parse initial content safely (can be JSON or plain text)
    const parseInitialContent = (content?: string | null) => {
        if (!content) {
            return {
                type: 'doc',
                content: [{ type: 'paragraph' }],
            };
        }
        try {
            return JSON.parse(content);
        } catch {
            return {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: content }],
                    },
                ],
            };
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: {
                    HTMLAttributes: {
                        class: 'bg-muted/80 rounded-md p-3 font-mono text-xs',
                    },
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder: 'Add a description or paste rich specifications...',
            }),
        ],
        content: parseInitialContent(initialContent),
        onUpdate: () => {
            setIsDirty(true);
        },
    });

    useEffect(() => {
        if (editor && initialContent !== undefined) {
            const currentJson = JSON.stringify(editor.getJSON());
            if (initialContent && initialContent !== currentJson) {
                editor.commands.setContent(parseInitialContent(initialContent));
                setIsDirty(false);
            }
        }
    }, [initialContent, editor]);

    if (!editor) {
        return <div className="h-28 rounded-lg bg-muted/20 animate-pulse" />;
    }

    const handleSave = () => {
        const json = JSON.stringify(editor.getJSON());
        onSave(json);
        setIsDirty(false);
    };

    const handleCancel = () => {
        editor.commands.setContent(parseInitialContent(initialContent));
        setIsDirty(false);
        if (onCancel) onCancel();
    };

    const openLinkDialog = () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        setLinkText(selectedText || '');
        setLinkUrl(editor.getAttributes('link').href || '');
        setLinkPopoverOpen(true);
    };

    const applyLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkUrl) {
            editor.chain().focus().unsetLink().run();
            setLinkPopoverOpen(false);
            return;
        }

        if (linkText && !editor.state.selection.empty) {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl })
                .run();
        } else if (linkText) {
            editor
                .chain()
                .focus()
                .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
                .run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl })
                .run();
        }

        setLinkPopoverOpen(false);
        setLinkText('');
        setLinkUrl('');
    };

    const insertEmoji = (emoji: string) => {
        editor.chain().focus().insertContent(emoji).run();
        setEmojiPopoverOpen(false);
    };

    const applyAiTemplate = (templateType: string) => {
        let templateContent = '';
        if (templateType === 'criteria') {
            templateContent = `<h3>Acceptance Criteria</h3><ul><li>Given a valid user session, when they visit the dashboard, then data loads under 500ms.</li><li>All edge error cases display clear alert toasts.</li><li>State changes are persisted immediately.</li></ul>`;
        } else if (templateType === 'summary') {
            templateContent = `<h3>Summary & Scope</h3><p>Comprehensive refactoring to improve system resilience, remove dead code, and ensure adherence to security standards.</p>`;
        } else if (templateType === 'test_cases') {
            templateContent = `<h3>Test Scenarios</h3><ol><li>Verify role permission enforcement for non-admin accounts.</li><li>Validate file size limit rejects uploads exceeding 20MB.</li><li>Ensure suspended accounts receive immediate 403 redirect.</li></ol>`;
        }

        editor.chain().focus().insertContent(templateContent).run();
        setAiPromptOpen(false);
    };

    return (
        <div className="space-y-3">
            {/* Bordered Container with Top Toolbar */}
            <div className="border border-border/80 rounded-xl overflow-hidden bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-2xs">
                {/* Top Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border/60 bg-muted/20">
                    {/* AI Prompt Trigger */}
                    <Popover.Root open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
                        <Popover.Trigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition-colors mr-1"
                                title="AI Assistant Prompt"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>AI Assistant</span>
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                className="z-50 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
                                sideOffset={5}
                            >
                                <div className="text-xs font-semibold px-2 py-1 text-muted-foreground uppercase tracking-wider">
                                    Generate Content
                                </div>
                                <div className="space-y-1 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => applyAiTemplate('criteria')}
                                        className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors flex items-center justify-between"
                                    >
                                        <span>Draft Acceptance Criteria</span>
                                        <Sparkles className="h-3 w-3 text-purple-500" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyAiTemplate('summary')}
                                        className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors flex items-center justify-between"
                                    >
                                        <span>Generate Executive Summary</span>
                                        <Sparkles className="h-3 w-3 text-purple-500" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyAiTemplate('test_cases')}
                                        className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors flex items-center justify-between"
                                    >
                                        <span>Create Test Cases</span>
                                        <Sparkles className="h-3 w-3 text-purple-500" />
                                    </button>
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>

                    <div className="h-4 w-px bg-border/60 mx-1" />

                    {/* Bold */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded-md text-xs transition-colors ${
                            editor.isActive('bold')
                                ? 'bg-primary/15 text-primary font-bold'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </button>

                    {/* Italic */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded-md text-xs transition-colors ${
                            editor.isActive('italic')
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </button>

                    {/* Code Block */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`p-1.5 rounded-md text-xs transition-colors ${
                            editor.isActive('codeBlock')
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Code Block"
                    >
                        <Code className="h-3.5 w-3.5" />
                    </button>

                    <div className="h-4 w-px bg-border/60 mx-1" />

                    {/* Bullet List */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded-md text-xs transition-colors ${
                            editor.isActive('bulletList')
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Bullet List"
                    >
                        <List className="h-3.5 w-3.5" />
                    </button>

                    {/* Ordered List */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-1.5 rounded-md text-xs transition-colors ${
                            editor.isActive('orderedList')
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                        title="Numbered List"
                    >
                        <ListOrdered className="h-3.5 w-3.5" />
                    </button>

                    {/* 2-Input Link Popover */}
                    <Popover.Root open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
                        <Popover.Trigger asChild>
                            <button
                                type="button"
                                onClick={openLinkDialog}
                                className={`p-1.5 rounded-md text-xs transition-colors ${
                                    editor.isActive('link')
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                                title="Insert Link"
                            >
                                <LinkIcon className="h-3.5 w-3.5" />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                className="z-50 w-80 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
                                sideOffset={5}
                            >
                                <form onSubmit={applyLink} className="space-y-2.5">
                                    <div className="text-xs font-semibold text-foreground">Add link</div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-muted-foreground">Text to display</label>
                                        <input
                                            type="text"
                                            value={linkText}
                                            onChange={(e) => setLinkText(e.target.value)}
                                            placeholder="Link description"
                                            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-muted-foreground">URL</label>
                                        <input
                                            type="url"
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setLinkPopoverOpen(false)}
                                            className="px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-xs"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </form>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>

                    {/* Emoji Popover */}
                    <Popover.Root open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
                        <Popover.Trigger asChild>
                            <button
                                type="button"
                                className="p-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title="Insert Emoji"
                            >
                                <Smile className="h-3.5 w-3.5" />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                className="z-50 w-52 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95"
                                sideOffset={5}
                            >
                                <div className="grid grid-cols-6 gap-1 p-1 text-base">
                                    {['👍', '🚀', '🔥', '🎉', '✅', '⚠️', '💡', '📌', '⚡', '💻', '📈', '🔒'].map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => insertEmoji(emoji)}
                                            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>

                    <div className="flex-1" />

                    {/* Undo / Redo */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="p-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Undo"
                    >
                        <Undo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="p-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Redo"
                    >
                        <Redo2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Editor Surface */}
                <div className="p-4 min-h-[140px] text-sm text-foreground bg-background">
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/* Save / Cancel buttons when dirty */}
            {isDirty && (
                <div className="flex items-center gap-2 animate-in fade-in-50 duration-200">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <Check className="h-3.5 w-3.5" />
                        <span>Save</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
                    >
                        <X className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                    </button>
                </div>
            )}
        </div>
    );
};
