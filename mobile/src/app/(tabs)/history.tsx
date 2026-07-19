import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import API from '../../services/api';
import { 
  CalendarRange 
} from 'lucide-react-native';

export default function HistoryScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = '#4F46E5';

  const loadHistoryData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load history data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistoryData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistoryData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const attendance = data?.attendance || { percentage: 0, totalClasses: 0, presentCount: 0, records: [] };
  const records = attendance.records || [];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white">
        <Text className="text-2xl font-black text-[#0F172A]">Attendance Logs</Text>
        <Text className="text-xs text-[#64748B] mt-0.5">View check-in times and rolling stats</Text>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Rolling Attendance stats */}
        <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 mb-6 flex-row justify-between items-center shadow-sm">
          <View>
            <Text className="text-[10px] text-[#64748B] font-extrabold uppercase tracking-wider">Roll Summary</Text>
            <Text className="text-2xl font-black text-[#0F172A] mt-1">{attendance.percentage}% Attendance</Text>
            <Text className="text-[10px] text-[#64748B] mt-1.5 font-semibold">
              Marked {attendance.presentCount} of {attendance.totalClasses} session days
            </Text>
          </View>
          <View className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl items-center justify-center">
            <CalendarRange size={22} color={primaryColor} />
          </View>
        </View>

        {/* 2. History Feed List */}
        <View className="space-y-4 mb-10">
          <Text className="text-[10px] text-[#64748B] font-black uppercase tracking-wider">Check-in Feed History</Text>
          
          {records.length > 0 ? (
            records.map((rec: any) => {
              const dateObj = new Date(rec.date);
              const formattedDate = dateObj.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
              const formattedTime = dateObj.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <View 
                  key={rec._id} 
                  className="bg-white border border-[#E2E8F0] p-4.5 rounded-2xl flex-row justify-between items-center shadow-sm"
                >
                  <View className="space-y-1 max-w-[70%]">
                    <Text className="font-bold text-xs text-[#0F172A]">{formattedDate}</Text>
                    <Text className="text-[10px] text-[#64748B] font-semibold mt-0.5">
                      Scan time: {formattedTime}
                    </Text>
                    {rec.remarks ? (
                      <Text className="text-[9px] text-[#64748B] italic mt-1 leading-normal font-semibold">
                        Trainer note: "{rec.remarks}"
                      </Text>
                    ) : null}
                  </View>

                  <View className="items-end">
                    <Text className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      rec.status === 'Present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : rec.status === 'Late'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {rec.status}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white border border-dashed border-[#E2E8F0] rounded-3xl p-8 items-center justify-center shadow-sm">
              <Text className="text-xs text-[#64748B] italic font-semibold">No attendance records stored yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
