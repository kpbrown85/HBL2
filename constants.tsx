
import React from 'react';
import { Llama, FAQItem, GalleryImage, Review, GearItem } from './types';
import { 
  Leaf, 
  Footprints, 
  ShieldCheck, 
  Mountain, 
  Wind, 
  Weight, 
  Package, 
  Target, 
  Tent, 
  Backpack, 
  Scale, 
  Zap, 
  Thermometer,
  Anchor
} from 'lucide-react';

export const LLAMAS: Llama[] = [
  {
    id: '1',
    name: 'Wookie',
    age: 8,
    personality: 'The Stoic Leader. Wookie is unfazed by creek crossings or rocky terrain.',
    maxLoad: 80,
    imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    specialty: 'Lead Llama'
  },
  {
    id: '2',
    name: 'Boulder',
    age: 5,
    personality: 'Rugged and reliable. Boulder is as solid as his name on technical trails.',
    maxLoad: 65,
    imageUrl: 'https://images.unsplash.com/photo-1574347781534-f87f4c084610?auto=format&fit=crop&q=80&w=800',
    specialty: 'Backpacking'
  },
  {
    id: '3',
    name: 'Everett',
    age: 10,
    personality: 'The Workhorse. Everett has helped pack out record-setting bulls for years.',
    maxLoad: 90,
    imageUrl: 'https://images.unsplash.com/photo-159107311313064-0731238495a6?auto=format&fit=crop&q=80&w=800',
    specialty: 'Hunting'
  },
  {
    id: '4',
    name: 'Murphy',
    age: 6,
    personality: 'Gentle and patient. Perfect for families or first-time llama packers.',
    maxLoad: 70,
    imageUrl: 'https://images.unsplash.com/photo-1518176258769-f2430c396591?auto=format&fit=crop&q=80&w=800',
    specialty: 'Gentle Soul'
  }
];

export const GALLERY_IMAGES: GalleryImage[] = [
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200', caption: 'High mountain pass near Helena' },
  { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200', caption: 'Llama camp by the alpine lake' },
  { url: 'https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=1200', caption: 'Morning mist in the Blackfoot Valley' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200', caption: 'Packing out of the Bob Marshall' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200', caption: 'Granite peaks at sunset' },
  { url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=1200', caption: 'Everett on the trail' },
];

export const FAQS: FAQItem[] = [
  {
    question: "How much weight can a llama carry?",
    answer: "A healthy, fit llama can comfortably carry about 20-25% of its body weight. For our herd, this typically ranges from 60 to 90 pounds of gear plus the pack system.",
    category: "Logistics"
  },
  {
    question: "Do llamas spit?",
    answer: "Llamas mostly spit at other llamas to establish hierarchy or over food. It is very rare for them to spit at humans unless they are severely mishandled or threatened. Our llamas are highly socialized.",
    category: "Herd"
  },
  {
    question: "What do llamas eat in the backcountry?",
    answer: "They are grazers and browsers, much like deer or elk. They can survive on native grasses, shrubs, and weeds. However, for longer trips, we provide specialized llama pellets to supplement their diet.",
    category: "Herd"
  },
  {
    question: "Why do I need a minimum of two llamas?",
    answer: "Llamas are herd animals and feel extremely stressed when alone. Two is the absolute minimum for their mental health and safety during a trek.",
    category: "Herd"
  },
  {
    question: "What equipment do I need to bring?",
    answer: "You are responsible for your personal camping gear (tents, sleeping bags, stoves, food). We provide the pack saddles, panniers, and scales for the llamas.",
    category: "Equipment"
  },
  {
    question: "Are llamas afraid of bears?",
    answer: "Llamas are actually excellent alert animals. They have keen eyesight and will often 'alarm call' (a distinct whistling sound) when they spot a predator long before humans notice. This provides an extra layer of safety for your camp.",
    category: "Safety"
  },
  {
    question: "Do I need special training to lead a llama?",
    answer: "First-timers are required to take our 1-hour 'Llama Packing Clinic' ($75). We cover leading, saddling, balanced loading, and picket staking to ensure a successful trip.",
    category: "Logistics"
  },
  {
    question: "How many miles can they hike in a day?",
    answer: "Depending on terrain and vertical gain, a typical llama trek covers 5 to 10 miles per day. They are slower than a human with a light pack but much more efficient than a horse.",
    category: "Logistics"
  }
];

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    name: 'Sarah M.',
    rating: 5,
    comment: 'Wookie was an absolute pro. We packed into the Scapegoat Wilderness for 6 days and he never missed a step. The best backpacking trip of my life!',
    date: 'Aug 2024'
  },
  {
    id: 'r2',
    name: 'Tom Jenkins',
    rating: 5,
    comment: 'Used Everett for a late season elk hunt. He carried out a heavy load without breaking a sweat. Much easier to manage than horses.',
    date: 'Oct 2024'
  },
  {
    id: 'r3',
    name: 'The Robertson Family',
    rating: 4,
    comment: 'Our kids loved Murphy. The clinic was very helpful for us as first-timers. We will be back next summer!',
    date: 'July 2024'
  }
];

