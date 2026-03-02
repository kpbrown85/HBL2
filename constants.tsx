
import React from 'react';
import { Llama, FAQItem, GalleryImage, GearItem, Review, Trail, BlogEntry, GearAddon } from './types';
import { 
  Leaf, 
  ShieldCheck, 
  Mountain, 
  Weight, 
  Package, 
  Target, 
  Tent, 
  Scale, 
  Zap, 
  Thermometer,
  Anchor,
  Compass
} from 'lucide-react';

export const LLAMAS: Llama[] = [
  {
    id: '1',
    name: 'Wookie',
    age: 8,
    personality: 'The Stoic General. Wookie is unfazed by creek crossings, lightning, or heavy timber.',
    maxLoad: 80,
    imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    specialty: 'Lead Llama'
  },
  {
    id: '2',
    name: 'Boulder',
    age: 5,
    personality: 'Rugged and reliable. A powerhouse climber who excels on technical, high-altitude trails.',
    maxLoad: 90,
    imageUrl: 'https://images.unsplash.com/photo-1574347781534-f87f4c084610?auto=format&fit=crop&q=80&w=800',
    specialty: 'Backpacking'
  },
  {
    id: '3',
    name: 'Everett',
    age: 10,
    personality: 'The Seasoned Outfitter. Everett has successfully packed out double-digit elk harvests.',
    maxLoad: 85,
    imageUrl: 'https://images.unsplash.com/photo-159107311313064-0731238495a6?auto=format&fit=crop&q=80&w=800',
    specialty: 'Hunting'
  },
  {
    id: '4',
    name: 'Murphy',
    age: 6,
    personality: 'Gentle Soul. Highly socialized and patient, making him the ideal choice for family treks.',
    maxLoad: 70,
    imageUrl: 'https://images.unsplash.com/photo-1518176258769-f2430c396591?auto=format&fit=crop&q=80&w=800',
    specialty: 'Gentle Soul'
  }
];

export const GALLERY_IMAGES: GalleryImage[] = [
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200', caption: 'Sunrise over the Scapegoat' },
  { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200', caption: 'High country base camp' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200', caption: 'Morning deployment' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200', caption: 'Packing out at dusk' },
];

export const FAQS: FAQItem[] = [
  {
    question: "What is the weight capacity per animal?",
    answer: "A fit, mature llama can carry 60-90 lbs of gear, excluding the pack saddle. We weigh every load to ensure balance.",
    category: "Logistics"
  },
  {
    question: "Are they safe around children?",
    answer: "Extremely. Llamas are gentle, curious animals. Our 'Gentle Souls' are specifically trained for family expeditions.",
    category: "Herd"
  },
  {
    question: "Do I need a special trailer?",
    answer: "Yes. Llamas require a stock trailer. We offer daily trailer rentals or can deliver the herd to your trailhead.",
    category: "Logistics"
  },
  {
    question: "How do they handle predators?",
    answer: "Llamas have excellent vision and will sound an alarm call if they spot bears or wolves, acting as a natural camp sentry.",
    category: "Safety"
  }
];

export const BENEFITS = [
  {
    title: "Low Impact",
    description: "Padded feet that protect delicate alpine trails.",
    icon: <Leaf className="w-12 h-12" />
  },
  {
    title: "Elite Altitude",
    description: "Native to the Andes, evolved for vertical oxygen-thin air.",
    icon: <Mountain className="w-12 h-12" />
  },
  {
    title: "Intelligence",
    description: "Incredible situational awareness and camp security.",
    icon: <ShieldCheck className="w-12 h-12" />
  },
  {
    title: "Efficiency",
    description: "Low maintenance grazers that require minimal supplemental feed.",
    icon: <Weight className="w-12 h-12" />
  }
];

export const GEAR_ITEMS: GearItem[] = [
  { id: 'g1', name: 'Decker Saddles', description: 'Professional grade mountain saddles with padded cinch systems.', category: 'both', icon: <Package className="w-6 h-6" /> },
  { id: 'g2', name: 'Trail Scale', description: 'Essential for balancing pannier weight within 2lbs.', category: 'both', icon: <Scale className="w-6 h-6" /> },
  { id: 'g3', name: 'Picket Kit', description: 'High-strength staking system for safe overnight grazing.', category: 'both', icon: <Anchor className="w-6 h-6" /> },
  { id: 'g4', name: 'Meat Panniers', description: 'Insulated, heavy-duty bags designed for elk and deer pack-outs.', category: 'hunting', icon: <Target className="w-6 h-6" /> },
  { id: 'g5', name: 'Alpine Tent', description: 'Since the llamas carry the bulk, enjoy a higher-tier base camp setup.', category: 'backpacking', icon: <Tent className="w-6 h-6" /> }
];

export const PERSONAL_GEAR_CHECKLIST = [
  { id: 'p1', label: 'Bear Spray (Mandatory)', essential: true },
  { id: 'p2', label: 'Water Filtration System', essential: true },
  { id: 'p3', label: 'Emergency GPS / InReach', essential: true },
  { id: 'p4', label: 'Mountain Boots (Broken In)', essential: true },
  { id: 'p5', label: 'Sleeping Bag (15°F or lower)', essential: true },
  { id: 'p6', label: 'Headlamp + Spare Batteries', essential: true },
  { id: 'p7', label: 'Polarized Sunglasses', essential: false },
  { id: 'p8', label: 'Multi-tool / Knife', essential: false },
  { id: 'p9', label: 'Full Personal First Aid Kit', essential: true },
  { id: 'p10', label: 'Sunscreen & Lip Balm', essential: false }
];

export const LLAMA_FACTS = [
  "Llamas have three stomach compartments for extreme nutrient efficiency.",
  "Their feet have soft pads and two toes, making them incredibly sure-footed on loose shale.",
  "A llama's alarm call is a distinct whistling sound that alerts the entire herd to predators.",
  "Llamas communicate through humming and ear positioning.",
  "They were domesticated over 4,000 years ago in the Andes mountains."
];

export const PRICING = {
  dailyPerLlama: 65,
  minLlamas: 2,
  longTripDiscountDays: 5,
  longTripDiscountRate: 0.15,
  clinicFee: 75,
  trailerDaily: 25
};

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    name: 'Sarah J.',
    rating: 5,
    comment: 'Wookie was an incredible leader. We felt so safe crossing the high ridges. Best backpacking trip ever!',
    date: 'August 2024'
  },
  {
    id: 'r2',
    name: 'Marcus T.',
    rating: 5,
    comment: 'Packing out an elk with Everett saved our backs. These llamas are absolute machines in the steep stuff.',
    date: 'October 2024'
  },
  {
    id: 'r3',
    name: 'The Miller Family',
    rating: 5,
    comment: 'Murphy was so patient with the kids. They still talk about "their" llama every day. Highly recommend for families.',
    date: 'July 2024'
  }
];

