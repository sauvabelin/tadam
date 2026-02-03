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
     * Get a single bubble by ID
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

        return $result ?: null;
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
