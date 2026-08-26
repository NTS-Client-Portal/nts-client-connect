import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { sendInvitations } from '@/lib/invitationService';
import { X, Settings, Mail, UserPlus } from 'lucide-react';

interface TeamInviteModalProps {
    open: boolean;
    companyId: string | null;
    onClose: (dontShowAgain: boolean) => void;
}

type InviteRole = 'manager' | 'member';

const TeamInviteModal: React.FC<TeamInviteModalProps> = ({ open, companyId, onClose }) => {
    const session = useSession();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<InviteRole>('member');
    const [inviteEmails, setInviteEmails] = useState<{ email: string; role: InviteRole }[]>([]);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleAdd = () => {
        if (!inviteEmail) return;
        if (inviteEmails.some(invite => invite.email.toLowerCase() === inviteEmail.toLowerCase())) {
            setInviteEmail('');
            return;
        }
        setInviteEmails(prev => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
        setInviteEmail('');
    };

    const handleSend = async () => {
        if (!companyId || !session?.user?.id) {
            setError('Your account is still finishing setup — try again in a moment.');
            return;
        }
        if (inviteEmails.length === 0) return;

        setSending(true);
        setError(null);
        try {
            await sendInvitations(inviteEmails, session.user.id, companyId);
            setInviteEmails([]);
            setSent(true);
        } catch (err: any) {
            setError(err?.message || 'Failed to send invitations.');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => onClose(dontShowAgain);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between bg-[#111928] px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Invite your team</h2>
                            <p className="mt-0.5 text-sm text-slate-300">Add teammates to your company.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="rounded-md p-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {sent ? (
                        <div className="py-6 text-center">
                            <div className="text-lg font-semibold text-emerald-600">Invitations sent!</div>
                            <p className="mt-2 text-sm text-slate-500">
                                Your teammates will receive an email invite shortly.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="email"
                                    placeholder="Enter email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAdd();
                                        }
                                    }}
                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as InviteRole)}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="manager">Manager</option>
                                    <option value="member">Member</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    className="rounded-lg bg-[#020a14] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#0f172a]"
                                >
                                    Add
                                </button>
                            </div>

                            {inviteEmails.length > 0 && (
                                <ul className="mt-4 space-y-2">
                                    {inviteEmails.map((invite, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                        >
                                            <span className="flex items-center gap-2 text-sm text-slate-700">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                {invite.email}
                                            </span>
                                            <span className="text-xs font-semibold uppercase text-slate-500">
                                                {invite.role}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={sending || inviteEmails.length === 0}
                                className="mt-4 w-full rounded-lg bg-[#020a14] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {sending ? 'Sending Invitations...' : 'Send Invitations'}
                            </button>
                        </>
                    )}

                    <p className="mt-5 flex items-start gap-1.5 text-xs text-slate-500">
                        <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            You can always invite teammates later from{' '}
                            <span className="font-medium text-slate-700">Settings → Invite User</span>.
                        </span>
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={dontShowAgain}
                                onChange={e => setDontShowAgain(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-[#020a14] focus:ring-blue-500"
                            />
                            Don't show me this again
                        </label>
                        <button
                            onClick={handleClose}
                            className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
                        >
                            {sent ? 'Done' : 'Maybe later'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamInviteModal;
