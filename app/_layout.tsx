import { Stack } from 'expo-router';
import { OneSignal } from 'react-native-onesignal';

const onesignalId = process.env.EXPO_PUBLIC_ONESIGNAL_ID || '';

export default function RootLayout() {
    OneSignal.initialize(onesignalId);
    OneSignal.login('partner_12345');
    OneSignal.Notifications.requestPermission(false);

    return <Stack screenOptions={{ headerShown: false }} />;
}
