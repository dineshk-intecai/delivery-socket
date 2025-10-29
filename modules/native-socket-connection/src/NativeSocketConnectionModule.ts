import { requireNativeModule, EventSubscription } from 'expo-modules-core';

export interface NativeSocketConnectionModule {
	startService(): void;
	stopService(): void;
	setSocketUrl(socketUrl: string): void;

	emitEvent(event: string, data: Record<string, any>): void;
	listenEvent(event: string): void;

	addListener(eventName: string, listener: (data: Record<string, any>) => void): EventSubscription;
}

const NativeSocketConnection = requireNativeModule<NativeSocketConnectionModule>('NativeSocketConnection');

export const addSocketListener = (
	event: string,
	listener: (data: Record<string, any>) => void
): EventSubscription => {
	return NativeSocketConnection.addListener('onEvent', ({ event: receivedEvent, data }) => {
		if (receivedEvent === event) {
			listener(data);
		}
	});
};

export const emitEvent = (event: string, data: Record<string, any>) => {
	NativeSocketConnection.emitEvent(event, data);
};

export const listenEvent = (event: string) => {
	NativeSocketConnection.listenEvent(event);
};

export default {
	...NativeSocketConnection,
	addSocketListener,
	emitEvent,
	listenEvent,
};
