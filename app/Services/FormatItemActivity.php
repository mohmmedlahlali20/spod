<?php

namespace App\Services;

use App\Models\User;

class FormatItemActivity
{
    /**
     * Convert ProseMirror JSON description to a readable text snippet.
     */
    public static function descriptionToText(?string $json, int $maxLength = 120): string
    {
        if (empty($json)) {
            return '';
        }

        $data = json_decode($json, true);

        if (! is_array($data)) {
            return mb_substr(strip_tags($json), 0, $maxLength).'…';
        }

        $text = self::extractTextFromNodes($data['content'] ?? []);

        if (mb_strlen($text) > $maxLength) {
            return mb_substr($text, 0, $maxLength).'…';
        }

        return $text;
    }

    /**
     * Recursively extract text content from ProseMirror nodes.
     */
    private static function extractTextFromNodes(array $nodes): string
    {
        $result = '';

        foreach ($nodes as $node) {
            if (isset($node['text'])) {
                $result .= $node['text'];
            }

            if (isset($node['content'])) {
                $result .= self::extractTextFromNodes($node['content']);
            }

            if (in_array($node['type'] ?? '', ['paragraph', 'heading', 'bulletList', 'orderedList'])) {
                $result .= ' ';
            }
        }

        return trim($result);
    }

    /**
     * Convert an array of user IDs into display names.
     */
    public static function userIdsToNames(mixed $userIds): string
    {
        if (empty($userIds)) {
            return 'None';
        }

        if (is_string($userIds)) {
            $userIds = json_decode($userIds, true);
        }

        if (! is_array($userIds)) {
            $userIds = [$userIds];
        }

        $users = User::whereIn('id', $userIds)->pluck('name')->toArray();

        return implode(', ', $users) ?: 'Unknown';
    }

    /**
     * Map status values into clean display strings.
     */
    public static function formatStatus(?string $status): string
    {
        return match ($status) {
            'Backlog' => 'Backlog',
            'Todo' => 'To Do',
            'In Progress' => 'In Progress',
            'In Review' => 'In Review',
            'Done' => 'Done',
            'Cancelled' => 'Cancelled',
            default => $status ?? 'Unknown',
        };
    }

    /**
     * Map priority values into clean display strings.
     */
    public static function formatPriority(?string $priority): string
    {
        return match ($priority) {
            'urgent' => '🔴 Urgent',
            'high' => '🟠 High',
            'normal' => '🟡 Normal',
            'low' => '🔵 Low',
            default => $priority ?? 'Unknown',
        };
    }

    /**
     * Format a single activity log entry for display.
     */
    public static function formatActivityEntry(array $properties): array
    {
        $formatted = [];
        $old = $properties['old'] ?? [];
        $attributes = $properties['attributes'] ?? [];

        foreach ($attributes as $key => $newValue) {
            $oldValue = $old[$key] ?? null;

            $formatted[] = match ($key) {
                'status' => [
                    'field' => 'Status',
                    'old' => self::formatStatus($oldValue),
                    'new' => self::formatStatus($newValue),
                ],
                'priority' => [
                    'field' => 'Priority',
                    'old' => self::formatPriority($oldValue),
                    'new' => self::formatPriority($newValue),
                ],
                'assignee_id' => [
                    'field' => 'Assignee',
                    'old' => $oldValue ? self::userIdsToNames($oldValue) : 'Unassigned',
                    'new' => $newValue ? self::userIdsToNames($newValue) : 'Unassigned',
                ],
                'description' => [
                    'field' => 'Description',
                    'old' => self::descriptionToText($oldValue),
                    'new' => self::descriptionToText($newValue),
                ],
                'title' => [
                    'field' => 'Title',
                    'old' => $oldValue ?? '',
                    'new' => $newValue ?? '',
                ],
                default => [
                    'field' => ucfirst(str_replace('_', ' ', $key)),
                    'old' => is_array($oldValue) ? json_encode($oldValue) : ($oldValue ?? ''),
                    'new' => is_array($newValue) ? json_encode($newValue) : ($newValue ?? ''),
                ],
            };
        }

        return $formatted;
    }
}
