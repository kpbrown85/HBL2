
import React from 'react';

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
  name: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  numLlamas: number;
  trailerNeeded: boolean;
  isFirstTimer: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
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