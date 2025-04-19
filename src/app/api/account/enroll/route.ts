import { NextRequest, NextResponse } from 'next/server';
import { request } from 'urllib';

// TiDB Cloud API authentication keys
const PUBLIC_KEY = 'O256AUS0';
const PRIVATE_KEY = 'bdcbc32c-280c-490a-8569-46ebcc1cfad7';

export async function PUT(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();
        const { userId, enrollments } = body;

        // Validate required fields
        if (!userId || !enrollments) {
            return NextResponse.json(
                { error: 'userId and enrollments are required' },
                { status: 400 }
            );
        }

        // Base TiDB Cloud API URL
        const url = 'https://us-east-1.data.tidbcloud.com/api/v1beta/app/dataapp-SKwKwHID/endpoint/users';

        try {
            // Make request to TiDB Cloud
            const { err, data, res } = await request(url, {
                auth: `${PUBLIC_KEY}:${PRIVATE_KEY}`,
                headers: {
                    'content-type': 'application/json',
                },
                method: 'PUT',
                data: {
                    "enrollments": enrollments,
                    "userId": userId
                }
            });

            // Handle request errors
            if (err) {
                console.error('TiDB Cloud API error:', err);
                return NextResponse.json(
                    { error: 'Error while updating user enrollments' },
                    { status: 500 }
                );
            }

            // Log response data for debugging
            console.log('TiDB Response:', data.toString());

            // Parse the response data
            let responseData;
            try {
                responseData = JSON.parse(data.toString());
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                return NextResponse.json(
                    { error: 'Invalid response from database service' },
                    { status: 500 }
                );
            }

            // Check if update was successful
            if (res.statusCode === 200) {
                return NextResponse.json({
                    message: 'User enrollments updated successfully',
                    data: responseData
                }, { status: 200 });
            } else {
                return NextResponse.json({
                    error: 'Failed to update user enrollments',
                    details: responseData
                }, { status: res.statusCode });
            }
        } catch (apiError) {
            console.error('TiDB Cloud API request error:', apiError);
            return NextResponse.json(
                { error: 'Error communicating with database service' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
