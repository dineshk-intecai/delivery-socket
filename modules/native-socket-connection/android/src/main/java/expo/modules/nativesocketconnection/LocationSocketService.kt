package expo.modules.nativesocketconnection

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException
import android.os.Handler

class LocationSocketService : Service() {

    companion object {
        private const val TAG = "LocationSocketService"
        private var socket: Socket? = null
        private var socketUrl: String? = null
        private var eventEmitter: NativeSocketConnectionModule? = null

        fun setEventEmitter(module: NativeSocketConnectionModule) {
            eventEmitter = module
        }

        fun clearEventEmitter() {
            eventEmitter = null
        }

        fun setSocketUrl(url: String) {
            socketUrl = url
        }

        fun emitEvent(event: String, payload: Map<String, Any>) {
            try {
                if (socket?.connected() == true) {
                    val data = JSONObject(payload)
                    Log.d(TAG, "Emitting event: $event with data: $data")
                    socket?.emit(event, data)
                } else {
                    Log.w(TAG, "Socket not connected, cannot emit event.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error emitting socket event: ${e.message}")
            }
        }

        fun listenEvent(event: String) {
            socket?.on(event) { args ->
                try {
                    val jsonObject = args[0] as? JSONObject ?: return@on
                    val map = jsonObjectToMap(jsonObject)
                    eventEmitter?.sendToJS(event, map)
                } catch (e: Exception) {
                    Log.e(TAG, "Error in event $event: ${e.message}")
                }
            }
        }

        private fun jsonObjectToMap(jsonObject: JSONObject): Map<String, Any> {
            val map = mutableMapOf<String, Any>()
            val keys = jsonObject.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val value = jsonObject.get(key)
                map[key] = when (value) {
                    is JSONObject -> jsonObjectToMap(value)
                    else -> value
                }
            }
            return map
        }
    }

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification()
        connectSocket()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    private fun connectSocket() {
        if (socketUrl == null) {
            Log.e(TAG, "Socket URL not set before connecting.")
            return
        }

        try {
            val opts = IO.Options()
            opts.transports = arrayOf("websocket")
            opts.reconnection = true
            opts.reconnectionAttempts = Int.MAX_VALUE
            opts.reconnectionDelay = 2000
            opts.secure = socketUrl?.startsWith("wss") == true

            socket = IO.socket(socketUrl, opts)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Socket connected")
                eventEmitter?.sendToJS("onConnect", emptyMap())
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "Socket disconnected")
                eventEmitter?.sendToJS("onDisconnect", emptyMap())
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e(TAG, "Socket connection error: ${args.joinToString()}")
                eventEmitter?.sendToJS("onError", mapOf(
                    "error" to args.joinToString()
                ))
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Socket connection error", e)
        }
    }

    private fun startForegroundNotification() {
        val channelId = "socket_service_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Socket Service",
                NotificationManager.IMPORTANCE_LOW
            )
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }

        val notification = Notification.Builder(this, channelId)
            .setContentTitle("Live tracking active")
            .setContentText("Maintaining socket connection...")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .build()

        startForeground(1, notification)
    }

    override fun onDestroy() {
        Log.w(TAG, "Service destroyed — cleaning up")
        safelyDisconnectSocket()
        super.onDestroy()
    }

    private fun safelyDisconnectSocket() {
        try {
            socket?.off()
            socket?.disconnect()
            socket = null
            eventEmitter = null
            Log.d(TAG, "Socket and emitter cleared safely.")
        } catch (e: Exception) {
            Log.e(TAG, "Error while disconnecting socket: ${e.message}")
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
