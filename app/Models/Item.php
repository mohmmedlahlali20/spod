<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Item extends Model implements HasMedia
{
    use InteractsWithMedia, LogsActivity;

    protected $fillable = [
        'folder_id',
        'parent_id',
        'code',
        'title',
        'description',
        'status',
        'priority',
        'assignee_id',
        'creator_id',
        'start_date',
        'due_date',
        'deadline',
        'size',
        'impact',
        'fields_data',
        'order_index',
    ];

    protected $appends = [
        'subtasks_count',
        'completed_subtasks_count',
    ];

    protected function casts(): array
    {
        return [
            'fields_data' => 'array',
            'start_date' => 'date',
            'due_date' => 'date',
            'deadline' => 'datetime',
            'order_index' => 'integer',
        ];
    }

    /**
     * Configure Spatie Activitylog to track specific attributes.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'description', 'status', 'priority', 'assignee_id', 'fields_data'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * Auto-generate the item code on creation within a DB transaction.
     */
    protected static function booted(): void
    {
        static::creating(function (Item $item) {
            if (empty($item->code)) {
                DB::transaction(function () use ($item) {
                    $folder = Folder::lockForUpdate()->find($item->folder_id);
                    $folder->increment('current_number');
                    $item->code = "{$folder->prefix}-{$folder->current_number}";
                });
            }
        });
    }

    // ── Relationships ──

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'parent_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Item::class, 'parent_id')->orderBy('order_index');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    // ── Accessors ──

    public function getSubtasksCountAttribute(): int
    {
        return $this->subtasks()->count();
    }

    public function getCompletedSubtasksCountAttribute(): int
    {
        return $this->subtasks()->where('status', 'Done')->count();
    }

    // ── Media Collections ──

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attachments');
    }
}
