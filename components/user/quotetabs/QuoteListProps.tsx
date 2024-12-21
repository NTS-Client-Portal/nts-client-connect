import { Session } from '@supabase/supabase-js';

export interface QuoteListProps {
    session: Session | null;
    isAdmin: boolean;
}
