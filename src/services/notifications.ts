import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerDeviceForPush(userId: string): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return;
  }

  const token = await messaging().getToken();
  await firestore().collection('users').doc(userId).set(
    {
      fcmToken: token,
      fcmUpdatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export function listenForForegroundMessages(
  onMessage: (title: string, body: string) => void,
) {
  return messaging().onMessage(async remoteMessage => {
    const title = remoteMessage.notification?.title ?? 'Social Connect';
    const body = remoteMessage.notification?.body ?? 'You have a new notification';
    onMessage(title, body);
  });
}

export function listenForTokenRefresh(userId: string) {
  return messaging().onTokenRefresh(async token => {
    await firestore().collection('users').doc(userId).set(
      {
        fcmToken: token,
        fcmUpdatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}
