import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as NativeSocketConnection from 'native-socket-connection';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

NativeSocketConnection.setSocketUrl('http://192.168.0.120:3000');

export default function App() {
	const [isEnabled, setIsEnabled] = useState(false);
	const watchRef = useRef<Location.LocationSubscription | null>(null);

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

	useEffect(() => {
		if (!isEnabled) return;

		let isCancelled = false;

		start(isCancelled);

		return () => {
			isCancelled = true;
			if (watchRef.current) {
				watchRef.current.remove();
				watchRef.current = null;
			}
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
				NativeSocketConnection.sendLocation(latitude, longitude);
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
			{isEnabled && <Text>Service is running</Text>}

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
