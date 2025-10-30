package expo.modules.nativesocketconnection

import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeSocketConnectionModule : Module() {
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun definition() = ModuleDefinition {
        Name("NativeSocketConnection")

        OnStartObserving {
            LocationSocketService.setEventEmitter(this@NativeSocketConnectionModule)
        }

        OnStopObserving {
            LocationSocketService.clearEventEmitter()
        }

        Function("setSocketUrl") { socketUrl: String ->
            LocationSocketService.setSocketUrl(socketUrl)
            return@Function null
        }

        Function("startService") {
            val ctx = appContext.reactContext ?: return@Function null
            val intent = Intent(ctx, LocationSocketService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ctx.startForegroundService(intent)
            else
                ctx.startService(intent)
            return@Function null
        }

        Function("stopService") {
            val ctx = appContext.reactContext ?: return@Function null
            LocationSocketService.clearEventEmitter()
            ctx.stopService(Intent(ctx, LocationSocketService::class.java))
            return@Function null
        }

        Function("emitEvent") { event: String, payload: Map<String, Any> ->
            LocationSocketService.emitEvent(event, payload)
            return@Function null
        }

        Function("listenEvent") { event: String ->
            LocationSocketService.listenEvent(event)
            return@Function null
        }

        Events("onConnect", "onDisconnect", "onError", "onEvent")
    }

    fun sendToJS(event: String, data: Map<String, Any>) {
        val reactContext = appContext.reactContext
        if (reactContext == null) {
            android.util.Log.w("NativeSocketConnection", "React context not ready — dropped event: $event")
            return
        }
    
        mainHandler.post {
            try {
                sendEvent("onEvent", mapOf("event" to event, "data" to data))
            } catch (e: Exception) {
                android.util.Log.e(
                    "NativeSocketConnection",
                    "Error sending event to JS: ${e.message}"
                )
            }
        }
    }
}
