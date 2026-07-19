import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Sparkles, GraduationCap, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Full width matching standard padding

export default function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = [
    {
      id: 1,
      title: 'Full-Stack Bootcamp',
      subtitle: 'Master MERN & Next.js. Enroll now and get 20% off!',
      icon: <GraduationCap size={24} color="#ffffff" />,
      colors: 'bg-violet-800',
      tag: 'New Course'
    },
    {
      id: 2,
      title: 'Career Placement Drive',
      subtitle: 'Top IT companies are hiring. Register your profile today.',
      icon: <Briefcase size={24} color="#ffffff" />,
      colors: 'bg-emerald-600',
      tag: 'Hiring'
    },
    {
      id: 3,
      title: 'Informatics Premium',
      subtitle: 'Upgrade to pro tier for 1-on-1 expert mentorship.',
      icon: <Sparkles size={24} color="#ffffff" />,
      colors: 'bg-purple-600',
      tag: 'Pro Feature'
    }
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const activeBanner = banners[activeIndex];

  return (
    <View className="mt-4 mb-2 px-6">
      {/* 1. Single prominent active card */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={{ width: CARD_WIDTH }}
        className={`rounded-3xl p-5 ${activeBanner.colors} shadow-md shadow-violet-950/10 flex flex-row justify-between items-center overflow-hidden min-h-[140px]`}
      >
        {/* Decorative background circle */}
        <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
        
        <View className="flex-1 pr-4">
          <View className="bg-white/20 self-start px-2.5 py-1 rounded-full mb-3">
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">{activeBanner.tag}</Text>
          </View>
          <Text className="text-white text-lg font-black tracking-tight mb-1">{activeBanner.title}</Text>
          <Text className="text-white/80 text-xs font-medium leading-relaxed">{activeBanner.subtitle}</Text>
        </View>
        
        <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md">
          {activeBanner.icon}
        </View>
      </TouchableOpacity>

      {/* 2. Controls Row (Arrow buttons + Dot Indicators) */}
      <View className="flex-row items-center justify-between mt-3 px-1">
        {/* Left Arrow Button */}
        <TouchableOpacity
          onPress={handlePrev}
          className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] items-center justify-center shadow-sm"
        >
          <ChevronLeft size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Center Dot Indicators */}
        <View className="flex-row gap-1.5">
          {banners.map((_, index) => (
            <View
              key={index}
              className={`h-1.5 rounded-full ${activeIndex === index ? 'w-4 bg-[#4F46E5]' : 'w-1.5 bg-slate-200'}`}
            />
          ))}
        </View>

        {/* Right Arrow Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] items-center justify-center shadow-sm"
        >
          <ChevronRight size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
