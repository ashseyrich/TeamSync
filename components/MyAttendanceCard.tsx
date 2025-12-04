import React from 'react';
import type { AttendanceStats } from '../types.ts';

interface MyAttendanceCardProps {
    stats: AttendanceStats;
}

const StatBox: React.FC<{ value: number | string; label: string; colorClass: string }> = ({ value, label, colorClass }) => (
    <div className={`p-3 rounded-lg text-center ${colorClass}`}>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-semibold">{label}</p>
    </div>
);

export const MyAttendanceCard: React.FC<MyAttendanceCardProps> = ({ stats }) => {
    
    const totalCheckedIn = stats.onTime + stats.early + stats.late;
    const reliability = stats.reliabilityScore || 100;
    
    // Determine color based on reliability
    let barColor = 'bg-green-500';
    let message = "You're a rockstar! Thanks for being dependable.";
    
    if (reliability < 90) {
        barColor = 'bg-blue-500';
        message = "Solid attendance. Keep it up!";
    }
    if (reliability < 75) {
        barColor = 'bg-yellow-500';
        message = "Try to be more consistent with check-ins.";
    }
    if (reliability < 50) {
        barColor = 'bg-red-500';
        message = "Attendance is critical for the team. Please improve.";
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800">My Reliability</h3>
            <p className="text-sm text-gray-600 mt-1">Your dependability score based on check-ins and punctuality.</p>
            
            {stats.totalAssignments > 0 ? (
                <>
                    <div className="mt-6 mb-2 flex justify-between items-end">
                        <span className="text-3xl font-extrabold text-gray-800">{reliability.toFixed(0)}%</span>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reliability Score</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div className={`${barColor} h-3 rounded-full transition-all duration-1000`} style={{ width: `${reliability}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-700 italic mb-6">"{message}"</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                        <StatBox value={stats.totalAssignments} label="Assignments" colorClass="bg-gray-50 text-gray-800" />
                        <StatBox value={stats.onTime + stats.early} label="On-Time" colorClass="bg-green-50 text-green-800" />
                        <StatBox value={stats.late} label="Late" colorClass="bg-yellow-50 text-yellow-800" />
                        <StatBox value={stats.noShow} label="No-Shows" colorClass="bg-red-50 text-red-800" />
                    </div>
                </>
            ) : (
                <div className="mt-4 text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">You have no past assignments yet. Your reliability score will appear here once you start serving.</p>
                </div>
            )}
        </div>
    );
};