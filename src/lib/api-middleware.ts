import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK (singleton pattern)
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Firebase Admin SDK initialization failed');
  }
}

export interface AuthenticatedRequest extends NextRequest {
  user: DecodedIdToken;
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 */
export async function verifyAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: DecodedIdToken;
  error?: string;
  status?: number;
}> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
        status: 401,
      };
    }

    // Extract token
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return {
        success: false,
        error: 'No token provided',
        status: 401,
      };
    }

    // Verify token with Firebase Admin
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    return {
      success: true,
      user: decodedToken,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    
    if (error instanceof Error) {
      // Handle specific Firebase Auth errors
      if (error.message.includes('expired')) {
        return {
          success: false,
          error: 'Token has expired',
          status: 401,
        };
      }
      
      if (error.message.includes('invalid')) {
        return {
          success: false,
          error: 'Invalid token',
          status: 401,
        };
      }
    }

    return {
      success: false,
      error: 'Authentication failed',
      status: 401,
    };
  }
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user!;

    return handler(authenticatedRequest, ...args);
  };
}

/**
 * Validate request body against a schema
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { isValid: boolean; error?: string; data?: T } {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: 'Request body must be a valid JSON object',
    };
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      return {
        isValid: false,
        error: `Missing required field: ${String(field)}`,
      };
    }
  }

  // Filter out unknown fields
  const allowedFields = [...requiredFields, ...optionalFields];
  const filteredData: any = {};
  
  for (const field of allowedFields) {
    if (field in body) {
      filteredData[field] = body[field];
    }
  }

  return {
    isValid: true,
    data: filteredData as T,
  };
}

/**
 * Rate limiting store (in-memory for simplicity)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting middleware
 */
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (request: NextRequest): { allowed: boolean; error?: string } => {
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitStore.delete(key);
      }
    }
    
    const current = rateLimitStore.get(clientId);
    
    if (!current) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now });
      return { allowed: true };
    }
    
    if (current.resetTime < windowStart) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now });
      return { allowed: true };
    }
    
    if (current.count >= maxRequests) {
      return {
        allowed: false,
        error: 'Rate limit exceeded. Please try again later.',
      };
    }
    
    current.count++;
    return { allowed: true };
  };
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: any, visited = new WeakSet()): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, 10000); // Limit length
  }
  
  if (Array.isArray(input)) {
    if (visited.has(input)) {
      return '[Circular Reference]';
    }
    visited.add(input);
    const result = input.map(item => sanitizeInput(item, visited));
    visited.delete(input);
    return result;
  }
  
  if (input && typeof input === 'object') {
    if (visited.has(input)) {
      return '[Circular Reference]';
    }
    visited.add(input);
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value, visited);
    }
    visited.delete(input);
    return sanitized;
  }
  
  return input;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  
  return response;
}

/**
 * Error response helper with consistent format
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: string
): NextResponse {
  const response = NextResponse.json(
    { 
      error,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
  
  return addSecurityHeaders(response);
}

/**
 * Success response helper with consistent format
 */
export function createSuccessResponse(
  data: any,
  message?: string
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  });
  
  return addSecurityHeaders(response);
}