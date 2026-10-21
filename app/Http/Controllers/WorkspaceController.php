<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\Item;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    /**
     * Display the Kanban Board view for a workspace.
     */
    public function board(Request $request, string $slug = 'engineering'): Response
    {
        $workspace = Workspace::where('slug', $slug)->with('folders.customFieldDefinitions')->firstOrFail();

        // Get active folder or default to first
        $folderId = $request->query('folder_id');
        $activeFolder = $folderId
            ? $workspace->folders->firstWhere('id', (int) $folderId)
            : $workspace->folders->first();

        if (! $activeFolder && $workspace->folders->isNotEmpty()) {
            $activeFolder = $workspace->folders->first();
        }

        // Fetch top-level items and subitems with eager loading
        $items = Item::where('folder_id', $activeFolder?->id)
            ->with([
                'parent:id,code,title',
                'subtasks:id,parent_id,code,title,status,priority,assignee_id,order_index',
                'assignee:id,name,email',
                'creator:id,name,email',
                'media',
            ])
            ->orderBy('order_index')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'folder_id' => $item->folder_id,
                    'parent_id' => $item->parent_id,
                    'parent' => $item->parent ? [
                        'id' => $item->parent->id,
                        'code' => $item->parent->code,
                        'title' => $item->parent->title,
                    ] : null,
                    'code' => $item->code,
                    'title' => $item->title,
                    'description' => $item->description,
                    'status' => $item->status,
                    'priority' => $item->priority,
                    'assignee_id' => $item->assignee_id,
                    'assignee' => $item->assignee ? [
                        'id' => $item->assignee->id,
                        'name' => $item->assignee->name,
                        'email' => $item->assignee->email,
                    ] : null,
                    'creator' => $item->creator ? [
                        'id' => $item->creator->id,
                        'name' => $item->creator->name,
                    ] : null,
                    'start_date' => $item->start_date?->format('Y-m-d'),
                    'due_date' => $item->due_date?->format('Y-m-d'),
                    'deadline' => $item->deadline?->toISOString(),
                    'size' => $item->size,
                    'impact' => $item->impact,
                    'fields_data' => $item->fields_data ?? [],
                    'order_index' => $item->order_index,
                    'subtasks_count' => $item->subtasks_count,
                    'completed_subtasks_count' => $item->completed_subtasks_count,
                    'subtasks' => $item->subtasks,
                    'attachments' => $item->getMedia('attachments')->map(fn ($media) => [
                        'id' => $media->id,
                        'name' => $media->file_name,
                        'file_name' => $media->file_name,
                        'size' => $media->size,
                        'human_size' => $media->human_readable_size,
                        'mime_type' => $media->mime_type,
                        'url' => $media->getUrl(),
                        'created_at' => $media->created_at->toISOString(),
                    ]),
                    'created_at' => $item->created_at->toISOString(),
                    'updated_at' => $item->updated_at->toISOString(),
                ];
            });

        // Filter active assignees using User::active()
        $assignees = User::active()->get(['id', 'name', 'email']);

        // All accessible workspaces for navigation
        $workspaces = Workspace::with('folders')->get(['id', 'name', 'slug', 'is_private']);

        return Inertia::render('workspace/board', [
            'workspace' => $workspace,
            'workspaces' => $workspaces,
            'activeFolder' => $activeFolder,
            'customFields' => $activeFolder?->customFieldDefinitions ?? [],
            'items' => $items,
            'assignees' => $assignees,
        ]);
    }
}
