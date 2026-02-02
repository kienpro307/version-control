import { NextResponse } from 'next/server';

// Standard API response helpers
export function apiSuccess<T>(data: T, meta?: { total?: number; page?: number; limit?: number }) {
    return NextResponse.json({
        success: true,
        data,
        ...(meta && { meta }),
    });
}

export function apiError(code: string, message: string, status: number = 400) {
    return NextResponse.json(
        {
            success: false,
            error: { code, message },
        },
        { status }
    );
}

// Common error responses
export const errors = {
    notFound: (resource: string, id: string) =>
        apiError('NOT_FOUND', `${resource} with id '${id}' not found`, 404),
    badRequest: (message: string) =>
        apiError('BAD_REQUEST', message, 400),
    serverError: (message: string = 'Internal server error') =>
        apiError('SERVER_ERROR', message, 500),
};
