
import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, Check, Info, Package } from 'lucide-react';

interface GearItem {
  id: string;
  name: string;
  category: 'Camping' | 'Kitchen' | 'Safety';
  price: number;
  description: string;
  imageUrl: string;
}

const GEAR_ITEMS: GearItem[] = [
  {
    id: 'tent-1',
    name: '4-Season Alpine Tent',
    category: 'Camping',
    price: 45,
    description: 'Rugged, lightweight shelter designed for high-altitude Montana winds.',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'stove-1',
    name: 'Backcountry Jet-Boil Kit',
    category: 'Kitchen',
    price: 15,
    description: 'Fast boiling stove with fuel and compact nesting pots.',
    imageUrl: 'https://images.unsplash.com/photo-1596434449261-26798e3b740a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'filter-1',
    name: 'Gravity Water Filter',
    category: 'Safety',
    price: 10,
    description: 'High-volume filtration system for clean water on the move.',
    imageUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'bear-1',
    name: 'Bear-Proof Food Canister',
    category: 'Safety',
    price: 8,
    description: 'Mandatory for many wilderness areas. Keep your food and the bears safe.',
    imageUrl: 'https://images.unsplash.com/photo-1533675114003-df9730407ad3?auto=format&fit=crop&q=80&w=400'
  }
];

export const GearShop: React.FC = () => {
  const [cart, setCart] = useState<Record<string, number>>({});

  const updateCart = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const total = Object.entries(cart).reduce((acc, [id, qty]) => {
    const item = GEAR_ITEMS.find(i => i.id === id);
    return acc + (item?.price || 0) * qty;
  }, 0);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Package size={24} />
            </div>
            <h2 className="text-5xl font-black tracking-tight text-stone-900">Gear Rental Add-ons</h2>
          </div>
          <p className="text-stone-500 font-bold text-lg leading-relaxed">
            Travel light. Rent high-performance backcountry gear specifically selected for llama packing. All rentals are per-trip.
          </p>
        </div>
        
        {Object.keys(cart).length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-stone-100 flex items-center gap-8 animate-in slide-in-from-right-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Rental Total</p>
              <p className="text-3xl font-black text-green-800">${total}</p>
            </div>
            <button className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3">
              <Check size={18} /> Add to Booking
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {GEAR_ITEMS.map((item) => (
          <div key={item.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-stone-100 flex flex-col">
            <div className="h-56 overflow-hidden relative">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-900 shadow-sm">
                  {item.category}
                </span>
              </div>
              <div className="absolute bottom-6 right-6">
                <span className="bg-green-800 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg">
                  ${item.price}
                </span>
              </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-black text-stone-900 mb-3">{item.name}</h3>
              <p className="text-stone-500 text-sm font-medium leading-relaxed mb-8 flex-1">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                {cart[item.id] ? (
                  <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border border-stone-100">
                    <button 
                      onClick={() => updateCart(item.id, -1)}
                      className="w-10 h-10 bg-white text-stone-900 rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-black w-6 text-center">{cart[item.id]}</span>
                    <button 
                      onClick={() => updateCart(item.id, 1)}
                      className="w-10 h-10 bg-white text-stone-900 rounded-xl flex items-center justify-center shadow-sm hover:bg-green-50 hover:text-green-600 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => updateCart(item.id, 1)}
                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3"
                  >
                    <ShoppingBag size={16} /> Rent This Item
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-stone-900 rounded-[3rem] p-12 text-white flex flex-col lg:flex-row items-center gap-12">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0">
          <Info size={40} className="text-green-400" />
        </div>
        <div className="flex-1 text-center lg:text-left">
          <h4 className="text-2xl font-black mb-2">Need a full pack list?</h4>
          <p className="text-stone-400 font-medium">Use our automated packing list generator to ensure you have everything needed for a safe Montana expedition.</p>
        </div>
        <button className="px-10 py-5 bg-green-800 hover:bg-green-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl">
          Generate List
        </button>
      </div>
    </div>
  );
};
