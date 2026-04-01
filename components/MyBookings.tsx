import React, { useState, useEffect } from 'react';
import { db, auth, collection, onSnapshot, query, where, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { BookingData } from '../types';
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, Mountain, Package, Users, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bookings'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingData[];
      setBookings(fetchedBookings);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Retrieving Expedition History...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-stone-50 rounded-[3rem] p-16 text-center border border-stone-100">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm text-stone-200">
          <Calendar size={32} />
        </div>
        <h3 className="text-2xl font-black text-stone-900 mb-2">No Treks Found</h3>
        <p className="text-stone-400 font-medium mb-8">You haven't requested any expeditions yet.</p>
        <a href="#booking" className="inline-flex items-center gap-2 text-gold font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
          Plan Your First Trek <ChevronRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {bookings.map((booking, idx) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-stone-100 rounded-[2.5rem] p-8 hover:shadow-xl transition-all group overflow-hidden relative"
          >
            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                    booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                    booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-100 text-stone-500'
                  )}>
                    {booking.status === 'confirmed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {booking.status}
                  </div>
                  <span className="text-stone-300 font-bold text-xs">ID: {booking.id?.substring(0, 8)}</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-3xl font-black text-stone-900 tracking-tighter">
                    {booking.bookingType === 'clinic' ? 'Pack Clinic' : 'High Country Expedition'}
                  </h4>
                  <div className="flex items-center gap-2 text-stone-400 font-bold text-sm">
                    <Calendar size={16} className="text-gold" />
                    {booking.startDate} {booking.endDate ? `— ${booking.endDate}` : ''}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-stone-300" />
                    <span className="text-xs font-bold text-stone-600">{booking.numLlamas} Llamas</span>
                  </div>
                  {booking.trailerNeeded && (
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-stone-300" />
                      <span className="text-xs font-bold text-stone-600">Trailer</span>
                    </div>
                  )}
                  {booking.addons && booking.addons.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-stone-300" />
                      <span className="text-xs font-bold text-stone-600">{booking.addons.length} Add-ons</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between items-end text-right gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Investment</p>
                  <p className="text-3xl font-black text-gold">${booking.totalPrice?.toLocaleString()}</p>
                </div>
                
                <button className="p-4 bg-stone-50 text-stone-400 rounded-2xl group-hover:bg-midnight group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Background Mountain Trace */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Mountain size={200} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