export const TRAILHEADS: Trail[] = [
  {
    id: 't1',
    name: 'Mount Helena (Park City)',
    region: 'Helena',
    description: 'The classic Helena experience. Quick access to high ridges with panoramic views of the city and the Elkhorn Mountains.',
    difficulty: 'Moderate',
    coordinates: { lat: 46.5822, lng: -112.0528 },
    bestFor: 'Day Treks / Training',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't2',
    name: 'Trout Creek Canyon',
    region: 'Helena',
    description: 'Stunning limestone cliffs and a gentle grade. Perfect for first-time llama packers and families.',
    difficulty: 'Easy',
    coordinates: { lat: 46.7214, lng: -111.7845 },
    bestFor: 'Families / Beginners',
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't3',
    name: 'Hanging Valley',
    region: 'Helena',
    description: 'A hidden gem in the Big Belt Mountains. Lush meadows and dramatic rock formations await the adventurous.',
    difficulty: 'Strenuous',
    coordinates: { lat: 46.8122, lng: -111.6541 },
    bestFor: 'Backpacking / Photography',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't4',
    name: 'Refrigerator Canyon',
    region: 'Helena',
    description: 'Deep, narrow canyon that stays cool even in mid-summer. Leads into the heart of the Gates of the Mountains Wilderness.',
    difficulty: 'Moderate',
    coordinates: { lat: 46.8541, lng: -111.7214 },
    bestFor: 'Wilderness Access',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't5',
    name: 'Thompson Park',
    region: 'Butte',
    description: 'A unique landscape of granite boulders and Douglas fir. Excellent trails for llama training near the Continental Divide.',
    difficulty: 'Moderate',
    coordinates: { lat: 45.9123, lng: -112.4567 },
    bestFor: 'Day Treks / Training',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't6',
    name: 'Hyalite Canyon',
    region: 'Bozeman',
    description: 'The crown jewel of Bozeman. High alpine lakes and rugged peaks. Perfect for multi-day llama expeditions.',
    difficulty: 'Strenuous',
    coordinates: { lat: 45.4856, lng: -110.9654 },
    bestFor: 'Multi-day Expeditions',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't7',
    name: 'Rattlesnake Wilderness',
    region: 'Missoula',
    description: 'A massive wilderness area right in Missoula\'s backyard. Endless trails through dense forest and high ridges.',
    difficulty: 'Moderate',
    coordinates: { lat: 46.9543, lng: -113.9654 },
    bestFor: 'Backpacking / Solitude',
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800'
  }
];

export const GEAR_ADDONS: GearAddon[] = [
  { id: 'a1', name: '4-Season Expedition Tent', pricePerDay: 15, icon: 'Tent', description: 'Heavy-duty protection for high-altitude camps.' },
  { id: 'a2', name: 'Bear-Proof Canisters', pricePerDay: 5, icon: 'ShieldCheck', description: 'Mandatory in many Montana wilderness areas.' },
  { id: 'a3', name: 'Solar Power Kit', pricePerDay: 10, icon: 'Zap', description: 'Keep your GPS and phone charged on long treks.' },
  { id: 'a4', name: 'Premium Sleeping Pad', pricePerDay: 8, icon: 'Bed', description: 'Extra comfort for those cold mountain nights.' }
];

export const BLOG_ENTRIES: BlogEntry[] = [
  {
    id: 'b1',
    title: 'Sunrise Over the Scapegoat',
    date: 'Sept 12, 2025',
    excerpt: 'A 5-day journey into the heart of the Scapegoat Wilderness with Wookie and Boulder.',
    content: 'The Scapegoat Wilderness is a place of raw beauty and silence. Our 5-day expedition took us through some of the most rugged terrain in Montana...',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200',
    author: 'Kevin Brown'
  },
  {
    id: 'b2',
    title: 'Packing Out: A Successful Harvest',
    date: 'Oct 24, 2024',
    excerpt: 'How Everett and the team handled a double-digit elk pack-out in the Elkhorns.',
    content: 'Hunting in the Elkhorns is a challenge, but packing out a harvest is where the llamas truly shine. Everett proved his worth once again...',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200',
    author: 'Kevin Brown'
  }
];
