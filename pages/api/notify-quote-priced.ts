import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * POST /api/notify-quote-priced
 *
 * Body: { quoteId: number }
 *
 * Emails the shipper who submitted the quote to let them know a broker
 * has set a price. Runs server-side so:
 *   1. The SendGrid API key never touches the browser.
 *   2. We look up the recipient email ourselves — the client can't spoof
 *      the "to" address by sending someone else's quote ID (they can
 *      only trigger emails for quotes they know the ID of, and always
 *      to the legitimate owner).
 *
 * The endpoint is deliberately best-effort: if SendGrid is
 * misconfigured we log and return 200 rather than blocking the calling
 * flow. The critical write (price + brokers_status + in-app
 * notification) has already happened by the time this is invoked.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawQuoteId = req.body?.quoteId;
    const quoteId = Number(rawQuoteId);
    if (!Number.isFinite(quoteId) || quoteId <= 0) {
        return res
            .status(400)
            .json({ error: 'quoteId (positive number) is required' });
    }

    if (!process.env.SENDGRID_API_KEY) {
        console.warn(
            'notify-quote-priced: SENDGRID_API_KEY not set; skipping email'
        );
        return res.status(200).json({ ok: true, skipped: 'no_api_key' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error(
            'notify-quote-priced: Supabase server credentials missing'
        );
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    // Service-role client bypasses RLS so this endpoint can look up the
    // shipper's email regardless of who called it.
    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

    const { data: quote, error: quoteError } = await supabase
        .from('shippingquotes')
        .select(
            'id, price, user_id, origin_city, origin_state, destination_city, destination_state'
        )
        .eq('id', quoteId)
        .single();

    if (quoteError || !quote) {
        console.error(
            'notify-quote-priced: quote lookup failed',
            quoteError?.message
        );
        return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.price == null) {
        return res.status(400).json({ error: 'Quote has no price set' });
    }

    if (!quote.user_id) {
        return res
            .status(400)
            .json({ error: 'Quote has no owning user; cannot notify' });
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', quote.user_id)
        .single();

    if (profileError || !profile?.email) {
        console.error(
            'notify-quote-priced: profile lookup failed',
            profileError?.message
        );
        return res.status(404).json({ error: 'Shipper profile not found' });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const priceFormatted = Number(quote.price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const routeText = [
        [quote.origin_city, quote.origin_state].filter(Boolean).join(', ') ||
            '—',
        '→',
        [quote.destination_city, quote.destination_state]
            .filter(Boolean)
            .join(', ') || '—',
    ].join(' ');

    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.URL || // Netlify sets this in production
        'https://shipper-connect.com';
    const quoteUrl = `${siteUrl}/user/logistics-management?tab=requests`;

    const fromEmail =
        process.env.EMAIL_USER || 'noreply@nationwidetransportservices.com';

    const greeting = profile.first_name ? `Hi ${profile.first_name},` : 'Hi,';

    const textBody = [
        greeting,
        '',
        'Good news — a broker has priced your recent quote request.',
        '',
        `Quote #${quote.id}`,
        `Route: ${routeText}`,
        `Price: $${priceFormatted}`,
        '',
        `Sign in to review and accept: ${quoteUrl}`,
        '',
        '— NTS Logistics',
    ].join('\n');

    const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">Your quote has been priced</h2>
      <p style="margin: 0 0 8px;">${greeting}</p>
      <p style="margin: 0 0 16px;">A broker has responded to your quote request.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 16px 6px 0; color: #6b7280; font-size: 14px;">Quote</td>
          <td style="padding: 6px 0; font-family: monospace;">#${quote.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 16px 6px 0; color: #6b7280; font-size: 14px;">Route</td>
          <td style="padding: 6px 0;">${routeText}</td>
        </tr>
        <tr>
          <td style="padding: 6px 16px 6px 0; color: #6b7280; font-size: 14px;">Price</td>
          <td style="padding: 6px 0; font-size: 22px; font-weight: 600;">$${priceFormatted}</td>
        </tr>
      </table>
      <p style="margin: 20px 0;">
        <a href="${quoteUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Review your quote
        </a>
      </p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        — NTS Logistics
      </p>
    </div>
  `;

    try {
        await sgMail.send({
            to: profile.email,
            from: { email: fromEmail, name: 'NTS Logistics' },
            subject: `Your quote #${quote.id} has been priced ($${priceFormatted})`,
            text: textBody,
            html: htmlBody,
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // SendGrid's response body has useful debugging info; surface it
        // to the server logs but not to the client.
        const responseBody =
            err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { body?: unknown } }).response?.body
                : undefined;
        console.error('notify-quote-priced: SendGrid send failed', {
            error: msg,
            response: responseBody,
        });
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
