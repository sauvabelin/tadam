<?php

declare(strict_types=1);

namespace Tadam;

class RateLimiter
{
    private int $maxAttempts;
    private int $windowSeconds;

    public function __construct(int $maxAttempts = 5, int $windowSeconds = 300)
    {
        $this->maxAttempts = $maxAttempts;
        $this->windowSeconds = $windowSeconds;
    }

    /**
     * Check if identifier is allowed to make another attempt
     */
    public function isAllowed(string $identifier): bool
    {
        $this->cleanup();

        $count = \DB::queryFirstField(
            "SELECT COUNT(*) FROM rate_limits WHERE identifier = %s AND created_at > DATE_SUB(NOW(), INTERVAL %i SECOND)",
            $identifier,
            $this->windowSeconds
        );

        return $count < $this->maxAttempts;
    }

    /**
     * Record a failed attempt
     */
    public function record(string $identifier): void
    {
        \DB::insert('rate_limits', ['identifier' => $identifier]);
    }

    /**
     * Clear all attempts for identifier (on successful login)
     */
    public function clear(string $identifier): void
    {
        \DB::delete('rate_limits', 'identifier = %s', $identifier);
    }

    /**
     * Clean up old entries
     */
    private function cleanup(): void
    {
        \DB::delete('rate_limits', 'created_at < DATE_SUB(NOW(), INTERVAL %i SECOND)', $this->windowSeconds * 2);
    }
}
