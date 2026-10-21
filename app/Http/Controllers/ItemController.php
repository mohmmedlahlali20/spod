<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\User;
use App\Services\FormatItemActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity;

class ItemController extends Controller
{
    /**
     * Store a newly created item.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'folder_id' => 'required|exists:folders,id',
            'parent_id' => 'nullable|exists:items,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'priority' => 'required|in:urgent,high,normal,low',
            'assignee_id' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'size' => 'nullable|string|max:50',
            'impact' => 'nullable|string|max:50',
            'fields_data' => 'nullable|array',
            'order_index' => 'nullable|integer',
        ]);

        $creatorId = Auth::id() ?? User::active()->first()?->id ?? 1;
        $validated['creator_id'] = $creatorId;

        $item = Item::create($validated);

        activity()
            ->performedOn($item)
            ->causedBy(Auth::user())
            ->log('created this item');

        return back()->with('success', "Item {$item->code} created successfully.");
    }

    /**
     * Update an existing item.
     */
    public function update(Request $request, Item $item): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:urgent,high,normal,low',
            'assignee_id' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'size' => 'nullable|string|max:50',
            'impact' => 'nullable|string|max:50',
            'fields_data' => 'nullable|array',
            'order_index' => 'nullable|integer',
        ]);

        $item->update($validated);

        return back()->with('success', "Item {$item->code} updated successfully.");
    }

    /**
     * Quickly update item status (for Kanban drag & drop).
     */
    public function updateStatus(Request $request, Item $item): JsonResponse
    {
        $request->validate([
            'status' => 'required|string',
            'order_index' => 'nullable|integer',
        ]);

        $item->update([
            'status' => $request->status,
            'order_index' => $request->order_index ?? $item->order_index,
        ]);

        return response()->json([
            'success' => true,
            'item' => $item,
        ]);
    }

    /**
     * Add a subtask under an item.
     */
    public function storeSubtask(Request $request, Item $item): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'assignee_id' => 'nullable|exists:users,id',
            'priority' => 'nullable|in:urgent,high,normal,low',
        ]);

        $creatorId = Auth::id() ?? User::active()->first()?->id ?? 1;

        $subtask = Item::create([
            'folder_id' => $item->folder_id,
            'parent_id' => $item->id,
            'title' => $validated['title'],
            'status' => 'Todo',
            'priority' => $validated['priority'] ?? 'normal',
            'assignee_id' => $validated['assignee_id'] ?? null,
            'creator_id' => $creatorId,
            'order_index' => $item->subtasks()->count(),
        ]);

        activity()
            ->performedOn($item)
            ->causedBy(Auth::user())
            ->log("added subtask {$subtask->code}: {$subtask->title}");

        return back()->with('success', "Subtask {$subtask->code} created.");
    }

    /**
     * Delete an item.
     */
    public function destroy(Item $item): RedirectResponse
    {
        $code = $item->code;
        $item->delete();

        return back()->with('success', "Item {$code} deleted successfully.");
    }

    /**
     * Upload an attachment to the item.
     */
    public function uploadAttachment(Request $request, Item $item): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|max:20480', // 20MB max
        ]);

        $media = $item->addMediaFromRequest('file')
            ->toMediaCollection('attachments');

        activity()
            ->performedOn($item)
            ->causedBy(Auth::user())
            ->log("uploaded attachment {$media->file_name}");

        return back()->with('success', "File {$media->file_name} attached successfully.");
    }

    /**
     * Remove an attachment.
     */
    public function deleteAttachment(Item $item, int $mediaId): RedirectResponse
    {
        $media = $item->media()->findOrFail($mediaId);
        $fileName = $media->file_name;
        $media->delete();

        activity()
            ->performedOn($item)
            ->causedBy(Auth::user())
            ->log("removed attachment {$fileName}");

        return back()->with('success', 'Attachment removed.');
    }

    /**
     * Fetch formatted human-readable activity log for an item.
     */
    public function activity(Item $item): JsonResponse
    {
        $activities = Activity::where('subject_type', Item::class)
            ->where('subject_id', $item->id)
            ->with('causer:id,name,email')
            ->latest()
            ->take(25)
            ->get()
            ->map(function ($act) {
                $properties = $act->properties->toArray() ?? [];
                $changes = FormatItemActivity::formatActivityEntry($properties);

                return [
                    'id' => $act->id,
                    'causer' => $act->causer ? [
                        'name' => $act->causer->name,
                        'email' => $act->causer->email,
                    ] : [
                        'name' => 'System',
                        'email' => '',
                    ],
                    'description' => $act->description,
                    'changes' => $changes,
                    'created_at' => $act->created_at->diffForHumans(),
                ];
            });

        return response()->json($activities);
    }

    /**
     * Add a comment to an item.
     */
    public function comment(Request $request, Item $item): JsonResponse
    {
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $user = Auth::user() ?? User::active()->first();

        activity()
            ->performedOn($item)
            ->causedBy($user)
            ->withProperties(['comment' => $request->comment])
            ->log('commented: '.$request->comment);

        return response()->json([
            'success' => true,
            'message' => 'Comment added',
        ]);
    }
}
