import React from 'react';

interface AvatarProps {
  avatarUrl?: string;
  name: string;
  sizeClassName: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatarUrl, name, sizeClassName }) => {
    const initial = name.charAt(0).toUpperCase();

    if (avatarUrl && avatarUrl.startsWith('data:image/')) {
        return (
            <div className={`${sizeClassName} rounded-full overflow-hidden bg-gray-200`}>
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
        );
    }
    
    // Fallback to initial
    const colors = ['bg-blue-200 text-blue-800', 'bg-green-200 text-green-800', 'bg-purple-200 text-purple-800', 'bg-yellow-200 text-yellow-800', 'bg-red-200 text-red-800'];
    const colorClass = colors[name.charCodeAt(0) % colors.length];

    return (
        <div className={`${sizeClassName} rounded-full flex items-center justify-center font-bold ${colorClass}`}>
            {initial}
        </div>
    );
};