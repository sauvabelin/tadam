<?php

namespace Tadam;

use DB;

class BubbleController
{
    /**
     * Category to bubble mapping
     */
    private const CATEGORIES = [
        'journal' => ['journal'],
        'lettres' => ['lettres'],
        'pages' => [
            'informations', 'train', 'chapiteau', 'inspectionDesSacs',
            'hike', 'concert', 'bouffe', 'contact', 'dons',
            'inscription', 'bienvenue', 'patatra', 'fantasia', 'lamifa', 'zampazzi'
        ]
    ];

    /**
     * All valid bubble IDs
     */
    private array $validBubbleIds;

    public function __construct()
    {
        $this->validBubbleIds = array_merge(...array_values(self::CATEGORIES));
    }

    /**
     * Get category for a bubble ID
     */
    private function getCategoryForBubble(string $bubbleId): string
    {
        foreach (self::CATEGORIES as $category => $bubbles) {
            if (in_array($bubbleId, $bubbles, true)) {
                return $category;
            }
        }
        return 'pages'; // default
    }

    /**
     * Check if bubble ID is valid
     */
    public function isValidBubbleId(string $bubbleId): bool
    {
        return in_array($bubbleId, $this->validBubbleIds, true);
    }

    /**
     * List all bubbles, optionally filtered by category
     */
    public function list(?string $category = null): array
    {
        if ($category !== null && !isset(self::CATEGORIES[$category])) {
            return [];
        }

        if ($category !== null) {
            return DB::query(
                "SELECT id, bubble_id, content, category, created_at, updated_at
                 FROM bubbles
                 WHERE category = %s
                 ORDER BY bubble_id",
                $category
            );
        }

        return DB::query(
            "SELECT id, bubble_id, content, category, created_at, updated_at
             FROM bubbles
             ORDER BY category, bubble_id"
        );
    }

    /**
     * Get a single bubble by ID, including its tabs
     */
    public function get(string $bubbleId): ?array
    {
        if (!$this->isValidBubbleId($bubbleId)) {
            return null;
        }

        $result = DB::queryFirstRow(
            "SELECT id, bubble_id, content, category, created_at, updated_at
             FROM bubbles
             WHERE bubble_id = %s",
            $bubbleId
        );

        if ($result) {
            $result['tabs'] = $this->getTabs($bubbleId);
        }

        return $result ?: null;
    }

    /**
     * Get all tabs for a bubble
     */
    public function getTabs(string $bubbleId): array
    {
        return DB::query(
            "SELECT id, bubble_id, tab_name, content, sort_order, created_at, updated_at
             FROM bubble_tabs
             WHERE bubble_id = %s
             ORDER BY sort_order ASC, id ASC",
            $bubbleId
        ) ?: [];
    }

    /**
     * Create a new tab for a bubble
     */
    public function createTab(string $bubbleId, string $tabName, ?string $content = null): array
    {
        // Get next sort_order
        $maxOrder = DB::queryFirstField(
            "SELECT MAX(sort_order) FROM bubble_tabs WHERE bubble_id = %s",
            $bubbleId
        );
        $sortOrder = ($maxOrder !== null) ? (int)$maxOrder + 1 : 0;

        DB::insert('bubble_tabs', [
            'bubble_id' => $bubbleId,
            'tab_name' => $tabName,
            'content' => $content ?? '',
            'sort_order' => $sortOrder,
        ]);

        $id = DB::insertId();

        return DB::queryFirstRow(
            "SELECT id, bubble_id, tab_name, content, sort_order, created_at, updated_at
             FROM bubble_tabs WHERE id = %i",
            $id
        );
    }

    /**
     * Update an existing tab
     */
    public function updateTab(int $tabId, string $bubbleId, array $data): ?array
    {
        $tab = DB::queryFirstRow(
            "SELECT id FROM bubble_tabs WHERE id = %i AND bubble_id = %s",
            $tabId,
            $bubbleId
        );

        if (!$tab) {
            return null;
        }

        $update = [];
        if (isset($data['tab_name'])) {
            $update['tab_name'] = $data['tab_name'];
        }
        if (array_key_exists('content', $data)) {
            $update['content'] = $data['content'];
        }

        if (!empty($update)) {
            DB::update('bubble_tabs', $update, "id = %i", $tabId);
        }

        return DB::queryFirstRow(
            "SELECT id, bubble_id, tab_name, content, sort_order, created_at, updated_at
             FROM bubble_tabs WHERE id = %i",
            $tabId
        );
    }

    /**
     * Delete a tab
     */
    public function deleteTab(int $tabId, string $bubbleId): bool
    {
        $tab = DB::queryFirstRow(
            "SELECT id FROM bubble_tabs WHERE id = %i AND bubble_id = %s",
            $tabId,
            $bubbleId
        );

        if (!$tab) {
            return false;
        }

        DB::delete('bubble_tabs', "id = %i", $tabId);
        return true;
    }

    /**
     * Reorder tabs for a bubble
     */
    public function reorderTabs(string $bubbleId, array $tabIds): array
    {
        foreach ($tabIds as $index => $tabId) {
            DB::update(
                'bubble_tabs',
                ['sort_order' => $index],
                "id = %i AND bubble_id = %s",
                (int)$tabId,
                $bubbleId
            );
        }

        return $this->getTabs($bubbleId);
    }

    /**
     * Create or update a bubble
     */
    public function save(string $bubbleId, array $data): array
    {
        if (!$this->isValidBubbleId($bubbleId)) {
            throw new \InvalidArgumentException("Invalid bubble ID: {$bubbleId}");
        }

        $content = $data['content'] ?? '';
        $category = $this->getCategoryForBubble($bubbleId);

        // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert
        DB::query(
            "INSERT INTO bubbles (bubble_id, content, category)
             VALUES (%s, %s, %s)
             ON DUPLICATE KEY UPDATE
                content = VALUES(content),
                updated_at = CURRENT_TIMESTAMP",
            $bubbleId,
            $content,
            $category
        );

        // Return the saved record
        return $this->get($bubbleId);
    }
}
