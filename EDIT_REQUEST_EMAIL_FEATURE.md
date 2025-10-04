# Edit Request Email Notification System

## Overview
Complete email notification system for edit requests with dual approval interfaces for brokers.

## Features Implemented

### 1. **Shipper Requests Edit** (EditQuoteModal.tsx)
When a shipper submits an edit request:
- ✅ Edit request saved to `edit_requests` table
- ✅ In-app notification sent to assigned broker (nts_users)
- ✅ **Email notification sent to broker** with:
  - Quote ID
  - List of fields requested to change
  - Shipper's reason (if provided)
  - Call-to-action to review in dashboard
- ✅ Broker sees notification in NotificationBell component

### 2. **Broker Reviews Edit Request** 
Brokers can review and approve/reject edit requests from **TWO locations**:

#### A. Dedicated Edit Request Manager (EditRequestManager.tsx)
- Accessible via "View Edit Requests" button in QuoteList
- Shows all pending, approved, and rejected edit requests
- Full-featured review interface with:
  - Visual diff of requested changes (old → new)
  - Shipper's reason for requesting edit
  - Optional review notes field
  - Approve/Reject buttons

#### B. Inline Quote Table Actions (QuoteTable.tsx) ⭐ **NEW**
- **Desktop View**: Animated amber "Review Edit Request" button appears in Actions column
- **Mobile View**: Amber alert box appears above action buttons
- Same review modal as Edit Request Manager
- Allows brokers to handle edit requests without leaving the quote table

### 3. **Email & Notification on Approval/Rejection**
When broker approves or rejects:
- ✅ Edit request status updated in database
- ✅ Changes applied to quote (if approved)
- ✅ **In-app notification** sent to shipper
- ✅ **Email notification** sent to shipper with:
  - Status badge (✅ Approved or ❌ Rejected)
  - List of requested changes
  - Broker's review notes (shown as "Notes" for approval, "Reason for Rejection" for denial)
  - Confirmation of changes applied (if approved)
  - Professional HTML formatting

## Technical Implementation

### Database Tables Used
- `edit_requests` - Stores edit request data with status tracking
- `notifications` - In-app notifications
- `profiles` - Shipper data (email, name)
- `nts_users` - Broker data (name)
- `shippingquotes` - Quote data that gets updated on approval

### Email Template Structure
```html
<div style="font-family: Arial, sans-serif;">
  <h2 style="color: [green/red]">[Emoji] Edit Request [Status]</h2>
  <p>Hello [FirstName],</p>
  <p>Your edit request for Quote #[ID] has been [status] by [BrokerName].</p>
  
  <!-- Requested Changes Section -->
  <div style="background-color: #f3f4f6; padding: 15px;">
    <h3>Requested Changes:</h3>
    <ul>[List of fields]</ul>
  </div>

  <!-- Review Notes (Optional) -->
  [If review notes provided]
  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b;">
    <strong>[Notes/Reason]:</strong>
    <p>[Broker's notes]</p>
  </div>

  <!-- Outcome Message -->
  [Confirmation or next steps]
  
  <!-- Call-to-Action Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="[Dashboard Link]" 
       style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
      [Button Text] →
    </a>
  </div>
</div>
```

### Code Flow

#### Approval/Rejection Process:
1. **STEP 1 (CRITICAL)**: Update `edit_requests` table with status, reviewer, timestamp, notes
2. **STEP 2 (CRITICAL)**: If approved, apply changes to `shippingquotes` table
3. **STEP 3 (NON-BLOCKING)**: Async notification process:
   - Fetch shipper and broker data
   - Create in-app notification
   - Send email via `/.netlify/functions/sendEmail`
   - Log all steps for debugging

### Key Functions

