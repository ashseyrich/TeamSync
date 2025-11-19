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
    const percentages = {
        early: totalCheckedIn > 0 ? (stats.early / totalCheckedIn) * 100 : 0,
        onTime: totalCheckedIn > 0 ? (stats.onTime / totalCheckedIn) * 100 : 0,
        late: totalCheckedIn > 0 ? (stats.late / totalCheckedIn) * 100 : 0,
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800">My Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">A private summary of your check-in history for past events.</p>
            
            {stats.totalAssignments > 0 ? (
                <>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatBox value={stats.totalAssignments} label="Assignments" colorClass="bg-gray-100 text-gray-800" />
                        <StatBox value={stats.onTime + stats.early} label="On-Time / Early" colorClass="bg-green-100 text-green-800" />
                        <StatBox value={stats.late} label="Late" colorClass="bg-yellow-100 text-yellow-800" />
                        <StatBox value={stats.noShow} label="No-Shows" colorClass="bg-red-100 text-red-800" />
                    </div>
                    
                    {totalCheckedIn > 0 && (
                         <div className="mt-4">
                             <p className="text-sm font-semibold text-gray-700 mb-1">Check-in Breakdown</p>
                             <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                                <div className="bg-green-400 h-4" style={{ width: `${percentages.early}%` }} title={`Early: ${percentages.early.toFixed(0)}%`}></div>
                                <div className="bg-blue-400 h-4" style={{ width: `${percentages.onTime}%` }} title={`On-Time: ${percentages.onTime.toFixed(0)}%`}></div>
                                <div className="bg-yellow-400 h-4" style={{ width: `${percentages.late}%` }} title={`Late: ${percentages.late.toFixed(0)}%`}></div>
                            </div>
                         </div>
                    )}
                </>
            ) : (
                <div className="mt-4 text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">You have no past assignments to analyze.</p>
                </div>
            )}
        </div>
    );
};