import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Home, Camera, FileText, Briefcase, User, BookOpen } from 'lucide-react-native';
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
          backgroundColor: isDark ? '#1C1530' : '#ffffff', // LCP surface dark : light
          borderTopColor: isDark ? 'rgba(196,163,255,0.16)' : 'rgba(81,0,137,0.12)', // LCP border dark : light
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 8,
          height: 70 + Math.max(insets.bottom, 20),
        },
        tabBarActiveTintColor: '#5B21B6', // LCP primary
        tabBarInactiveTintColor: isDark ? '#A79AC2' : '#6B6478', // LCP muted dark : light
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ color }) => <BookOpen size={20} color={color} />,
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
        name="career"
        options={{
          title: 'Career',
          tabBarIcon: ({ color }) => <Briefcase size={20} color={color} />,
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
        name="history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
