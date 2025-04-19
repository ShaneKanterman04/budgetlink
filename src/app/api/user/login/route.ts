import { NextRequest, NextResponse } from 'next/server';
import { request } from 'urllib';
import { compare } from 'bcrypt';

// TiDB Cloud API authentication keys
const PUBLIC_KEY = 'O256AUS0';
const PRIVATE_KEY = 'bdcbc32c-280c-490a-8569-46ebcc1cfad7';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        try {
            // Construct the login URL with email as query parameter
            const loginUrl = `https://us-east-1.data.tidbcloud.com/api/v1beta/app/dataapp-SKwKwHID/endpoint/login?email=${encodeURIComponent(email)}`;
            
            // Make GET request to TiDB Cloud API
            const { err, data, res } = await request(loginUrl, {
                auth: `${PUBLIC_KEY}:${PRIVATE_KEY}`,
                method: 'GET',
            });

            // Handle TiDB Cloud API errors
            if (err) {
                console.error('TiDB Cloud API error:', err);
                return NextResponse.json(
                    { error: 'Authentication service error' },
                    { status: 500 }
                );
            }

            // Parse the response data
            let responseData;
            try {
                responseData = JSON.parse(data.toString());
                console.log('Full response data:', responseData);
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                return NextResponse.json(
                    { error: 'Invalid response from authentication service' },
                    { status: 500 }
                );
            }

            // Check if the response has the expected structure and contains user data
            if (res.statusCode === 200 && 
                responseData?.data?.rows && 
                responseData.data.rows.length > 0) {
                
                // Access the single row that is returned
                const userData = responseData.data.rows[0];
                console.log('User row:', userData);

                // Now we can access properties using the exact property names from the user row
                const userId = userData.userId;
                const userEmail = userData.email;
                const hashedPassword = userData.password;
                const enrollments = userData.enrollments;
                
                if (!hashedPassword) {
                    console.error('No password found in user data');
                    return NextResponse.json(
                        { error: 'Invalid user data' },
                        { status: 500 }
                    );
                }

                // Verify the password
                const passwordMatch = await compare(password, hashedPassword);
                
                if (!passwordMatch) {
                    return NextResponse.json(
                        { error: 'Invalid email or password' },
                        { status: 401 }
                    );
                }

                // Create a simple auth token (just a timestamp + userId to make it unique)
                const authToken = `${Date.now()}_${userId}_${Math.random().toString(36).substring(2, 15)}`;

                // Return the auth token and user info
                return NextResponse.json(
                    {
                        message: 'Login successful',
                        token: authToken,
                        user: { 
                            userId,
                            email: userEmail,
                            enrollments
                        }
                    },
                    { status: 200 }
                );
            } else {
                // No user found or invalid format
                return NextResponse.json(
                    { error: 'Invalid email or password' },
                    { status: 401 }
                );
            }
        } catch (apiError) {
            console.error('TiDB Cloud API request error:', apiError);
            return NextResponse.json(
                { error: 'Error communicating with authentication service' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
