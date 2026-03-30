
import React, { useState, useEffect } from 'react';
import { PRICING, GEAR_ADDONS } from '../constants';
import { BookingData, GearAddon } from '../types';
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
  Loader2,
  Package,
  ShieldCheck,
  Zap,
  Tent,
  Bed,
  PenTool,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval, isPast, isWithinInterval } from 'date-fns';

interface BookingFormProps {
  isClinicOnly?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({ isClinicOnly = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    numLlamas: isClinicOnly ? 0 : 2,
    trailerNeeded: false,
    isFirstTimer: isClinicOnly ? true : false,
    bookingType: (isClinicOnly ? 'clinic' : 'expedition') as 'clinic' | 'expedition',
    addons: [] as string[],
    customOutfitting: false,
    customRequests: ''
  });

  const [pricingBreakdown, setPricingBreakdown] = useState({
    base: 0,
    seasonal: 0,
    demand: 0,
    addons: 0,
    total: 0
  });

  const [estimate, setEstimate] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [adminEmail, setAdminEmail] = useState('kevin.paul.brown@gmail.com');
  const [existingBookings, setExistingBookings] = useState<BookingData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/get-bookings');
        if (res.ok) {
          const data = await res.json();
          setExistingBookings(data.filter((b: any) => b.status === 'confirmed'));
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    let currentPricing = { ...PRICING };
    // Sync with branding if available
    try {
      const branding = JSON.parse(localStorage.getItem('hbl_branding') || '{}');
      if (branding.adminEmail) setAdminEmail(branding.adminEmail);
      if (branding.pricePerLlamaDay) currentPricing.dailyPerLlama = branding.pricePerLlamaDay;
      if (branding.priceTrailerDay) currentPricing.trailerDaily = branding.priceTrailerDay;
      if (branding.priceClinic) currentPricing.clinicFee = branding.priceClinic;
    } catch {}
    
    if (isClinicOnly) {
      setEstimate(currentPricing.clinicFee);
      return;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;

      if (diffDays >= 0) {
        let dailyRate = currentPricing.dailyPerLlama;
        
        // 1. Seasonality Adjustment
        const startMonth = start.getMonth();
        let seasonalMultiplier = 1;
        if (currentPricing.peakSeasonMonths.includes(startMonth)) {
          seasonalMultiplier += currentPricing.peakSeasonSurcharge;
        } else if (!currentPricing.shoulderSeasonMonths.includes(startMonth)) {
          seasonalMultiplier -= currentPricing.offSeasonDiscount;
        }
        
        // 2. Availability / Demand Adjustment
        // Total herd size is 4 (Wookie, Boulder, Everett, Murphy)
        const totalHerdSize = 4;
        const daysInInterval = eachDayOfInterval({ start, end });
        let maxLlamasBooked = 0;
        
        daysInInterval.forEach(day => {
          const bookedOnDay = existingBookings.reduce((count, b) => {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            return isWithinInterval(day, { start: bStart, end: bEnd }) ? count + b.numLlamas : count;
          }, 0);
          maxLlamasBooked = Math.max(maxLlamasBooked, bookedOnDay);
        });
        
        let demandMultiplier = 1;
        if (maxLlamasBooked / totalHerdSize >= currentPricing.highDemandThreshold) {
          demandMultiplier += currentPricing.highDemandSurcharge;
        }

        // 3. Long Trip Discount
        if (diffDays > currentPricing.longTripDiscountDays) {
          dailyRate *= (1 - currentPricing.longTripDiscountRate);
        }

        const adjustedDailyRate = dailyRate * seasonalMultiplier * demandMultiplier;
        let baseTotal = (formData.numLlamas * adjustedDailyRate * diffDays);
        if (formData.trailerNeeded) baseTotal += (currentPricing.trailerDaily * diffDays);
        if (formData.isFirstTimer) baseTotal += currentPricing.clinicFee;

        // 4. Add Gear Addons
        let addonsTotal = 0;
        formData.addons.forEach(addonId => {
          const addon = GEAR_ADDONS.find(a => a.id === addonId);
          if (addon) addonsTotal += (addon.pricePerDay * diffDays);
        });
        
        // 5. Custom Outfitting
        if (formData.customOutfitting) addonsTotal += currentPricing.customOutfittingFee;

        const total = baseTotal + addonsTotal;
        setEstimate(total);
        setPricingBreakdown({
          base: baseTotal,
          seasonal: seasonalMultiplier - 1,
          demand: demandMultiplier - 1,
          addons: addonsTotal,
          total
        });
      }
    } else {
      setEstimate(0);
      setPricingBreakdown({ base: 0, seasonal: 0, demand: 0, addons: 0, total: 0 });
    }
  }, [formData, isClinicOnly, existingBookings]);

  const toggleAddon = (id: string) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.includes(id) 
        ? prev.addons.filter(a => a !== id) 
        : [...prev.addons, id]
    }));
  };

  const isDateBooked = (date: Date) => {
    return existingBookings.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return isWithinInterval(date, { start, end });
    });
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 hover:bg-stone-100 rounded-full transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-black tracking-tight text-stone-900 uppercase tracking-widest">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 hover:bg-stone-100 rounded-full transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-stone-400">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const isBooked = isDateBooked(day);
        const isSelected = formData.startDate === formattedDate || formData.endDate === formattedDate;
        const isInRange = formData.startDate && formData.endDate && isWithinInterval(day, { start: new Date(formData.startDate), end: new Date(formData.endDate) });
        const isPastDate = isPast(day) && !isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => {
              if (isBooked || isPastDate || !isCurrentMonth) return;
              if (!formData.startDate || (formData.startDate && formData.endDate)) {
                setFormData({ ...formData, startDate: formattedDate, endDate: '' });
              } else {
                const start = new Date(formData.startDate);
                if (day < start) {
                  setFormData({ ...formData, startDate: formattedDate, endDate: '' });
                } else {
                  setFormData({ ...formData, endDate: formattedDate });
                }
              }
            }}
            className={`relative h-14 flex items-center justify-center text-xs font-black cursor-pointer transition-all rounded-xl border-2 ${
              !isCurrentMonth ? 'text-stone-200 border-transparent cursor-default' :
              isBooked ? 'bg-red-50 text-red-300 border-red-50 cursor-not-allowed' :
              isPastDate ? 'text-stone-300 border-transparent cursor-default' :
              isSelected ? 'bg-stone-900 text-white border-stone-900 shadow-lg scale-110 z-10' :
              isInRange ? 'bg-green-100 text-green-800 border-green-100' :
              'bg-white text-stone-600 border-stone-50 hover:border-stone-200'
            }`}
          >
            {format(day, 'd')}
            {isBooked && isCurrentMonth && <div className="absolute bottom-1.5 w-1 h-1 bg-red-400 rounded-full" />}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 mb-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="mb-8">{rows}</div>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newBooking: Partial<BookingData> = {
      ...formData,
      status: 'pending',
      isRead: false,
      totalPrice: estimate,
      timestamp: Date.now()
    };

    try {
      const paths = ['/api/create-booking'];
      let response: Response | null = null;
      let lastError: any = null;

      for (const path of paths) {
        try {
          const res = await fetch(path, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(newBooking),
          });
          
          if (res.ok) {
            response = res;
            break;
          } else {
            const text = await res.text();
            lastError = `Path ${path} failed (${res.status}): ${text.substring(0, 100)}`;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!response) {
        throw new Error(lastError || "All submission paths failed");
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.details || result.error || "Submission failed");
      }

      const savedBooking = result;
      const existing = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
      localStorage.setItem('hbl_bookings', JSON.stringify([savedBooking, ...existing]));
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
      numLlamas: isClinicOnly ? 0 : 2,
      trailerNeeded: false,
      isFirstTimer: isClinicOnly ? true : false,
      bookingType: isClinicOnly ? 'clinic' : 'expedition',
      addons: [],
      customOutfitting: false,
      customRequests: ''
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-2xl border border-stone-100 text-center max-w-4xl mx-auto overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-green-800" />
        <div className="space-y-12">
          <div className="w-24 h-24 bg-green-50 text-green-700 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-green-900/5">
            <CheckCircle2 size={48} />
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl lg:text-7xl font-black text-stone-900 tracking-tighter leading-none">
              Expedition <br/> <span className="text-stone-300 italic">Requested</span>
            </h2>
            <p className="text-stone-400 font-medium text-xl max-w-xl mx-auto leading-relaxed">
              We've received your high-country request. Our team will review the dates and herd availability before confirming your trek.
            </p>
          </div>

          <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 text-left space-y-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-stone-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Schedule</p>
                  <p className="font-bold text-stone-900">{formData.startDate} to {formData.endDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Status</p>
                <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">Pending Review</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-stone-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Gear Add-ons</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.addons.length > 0 ? formData.addons.map(id => {
                        const addon = GEAR_ADDONS.find(a => a.id === id);
                        return (
                          <span key={id} className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            {addon?.name}
                          </span>
                        );
                      }) : <span className="text-stone-300 font-bold">None Selected</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Pricing Breakdown</p>
                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest">
                  {pricingBreakdown.seasonal !== 0 && (
                    <span className={pricingBreakdown.seasonal > 0 ? 'text-amber-600' : 'text-green-600'}>
                      {pricingBreakdown.seasonal > 0 ? 'Peak Season Surcharge' : 'Off-Season Discount'}
                    </span>
                  )}
                  {pricingBreakdown.demand > 0 && (
                    <span className="text-red-600">High Demand Surcharge</span>
                  )}
                  {formData.customOutfitting && (
                    <span className="text-stone-600">Custom Outfitting Fee</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Estimated Investment</p>
                <div className="text-4xl font-black text-green-800">
                  ${estimate.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              type="button"
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
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 lg:p-20 rounded-[4rem] shadow-2xl border border-stone-100 text-left space-y-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-20">
          {/* Step 1: Expedition Details */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-900">Expedition Schedule</h3>
                <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-1">Select your high-country dates</p>
              </div>
            </div>

            <div className="bg-stone-50 p-8 lg:p-12 rounded-[3rem] border border-stone-100">
              {renderHeader()}
              {renderDays()}
              {renderCells()}
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-stone-100 p-6 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-stone-900" 
                    value={formData.startDate} 
                    readOnly
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">End Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-stone-100 p-6 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-stone-900" 
                    value={formData.endDate} 
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Gear Rental Add-ons */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-900">Gear Rental Shop</h3>
                <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-1">Enhance your expedition loadout</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GEAR_ADDONS.map(addon => (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex items-start gap-6 p-8 rounded-[2.5rem] border-2 transition-all text-left ${
                    formData.addons.includes(addon.id)
                      ? 'bg-green-800 border-green-800 text-white shadow-2xl shadow-green-900/20'
                      : 'bg-white border-stone-100 text-stone-900 hover:border-stone-200'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    formData.addons.includes(addon.id) ? 'bg-white/20' : 'bg-stone-50'
                  }`}>
                    {addon.icon === 'Tent' && <Tent size={24} />}
                    {addon.icon === 'ShieldCheck' && <ShieldCheck size={24} />}
                    {addon.icon === 'Zap' && <Zap size={24} />}
                    {addon.icon === 'Bed' && <Bed size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-black text-lg tracking-tight">{addon.name}</h4>
                      <span className={`text-xs font-black uppercase tracking-widest ${
                        formData.addons.includes(addon.id) ? 'text-green-200' : 'text-green-600'
                      }`}>
                        +${addon.pricePerDay}/day
                      </span>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${
                      formData.addons.includes(addon.id) ? 'text-white/70' : 'text-stone-400'
                    }`}>
                      {addon.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-stone-400">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight">Custom Outfitting</h4>
                    <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">Special requests & custom gear</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, customOutfitting: !formData.customOutfitting})}
                  className={`w-16 h-8 rounded-full transition-all relative ${formData.customOutfitting ? 'bg-green-800' : 'bg-stone-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.customOutfitting ? 'left-9' : 'left-1'}`} />
                </button>
              </div>
              
              {formData.customOutfitting && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <p className="text-xs font-bold text-stone-500 italic">Adds a ${PRICING.customOutfittingFee} flat outfitting fee for custom logistics and gear sourcing.</p>
                  <textarea 
                    className="w-full bg-white border border-stone-100 p-6 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-medium text-stone-900 text-sm min-h-[120px]"
                    placeholder="Describe your custom gear needs or special logistics..."
                    value={formData.customRequests}
                    onChange={(e) => setFormData({...formData, customRequests: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-20">
          {/* Step 3: Logistics */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-900">Expedition Logistics</h3>
                <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configure your pack string</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 text-left">Number of Llamas (Min 2)</label>
                <div className="flex items-center gap-6 bg-stone-50 p-6 rounded-3xl border border-stone-100">
                  <input 
                    type="range"
                    min="2"
                    max="12"
                    className="flex-1 accent-green-800"
                    value={formData.numLlamas}
                    onChange={(e) => setFormData({...formData, numLlamas: parseInt(e.target.value) || 2})}
                  />
                  <span className="w-20 text-center font-black text-3xl text-stone-900 bg-white py-4 rounded-2xl border border-stone-200 shadow-sm">
                    {formData.numLlamas}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, trailerNeeded: !formData.trailerNeeded })}
                  className={`flex flex-col p-8 rounded-[2.5rem] border-2 transition-all text-left ${
                    formData.trailerNeeded 
                      ? 'bg-stone-900 border-stone-900 text-white shadow-xl' 
                      : 'bg-white border-stone-100 text-stone-900 hover:border-stone-200'
                  }`}
                >
                  <Truck className={`mb-4 ${formData.trailerNeeded ? 'text-green-400' : 'text-stone-300'}`} size={32} />
                  <h4 className="font-black text-lg tracking-tight mb-1">Trailer Rental</h4>
                  <p className={`text-xs font-bold uppercase tracking-widest ${formData.trailerNeeded ? 'text-stone-400' : 'text-stone-400'}`}>
                    ${PRICING.trailerDaily}/day
                  </p>
                </button>

                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, isFirstTimer: !formData.isFirstTimer })}
                  className={`flex flex-col p-8 rounded-[2.5rem] border-2 transition-all text-left ${
                    formData.isFirstTimer 
                      ? 'bg-stone-900 border-stone-900 text-white shadow-xl' 
                      : 'bg-white border-stone-100 text-stone-900 hover:border-stone-200'
                  }`}
                >
                  <GraduationCap className={`mb-4 ${formData.isFirstTimer ? 'text-green-400' : 'text-stone-300'}`} size={32} />
                  <h4 className="font-black text-lg tracking-tight mb-1">Pack Clinic</h4>
                  <p className={`text-xs font-bold uppercase tracking-widest ${formData.isFirstTimer ? 'text-stone-400' : 'text-stone-400'}`}>
                    ${PRICING.clinicFee} One-time
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Contact */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-900">Contact Information</h3>
                <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-1">Where should we send the intel?</p>
              </div>
            </div>

            <div className="space-y-6">
              <input 
                required
                type="text" 
                className="w-full px-8 py-6 rounded-3xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-bold text-lg"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  required
                  type="email" 
                  className="w-full px-8 py-6 rounded-3xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-bold text-lg"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <input 
                  required
                  type="tel" 
                  className="w-full px-8 py-6 rounded-3xl bg-stone-50 border border-stone-100 focus:bg-white focus:ring-4 focus:ring-green-700/5 focus:border-green-700 outline-none transition-all text-stone-900 font-bold text-lg"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bg-stone-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-2">Estimated Investment</p>
                  <div className="text-6xl font-black tracking-tighter">${estimate.toLocaleString()}</div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {pricingBreakdown.seasonal !== 0 && (
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${pricingBreakdown.seasonal > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        {pricingBreakdown.seasonal > 0 ? 'Peak Rate' : 'Off-Season Rate'}
                      </span>
                    )}
                    {pricingBreakdown.demand > 0 && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-red-500/20 text-red-400">High Demand</span>
                    )}
                  </div>
                </div>
                <Calculator className="text-stone-700" size={48} />
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-white text-stone-900 py-8 rounded-3xl font-black text-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-4 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-stone-100'}`}
              >
                {isSubmitting ? (
                  <>Processing... <Loader2 className="w-6 h-6 animate-spin" /></>
                ) : (
                  <>Send Expedition Request <ArrowRight className="w-6 h-6" /></>
                )}
              </button>
              <p className="text-center text-stone-500 text-[10px] font-black uppercase tracking-widest mt-8">
                No payment required until dates are confirmed
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
