import React, { useEffect, useRef } from 'react';
import { Alert, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import HomeStack from './src/navigation/HomeStack';
import MessagesStack from './src/navigation/MessagesStack';
import { store } from './src/store';
import {
  setAuthUser,
  setInitializing,
  setProfile,
  clearAuth,
} from './src/store/slices/authSlice';
import { initializeFirebase } from './src/config/firebase';
import {
  listenForForegroundMessages,
  listenForTokenRefresh,
  registerDeviceForPush,
} from './src/services/notifications';
import { useAppSelector } from './src/hooks/redux';
import { MainTabParamList } from './src/types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

initializeFirebase();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: tabBarBottom,
          height: 52 + tabBarBottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            HomeTab: 'home-outline',
            Messages: 'chatbubbles-outline',
            Profile: 'person-outline',
            Settings: 'settings-outline',
          };
          return (
            <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, profileCompleted } = useAppSelector(state => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : !profileCompleted ? (
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

function AuthBootstrap() {
  const profileUnsub = useRef<(() => void) | null>(null);
  const tokenRefreshUnsub = useRef<(() => void) | null>(null);
  const messageUnsub = useRef<(() => void) | null>(null);
  const initializing = useAppSelector(state => state.auth.initializing);

  useEffect(() => {
    const authUnsub = auth().onAuthStateChanged(async authUser => {
      store.dispatch(setAuthUser(authUser));

      profileUnsub.current?.();
      profileUnsub.current = null;
      tokenRefreshUnsub.current?.();
      tokenRefreshUnsub.current = null;
      messageUnsub.current?.();
      messageUnsub.current = null;

      if (authUser) {
        profileUnsub.current = firestore()
          .collection('users')
          .doc(authUser.uid)
          .onSnapshot(doc => {
            if (doc.exists()) {
              store.dispatch(
                setProfile({
                  uid: authUser.uid,
                  ...(doc.data() as { name: string; bio: string; photoUrl?: string }),
                }),
              );
            } else {
              store.dispatch(setProfile(null));
            }
            store.dispatch(setInitializing(false));
          });

        await registerDeviceForPush(authUser.uid);
        tokenRefreshUnsub.current = listenForTokenRefresh(authUser.uid);
        messageUnsub.current = listenForForegroundMessages((title, body) => {
          Alert.alert(title, body);
        });
      } else {
        store.dispatch(clearAuth());
      }
    });

    return () => {
      authUnsub();
      profileUnsub.current?.();
      tokenRefreshUnsub.current?.();
      messageUnsub.current?.();
    };
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Provider store={store}>
          <AuthBootstrap />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
