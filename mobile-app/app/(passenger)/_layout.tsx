import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PassengerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#F3F4F6',
          paddingBottom: 6,
          paddingTop: 4,
          height: 64,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        headerStyle: { backgroundColor: '#FF6B00' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan-board"
        options={{
          title: 'Scan & Board',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan" size={size} color={color} />,
          tabBarActiveTintColor: '#FF6B00',
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alarms"
        options={{
          title: 'Alarms',
          tabBarIcon: ({ color, size }) => <Ionicons name="alarm" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="route/[id]"       options={{ href: null }} />
      <Tabs.Screen name="track/[busId]"    options={{ href: null }} />
      <Tabs.Screen name="rate/[tripId]"    options={{ href: null }} />
      <Tabs.Screen name="favourites"       options={{ href: null }} />
      <Tabs.Screen name="notifications"    options={{ href: null }} />
      <Tabs.Screen name="map"              options={{ href: null }} />
      <Tabs.Screen name="sos"              options={{ href: null }} />
    </Tabs>
  );
}
