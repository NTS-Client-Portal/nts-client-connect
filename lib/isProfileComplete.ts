import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const isProfileComplete = async (userId: string): Promise<boolean> => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found
                return false;
            }
            throw error;
        }

        return profile?.profile_complete ?? false;
    } catch (error) {
        console.error('Error checking profile completeness:', error);
        return false;
    }
};