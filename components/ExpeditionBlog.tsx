
import React from 'react';
import { BookOpen, Calendar, User, ArrowRight, Mountain, Wind, Sun } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  imageUrl: string;
  readTime: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Traversing the Elkhorns: A 7-Day Solo Expedition',
    excerpt: 'How three llamas and one packer navigated the rugged terrain of the Elkhorn Mountains during a late September storm.',
    author: 'Helena Team',
    date: 'Oct 12, 2025',
    category: 'Expedition Report',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    readTime: '8 min read'
  },
  {
    id: '2',
    title: 'Llama Packing 101: Essential Knots and Hitches',
    excerpt: 'Mastering the basics of securing your load. A guide to the most reliable knots for backcountry llama packing.',
    author: 'Chief Wrangler',
    date: 'Nov 05, 2025',
    category: 'Skills',
    imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
    readTime: '5 min read'
  },
  {
    id: '3',
    title: 'Winter Scouting in the Scapegoat Wilderness',
    excerpt: 'Finding the best summer routes while the snow is still deep. A look at the upcoming season\'s most promising trails.',
    author: 'Helena Team',
    date: 'Jan 20, 2026',
    category: 'Scouting',
    imageUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=800',
    readTime: '12 min read'
  }
];

export const ExpeditionBlog: React.FC = () => {
  return (
    <div className="space-y-16">
      <header className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 bg-midnight/5 px-6 py-3 rounded-full border border-midnight/10 mb-8">
          <BookOpen className="text-gold" size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">The High Country Journal</span>
        </div>
        <h2 className="text-6xl font-black tracking-tight text-stone-900 mb-8">Expedition Reports & Field Notes</h2>
        <p className="text-stone-500 font-bold text-xl leading-relaxed">
          Stories from the trail, technical packing advice, and scouting reports from the Montana Rockies.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {BLOG_POSTS.map((post) => (
          <article key={post.id} className="group cursor-pointer">
            <div className="relative h-[450px] rounded-[3rem] overflow-hidden mb-8 shadow-xl group-hover:shadow-2xl transition-all duration-500">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute top-8 left-8">
                <span className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-900 shadow-lg">
                  {post.category}
                </span>
              </div>
              
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-4 text-white/80 text-[10px] font-black uppercase tracking-widest mb-4">
                  <span className="flex items-center gap-2"><Calendar size={14} /> {post.date}</span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-3xl font-black text-white leading-tight group-hover:text-gold transition-colors">
                  {post.title}
                </h3>
              </div>
            </div>
            
            <p className="text-stone-500 font-medium leading-relaxed mb-6 px-4">
              {post.excerpt}
            </p>
            
            <div className="flex items-center gap-3 px-4 text-stone-900 font-black text-xs uppercase tracking-widest group-hover:gap-6 transition-all">
              Read Full Report <ArrowRight size={16} className="text-gold" />
            </div>
          </article>
        ))}
      </div>

      <div className="bg-stone-50 rounded-[4rem] p-16 border border-stone-100 text-center">
        <h3 className="text-3xl font-black text-stone-900 mb-6">Want to contribute?</h3>
        <p className="text-stone-500 font-bold text-lg mb-10 max-w-2xl mx-auto">
          We love hearing from our clients. If you have a trip report or photos you'd like to share, send them over and we'll feature them in the Journal.
        </p>
        <button className="px-12 py-6 bg-stone-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">
          Submit Trip Report
        </button>
      </div>
    </div>
  );
};
