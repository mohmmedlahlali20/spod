<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

// Default redirect
Route::get('/', function () {
    return redirect()->route('workspace.board', ['slug' => 'engineering']);
});

// Authentication & Switching
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::post('/switch-user/{user}', [AuthController::class, 'switchUser'])->name('switch-user');

// Workspace Kanban Board
Route::get('/workspace/{slug}/board', [WorkspaceController::class, 'board'])->name('workspace.board');
Route::get('/workspace/{slug}/members', [MemberController::class, 'index'])->name('workspace.members');

// Items CRUD & Actions
Route::post('/items', [ItemController::class, 'store'])->name('items.store');
Route::put('/items/{item}', [ItemController::class, 'update'])->name('items.update');
Route::delete('/items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');
Route::put('/items/{item}/status', [ItemController::class, 'updateStatus'])->name('items.update-status');
Route::post('/items/{item}/subtasks', [ItemController::class, 'storeSubtask'])->name('items.subtasks.store');
Route::post('/items/{item}/attachments', [ItemController::class, 'uploadAttachment'])->name('items.attachments.store');
Route::delete('/items/{item}/attachments/{media}', [ItemController::class, 'deleteAttachment'])->name('items.attachments.destroy');
Route::get('/items/{item}/activity', [ItemController::class, 'activity'])->name('items.activity');
Route::post('/items/{item}/comment', [ItemController::class, 'comment'])->name('items.comment');

// Members Management
Route::put('/members/{user}/suspend', [MemberController::class, 'suspend'])->name('members.suspend');
Route::put('/members/{user}/reactivate', [MemberController::class, 'reactivate'])->name('members.reactivate');
Route::put('/members/{user}/workspaces', [MemberController::class, 'updateWorkspaces'])->name('members.workspaces');
