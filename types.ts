
import React from 'react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface Llama {
  id: string;
  name: string;
  age: number;
  personality: string;
  maxLoad: number; // in lbs
  imageUrl: string;
  specialty: 'Backpacking' | 'Hunting' | 'Lead Llama' | 'Gentle Soul';
}

export interface BookingData {
  id: string;
  name: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  numLlamas: number;
  trailerNeeded: boolean;
  isFirstTimer: boolean;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'canceled';
  isRead?: boolean;
  signature_data?: string;
  signed_at?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Herd' | 'Logistics' | 'Equipment' | 'Safety';
}

export interface GalleryImage {
  url: string;
  caption: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface GearItem {
  id: string;
  name: string;
  description: string;
  category: 'backpacking' | 'hunting' | 'both';
  icon: React.ReactNode;
}
