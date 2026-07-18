import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Home, Camera, FileText, CalendarRange, User, BookOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#020617' : '#ffffff', // Slate 950 : White
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0', // Slate 800 : Slate 200
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 8,
          height: 70 + Math.max(insets.bottom, 20),
        },
        tabBarActiveTintColor: '#6366f1', // Indigo 500
        tabBarInactiveTintColor: '#64748b', // Slate 500
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'QR Scan',
          tabBarIcon: ({ color }) => <Camera size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Scorecard',
          tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => <CalendarRange size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ color }) => <BookOpen size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
