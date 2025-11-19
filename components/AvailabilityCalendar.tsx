import React, { useState } from 'react';

interface AvailabilityCalendarProps {
  availability: Record<string, 'available' | 'unavailable'>;
  onUpdate: (newAvailability: Record<string, 'available' | 'unavailable'>) => void;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ availability, onUpdate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date);
    const newAvailability = { ...availability };
    if (availability[dateString] === 'unavailable') {
      delete newAvailability[dateString]; // or set to 'available'
    } else {
      newAvailability[dateString] = 'unavailable';
    }
    onUpdate(newAvailability);
  };
  
  const changeMonth = (offset: number) => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  const renderHeader = () => {
    const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button>
        <span className="font-bold text-gray-800">{dateFormat.format(currentMonth)}</span>
        <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    
    const rows = [];
    let days = [];
    let day = new Date(startDate);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dateString = formatDate(cloneDay);
        const isUnavailable = availability[dateString] === 'unavailable';
        const isCurrentMonth = cloneDay.getMonth() === currentMonth.getMonth();

        days.push(
          <div
            key={day.toString()}
            className={`p-1 text-center text-sm rounded-full cursor-pointer 
                        ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                        ${isUnavailable ? 'bg-red-200 text-red-800 font-bold line-through' : 'hover:bg-blue-100'}
                        ${!isCurrentMonth ? 'pointer-events-none' : ''}`}
            onClick={() => isCurrentMonth && handleDateClick(cloneDay)}
          >
            {cloneDay.getDate()}
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-2 mt-2">{rows}</div>;
  };

  return (
    <div>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
