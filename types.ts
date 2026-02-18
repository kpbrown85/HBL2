
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

export interface WeatherDay {
  day: string;
  condition: string;
  high: string;
  low: string;
  precipitation: string;
}

export interface WeatherForecast {
  currentTemp: string;
  currentCondition: string;
  lastUpdated: string;
  forecast: WeatherDay[];
  sources: { uri: string; title: string }[];
}
