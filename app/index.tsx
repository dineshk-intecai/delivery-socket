import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as NativeSocketConnection from 'native-socket-connection';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { partnerId } from '@/utils';
import { sendNotify } from '@/services';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;
NativeSocketConnection.setSocketUrl(SOCKET_URL || '');

type Location = {
	lat: number;
	lng: number;
}

export default function App() {
	const [isEnabled, setIsEnabled] = useState(false);
	const watchRef = useRef<Location.LocationSubscription | null>(null);

	const [location, setLocation] = useState<Location | null>(null);
	const [userId, setUserId] = useState<string | null>(null);

	const startService = async () => {
		const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
		if (fgStatus !== 'granted') {
			Alert.alert('Permission Required', 'Foreground location permission is required.');
			return;
		}

		const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
		if (bgStatus !== 'granted') {
			Alert.alert('Permission Required', 'Background location permission is required.');
			return;
		}

		NativeSocketConnection.startService();
		setIsEnabled(true);
	};

	const stopService = async () => {
		NativeSocketConnection.stopService();
		if (watchRef.current) {
			watchRef.current.remove();
			watchRef.current = null;
		}
		setIsEnabled(false);
	};



	const notifyUser = async (title: string, message: string) => {
		await sendNotify(title, message);
	};

	useEffect(() => {
		if (!isEnabled) return;

		let isCancelled = false;
		start(isCancelled);

		NativeSocketConnection.listen('onConnect');
		NativeSocketConnection.listen('onDisconnect');
		NativeSocketConnection.listen('onError');
		NativeSocketConnection.listen('live_location');
		NativeSocketConnection.listen('live_location_partnerId');

		const connect = NativeSocketConnection.addListener('onConnect', () => {
			notifyUser('Socket Connection', 'Connected to server');
			console.log('on connect ---> Connected to server');
		});
		const disconnect = NativeSocketConnection.addListener('onDisconnect', () => {
			console.log('on disconnect ---> Disconnected from server');
		});
		const error = NativeSocketConnection.addListener('onError', (error) => {
			console.log('on error --->', error);
		});

		const liveLocation = NativeSocketConnection.addListener('live_location', (data) => {
			setLocation({
				lat: data.lat,
				lng: data.lng,
			});
		});

		const liveLocationPartnerId = NativeSocketConnection.addListener('live_location_partnerId', (data) => {
			setUserId(data.partnerId);
		});

		return () => {
			isCancelled = true;
			if (watchRef.current) {
				watchRef.current.remove();
				watchRef.current = null;
			}
			connect.remove();
			disconnect.remove();
			error.remove();
			liveLocation.remove();
			liveLocationPartnerId.remove();
		};
	}, [isEnabled]);

	const start = async (isCancelled: boolean) => {
		watchRef.current = await Location.watchPositionAsync(
			{
				accuracy: Location.Accuracy.Highest,
				distanceInterval: 25,
			},
			(loc) => {
				const { latitude, longitude } = loc.coords;
				NativeSocketConnection.emit('location_update', {
					lat: latitude,
					lng: longitude,
					partnerId
				});
			}
		);

		if (isCancelled && watchRef.current) {
			watchRef.current.remove();
			watchRef.current = null;
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />
			{isEnabled && <Text style={{ textAlign: 'center' }}>Service is running for partner{`\n${userId}`}</Text>}
			{location && <Text>Latitude : {location.lat} {'\n'}Longitude : {location.lng}</Text>}

			<TouchableOpacity
				activeOpacity={0.8}
				onPress={isEnabled ? stopService : startService}
				style={[
					styles.button,
					{ backgroundColor: isEnabled ? 'red' : 'green' },
				]}
			>
				<Text style={styles.text}>
					{isEnabled ? 'Stop' : 'Start'} Service
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		gap: 20,
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	text: {
		color: 'white',
		fontSize: 16,
		fontWeight: '500',
		letterSpacing: 0.5,
	},
});
