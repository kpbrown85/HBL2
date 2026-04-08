
import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, User, ArrowRight, Mountain, Wind, Sun, X, Send, CheckCircle2, Loader2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, collection, addDoc, handleFirestoreError, OperationType, query, where, orderBy, onSnapshot } from '../firebase';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
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
    content: 'The Elkhorn Mountains offer some of the most challenging and rewarding terrain in Montana. This solo expedition was a test of both human and llama endurance. We encountered a surprise early-season blizzard on day three, but the llamas handled the slick limestone ridges with incredible poise. Wookie, our lead llama, was instrumental in finding the trail when visibility dropped to near zero. We spent two days hunkered down in a high-altitude basin, waiting for the storm to break before pushing over the final pass. The experience reinforced the importance of high-quality gear and the unparalleled reliability of a well-trained llama string.',
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
    content: 'Securing a load is perhaps the most critical skill for any llama packer. A shifting load can cause discomfort for the animal and lead to dangerous situations on steep trails. In this guide, we cover the three essential knots every packer should know: the Bowline, the Clove Hitch, and the Taut-Line Hitch. We also demonstrate the proper way to secure panniers using the Decker saddle system. Consistency is key—checking your hitches at every rest stop ensures the safety of your string and the integrity of your gear. Practice these at home until they become second nature before heading into the high country.',
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
    content: 'Scouting in winter provides a unique perspective on the landscape. By observing snow accumulation and drainage patterns, we can predict which trails will open early and which will remain blocked by deadfall or high water. Our recent trek into the Scapegoat revealed significant new blowdown in the lower canyons, which will require clearing before the summer season begins. However, the high ridges are looking spectacular. We\'ve identified several new potential campsites near alpine lakes that have rarely been visited. This season promises to be one of our best yet for those seeking true solitude and pristine wilderness.',
    author: 'Helena Team',
    date: 'Jan 20, 2026',
    category: 'Scouting',
    imageUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=800',
    readTime: '12 min read'
  }
];

export const ExpeditionBlog: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [communityReports, setCommunityReports] = useState<BlogPost[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Expedition Report',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(
      collection(db, 'trip-reports'), 
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          excerpt: data.content.substring(0, 150) + '...',
          content: data.content,
          author: data.authorName,
          date: data.date,
          category: data.category || 'Community Report',
          imageUrl: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=800', // Default for community
          readTime: Math.ceil(data.content.split(' ').length / 200) + ' min read'
        } as BlogPost;
      });
      setCommunityReports(reports);
    }, (error) => {
      console.error("Error fetching trip reports:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please sign in to submit a trip report.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trip-reports'), {
        uid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        title: formData.title,
        content: formData.content,
        category: formData.category,
        date: formData.date,
        status: 'approved', // Auto-approve for now as requested by "view trip reports"
        createdAt: new Date().toISOString()
      });
      setSubmitSuccess(true);
      setFormData({ 
        title: '', 
        content: '', 
        category: 'Expedition Report',
        date: new Date().toISOString().split('T')[0] 
      });
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitForm(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trip-reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allPosts = [...BLOG_POSTS, ...communityReports];

  return (
    <div className="space-y-16">
      <header className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 bg-midnight/5 px-6 py-3 rounded-full border border-midnight/10 mb-8">
          <BookOpen className="text-gold" size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">High Country Trip Reports</span>
        </div>
        <h2 className="text-6xl font-black tracking-tight text-stone-900 mb-8">Expedition Reports & Field Notes</h2>
        <p className="text-stone-500 font-bold text-xl leading-relaxed">
          Stories from the trail, technical packing advice, and scouting reports from the Montana Rockies.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {allPosts.map((post) => (
          <article 
            key={post.id} 
            className="group cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
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
            
            <p className="text-stone-500 font-medium leading-relaxed mb-6 px-4 line-clamp-3">
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
          We love hearing from our clients. If you have a trip report or photos you'd like to share, send them over and we'll feature them in our Trip Reports section.
        </p>
        <button 
          onClick={() => setShowSubmitForm(true)}
          className="px-12 py-6 bg-stone-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
        >
          Submit Trip Report
        </button>
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[4rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-8 right-8 z-10 p-4 bg-white/90 backdrop-blur-md rounded-2xl text-stone-900 hover:bg-gold hover:text-white transition-all shadow-xl"
              >
                <X size={24} />
              </button>

              <div className="overflow-y-auto">
                <div className="h-[400px] relative">
                  <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </div>

                <div className="p-16 -mt-32 relative">
                  <div className="inline-flex items-center gap-3 bg-gold px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl mb-8">
                    {selectedPost.category}
                  </div>
                  <h2 className="text-6xl font-black tracking-tight text-stone-900 mb-8 leading-tight">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-8 text-stone-400 font-black text-xs uppercase tracking-widest mb-12 pb-12 border-b border-stone-100">
                    <span className="flex items-center gap-2"><User size={16} className="text-gold" /> {selectedPost.author}</span>
                    <span className="flex items-center gap-2"><Calendar size={16} className="text-gold" /> {selectedPost.date}</span>
                    <span>{selectedPost.readTime}</span>
                  </div>
                  <div className="prose prose-stone prose-xl max-w-none">
                    <p className="text-stone-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedPost.content}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Form Modal */}
      <AnimatePresence>
        {showSubmitForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowSubmitForm(false)}
              className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[4rem] max-w-2xl w-full p-16 shadow-2xl"
            >
              <button 
                onClick={() => setShowSubmitForm(false)}
                className="absolute top-8 right-8 p-4 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={24} />
              </button>

              {submitSuccess ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-4xl font-black text-stone-900 mb-4">Report Submitted!</h3>
                  <p className="text-stone-500 font-bold text-xl">Our team will review your story and feature it soon.</p>
                </div>
              ) : (
                <>
                  <div className="mb-12 text-center">
                    <h3 className="text-4xl font-black text-stone-900 mb-4">Share Your Story</h3>
                    <p className="text-stone-500 font-bold text-lg">Tell us about your latest high country expedition.</p>
                  </div>

                  <form onSubmit={handleSubmitReport} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Expedition Title</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g., Sunrise over the Scapegoat"
                        className="w-full bg-stone-50 border border-stone-100 p-6 rounded-3xl outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">The Story</label>
                      <textarea 
                        required
                        rows={6}
                        placeholder="Tell us about the trails, the llamas, and the views..."
                        className="w-full bg-stone-50 border border-stone-100 p-6 rounded-3xl outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900 resize-none"
                        value={formData.content}
                        onChange={e => setFormData({...formData, content: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Category</label>
                        <select 
                          className="w-full bg-stone-50 border border-stone-100 p-6 rounded-3xl outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900 appearance-none"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                          <option>Expedition Report</option>
                          <option>Skills & Tips</option>
                          <option>Scouting</option>
                          <option>Gear Review</option>
                          <option>Wildlife</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Expedition Date</label>
                        <input 
                          type="date"
                          className="w-full bg-stone-50 border border-stone-100 p-6 rounded-3xl outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900"
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={isSubmitting}
                      className="w-full py-8 bg-stone-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>Submit Report <Send size={16} /></>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
