import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Home, Camera, FileText, CalendarRange, User } from 'lucide-react-native';

export default function TabLayout() {
  const scheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617', // Slate 950
          borderTopColor: '#1e293b', // Slate 800
          paddingBottom: 16,
          paddingTop: 8,
          height: 75,
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
    </Tabs>
  );
}
