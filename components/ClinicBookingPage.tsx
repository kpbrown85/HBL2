import React from 'react';
import { ArrowLeft, GraduationCap, Info, ShieldCheck } from 'lucide-react';
import { BookingForm } from './BookingForm';

interface ClinicBookingPageProps {
  onBack: () => void;
}

export const ClinicBookingPage: React.FC<ClinicBookingPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-stone-50 py-24 px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-stone-900 leading-none mb-4">Clinic Booking.</h1>
            <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Secure your spot in our next hands-on training session</p>
          </div>
          <button onClick={onBack} className="flex items-center gap-3 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:text-stone-900 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <BookingForm isClinicOnly={true} />
          </div>
          
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-100 space-y-6">
              <div className="w-12 h-12 bg-green-50 text-green-800 rounded-2xl flex items-center justify-center shadow-sm">
                <Info size={24} />
              </div>
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">What to Expect</h3>
              <ul className="space-y-4 text-stone-500 text-sm font-medium leading-relaxed">
                <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 shrink-0" /> 2-hour intensive hands-on session</li>
                <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 shrink-0" /> Learn saddling & weight distribution</li>
                <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 shrink-0" /> Practice leading through obstacles</li>
                <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 shrink-0" /> Basic first aid & trail nutrition</li>
              </ul>
            </div>

            <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-xl space-y-6">
              <div className="w-12 h-12 bg-white/10 text-green-400 rounded-2xl flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Certification</h3>
              <p className="text-stone-400 text-sm font-medium leading-relaxed">
                Completion of this clinic grants you "Pro" status in our system, allowing you to book solo expeditions without a guide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
