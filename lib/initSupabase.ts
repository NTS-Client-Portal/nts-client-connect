import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types'; // Import the generated types
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const fetchTables = async () => {
    try {
        const { data, error } = await supabase.rpc('get_tables');
        if (error) {
            console.error('Error fetching tables:', error.message);
        } else {
            console.log('Fetched tables:', data);
        }
    } catch (error) {
        console.error('Unexpected error fetching tables:', error);
    }
};

// Call fetchTables to test the function
fetchTables();