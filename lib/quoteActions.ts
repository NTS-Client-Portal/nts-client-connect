import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export interface SetBrokerPriceParams {
    supabase: SupabaseClient<Database>;
    quoteId: number;
    price: number;
}

export interface SetBrokerPriceResult {
    ok: boolean;
    error?: string;
    /** The shippingquotes row after the update (or null on failure). */
    quote?: Database['public']['Tables']['shippingquotes']['Row'];
}

/**
 * Atomically transition a shipper-submitted quote into the "priced" state.
 *
 * Writes:
 *   1. `shippingquotes.price` + `brokers_status='priced'` + touches `updated_at`.
 *   2. `notifications` row for the shipper who created the quote so their
 *      NotificationBell lights up. If the notification insert fails we
 *      log but do not roll back the price update — the price is the
 *      critical piece of data and the shipper will still see the price
 *      when they refresh.
 *
 * Callers are responsible for any UI-specific side effects (e.g. document
 * generation, form reset). Keeping those out of this helper lets both the
 * shipper-side QuoteTable and the broker-side NtsQuoteList share the
 * exact same state-transition logic.
 */
export async function setBrokerPrice({
    supabase,
    quoteId,
    price,
}: SetBrokerPriceParams): Promise<SetBrokerPriceResult> {
    if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, error: 'Price must be a positive number.' };
    }

    const { data: updated, error: updateError } = await supabase
        .from('shippingquotes')
        .update({
            price,
            brokers_status: 'priced',
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .select('*')
        .single();

    if (updateError || !updated) {
        return {
            ok: false,
            error: updateError?.message ?? 'Could not update quote price.',
        };
    }

    // Fire-and-log notification. Never blocks the price update result.
    if (updated.user_id) {
        const { error: notifyError } = await supabase
            .from('notifications')
            .insert({
                user_id: updated.user_id,
                type: 'quote_priced',
                message: `Your quote #${updated.id} has been priced at $${price.toLocaleString(
                    'en-US',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}.`,
                is_read: false,
                created_at: new Date().toISOString(),
            });

        if (notifyError) {
            console.error(
                'setBrokerPrice: price saved but notification insert failed:',
                notifyError.message
            );
        }
    }

    // Fire-and-log email. Runs server-side via /api/notify-quote-priced
    // which looks up the shipper's real email and sends via SendGrid.
    // Deliberately not awaited-with-blocking; email failure never
    // rolls back the price update or hides it from the caller.
    if (typeof window !== 'undefined') {
        try {
            const resp = await fetch('/api/notify-quote-priced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteId: updated.id }),
            });
            if (!resp.ok) {
                const body = await resp.text().catch(() => '');
                console.error(
                    `setBrokerPrice: email dispatch returned ${resp.status}: ${body}`
                );
            }
        } catch (emailError) {
            console.error(
                'setBrokerPrice: email dispatch threw:',
                emailError instanceof Error
                    ? emailError.message
                    : String(emailError)
            );
        }
    }

    return { ok: true, quote: updated };
}
