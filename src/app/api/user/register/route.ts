import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';

// Import urllib for TiDB Cloud API requests
import { request } from 'urllib';

// TiDB Cloud API authentication keys
const PUBLIC_KEY = 'O256AUS0';
const PRIVATE_KEY = 'bdcbc32c-280c-490a-8569-46ebcc1cfad7';

// TiDB Cloud API endpoint
const TIDB_API_URL = 'https://us-east-1.data.tidbcloud.com/api/v1beta/app/dataapp-SKwKwHID/endpoint/users';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, name } = body;

        // Validate input
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        try {
            // Make request to TiDB Cloud API
            const { err, data, res } = await request(
                TIDB_API_URL,
                {
                    auth: `${PUBLIC_KEY}:${PRIVATE_KEY}`,
                    headers: {
                        'content-type': 'application/json',
                    },
                    method: 'POST',
                    data: {
                        "email": email,
                        "enrollments": "default",
                        "password": hashedPassword,
                        "name": name
                    }
                }
            );

            // Handle TiDB Cloud API errors
            if (err) {
                console.error('TiDB Cloud API error:', err);
                return NextResponse.json(
                    { error: 'Database operation failed' },
                    { status: 500 }
                );
            }

            // Log the response for debugging
            console.log('TiDB Cloud API response:', data?.toString());

            // Return success response
            return NextResponse.json(
                { 
                    message: 'User registered successfully',
                    user: { email, name }
                },
                { status: 201 }
            );
        } catch (apiError) {
            console.error('TiDB Cloud API request error:', apiError);
            return NextResponse.json(
                { error: 'Error communicating with database service' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}