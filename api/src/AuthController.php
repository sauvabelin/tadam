<?php

declare(strict_types=1);

namespace Tadam;

/**
 * Handles authentication and session management
 */
class AuthController
{
    private int $sessionExpiry;

    public function __construct(int $sessionExpiry = 86400)
    {
        $this->sessionExpiry = $sessionExpiry;
    }

    /**
     * Generate a secure random token
     */
    private function generateToken(): string
    {
        return bin2hex(random_bytes(32)); // 64 character hex string
    }

    /**
     * Create a new session and return the token
     */
    public function createSession(): string
    {
        // Clean up expired sessions first
        $this->cleanupExpiredSessions();

        $token = $this->generateToken();
        $expiresAt = date('Y-m-d H:i:s', time() + $this->sessionExpiry);

        \DB::insert('sessions', [
            'token' => $token,
            'expires_at' => $expiresAt,
        ]);

        return $token;
    }

    /**
     * Verify a token is valid and not expired
     */
    public function verifyToken(string $token): bool
    {
        if (empty($token)) {
            return false;
        }

        $session = \DB::queryFirstRow(
            "SELECT * FROM sessions WHERE token = %s AND expires_at > NOW()",
            $token
        );

        return $session !== null;
    }

    /**
     * Invalidate a session (logout)
     */
    public function invalidateToken(string $token): bool
    {
        \DB::delete('sessions', 'token = %s', $token);
        return \DB::affectedRows() > 0;
    }

    /**
     * Clean up expired sessions
     */
    public function cleanupExpiredSessions(): int
    {
        \DB::delete('sessions', 'expires_at <= NOW()');
        return \DB::affectedRows();
    }

    /**
     * Extend session expiry (touch)
     */
    public function extendSession(string $token): bool
    {
        $expiresAt = date('Y-m-d H:i:s', time() + $this->sessionExpiry);

        \DB::update('sessions', [
            'expires_at' => $expiresAt,
        ], 'token = %s AND expires_at > NOW()', $token);

        return \DB::affectedRows() > 0;
    }
}
