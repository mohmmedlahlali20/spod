<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    /**
     * Display the workspace members list.
     */
    public function index(Request $request, string $slug = 'engineering'): Response
    {
        $currentWorkspace = Workspace::where('slug', $slug)->first() ?? Workspace::first();

        $members = User::with(['roles', 'workspaces'])->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? 'member',
                'is_banned' => $user->isBanned(),
                'banned_at' => $user->banned_at?->format('M d, Y H:i'),
                'ban_reason' => $user->ban_reason,
                'workspaces' => $user->workspaces->map(fn ($w) => [
                    'id' => $w->id,
                    'name' => $w->name,
                    'slug' => $w->slug,
                    'is_private' => $w->is_private,
                ]),
                'workspace_ids' => $user->workspaces->pluck('id')->toArray(),
                'created_at' => $user->created_at->format('M d, Y'),
            ];
        });

        $allWorkspaces = Workspace::all(['id', 'name', 'slug', 'is_private']);
        $privateWorkspaces = Workspace::where('is_private', true)->get(['id', 'name', 'slug', 'is_private']);

        return Inertia::render('workspace/members', [
            'workspace' => $currentWorkspace,
            'workspaces' => $allWorkspaces,
            'privateWorkspaces' => $privateWorkspaces,
            'members' => $members,
        ]);
    }

    /**
     * Suspend user account (sets banned_at).
     */
    public function suspend(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $user->update([
            'banned_at' => now(),
            'ban_reason' => $request->reason ?? 'Account suspended by administrator.',
        ]);

        return back()->with('success', "Account for {$user->name} has been suspended.");
    }

    /**
     * Reactivate user account (clears banned_at).
     */
    public function reactivate(User $user): RedirectResponse
    {
        $user->update([
            'banned_at' => null,
            'ban_reason' => null,
        ]);

        return back()->with('success', "Account for {$user->name} has been reactivated.");
    }

    /**
     * Update user private workspace assignments (debounced auto-save).
     */
    public function updateWorkspaces(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'workspace_ids' => 'present|array',
            'workspace_ids.*' => 'exists:workspaces,id',
        ]);

        $user->workspaces()->sync($request->workspace_ids);

        return response()->json([
            'success' => true,
            'message' => 'Workspaces updated successfully.',
            'workspace_ids' => $user->workspaces()->pluck('workspaces.id'),
        ]);
    }
}
