
import React, { useState } from 'react';
import type { TeamType, TeamFeatures } from '../types.ts';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  adminInviteCode: string;
  teamName: string;
  teamType: TeamType;
  features: TeamFeatures;
}

const InviteSection: React.FC<{ 
    title: string; 
    code: string; 
    teamName: string;
    teamType: TeamType;
    features: TeamFeatures;
    isMemberInvite: boolean;
}> = ({ title, code, teamName, teamType, features, isMemberInvite }) => {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    
    // Encode features to ensure the invited user gets the same toolset
    const featuresParam = encodeURIComponent(JSON.stringify(features));
    
    // Include auto_approve=true so users clicking this specific link skip the pending queue
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

    return (
        <div className="p-5 bg-gray-50 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">{title}</h3>
            
            <div className="mb-6">
                <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-bold text-gray-700">Option 1: Instant Join Link</p>
                    {isMemberInvite && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Auto-Approves</span>}
                </div>
                <p className="text-xs text-gray-500 mb-2">Best for sharing via text or email. Users skip the approval queue.</p>
                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={inviteLink} 
                        className="flex-grow text-xs bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-600 focus:outline-none"
                    />
                    <button 
                        onClick={handleCopyLink} 
                        className={`px-3 py-2 text-xs font-semibold rounded-md text-white transition-colors flex-shrink-0 ${copiedLink ? 'bg-green-600' : 'bg-brand-primary hover:bg-brand-primary-dark'}`}
                    >
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>

            <div>
                 <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-bold text-gray-700">Option 2: Access Code</p>
                     {isMemberInvite && <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">Requires Approval</span>}
                </div>
                <p className="text-xs text-gray-500 mb-2">Give this code for manual entry. You must approve their request.</p>
                <div className="flex items-center gap-3">
                     <div className="flex-grow bg-white border-2 border-dashed border-gray-300 rounded-md px-4 py-2 text-center font-mono text-xl font-bold tracking-wider text-gray-800 select-all">
                        {code}
                     </div>
                     <button 
                        onClick={handleCopyCode} 
                        className={`px-3 py-2 text-xs font-semibold rounded-md text-white transition-colors flex-shrink-0 ${copiedCode ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, inviteCode, adminInviteCode, teamName, teamType, features }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Invite Team Members</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
            <InviteSection 
                title="Invite Volunteers"
                code={inviteCode}
                teamName={teamName}
                teamType={teamType}
                features={features}
                isMemberInvite={true}
            />
             <InviteSection 
                title="Invite Administrator"
                code={adminInviteCode}
                teamName={teamName}
                teamType={teamType}
                features={features}
                isMemberInvite={false}
            />
        </div>

        <div className="p-4 bg-gray-50 flex justify-end rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-dark">Done</button>
        </div>
      </div>
    </div>
  );
};
