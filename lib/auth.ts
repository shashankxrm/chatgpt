import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
}

/**
 * Middleware to authenticate API requests using Clerk
 * Returns the authenticated user ID or throws an error
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function authenticateRequest(_request: NextRequest): Promise<string> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }
  
  return userId;
}

/**
 * Wrapper for API route handlers that require authentication
 * Automatically extracts userId and passes it to the handler
 */
export function withAuth<T extends unknown[]>(
  handler: (_request: NextRequest, userId: string, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userId = await authenticateRequest(request);
      return await handler(request, userId, ...args);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: error instanceof Error ? error.message : 'Authentication failed'
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Utility to validate user ownership of a resource
 */
export function validateUserOwnership(userId: string, resourceUserId: string): void {
  if (userId !== resourceUserId) {
    throw new Error('Forbidden: User does not have access to this resource');
  }
}
