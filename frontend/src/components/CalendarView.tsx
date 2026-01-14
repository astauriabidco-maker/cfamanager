import React from 'react';

interface CalendarViewProps {
    days: { date: string }[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ days }) => {
    // Group days by Month
    const grouped = days.reduce((acc, day) => {
        const d = new Date(day.date);
        const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(d);
        return acc;
    }, {} as Record<string, Date[]>);

    if (days.length === 0) {
        return <div className="text-gray-400 italic p-4">Aucun jour de formation planifié.</div>;
    }

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([month, dates]) => (
                <div key={month} className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-lg capitalize mb-3 text-indigo-700">{month}</h3>
                    <div className="flex flex-wrap gap-2">
                        {dates.map((date, i) => (
                            <div key={i} className="flex flex-col items-center bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg min-w-[60px]">
                                <span className="text-xs uppercase font-semibold">{date.toLocaleDateString('default', { weekday: 'short' })}</span>
                                <span className="text-xl font-bold">{date.getDate()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CalendarView;
