import React, { useState } from 'react';
import { Sparkles, GraduationCap, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Web port of mobile/src/components/BannerCarousel.tsx.
 * Same three promo banners, arrow controls and dot indicators.
 */
const banners = [
  {
    id: 1,
    title: 'Full-Stack Bootcamp',
    subtitle: 'Master MERN & Next.js. Enroll now and get 20% off!',
    Icon: GraduationCap,
    colors: 'bg-violet-800',
    tag: 'New Course',
  },
  {
    id: 2,
    title: 'Career Placement Drive',
    subtitle: 'Top IT companies are hiring. Register your profile today.',
    Icon: Briefcase,
    colors: 'bg-emerald-600',
    tag: 'Hiring',
  },
  {
    id: 3,
    title: 'Informatics Premium',
    subtitle: 'Upgrade to pro tier for 1-on-1 expert mentorship.',
    Icon: Sparkles,
    colors: 'bg-purple-600',
    tag: 'Pro Feature',
  },
];

export default function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => setActiveIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleNext = () => setActiveIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  const banner = banners[activeIndex];
  const { Icon } = banner;

  return (
    <div>
      <div
        className={`relative rounded-3xl p-5 ${banner.colors} shadow-md flex justify-between items-center overflow-hidden min-h-[140px]`}
      >
        {/* Decorative background circle */}
        <span className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        <div className="flex-1 pr-4 relative">
          <span className="bg-white/20 inline-block px-2.5 py-1 rounded-full mb-3 text-white text-[10px] font-bold uppercase tracking-wider">
            {banner.tag}
          </span>
          <h3 className="text-white text-lg font-black tracking-tight mb-1">{banner.title}</h3>
          <p className="text-white/80 text-xs font-medium leading-relaxed">{banner.subtitle}</p>
        </div>

        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 relative">
          <Icon size={24} className="text-white" />
        </div>
      </div>

      {/* Controls: arrows + dot indicators */}
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous banner"
          className="w-8 h-8 rounded-full bg-white dark:bg-[#12131a] border border-[#E2E8F0] dark:border-[#1e2330] flex items-center justify-center shadow-sm cursor-pointer"
        >
          <ChevronLeft size={16} className="text-[#64748B]" />
        </button>

        <div className="flex gap-1.5">
          {banners.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? 'w-4 bg-[#4F46E5]' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next banner"
          className="w-8 h-8 rounded-full bg-white dark:bg-[#12131a] border border-[#E2E8F0] dark:border-[#1e2330] flex items-center justify-center shadow-sm cursor-pointer"
        >
          <ChevronRight size={16} className="text-[#64748B]" />
        </button>
      </div>
    </div>
  );
}
