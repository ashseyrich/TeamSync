import React, { useState } from 'react';
import type { PersonalGoal } from '../types.ts';

interface PersonalGoalsCardProps {
    goals: PersonalGoal[];
    onUpdateGoals: (goals: PersonalGoal[]) => void;
}

const statusClasses = {
    todo: 'bg-gray-200 text-gray-800',
    'in-progress': 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
};

export const PersonalGoalsCard: React.FC<PersonalGoalsCardProps> = ({ goals, onUpdateGoals }) => {
    const [newGoalText, setNewGoalText] = useState('');

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;
        const newGoal: PersonalGoal = {
            id: `goal_${Date.now()}`,
            text: newGoalText,
            status: 'todo',
        };
        onUpdateGoals([...goals, newGoal]);
        setNewGoalText('');
    };
    
    const handleUpdateStatus = (goalId: string, status: PersonalGoal['status']) => {
        const updatedGoals = goals.map(g => g.id === goalId ? { ...g, status } : g);
        onUpdateGoals(updatedGoals);
    };

    const handleDeleteGoal = (goalId: string) => {
        onUpdateGoals(goals.filter(g => g.id !== goalId));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Goals</h3>
            <div className="space-y-3 mb-4">
                {goals.length > 0 ? goals.map(goal => (
                    <div key={goal.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-800 flex-grow">{goal.text}</p>
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <select value={goal.status} onChange={(e) => handleUpdateStatus(goal.id, e.target.value as PersonalGoal['status'])} className={`text-xs font-semibold rounded-full border-none appearance-none px-2 py-1 ${statusClasses[goal.status]}`}>
                                <option value="todo">To-Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-400 hover:text-red-500">
                                &times;
                            </button>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 italic">No goals set yet. Add one below!</p>}
            </div>
            <form onSubmit={handleAddGoal} className="flex gap-2">
                <input 
                    type="text"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Add a new goal..."
                    className="flex-grow block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary-dark">Add</button>
            </form>
        </div>
    );
};