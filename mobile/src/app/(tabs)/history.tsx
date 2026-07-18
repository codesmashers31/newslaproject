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
import { useColorScheme } from 'nativewind';
import API from '../../services/api';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  BookOpen, 
  CalendarRange 
} from 'lucide-react-native';

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      <View className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18] items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  const attendance = data?.attendance || { percentage: 0, totalClasses: 0, presentCount: 0, records: [] };
  const records = attendance.records || [];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] bg-white dark:bg-[#0E0A18]">
        <Text className="text-xl font-black text-[#1A1325] dark:text-[#F6F3FC]">Attendance Logs</Text>
        <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2]">View check-in times and rolling stats</Text>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
        className="flex-1 px-6 py-4"
      >
        
        {/* 1. Rolling Attendance stats */}
        <View className="bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-5 mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] font-extrabold uppercase">Roll Summary</Text>
            <Text className="text-2xl font-black text-[#1A1325] dark:text-[#F6F3FC] mt-0.5">{attendance.percentage}% Attendance</Text>
            <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] mt-1 font-semibold">
              Marked {attendance.presentCount} of {attendance.totalClasses} session days
            </Text>
          </View>
          <View className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl items-center justify-center">
            <CalendarRange size={22} color="#a78bfa" />
          </View>
        </View>

        {/* 2. History Feed List */}
        <View className="space-y-3 mb-10">
          <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] font-extrabold uppercase tracking-wider mb-1">Check-in Feed History</Text>
          
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
                  className="bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] p-4 rounded-2xl flex-row justify-between items-center"
                >
                  <View className="space-y-1 max-w-[70%]">
                    <Text className="font-bold text-xs text-[#1A1325] dark:text-[#F6F3FC]">{formattedDate}</Text>
                    <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2]">
                      Scan: {formattedTime}
                    </Text>
                    {rec.remarks ? (
                      <Text className="text-[9px] text-[#6B6478] dark:text-[#A79AC2] italic mt-1">
                        Trainer note: "{rec.remarks}"
                      </Text>
                    ) : null}
                  </View>

                  <View className="items-end">
                    <Text className={`text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                      rec.status === 'Present'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : rec.status === 'Late'
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {rec.status}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-white dark:bg-[#1C1530] border border-dashed border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-8 items-center justify-center">
              <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2] italic">No attendance records stored yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
