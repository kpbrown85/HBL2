
import React, { useState, useEffect } from 'react';
import { PRICING } from '../constants';
import { BookingData } from '../types';
import { 
  Calendar, 
  Users, 
  Truck, 
  GraduationCap, 
  Calculator, 
  Mail, 
  Phone, 
  User,
  ArrowRight,
  CheckCircle2,
  Info,
  Send,
  Loader2
} from 'lucide-react';

export const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    numLlamas: 2,
    trailerNeeded: false,
    isFirstTimer: false
  });

  const [estimate, setEstimate] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [adminEmail, setAdminEmail] = useState('kevin.paul.brown@gmail.com');

  useEffect(() => {
    // Sync with branding email if available
    try {
      const branding = JSON.parse(localStorage.getItem('hbl_branding') || '{}');
      if (branding.adminEmail) setAdminEmail(branding.adminEmail);
    } catch {}
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;

      if (diffDays >= 0) {
        let dailyRate = PRICING.dailyPerLlama;
        if (diffDays > PRICING.longTripDiscountDays) {
          dailyRate *= (1 - PRICING.longTripDiscountRate);
        }

        let total = (formData.numLlamas * dailyRate * diffDays);
        if (formData.trailerNeeded) total += (PRICING.trailerDaily * diffDays);
        if (formData.isFirstTimer) total += PRICING.clinicFee;

        setEstimate(total);
      }
    } else {
      setEstimate(0);
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newBooking: Partial<BookingData> = {
      ...formData,
      status: 'pending',
      isRead: false
    };

    try {
      // Use relative path for maximum compatibility behind proxies
      const apiPath = '/api/create-booking';
      console.log(`[${new Date().toISOString()}] Client: Submitting booking to ${apiPath}`);
      
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newBooking),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorDetail = text;
        try {
          const json = JSON.parse(text);
          // If it's a JSON object, show the whole thing for debugging
          errorDetail = JSON.stringify(json, null, 2);
        } catch {}
        throw new Error(`Server rejected request (${response.status}): ${errorDetail}`);
      }
      
      const savedBooking = await response.json();
      console.log(`[${new Date().toISOString()}] Client: Booking submitted successfully`, savedBooking);

      // Redundancy: Save to localStorage as well
      const existing = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
      localStorage.setItem('hbl_bookings', JSON.stringify([savedBooking, ...existing]));
      
      // Notify app of new booking
      window.dispatchEvent(new Event('hbl_new_booking'));
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Submission error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`SUBMISSION FAILED\n\nError: ${msg}\n\nIf this persists, please contact us at ${adminEmail} or call 801-372-0353.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      startDate: '',
      endDate: '',
      numLlamas: 2,
      trailerNeeded: false,
      isFirstTimer: false
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl border border-stone-100 animate-in fade-in zoom-in duration-500">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/10">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-4xl font-black text-stone-900 mb-4">Request Confirmed</h3>
            <p className="text-stone-500 text-lg mb-4">
              We've received your expedition request, <span className="text-stone-900 font-bold">{formData.name.split(' ')[0]}</span>.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
               <Send size={12} /> Notification dispatched to {adminEmail}
            </div>
          </div>

          <div className="bg-stone-50 rounded-[2rem] p-8 mb-10 border border-stone-100">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400 mb-8 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Request Summary
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 text-left">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-stone-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Contact</p>
                    <p className="font-bold text-stone-900">{formData.name}</p>
                    <div className="flex flex-col text-sm text-stone-500 mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {formData.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {formData.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-stone-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Trip Dates</p>
                    <p className="font-bold text-stone-900">{formData.startDate} <ArrowRight className="inline w-3 h-3 mx-1 text-stone-300" /> {formData.endDate}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-stone-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Fleet</p>
                    <p className="font-bold text-stone-900">{formData.numLlamas} Pack Llamas</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-stone-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Equipment</p>
                    <div className="space-y-1">
                      <p className="font-bold text-stone-900 flex items-center gap-2">
                        {formData.trailerNeeded ? <span className="text-green-600">Trailer Included</span> : <span className="text-stone-300">No Trailer</span>}
                      </p>
                      <p className="font-bold text-stone-900 flex items-center gap-2">
                        {formData.isFirstTimer ? <span className="text-green-600">Packing Clinic Required</span> : <span className="text-stone-300">Clinic Not Needed</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-stone-200 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Estimated Investment</p>
                <div className="text-4xl font-black text-green-800">
                  ${estimate.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={resetForm}
              className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black hover:bg-stone-800 transition-all shadow-xl active:scale-95"
            >
              Send Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-stone-100 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-stone-50 pb-4 mb-8">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 tracking-tight">Lead Contact</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 text-left">Full Name</label>
              <input 
                required
                type="text" 
                className="w-full px-6 py-4 rounded-2xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-medium"
                placeholder="John Muir"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 text-left">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-6 py-4 rounded-2xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-medium"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 text-left">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  className="w-full px-6 py-4 rounded-2xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-medium"
                  placeholder="(406) 555-0123"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-stone-50 pb-4 mb-8">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-700">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 tracking-tight">Expedition Details</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 text-left">Start Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-6 py-4 rounded-2xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-medium"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 text-left">End Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-6 py-4 rounded-2xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-medium"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 text-left">Number of Llamas (Min 2)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range"
                  min="2"
                  max="12"
                  className="flex-1 accent-green-800"
                  value={formData.numLlamas}
                  onChange={(e) => setFormData({...formData, numLlamas: parseInt(e.target.value) || 2})}
                />
                <span className="w-16 text-center font-black text-2xl text-stone-900 bg-stone-100 py-2 rounded-xl border border-stone-200">
                  {formData.numLlamas}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expedition Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 bg-stone-50 p-8 rounded-[2rem] border border-stone-100">
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-stone-100 hover:border-green-200 transition-all shadow-sm">
            <div className="flex flex-col text-left">
              <span className="font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-700" /> Trailer Rental
              </span>
              <span className="text-xs text-stone-500 mt-1 leading-relaxed">
                ${PRICING.trailerDaily}/day transport service
              </span>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, trailerNeeded: !formData.trailerNeeded })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.trailerNeeded ? 'bg-green-700' : 'bg-stone-200'}`}
            >
              <span 
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.trailerNeeded ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <label className="flex items-start gap-4 cursor-pointer group bg-white p-6 rounded-2xl border border-stone-100 hover:border-green-200 transition-all shadow-sm">
            <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${formData.isFirstTimer ? 'bg-green-700 border-green-700 shadow-lg shadow-green-900/20' : 'bg-stone-50 border-stone-200'}`}>
              {formData.isFirstTimer && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden"
              checked={formData.isFirstTimer}
              onChange={(e) => setFormData({...formData, isFirstTimer: e.target.checked})}
            />
            <div className="flex flex-col text-left">
              <span className="font-bold text-stone-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-700" /> Llama Clinic (${PRICING.clinicFee})
              </span>
            </div>
          </label>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl flex flex-col justify-center relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Estimated Total</span>
          </div>
          <div className="text-5xl font-black text-stone-900 relative z-10">
            ${estimate.toLocaleString()}
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-green-800 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-[0_20px_40px_-10px_rgba(22,101,52,0.4)] active:scale-[0.98] flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-900'}`}
      >
        {isSubmitting ? (
          <>Processing Request... <Loader2 className="w-6 h-6 animate-spin" /></>
        ) : (
          <>Send Expedition Request <ArrowRight className="w-6 h-6" /></>
        )}
      </button>
    </form>
  );
};
