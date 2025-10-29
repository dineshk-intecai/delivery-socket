import NativeSocketConnection, {
	addSocketListener,
	emitEvent,
	listenEvent,
} from './src/NativeSocketConnectionModule';

export const startService = () => NativeSocketConnection.startService();
export const stopService = () => NativeSocketConnection.stopService();
export const setSocketUrl = (url: string) => NativeSocketConnection.setSocketUrl(url);

export const addListener = (event: string, callback: (data: Record<string, any>) => void) =>
	addSocketListener(event, callback);

export const emit = (event: string, data: Record<string, any>) => emitEvent(event, data);
export const listen = (event: string) => listenEvent(event);
