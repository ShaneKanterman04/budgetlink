import { NextRequest, NextResponse } from 'next/server';
import { request } from 'urllib';
import fs from 'fs';
import path from 'path';
import https from 'https';

// TiDB Cloud API authentication keys
const PUBLIC_KEY = 'O256AUS0';
const PRIVATE_KEY = 'bdcbc32c-280c-490a-8569-46ebcc1cfad7';

// Teller API configuration
const TELLER_API_URL = 'https://api.teller.io';

// Read Teller certificate and private key files
const certPath = path.join(process.cwd(), 'public', 'teller', 'certificate.pem');
const keyPath = path.join(process.cwd(), 'public', 'teller', 'private_key.pem');

// Load cert and key as strings
let cert: string;
let key: string;

try {
    cert = fs.readFileSync(certPath, 'utf8');
    key = fs.readFileSync(keyPath, 'utf8');
    console.log('Certificate and key loaded successfully');
} catch (error) {
    console.error('Error reading Teller certificate or key files:', error);
    cert = '';
    key = '';
}

// Helper function to make authenticated requests to Teller API
async function tellerApiRequest(url: string, accessToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
        console.log(`Making request to: ${url}`);
        
        // For test/development environment, use test_token authentication
        let headers: any = {};
        if (accessToken.startsWith('test_token_')) {
            headers = {
                'Authorization': `Basic ${Buffer.from(accessToken + ':').toString('base64')}`,
            };
        } else {
            headers = {
                'Authorization': `Bearer ${accessToken}`,
            };
        }
        
        // Add common headers
        headers['Content-Type'] = 'application/json';
        headers['User-Agent'] = 'BudgetLink/1.0';
        
        const req = https.request(url, {
            method: 'GET',
            cert: cert,
            key: key,
            headers: headers,
            // Set agent options
            rejectUnauthorized: false, // For development only
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                // Check if response is JSON
                let contentType = res.headers['content-type'];
                let isJson = contentType && contentType.includes('application/json');
                
                console.log(`Response status: ${res.statusCode}, Content-Type: ${contentType}`);
                
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        if (isJson && data) {
                            resolve(JSON.parse(data));
                        } else {
                            resolve(data); // Return raw data if not JSON
                        }
                    } catch (e) {
                        console.error('Error parsing response data:', e);
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                } else {
                    console.error(`Request failed with status ${res.statusCode}: ${data}`);
                    
                    // Try to parse the error response
                    try {
                        const errorData = isJson && data ? JSON.parse(data) : data;
                        reject({
                            status: res.statusCode,
                            data: errorData
                        });
                    } catch (e) {
                        reject({
                            status: res.statusCode,
                            message: data
                        });
                    }
                }
            });
        });
        
        req.on('error', (e) => {
            console.error(`Request error: ${e.message}`);
            reject(new Error(`Request error: ${e.message}`));
        });
        
        req.on('timeout', () => {
            console.error('Request timeout');
            req.destroy();
            reject(new Error('Request timed out'));
        });
        
        req.end();
    });
}

