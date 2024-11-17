require('dotenv').config();
const axios = require('axios');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getRedirectUrl = () => {
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:8888/profile-setup';
    }
    return `${process.env.NEXT_PUBLIC_REDIRECT_URL}/profile-setup`;
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({ message: 'CORS preflight check successful' }),
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Email and password are required' }),
        };
    }

    try {
        console.log('Sending request to Supabase:', { email, password });

        const response = await axios.post(`${SUPABASE_URL}/auth/v1/signup`, {
            email,
            password,
            options: {
                emailRedirectTo: getRedirectUrl()
            }
        }, {
            headers: {
                apikey: SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Supabase response:', response.data);

        if (response.data.error) {
            throw new Error(response.data.error.message);
        }

        const userId = response.data.user?.id; // Check if user and id exist
        if (!userId) {
            throw new Error('User ID not found in response');
        }

        // Insert the user's profile into the profiles table
        const profileResponse = await axios.post(`${SUPABASE_URL}/rest/v1/profiles`, {
            id: userId,
            email: email,
            role: 'user',
            team_role: 'manager'
        }, {
            headers: {
                apikey: SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            }
        });

        if (profileResponse.data.error) {
            throw new Error(profileResponse.data.error.message);
        }

        console.log('Profile creation successful:', profileResponse.data);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Signup successful', data: profileResponse.data }),
        };
    } catch (error) {
        console.error('Error during signup:', error.response ? error.response.data : error.message);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Failed to sign up', details: error.response ? error.response.data : error.message }),
        };
    }
};