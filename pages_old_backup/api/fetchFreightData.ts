import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

const fetchFreightData = async (req: NextApiRequest, res: NextApiResponse) => {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const result = await client.query(`
            SELECT f.*
            FROM freight f
            JOIN profiles p ON f.user_id = p.user_id
            WHERE p.company_id = (
                SELECT company_id
                FROM profiles
                WHERE user_id = $1
            );
        `, [userId]);
        await client.end();

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching freight data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export default fetchFreightData;