export async function GET(req: NextRequest) {
    try {
        // Get userId from query params
        const searchParams = req.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Verify that certificate and private key are loaded
        if (!cert || !key) {
            return NextResponse.json(
                { error: 'Teller API credentials not properly configured' },
                { status: 500 }
            );
        }

        // Step 1: Fetch enrollments from TiDB Cloud
        const tidbUrl = `https://us-east-1.data.tidbcloud.com/api/v1beta/app/dataapp-SKwKwHID/endpoint/users?userId=${encodeURIComponent(userId)}`;
        
        const { err, data, res } = await request(tidbUrl, {
            auth: `${PUBLIC_KEY}:${PRIVATE_KEY}`,
            method: 'GET',
        });

        if (err) {
            console.error('TiDB Cloud API error:', err);
            return NextResponse.json(
                { error: 'Error fetching user data' },
                { status: 500 }
            );
        }

        // Parse the user data
        let responseData;
        try {
            responseData = JSON.parse(data.toString());
            console.log('TiDB Response:', responseData);
        } catch (parseError) {
            console.error('Error parsing TiDB response:', parseError);
            return NextResponse.json(
                { error: 'Invalid response from database service' },
                { status: 500 }
            );
        }

        // Check if we have valid user data
        if (!responseData?.data?.rows || responseData.data.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get the first row (user data) and extract enrollments
        const userData = responseData.data.rows[0];
        let enrollmentsArray = [];
        
        // Handle enrollments which are stored as JSON strings
        if (userData.enrollments) {
            if (Array.isArray(userData.enrollments)) {
                // If it's already an array, process each enrollment
                enrollmentsArray = userData.enrollments.map(enrollment => {
                    if (typeof enrollment === 'string') {
                        try {
                            return JSON.parse(enrollment);
                        } catch (e) {
                            console.error('Error parsing enrollment string:', e);
                            return null;
                        }
                    }
                    return enrollment;
                }).filter(Boolean); // Filter out nulls from failed parses
            } else if (typeof userData.enrollments === 'string') {
                // If it's a single string, try to parse it as JSON array
                try {
                    const parsed = JSON.parse(userData.enrollments);
                    enrollmentsArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    console.error('Error parsing enrollments string:', e);
                }
            }
        }
        
        console.log('Parsed enrollments:', enrollmentsArray);
        
        if (enrollmentsArray.length === 0) {
            return NextResponse.json(
                { error: 'No valid enrollments found for this user' },
                { status: 404 }
            );
        }

        console.log(`Found ${enrollmentsArray.length} enrollments for user ${userId}`);

        // Step 2: Get transactions from Teller API for each enrollment
        const allTransactions = [];
        
        for (const enrollment of enrollmentsArray) {
            // Skip if enrollment has no access token
            if (!enrollment.accessToken) {
                console.log('Skipping enrollment with no access token');
                continue;
            }
            
            const institutionName = enrollment.enrollment?.institution?.name || 
                                   enrollment.institution?.name || 
                                   'Unknown institution';
            
            console.log(`Processing enrollment for ${institutionName} with token: ${enrollment.accessToken}`);
            
            try {
                // First, get accounts
                const accountsUrl = `${TELLER_API_URL}/accounts`;
                console.log(`Requesting accounts from: ${accountsUrl}`);
                const accounts = await tellerApiRequest(accountsUrl, enrollment.accessToken)
                    .catch(error => {
                        console.error('Error fetching accounts:', error);
                        return null;
                    });
                
                if (!accounts || !Array.isArray(accounts)) {
                    console.warn('Failed to get accounts or no accounts returned');
                    continue;
                }
                
                console.log(`Found ${accounts.length} accounts for this enrollment`);
                
                // For each account, get transactions
                for (const account of accounts) {
                    if (!account.id) {
                        console.warn('Invalid account data, skipping');
                        continue;
                    }
                    
                    const accountId = account.id;
                    const transactionsUrl = `${TELLER_API_URL}/accounts/${accountId}/transactions`;
                    
                    try {
                        console.log(`Requesting transactions from: ${transactionsUrl}`);
                        const transactions = await tellerApiRequest(transactionsUrl, enrollment.accessToken);
                        
                        if (!Array.isArray(transactions)) {
                            console.warn(`No transactions array returned for account ${accountId}`);
                            continue;
                        }
                        
                        console.log(`Found ${transactions.length} transactions for account ${accountId}`);
                        
                        // Add institution and account info to each transaction
                        const enrichedTransactions = transactions.map(transaction => ({
                            ...transaction,
                            institution: institutionName,
                            accountName: account.name || 'Unknown Account',
                            accountType: account.type || 'Unknown Type',
                        }));
                        
                        allTransactions.push(...enrichedTransactions);
                        
                    } catch (error) {
                        console.error(`Error fetching transactions for account ${accountId}:`, error);
                    }
                }
                
            } catch (error) {
                console.error(`Error processing enrollment for ${institutionName}:`, error);
            }
        }
        
        // If no transactions were found, return an empty array with a message
        if (allTransactions.length === 0) {
            return NextResponse.json({
                message: 'No transactions found for the enrolled accounts',
                data: []
            }, { status: 200 });
        }
        
        // Sort all transactions by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`Total transactions fetched: ${allTransactions.length}`);
        
        return NextResponse.json({
            message: 'Transactions retrieved successfully',
            data: allTransactions
        }, { status: 200 });

    } catch (error) {
        console.error('Error retrieving transactions:', error);
        return NextResponse.json(
            { error: 'Error retrieving transactions', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
