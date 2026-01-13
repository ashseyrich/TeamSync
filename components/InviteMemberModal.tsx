import React, { useState, useEffect } from 'react';
import type { TeamType, TeamFeatures } from '../types.ts';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  inviteCreatedAt?: Date;
  adminInviteCode: string;
  adminInviteCreatedAt?: Date;
  teamName: string;
  teamType: TeamType;
  features: TeamFeatures;
  onRefresh: () => void;
}

const InviteSection: React.FC<{ 
    title: string; 
    code: string; 
    createdAt?: Date;
    teamName: string;
    teamType: TeamType;
    features: TeamFeatures;
    isMemberInvite: boolean;
    onRefresh: () => void;
}> = ({ title, code, createdAt, teamName, teamType, features, isMemberInvite, onRefresh }) => {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTime = () => {
            if (!createdAt) return '24:00:00';
            const expiryTime = new Date(createdAt).getTime() + (24 * 60 * 60 * 1000);
            if (isNaN(expiryTime)) return '24:00:00';

            const diff = expiryTime - new Date().getTime();
            if (diff <= 0) return 'Expired';
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            return `${hours}h ${mins}m ${secs}s`;
        };

        const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
        setTimeLeft(calculateTime());
        return () => clearInterval(timer);
    }, [createdAt]);
    
    const featuresParam = encodeURIComponent(JSON.stringify(features));
    const inviteLink = `${window.location.origin}${window.location.pathname}?join_code=${code}&team_name=${encodeURIComponent(teamName)}&team_type=${teamType}&features=${featuresParam}&auto_approve=true`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const isExpired = timeLeft === 'Expired';

    return (
        <div className={`p-5 rounded-lg border shadow-sm ${isExpired ? 'bg-red-50 border-red-200 opacity-75' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-600 text-white' : 'bg-brand-primary text-white'}`}>
                        {isExpired ? 'Link Expired' : `Expires in: ${timeLeft}`}
                    </span>
                    <button onClick={onRefresh} className="p-1 text-gray-500 hover:text-brand-primary" title="Restart 24h timer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>
            
            <div className="mb-6">
                <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-bold text-gray-700">Instant Join Link (Mass Sign-up)</p>
                    {isMemberInvite && !isExpired && <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Bypasses Approval</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <input type="text" readOnly value={isExpired ? 'Link Expired' : inviteLink} className="flex-grow text-xs bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-600 focus:outline-none" />
                    <button onClick={handleCopyLink} disabled={isExpired} className={`px-4 py-2 text-xs font-bold rounded-md text-white transition-colors flex-shrink-0 ${copiedLink ? 'bg-green-600' : 'bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-400'}`}>
                        {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            <div>
                <p className="text-sm font-bold text-gray-700 mb-1">Manual Access Code</p>
                <div className="flex items-center gap-3">
                     <div className="flex-grow bg-white border-2 border-dashed border-gray-300 rounded-md px-4 py-2 text-center font-mono text-xl font-bold tracking-wider text-gray-800 select-all">
                        {isExpired ? 'EXPIRED' : code}
                     </div>
                     <button onClick={handleCopyCode} disabled={isExpired} className={`px-4 py-2 text-xs font-bold rounded-md text-white transition-colors flex-shrink-0 ${copiedCode ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400'}`}>
                        {copiedCode ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, inviteCode, inviteCreatedAt, adminInviteCode, adminInviteCreatedAt, teamName, teamType, features, onRefresh }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Invite Your Team</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-6">
            <p className="text-sm text-gray-600">Links and codes are valid for 24 hours. Refreshing them will extend the window but might invalidate previously shared links.</p>
            <InviteSection title="Invite Volunteers" code={inviteCode} createdAt={inviteCreatedAt} teamName={teamName} teamType={teamType} features={features} isMemberInvite={true} onRefresh={onRefresh} />
            <InviteSection title="Invite Administrator" code={adminInviteCode} createdAt={adminInviteCreatedAt} teamName={teamName} teamType={teamType} features={features} isMemberInvite={false} onRefresh={onRefresh} />
        </div>
        <div className="p-4 bg-gray-50 flex justify-end rounded-b-lg border-t">
          <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark">Done</button>
        </div>
      </div>
    </div>
  );
};