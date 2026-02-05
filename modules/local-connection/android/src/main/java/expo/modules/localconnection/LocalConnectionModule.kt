package expo.modules.localconnection

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.StandardCharsets

class LocalConnectionModule : Module() {
  
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context lost")

  // Lazy load manager with event wiring
  private val sessionManager: NearbyConnectionManager by lazy {
    val manager = NearbyConnectionManager(context)
    
    // 1. Discovery: Found a room/peer
    manager.onOpponentFound = { endpointId, endpointName ->
      sendEvent("onChange", mapOf(
        "type" to "found", 
        "endpointId" to endpointId,
        "endpointName" to endpointName
      ))
    }
    
    manager.onEndpointLost = { endpointId ->
      sendEvent("onChange", mapOf(
        "type" to "lost", 
        "endpointId" to endpointId
      ))
    }

    // 2. Connection Request: Someone wants to join us
    manager.onConnectionRequest = { endpointId, endpointName ->
      sendEvent("onChange", mapOf(
        "type" to "invite",
        "endpointId" to endpointId,
        "endpointName" to endpointName
      ))
    }
    
    // 3. Connection Established
    manager.onOpponentConnected = { peerName ->
      sendEvent("onChange", mapOf(
        "type" to "connected", 
        "peer" to peerName
      ))
    }
    
    // 4. Connection Lost
    manager.onOpponentDisconnected = { peerName ->
      sendEvent("onChange", mapOf(
        "type" to "disconnected", 
        "peer" to peerName
      ))
    }
    
    // 5. Data Received
    manager.onDataReceived = { data, peerName ->
      val message = String(data, StandardCharsets.UTF_8)
      sendEvent("onChange", mapOf(
        "type" to "data", 
        "data" to message, 
        "peer" to peerName
      ))
    }
    
    manager // return the instance
  }

  override fun definition() = ModuleDefinition {
    Name("LocalConnection")
    Events("onChange")

    // --- SETUP ---

    Function("InitPeerName") { name: String ->
      sessionManager.setPeerName(name)
    }

    Function("getOpponentName") {
      sessionManager.getOpponentName()
    }

    // Set connection medium: "BLUETOOTH", "WIFI", or "ALL"
    Function("setConnectionMedium") { medium: String ->
      sessionManager.setMedium(medium)
    }

    Function("startAdvertising") {
      // NOTE: Ensure 'startAdvertising()' is public in NearbyConnectionManager
      // OR use sessionManager.start() if you want to trigger both at once.
      sessionManager.startAdvertising()
    }

    Function("startScanning") {
      // NOTE: Ensure 'startDiscovery()' is public in NearbyConnectionManager
      sessionManager.startDiscovery()
    }

    Function("stopAdvertising") {
      sessionManager.stopAdvertising()
    }

    Function("stopScanning") {
      sessionManager.stopDiscovery()
    }

    Function("EndConnection") {
      sessionManager.endConnection()
    }

    // --- CONNECTION HANDSHAKE (Crucial for P2P) ---

    // Called by JS when user clicks a "Found" room
    Function("joinRoom") { endpointId: String ->
      sessionManager.joinRoom(endpointId)
    }

    // Called by JS when user accepts an "Invite"
    Function("acceptInvitation") { endpointId: String ->
      sessionManager.acceptConnection(endpointId)
    }

    // --- GAMEPLAY ---

    AsyncFunction("sendData") { message: String ->
      val data = message.toByteArray(StandardCharsets.UTF_8)
      sessionManager.send(data)
    }
  }
}