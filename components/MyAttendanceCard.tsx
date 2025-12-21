import React from 'react';
import type { AttendanceStats } from '../types.ts';

interface MyAttendanceCardProps {
    stats: AttendanceStats;
}

const StatBox: React.FC<{ value: number | string; label: string; colorClass: string }> = ({ value, label, colorClass }) => (
    <div className={`p-3 rounded-lg text-center ${colorClass} border`}>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
    </div>
);

export const MyAttendanceCard: React.FC<MyAttendanceCardProps> = ({ stats }) => {
    const reliability = stats.reliabilityScore || 0;
    
    let barColor = 'bg-green-500';
    let message = "Excellent reliability! You are a pillar of the team.";
    let textColor = 'text-green-700';
    
    if (reliability < 90) {
        barColor = 'bg-blue-500';
        message = "Solid attendance. Keep building that consistency!";
        textColor = 'text-blue-700';
    }
    if (reliability < 75) {
        barColor = 'bg-yellow-500';
        message = "Room for improvement. Punctuality is key for production.";
        textColor = 'text-yellow-700';
    }
    if (reliability < 50) {
        barColor = 'bg-red-500';
        message = "Attention needed. Please coordinate with leadership.";
        textColor = 'text-red-700';
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-brand-primary">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">My Accountability Score</h3>
                <span className={`text-sm font-bold px-2 py-1 rounded bg-gray-100 ${textColor}`}>
                    {reliability >= 90 ? 'ELITE' : reliability >= 75 ? 'RELIABLE' : 'GROWING'}
                </span>
            </div>
            
            {stats.totalAssignments > 0 ? (
                <>
                    <div className="mt-6 mb-2 flex justify-between items-end">
                        <span className="text-4xl font-black text-gray-900">{reliability.toFixed(0)}%</span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reliability Index</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden border">
                        <div className={`${barColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${reliability}%` }}></div>
                    </div>
                    <p className={`text-sm font-medium ${textColor} italic mb-6`}>"{message}"</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                        <StatBox value={stats.totalAssignments} label="Scheduled" colorClass="bg-gray-50 text-gray-700 border-gray-200" />
                        <StatBox value={stats.onTime + stats.early} label="Punctual" colorClass="bg-green-50 text-green-700 border-green-200" />
                        <StatBox value={stats.late} label="Late" colorClass="bg-yellow-50 text-yellow-700 border-yellow-200" />
                        <StatBox value={stats.noShow} label="Absent" colorClass="bg-red-50 text-red-700 border-red-200" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 text-center uppercase tracking-tighter">Scores are weighted: Late check-ins count as 50% reliability for that event.</p>
                </>
            ) : (
                <div className="mt-4 text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-sm text-gray-500">Your accountability profile will begin once you complete your first assigned service.</p>
                </div>
            )}
        </div>
    );
};