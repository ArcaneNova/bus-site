import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

SplashScreen.preventAutoHideAsync();

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.info('[Push] Must use a physical device for push notifications.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted.');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:       'SmartDTC Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#003087',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};

export default function RootLayout() {
  const { loadToken, isLoading, isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    loadToken();
  }, []);

  // Register push token once the user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isMounted = true;

    registerForPushNotifications().then(token => {
      if (token && isMounted) {
        // Save token to backend
        api.post('/mobile/push-token', { token, userId: user._id }).catch(() => {});
      }
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      Toast.show({ type: 'info', text1: title || 'Notification', text2: body || '', visibilityTime: 6000 });
    });

    // Listen for tap on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, any>;
      if (data?.type === 'delay' && data?.routeId) {
        router.push(`/(passenger)/route/${data.routeId}`);
      }
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)     Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(passenger)" />
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  );
}
