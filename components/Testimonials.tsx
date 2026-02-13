
import React, { useState } from 'react';
import { Review } from '../types';
import { REVIEWS } from '../constants';
import { Star, MessageSquarePlus, Quote } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const review: Review = {
      id: Date.now().toString(),
      name: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      date: 'Just now'
    };
    setReviews([review, ...reviews]);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsFormVisible(false);
      setNewReview({ name: '', rating: 5, comment: '' });
    }, 2000);
  };

  return (
    <div className="space-y-16">
      {/* Review Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl relative group">
            <Quote className="absolute top-6 right-6 w-8 h-8 text-stone-100 group-hover:text-green-50 transition-colors" />
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? 'fill-green-600 text-green-600' : 'text-stone-200'}`} 
                />
              ))}
            </div>
            <p className="text-stone-700 italic mb-6 leading-relaxed">"{review.comment}"</p>
            <div className="flex justify-between items-center border-t border-stone-50 pt-4">
              <span className="font-bold text-stone-900">{review.name}</span>
              <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">{review.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Trigger */}
      <div className="text-center">
        {!isFormVisible ? (
          <button 
            onClick={() => setIsFormVisible(true)}
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-full font-bold hover:bg-stone-800 transition-all shadow-xl active:scale-95"
          >
            <MessageSquarePlus className="w-5 h-5" /> Leave a Review
          </button>
        ) : (
          <div className="max-w-xl mx-auto bg-stone-50 p-10 rounded-[2.5rem] border border-stone-200 shadow-inner animate-in fade-in zoom-in duration-300">
            {isSubmitted ? (
              <div className="py-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <h4 className="text-2xl font-black text-stone-900">Review Published!</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="text-left space-y-6">
                <h4 className="text-2xl font-black text-stone-900 text-center mb-8">Share Your Adventure</h4>
                <div>
                  <label className="block text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">Your Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-white border border-stone-200 px-6 py-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Adventure Seeker"
                    value={newReview.name}
                    onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">Rating</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button 
                        key={r}
                        type="button"
                        onClick={() => setNewReview({...newReview, rating: r})}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${newReview.rating >= r ? 'bg-green-600 text-white' : 'bg-white text-stone-300 border border-stone-200'}`}
                      >
                        <Star className={`w-6 h-6 ${newReview.rating >= r ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 uppercase tracking-widest mb-2">Comments</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full bg-white border border-stone-200 px-6 py-4 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Tell us about your trip and your llama companion..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-green-800 text-white py-4 rounded-xl font-bold hover:bg-green-900 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                  >
                    Post Review
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="px-8 bg-stone-200 text-stone-600 py-4 rounded-xl font-bold hover:bg-stone-300 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
