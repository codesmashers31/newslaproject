import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import { 
  LANGUAGES, 
  LanguageCode, 
  getStoredLanguage, 
  setStoredLanguage, 
  getText 
} from '../services/language';
import { 
  MessageCircle, 
  Languages, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  X 
} from 'lucide-react-native';
import { Image } from 'expo-image';

interface AppHeaderProps {
  title?: string;
  onRefreshData?: () => void;
}

export default function AppHeader({ title, onRefreshData }: AppHeaderProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    getStoredLanguage().then(setCurrentLang);
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const cached = await AsyncStorage.getItem('cached_dashboard_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        const list = parsed.notifications || [];
        const count = parsed.unreadNotificationsCount ?? list.filter((n: any) => !n.isRead).length;
        setNotificationsList(list);
        setUnreadCount(count);
      }
    } catch (e) {}

    try {
      const { data } = await API.get('/student/dashboard');
      const list = data?.notifications || [];
      const count = data?.unreadNotificationsCount ?? list.filter((n: any) => !n.isRead).length;
      setNotificationsList(list);
      setUnreadCount(count);
    } catch (e) {}
  };

  const changeLanguage = async (code: LanguageCode) => {
    setCurrentLang(code);
    await setStoredLanguage(code);
    setLangModalVisible(false);
    if (onRefreshData) onRefreshData();
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('student_token');
    await AsyncStorage.removeItem('student_profile');
    router.replace('/login');
  };

  const openWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20SLA%20Portal%20Support').catch(() => {});
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put('/student/notifications/read');
      setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleMarkSingleRead = async (notifId: string) => {
    try {
      await API.put('/student/notifications/read', { notificationId: notifId });
      setNotificationsList(prev => {
        const updated = prev.map(n => n._id === notifId ? { ...n, isRead: true } : n);
        setUnreadCount(updated.filter(n => !n.isRead).length);
        return updated;
      });
    } catch (e) {}
  };

  const pageTitle = title || getText(currentLang, 'portalTitle');

  return (
    <>
      {/* Universal Fixed Top Navbar */}
      <View className="flex-row justify-between items-center px-5 py-3 bg-white/95 border-b border-slate-200/80 shadow-xs z-30">
        <View className="flex-row items-center gap-2.5">
          <View className="bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs">
            <Image
              source={require('../../assets/images/branding/logo-buildx.png')}
              style={{ height: 34, width: 34 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-lg font-black text-slate-800 tracking-tight">{pageTitle}</Text>
        </View>
        
        {/* Right Action Icons Row (WhatsApp, Language, Notification Bell, Sign Out) */}
        <View className="flex-row items-center gap-2.5">
          {/* WhatsApp Support */}
          <TouchableOpacity 
            onPress={openWhatsAppSupport}
            className="w-11 h-11 bg-emerald-500/10 rounded-2xl items-center justify-center border border-emerald-500/25 shadow-xs"
          >
            <MessageCircle size={20} color="#10B981" />
          </TouchableOpacity>

          {/* Language Selector */}
          <TouchableOpacity 
            onPress={() => setLangModalVisible(true)}
            className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-200/80 shadow-xs"
          >
            <Languages size={20} color="#475569" />
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity 
            onPress={() => {
              loadNotifications();
              setNotifModalVisible(true);
            }}
            className="w-11 h-11 bg-white rounded-2xl items-center justify-center border border-slate-200/80 shadow-xs relative"
          >
            <Bell size={20} color="#475569" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center border-2 border-white shadow-xs">
                <Text className="text-white text-[9px] font-black">{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity 
            onPress={handleSignOut}
            className="w-11 h-11 bg-rose-500/10 rounded-2xl items-center justify-center border border-rose-500/25 shadow-xs"
          >
            <LogOut size={18} color="#F43F5E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal visible={langModalVisible} animationType="fade" transparent={true} onRequestClose={() => setLangModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-3xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-indigo-50 rounded-xl">
                  <Languages size={20} color="#4F46E5" />
                </View>
                <Text className="text-lg font-black text-slate-800">{getText(currentLang, 'selectLanguage')}</Text>
              </View>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="gap-2.5 my-2">
              {LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => changeLanguage(lang.code)}
                    className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${isSelected ? 'bg-indigo-50/80 border-indigo-500' : 'bg-slate-50/60 border-slate-200'}`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xl">{lang.flag}</Text>
                      <View>
                        <Text className="text-sm font-black text-slate-800">{lang.nativeName}</Text>
                        <Text className="text-[11px] text-slate-500 font-medium">{lang.name} • {lang.region}</Text>
                      </View>
                    </View>
                    {isSelected && <CheckCircle2 size={18} color="#4F46E5" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Drawer Modal */}
      <Modal visible={notifModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNotifModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2.5">
                <View className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/50">
                  <Bell size={20} color="#D97706" />
                </View>
                <View>
                  <Text className="text-xl font-black text-slate-800">{getText(currentLang, 'notifications')}</Text>
                  {unreadCount > 0 && (
                    <Text className="text-[10px] text-rose-500 font-extrabold">{unreadCount} Unread</Text>
                  )}
                </View>
              </View>
              
              <View className="flex-row items-center gap-2">
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead} className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Text className="text-indigo-600 text-xs font-black">Mark All Read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotifModalVisible(false)} className="p-2 bg-slate-200/60 rounded-full">
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {notificationsList.length === 0 ? (
                <View className="py-16 items-center justify-center">
                  <Bell size={40} color="#94A3B8" />
                  <Text className="text-slate-500 font-bold text-sm mt-3">{getText(currentLang, 'noNotifications')}</Text>
                </View>
              ) : (
                notificationsList.map((item: any, idx: number) => {
                  const isUnread = !item.isRead;
                  return (
                    <TouchableOpacity 
                      key={item._id || idx} 
                      onPress={() => isUnread && item._id && handleMarkSingleRead(item._id)}
                      activeOpacity={0.8}
                      className={`p-4 mb-3 rounded-2xl border ${isUnread ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' : 'bg-white border-slate-200'}`}
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-row items-center flex-1 mr-2 gap-1.5">
                          {isUnread && <View className="w-2 h-2 rounded-full bg-indigo-600" />}
                          <Text className="text-slate-900 font-bold text-sm flex-1">{item.title || 'Notification'}</Text>
                        </View>
                        <Text className="text-[10px] text-slate-400 font-semibold">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                        </Text>
                      </View>
                      <Text className="text-slate-600 text-xs mt-1 leading-relaxed">{item.message}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
