import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * POST /api/notify-quote-submitted
 *
 * Body: { quoteId: number }
 *
 * Emails every broker assigned to the quote's company so they know a
 * new quote request is waiting for pricing. Uses the service-role
 * client to look up the recipients server-side — the browser never
 * chooses who gets emailed.
 *
 * Best-effort: this endpoint is called from the shipper's client after
 * a quote is inserted, and a failure here should NOT prevent the shipper
 * from seeing "quote submitted successfully". Errors are logged and
 * returned but the caller ignores them.
 *
 * If no broker is assigned to the company (or the quote has no
 * company_id — the "needs_admin_review" case), we return 200 with a
 * `skipped` reason and no email is sent.
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
            'notify-quote-submitted: SENDGRID_API_KEY not set; skipping email'
        );
        return res.status(200).json({ ok: true, skipped: 'no_api_key' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error(
            'notify-quote-submitted: Supabase server credentials missing'
        );
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

    const { data: quote, error: quoteError } = await supabase
        .from('shippingquotes')
        .select(
            'id, company_id, user_id, first_name, last_name, origin_city, origin_state, destination_city, destination_state, freight_type'
        )
        .eq('id', quoteId)
        .single();

    if (quoteError || !quote) {
        console.error(
            'notify-quote-submitted: quote lookup failed',
            quoteError?.message
        );
        return res.status(404).json({ error: 'Quote not found' });
    }

    if (!quote.company_id) {
        return res
            .status(200)
            .json({ ok: true, skipped: 'no_company_assigned' });
    }

    // Find every broker assigned to this company. Multiple assignments
    // are supported; we email each one.
    const { data: assignments, error: assignError } = await supabase
        .from('company_sales_users')
        .select('sales_user_id')
        .eq('company_id', quote.company_id);

    if (assignError) {
        console.error(
            'notify-quote-submitted: assignment lookup failed',
            assignError.message
        );
        return res.status(500).json({ error: 'Assignment lookup failed' });
    }

    const brokerIds = (assignments ?? [])
        .map((a) => a.sales_user_id)
        .filter((id): id is string => !!id);

    if (brokerIds.length === 0) {
        return res
            .status(200)
            .json({ ok: true, skipped: 'no_broker_assigned' });
    }

    const { data: brokers, error: brokerError } = await supabase
        .from('nts_users')
        .select('id, email, first_name')
        .in('id', brokerIds);

    if (brokerError || !brokers || brokers.length === 0) {
        console.error(
            'notify-quote-submitted: broker profile lookup failed',
            brokerError?.message
        );
        return res
            .status(200)
            .json({ ok: true, skipped: 'no_broker_emails' });
    }

    // Fetch company name for a nicer email header — best effort.
    const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', quote.company_id)
        .single();

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const shipperName =
        [quote.first_name, quote.last_name].filter(Boolean).join(' ') ||
        'A shipper';
    const companyName = company?.name || 'their company';
    const routeText = [
        [quote.origin_city, quote.origin_state].filter(Boolean).join(', ') ||
            '—',
        '→',
        [quote.destination_city, quote.destination_state]
            .filter(Boolean)
            .join(', ') || '—',
    ].join(' ');
    const freightLine = quote.freight_type
        ? `Freight: ${quote.freight_type}`
        : null;

    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.URL ||
        'https://shipper-connect.com';
    const quoteUrl = `${siteUrl}/companies/${quote.company_id}`;

    const fromEmail =
        process.env.EMAIL_USER || 'noreply@nationwidetransportservices.com';

    // Send one message at a time so a single bad address doesn't fail
    // the whole batch. Collect results for the response body.
    const results: Array<{
        email: string;
        ok: boolean;
        error?: string;
    }> = [];

    for (const broker of brokers) {
        if (!broker.email) {
            results.push({ email: '(missing)', ok: false, error: 'no email' });
            continue;
        }

        const greeting = broker.first_name ? `Hi ${broker.first_name},` : 'Hi,';

        const textBody = [
            greeting,
            '',
            `${shipperName} at ${companyName} just submitted a new quote request.`,
            '',
            `Quote #${quote.id}`,
            `Route: ${routeText}`,
            ...(freightLine ? [freightLine] : []),
            '',
            `Open the quote to review and price it: ${quoteUrl}`,
            '',
            '— NTS Logistics',
        ].join('\n');

        const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <h2 style="margin: 0 0 12px; font-size: 20px;">New quote request</h2>
        <p style="margin: 0 0 8px;">${greeting}</p>
        <p style="margin: 0 0 16px;">
          <strong>${shipperName}</strong> at <strong>${companyName}</strong> just submitted a new quote request.
        </p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #6b7280; font-size: 14px;">Quote</td>
            <td style="padding: 6px 0; font-family: monospace;">#${quote.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 16px 6px 0; color: #6b7280; font-size: 14px;">Route</td>
            <td style="padding: 6px 0;">${routeText}</td>
          </tr>
          ${
              freightLine
                  ? `<tr>
                        <td style="padding: 6px 16px 6px 0; color: #6b7280; font-size: 14px;">Freight</td>
                        <td style="padding: 6px 0;">${quote.freight_type}</td>
                     </tr>`
                  : ''
          }
        </table>
        <p style="margin: 20px 0;">
          <a href="${quoteUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Review &amp; price this quote
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          — NTS Logistics
        </p>
      </div>
    `;

        try {
            await sgMail.send({
                to: broker.email,
                from: { email: fromEmail, name: 'NTS Logistics' },
                subject: `New quote request #${quote.id} from ${companyName}`,
                text: textBody,
                html: htmlBody,
            });
            results.push({ email: broker.email, ok: true });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const responseBody =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { body?: unknown } }).response?.body
                    : undefined;
            console.error(
                'notify-quote-submitted: SendGrid send failed for',
                broker.email,
                { error: msg, response: responseBody }
            );
            results.push({ email: broker.email, ok: false, error: msg });
        }
    }

    const anySucceeded = results.some((r) => r.ok);
    return res.status(anySucceeded ? 200 : 500).json({
        ok: anySucceeded,
        sent: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
    });
}
