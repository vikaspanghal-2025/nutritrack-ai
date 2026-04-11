import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { todayPST, formatDateLabel } from '../utils/dateUtils';

export default function DateNav() {
  const { selectedDate, setSelectedDate } = useApp();
  const today = todayPST();
  const isToday = selectedDate === today;
  const label = formatDateLabel(selectedDate);

  function shift(days: number) {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const key = d.toISOString().split('T')[0];
    if (key <= today) setSelectedDate(key);
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-2 py-1.5">
      <button onClick={() => shift(-1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
        <ChevronLeft size={18} />
      </button>
      <div className="flex items-center gap-2 px-2 min-w-[120px] justify-center">
        <Calendar size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <button onClick={() => shift(1)} disabled={isToday}
        className={`p-1 rounded-lg ${isToday ? 'text-gray-200' : 'hover:bg-gray-100 text-gray-500'}`}>
        <ChevronRight size={18} />
      </button>
      {!isToday && (
        <button onClick={() => setSelectedDate(today)}
          className="text-xs text-brand-600 font-medium px-2 py-1 rounded-lg hover:bg-brand-50">
          Today
        </button>
      )}
    </div>
  );
}
