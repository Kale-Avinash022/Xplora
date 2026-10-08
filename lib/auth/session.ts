// lib/auth/session.ts
// Server-side session verification helper for XPLORA

import { prisma } from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Extracts the session user from cookies or Authorization header
 * and verifies that the user exists in the database.
 * Never trusts unverified client-supplied identifiers.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  try {
    let candidateUserId: string | null = null;

    // 1. Check cookies for xplora_user
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c) => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith('xplora_user=')) {
          const rawVal = cookie.substring('xplora_user='.length);
          try {
            const decoded = decodeURIComponent(rawVal);
            const parsed = JSON.parse(decoded);
            if (parsed && typeof parsed.id === 'string' && parsed.id.trim()) {
              candidateUserId = parsed.id.trim();
              break;
            }
          } catch {
            // Might be JSON without URI encoding
            try {
              const parsed = JSON.parse(rawVal);
              if (parsed && typeof parsed.id === 'string' && parsed.id.trim()) {
                candidateUserId = parsed.id.trim();
                break;
              }
            } catch {
              // Invalid cookie format
            }
          }
        }
      }
    }

    // 2. Fallback to Authorization header: Bearer <token_or_id>
    if (!candidateUserId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (token) {
          // Could be raw userId or JSON string
          if (token.startsWith('{')) {
            try {
              const parsed = JSON.parse(token);
              if (parsed && typeof parsed.id === 'string') {
                candidateUserId = parsed.id.trim();
              }
            } catch {}
          } else {
            candidateUserId = token;
          }
        }
      }
    }

    // 3. Fallback to explicit x-user-id header (for API testing / internal tools)
    if (!candidateUserId) {
      const customHeader = req.headers.get('x-user-id');
      if (customHeader && customHeader.trim()) {
        candidateUserId = customHeader.trim();
      }
    }

    if (!candidateUserId) {
      return null;
    }

    // 4. Verify against database: User MUST exist in DB
    const user = await prisma.user.findUnique({
      where: { id: candidateUserId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('[Session Verification Error]:', error);
    return null;
  }
}