export const BENEFITS = [
  {
    title: "Low Environmental Impact",
    description: "Unlike horses, llamas have soft, padded feet that don't tear up delicate alpine trails or campsites.",
    icon: <Leaf className="w-6 h-6 text-green-700" />
  },
  {
    title: "High Altitude Performance",
    description: "Llamas are native to the Andes. They are evolved for low oxygen and rugged, vertical terrain.",
    icon: <Mountain className="w-6 h-6 text-green-700" />
  },
  {
    title: "Intelligence & Alertness",
    description: "They are excellent 'watchdogs' for your camp, alert to predators like bears or mountain lions.",
    icon: <ShieldCheck className="w-6 h-6 text-green-700" />
  },
  {
    title: "Easy to Handle",
    description: "They are much smaller and less intimidating than pack horses or mules, making them great for families.",
    icon: <Weight className="w-6 h-6 text-green-700" />
  }
];

export const GEAR_ITEMS: GearItem[] = [
  {
    id: 'g1',
    name: 'Soft Panniers',
    description: 'Specialized fabric bags that hang on either side of the llama. Essential for balanced weight distribution.',
    category: 'both',
    icon: <Package className="w-6 h-6" />
  },
  {
    id: 'g2',
    name: 'Llama Scale',
    description: 'Used to weigh both panniers to within 1-2 lbs of each other to prevent saddle sores and shifting.',
    category: 'both',
    icon: <Scale className="w-6 h-6" />
  },
  {
    id: 'g3',
    name: 'Picket Line & Stake',
    description: 'Allows llamas to graze safely in a controlled area near camp while you rest.',
    category: 'both',
    icon: <Anchor className="w-6 h-6" />
  },
  {
    id: 'g4',
    name: 'Lightweight Pack Tent',
    description: 'Since llamas carry the heavy stuff, you can afford a slightly more comfortable, but still light, 4-season tent.',
    category: 'backpacking',
    icon: <Tent className="w-6 h-6" />
  },
  {
    id: 'g5',
    name: 'Heavy-Duty Game Bags',
    description: 'Crucial for hunting trips. These bags keep meat clean while being packed out by your llama team.',
    category: 'hunting',
    icon: <Target className="w-6 h-6" />
  },
  {
    id: 'g6',
    name: 'High-Altitude Stove',
    description: 'Reliable cooking system for the thin air of the Montana high country.',
    category: 'backpacking',
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 'g7',
    name: 'Insulated Meat Panniers',
    description: 'Keep your harvest cool during the trek back to the trailhead in warmer early seasons.',
    category: 'hunting',
    icon: <Thermometer className="w-6 h-6" />
  },
  {
    id: 'g8',
    name: 'Solar Power Bank',
    description: 'Keep your GPS and emergency satellite communicators charged on long-duration trips.',
    category: 'both',
    icon: <Wind className="w-6 h-6" />
  }
];

export const LLAMA_FACTS = [
  "Llamas are extremely efficient water users, making them perfect for dry mountain ridges.",
  "A llama's padded feet have a 'low-impact' footprint, similar to a human wearing a hiking boot.",
  "Llamas were first domesticated by the Incas over 4,000 years ago as mountain pack animals.",
  "Llamas possess highly sophisticated social intelligence and can recognize human facial expressions.",
  "A llama's distinct 'alarm call' is a high-pitched whistling sound used to warn the herd of predators.",
  "Llamas are naturally curious and often act as 'trail scouts' for their human companions.",
  "Llamas are pseudo-ruminants, meaning they have a three-compartment stomach for efficient digestion."
];

export const PRICING = {
  dailyPerLlama: 65,
  minLlamas: 2,
  longTripDiscountDays: 5,
  longTripDiscountRate: 0.15, // 15% off
  clinicFee: 75,
  trailerDaily: 25
};
