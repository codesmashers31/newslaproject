import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Sparkles, GraduationCap, Briefcase } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function BannerCarousel() {
  const banners = [
    {
      id: 1,
      title: 'Full-Stack Bootcamp',
      subtitle: 'Master MERN & Next.js. Enroll now and get 20% off!',
      icon: <GraduationCap size={24} color="#ffffff" />,
      colors: 'bg-indigo-600',
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

  return (
    <View className="mt-4 mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            style={{ width: CARD_WIDTH }}
            className={`rounded-3xl p-5 ${banner.colors} shadow-lg shadow-indigo-900/20 flex flex-row justify-between items-center overflow-hidden`}
          >
            {/* Decorative background circle */}
            <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            
            <View className="flex-1 pr-4">
              <View className="bg-white/20 self-start px-2.5 py-1 rounded-full mb-3">
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">{banner.tag}</Text>
              </View>
              <Text className="text-white text-lg font-black tracking-tight mb-1">{banner.title}</Text>
              <Text className="text-white/80 text-xs font-medium leading-relaxed">{banner.subtitle}</Text>
            </View>
            
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md">
              {banner.icon}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
