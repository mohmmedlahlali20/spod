import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Attachment } from '@/types';
import { X, Download, FileText, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface FilePreviewModalProps {
    file: Attachment | null;
    open: boolean;
    onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, open, onClose }) => {
    const [zoom, setZoom] = React.useState(1);

    if (!file) return null;

    const isPdf =
        file.mime_type?.includes('pdf') ||
        file.name?.toLowerCase().endsWith('.pdf') ||
        file.file_name?.toLowerCase().endsWith('.pdf');

    const isImage =
        file.mime_type?.startsWith('image/') ||
        ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].some((ext) =>
            file.file_name?.toLowerCase().endsWith(ext)
        );

    return (
        <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-5xl h-[88vh] bg-background border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/20">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <Dialog.Title className="text-sm font-semibold text-foreground truncate">
                                {file.file_name || file.name}
                            </Dialog.Title>
                            <span className="text-xs text-muted-foreground shrink-0">
                                ({file.human_size || `${Math.round(file.size / 1024)} KB`})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isImage && (
                                <div className="flex items-center bg-muted/60 rounded-lg p-0.5 mr-2">
                                    <button
                                        type="button"
                                        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="text-[11px] font-mono px-1.5 text-muted-foreground">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            <a
                                href={file.url}
                                download
                                className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                            </a>

                            <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="h-8 w-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>

                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors ml-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </Dialog.Close>
                        </div>
                    </div>

                    {/* Preview Surface */}
                    <div className="flex-1 bg-muted/10 overflow-auto flex items-center justify-center p-4">
                        {isPdf ? (
                            <iframe
                                src={`${file.url}#toolbar=1`}
                                title={file.file_name}
                                className="w-full h-full rounded-xl border border-border/40 shadow-inner bg-card"
                            />
                        ) : isImage ? (
                            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
                                <img
                                    src={file.url}
                                    alt={file.file_name}
                                    style={{ transform: `scale(${zoom})` }}
                                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md transition-transform duration-150"
                                />
                            </div>
                        ) : (
                            <div className="text-center p-8 space-y-3">
                                <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h4 className="font-semibold text-foreground text-sm">
                                    No direct preview available for this file type
                                </h4>
                                <p className="text-xs text-muted-foreground max-w-sm">
                                    You can download the file to inspect its full contents locally.
                                </p>
                                <a
                                    href={file.url}
                                    download
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download File</span>
                                </a>
                            </div>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
