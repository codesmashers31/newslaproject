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
  CalendarRange,
  Clock
} from 'lucide-react-native';


export default function HistoryScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('All');
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

  // Group records by day
  const groupRecordsByDate = (recordsList: any[]) => {
    const groups: { [key: string]: any[] } = {};
    recordsList.forEach(rec => {
      if (!rec.date) return;
      const dateObj = new Date(rec.date);
      const dateString = dateObj.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(rec);
    });
    return groups;
  };

  const groupedRecords = groupRecordsByDate(records);
  const totalPresent = attendance.presentCount ?? 0;
  const totalClasses = attendance.totalClasses ?? 0;
  const totalAbsent = Math.max(0, totalClasses - totalPresent);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center gap-3.5">
        <View className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100/50">
          <Clock size={20} color="#2563EB" />
        </View>
        <View>
          <Text className="text-2xl font-black text-[#0F172A]">Attendance Logs</Text>
          <Text className="text-xs text-[#64748B] mt-0.5">View check-in times and rolling stats</Text>
        </View>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Stylized Roll Summary dashboard card */}
        <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-[9px] text-[#64748B] font-black uppercase tracking-wider">Attendance Rate</Text>
              <Text className="text-3xl font-black text-[#0F172A] mt-1">{attendance.percentage}%</Text>
            </View>
            <View className="w-10 h-10 bg-blue-50 border border-blue-100/50 rounded-xl items-center justify-center">
              <CalendarRange size={20} color="#2563EB" />
            </View>
          </View>

          {/* Progress bar */}
          <View className="h-2 rounded-full bg-slate-100 mb-5 overflow-hidden">
            <View className="h-full rounded-full bg-[#2563EB]" style={{ width: `${attendance.percentage}%` }} />
          </View>

          {/* 3 Columns Metrics */}
          <View className="flex-row gap-3 pt-3.5 border-t border-[#F1F5F9]">
            <View className="flex-1 items-center">
              <Text className="text-sm font-black text-[#0F172A]">{totalPresent}</Text>
              <Text className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider mt-1">Days Present</Text>
            </View>
            <View className="flex-1 items-center border-x border-[#F1F5F9]">
              <Text className="text-sm font-black text-[#0F172A]">{totalClasses}</Text>
              <Text className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider mt-1">Total Classes</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-sm font-black text-rose-600">{totalAbsent}</Text>
              <Text className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider mt-1">Days Absent</Text>
            </View>
          </View>
        </View>

        {/* Date Picker Filter Bar */}
        <View className="mb-6">
          <Text className="text-[10px] text-[#64748B] font-black uppercase tracking-wider mb-3">Filter by Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 5 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedDate('All')}
              className={`px-4 py-2 rounded-full border ${selectedDate === 'All' ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#E2E8F0]'}`}
            >
              <Text className={`text-xs font-black ${selectedDate === 'All' ? 'text-white' : 'text-[#64748B]'}`}>All Days</Text>
            </TouchableOpacity>
            {Object.keys(groupedRecords).map(dateStr => (
              <TouchableOpacity
                key={dateStr}
                onPress={() => setSelectedDate(dateStr)}
                className={`px-4 py-2 rounded-full border ${selectedDate === dateStr ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#E2E8F0]'}`}
              >
                <Text className={`text-xs font-black ${selectedDate === dateStr ? 'text-white' : 'text-[#64748B]'}`}>{dateStr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 2. Day-Wise Grouped History Feed List */}
        <View className="space-y-4 mb-10">
          <Text className="text-[10px] text-[#64748B] font-black uppercase tracking-wider mb-2">
            {selectedDate === 'All' ? 'Day-Wise Attendance History' : `Attendance for ${selectedDate}`}
          </Text>
          
          {Object.keys(groupedRecords).length > 0 ? (
            Object.keys(groupedRecords)
              .filter(dateStr => selectedDate === 'All' || dateStr === selectedDate)
              .map(dateStr => (
                <View key={dateStr} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 mb-4 shadow-sm">
                  <Text className="font-black text-xs text-[#0F172A] mb-3 pb-2.5 border-b border-[#F1F5F9]">
                    {dateStr}
                  </Text>
                  
                  <View className="gap-3.5">
                    {groupedRecords[dateStr].map((rec: any) => {
                      const dateObj = new Date(rec.date);
                      const formattedTime = dateObj.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });

                      return (
                        <View key={rec._id} className="flex-row items-center justify-between py-1">
                          <View className="flex-1 pr-4">
                            <Text className="font-black text-xs text-[#0F172A]">
                              {rec.subject || 'Session Check-in'}
                            </Text>
                            <Text className="text-[10px] text-[#64748B] font-semibold mt-0.5">
                              Scan time: {formattedTime}
                            </Text>
                            {rec.remarks ? (
                              <Text className="text-[9px] text-amber-600 font-semibold italic mt-0.5">
                                Note: {rec.remarks}
                              </Text>
                            ) : null}
                          </View>
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
                      );
                    })}
                  </View>
                </View>
              ))
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
