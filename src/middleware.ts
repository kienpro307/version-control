import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only apply to /api routes (except /api/docs which is public)
    if (request.nextUrl.pathname.startsWith('/api') &&
        !request.nextUrl.pathname.startsWith('/api/docs')) {

        const authHeader = request.headers.get('Authorization');
        const apiKey = process.env.API_SECRET_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'API key not configured' } },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' } },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