**QuoteTable.tsx:**
```typescript
// Fetches pending edit requests for quotes
useEffect(() => {
  fetchEditRequests(); // Runs when quotes change
}, [quotes, isAdmin]);

// Handles approval/rejection with email notifications
const handleReviewEditRequest = async (requestId, status, request) => {
  // Update database
  // Apply changes if approved
  // Send notifications (async)
  // Refresh UI
};
```

**EditRequestManager.tsx:**
```typescript
// Similar review handler with same email logic
const handleReviewRequest = async (requestId, status) => {
  // Update edit_requests
  // Apply to shippingquotes if approved
  // Send in-app + email notifications (async)
};
```

## User Experience

### For Shippers:
1. Click "Request Edit" on a quote
2. Select fields to change, provide reason
3. Submit request
4. Receive confirmation in-app
5. **Get email when broker reviews** with decision and notes

### For Brokers:
1. See notification when edit request submitted
2. Review from either:
   - **Quote Table**: See amber badge, click "Review Edit Request"
   - **Edit Request Manager**: View all requests in dedicated interface
3. Review requested changes (visual diff)
4. Add optional notes (reason for rejection or clarifications)
5. Approve or Reject
6. Shipper immediately notified via email + in-app

## Visual Indicators

### Desktop Quote Table:
```
Actions Column:
  [Edit Button] [Accept Button] [Reject Button]
  [⚡ Review Edit Request] ← Animated amber button (only if pending edit)
```

### Mobile Quote Card:
```
┌─────────────────────────────────────┐
│ ⚡ Pending Edit Request            │
│ [Review Edit Request Button]        │
└─────────────────────────────────────┘
  [Edit Quote] [Create Order]
```

## Email Notification Examples

### Approved:
**Subject:** ✅ Edit Request Approved - Quote #1234

**Body:**
- Green header with checkmark
- List of changes applied
- Broker's notes (if any)
- Confirmation that changes are live

### Rejected:
**Subject:** ❌ Edit Request Rejected - Quote #1234

**Body:**
- Red header with X mark
- List of requested changes
- Broker's reason for rejection
- Encouragement to contact broker

## Testing Checklist

- [x] Shipper can submit edit request
- [x] Broker receives in-app notification
- [x] Broker sees amber badge on quote table
- [x] Broker can review from quote table (desktop & mobile)
- [x] Broker can review from Edit Request Manager
- [x] Approval applies changes to quote
- [x] Approval sends email to shipper
- [x] Rejection does not change quote
- [x] Rejection sends email to shipper
- [x] Review notes appear in email
- [x] Email uses correct shipper name and email
- [x] Email uses correct broker name
- [x] In-app notification created for shipper
- [x] UI refreshes after approval/rejection

## Files Modified

1. **components/admin/EditRequestManager.tsx** - Added email notifications to review handler
2. **components/user/quotetabs/QuoteTable.tsx** - Added inline edit request review capability
3. **netlify/functions/sendEmail.js** - Email sending infrastructure (already existed)

## Environment Variables Required

```env
SENDGRID_API_KEY=SG.xxx...
SENDGRID_USER=apikey
EMAIL_USER=noah@ntslogistics.com
SMTP_HOST=smtp.sendgrid.net
```

## Next Steps / Future Enhancements

- [ ] Add push notifications for mobile app
- [ ] Track email open/click rates
- [ ] Add bulk edit request approval
- [ ] Allow shipper to withdraw edit request
- [ ] Add edit request analytics dashboard
- [ ] Email templates with company branding

## Support & Troubleshooting

### Email not sending?
1. Check console for error logs (look for ⚠️ emoji)
2. Verify SendGrid API key in `.env`
3. Check Netlify function logs
4. Ensure shipper has valid email in profiles table

### Broker not seeing edit request badge?
1. Verify `isAdmin` prop is true for broker
2. Check if edit request status is 'pending'
3. Refresh the page to refetch edit requests

### Changes not applying on approval?
1. Check browser console for database errors
2. Verify quote_id matches in edit_requests table
3. Ensure requested_changes JSON format is correct
