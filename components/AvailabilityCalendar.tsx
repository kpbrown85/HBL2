
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, isAfter, startOfToday } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Info } from 'lucide-react';

// Mock booked dates
const BOOKED_DATES = [
  new Date(2026, 2, 15),
  new Date(2026, 2, 16),
  new Date(2026, 2, 17),
  new Date(2026, 3, 5),
  new Date(2026, 3, 6),
  new Date(2026, 5, 10),
  new Date(2026, 5, 11),
  new Date(2026, 5, 12),
];

export const AvailabilityCalendar: React.FC = () => {
  const [date, setDate] = useState<Date | [Date, Date] | null>(new Date());
  
  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      if (BOOKED_DATES.some(bookedDate => isSameDay(bookedDate, date))) {
        return 'booked-date';
      }
      if (isAfter(date, startOfToday())) {
        return 'available-date';
      }
    }
    return '';
  };

  return (
    <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-2xl border border-stone-100">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <header>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <CalendarIcon size={24} />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-stone-900">Herd Availability</h2>
            </div>
            <p className="text-stone-500 font-medium text-lg leading-relaxed">
              Plan your expedition around our herd's schedule. Green dates indicate full string availability.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-center gap-4">
              <CheckCircle2 className="text-green-600 shrink-0" size={24} />
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest text-green-800">Available</p>
                <p className="text-sm text-green-700 font-bold">Ready for booking</p>
              </div>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
              <XCircle className="text-red-600 shrink-0" size={24} />
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest text-red-800">Booked</p>
                <p className="text-sm text-red-700 font-bold">String is on trail</p>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex items-start gap-4">
            <Info className="text-stone-400 shrink-0 mt-1" size={20} />
            <p className="text-xs text-stone-500 font-bold leading-relaxed">
              Note: Availability is subject to change based on weather conditions and animal health. We recommend booking at least 3 weeks in advance for peak summer months.
            </p>
          </div>
        </div>

        <div className="lg:w-[450px] flex justify-center">
          <style>{`
            .react-calendar {
              border: none !important;
              font-family: 'Inter', sans-serif !important;
              width: 100% !important;
              background: transparent !important;
            }
            .react-calendar__tile {
              padding: 1.5em 0.5em !important;
              border-radius: 12px !important;
              font-weight: 700 !important;
              font-size: 0.9rem !important;
              transition: all 0.2s ease !important;
            }
            .react-calendar__tile:hover {
              background-color: #f5f5f4 !important;
            }
            .booked-date {
              background-color: #fee2e2 !important;
              color: #ef4444 !important;
              text-decoration: line-through !important;
            }
            .available-date {
              color: #166534 !important;
            }
            .react-calendar__navigation button {
              font-weight: 900 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.1em !important;
              font-size: 0.8rem !important;
              color: #1c1917 !important;
            }
            .react-calendar__month-view__weekdays__weekday {
              text-transform: uppercase !important;
              font-size: 0.7rem !important;
              font-weight: 900 !important;
              color: #a8a29e !important;
              text-decoration: none !important;
            }
            .react-calendar__tile--now {
              background: #f5f5f4 !important;
              border: 2px solid #166534 !important;
            }
            .react-calendar__tile--active {
              background: #166534 !important;
              color: white !important;
            }
          `}</style>
          <Calendar 
            onChange={setDate as any} 
            value={date as any}
            tileClassName={tileClassName}
            minDate={new Date()}
          />
        </div>
      </div>
    </div>
  );
};
