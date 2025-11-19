import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CheckInTimelinessChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Green, Blue, Amber for Early, On Time, Late

export const CheckInTimelinessChart: React.FC<CheckInTimelinessChartProps> = ({ data }) => {
    
    const chartData = data.filter(d => d.value > 0);
    
    if (chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No check-in data available.</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};