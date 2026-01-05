package expo.modules.localconnection

import android.content.Context
import android.os.Build
import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import java.nio.charset.StandardCharsets

class NearbyConnectionManager(private val context: Context) {
    private val SERVICE_ID = "shooter-game" // Aligned with iOS SERVICE_TYPE
    private val STRATEGY = Strategy.P2P_CLUSTER // P2P_CLUSTER allows Any-to-Any connections
    
    // Get device name safely
    private var myPeerName = "${Build.MANUFACTURER} ${Build.MODEL}"
    private var myOpponentName: String? = null

    private val connectionsClient = Nearby.getConnectionsClient(context)
    private val pendingConnections = mutableMapOf<String, String>() // EndpointID -> Peer Name
    private val connectedEndpoints = mutableMapOf<String, String>() // EndpointID -> Peer Name

    // --- CALLBACKS (Fixed signatures and names) ---
    // (EndpointID, EndpointName) -> Unit
    var onOpponentFound: ((String, String) -> Unit)? = null 
    // (EndpointID, EndpointName) -> Unit
    var onConnectionRequest: ((String, String) -> Unit)? = null 
    // (EndpointName) -> Unit
    var onOpponentConnected: ((String) -> Unit)? = null 
    // (EndpointName) -> Unit
    var onOpponentDisconnected: ((String) -> Unit)? = null 
    // (Data, PeerName) -> Unit
    var onDataReceived: ((ByteArray, String) -> Unit)? = null 
    // (EndpointID) -> Unit
    var onEndpointLost: ((String) -> Unit)? = null

    fun setPeerName(name: String) {
        myPeerName = name
    }

    fun getOpponentName(): String? {
        return myOpponentName
    }

    fun setMedium(medium: String) {
        // Note: Medium selection not supported in this version of Nearby API
        // The system will automatically choose the best medium
        Log.d("Nearby", "Medium preference: $medium (using system default)")
    }

    fun startAdvertising() {
        val options = AdvertisingOptions.Builder()
            .setStrategy(STRATEGY)
            .build()
        connectionsClient.startAdvertising(
            myPeerName,
            SERVICE_ID,
            connectionLifecycleCallback,
            options
        ).addOnFailureListener { e -> Log.e("Nearby", "Advertise failed", e) }
    }

    fun startDiscovery() {
        val options = DiscoveryOptions.Builder()
            .setStrategy(STRATEGY)
            .build()
        connectionsClient.startDiscovery(
            SERVICE_ID,
            endpointDiscoveryCallback,
            options
        ).addOnFailureListener { e -> Log.e("Nearby", "Discovery failed", e) }
    }

    fun stopAdvertising() {
        connectionsClient.stopAdvertising()
    }

    fun stopDiscovery() {
        connectionsClient.stopDiscovery()
    }

    fun joinRoom(endpointId: String) {
        // When joining, we ask for a connection
        connectionsClient.requestConnection(
            myPeerName,
            endpointId,
            connectionLifecycleCallback
        ).addOnFailureListener { e -> Log.e("Nearby", "Request connection failed", e) }
    }

    fun acceptConnection(endpointId: String) {
        connectionsClient.acceptConnection(endpointId, payloadCallback)
    }

    fun rejectConnection(endpointId: String) {
        connectionsClient.rejectConnection(endpointId)
    }

    fun endConnection() {
        connectionsClient.stopDiscovery()
        connectionsClient.stopAdvertising()
        connectionsClient.stopAllEndpoints()
        connectedEndpoints.clear()
        pendingConnections.clear()
    }

    fun send(data: ByteArray) {
        if (connectedEndpoints.isEmpty()) return
        val payload = Payload.fromBytes(data)
        
        connectionsClient.sendPayload(connectedEndpoints.keys.toList(), payload).addOnFailureListener { e ->
            Log.e("Nearby", "Send error: ", e)
        }
    }
    

    // 1. Lifecycle: Handles Connection Request -> Accept -> Connected
    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        
        override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
            pendingConnections[endpointId] = info.endpointName

            if (info.isIncomingConnection) {
                // CASE A: We are the HOST (Someone found us)
                // Trigger event so JS can ask user "Allow connection?"
                onConnectionRequest?.invoke(endpointId, info.endpointName)
            } else {
                // CASE B: We are the JOINER (We initiated this)
                // Auto-accept our side because we already clicked "Join"
                connectionsClient.acceptConnection(endpointId, payloadCallback)
            }
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            val peerName = pendingConnections.remove(endpointId) ?: "Unknown Peer"
            
            if (result.status.isSuccess) {
                myOpponentName = peerName
                connectedEndpoints[endpointId] = peerName
                
                // Stop advertising/scanning to save battery and bandwidth
                connectionsClient.stopAdvertising()
                connectionsClient.stopDiscovery()
                
                // FIXED: Name matches property
                onOpponentConnected?.invoke(peerName)
            } else {
                Log.d("Nearby", "Connection failed: ${result.status.statusCode}")
            }
        }

        override fun onDisconnected(endpointId: String) {
            val peerName = connectedEndpoints.remove(endpointId)
            // FIXED: Name matches property
            peerName?.let { onOpponentDisconnected?.invoke(it) }
        }
    }

    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val bytes = payload.asBytes() ?: return
                val peerName = connectedEndpoints[endpointId] ?: "Unknown Peer"
                onDataReceived?.invoke(bytes, peerName)
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
    }

    // 2. Discovery: Finds Rooms
    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            // FIXED: Name matches property + passes both ID and Name
            onOpponentFound?.invoke(endpointId, info.endpointName)
        }

        override fun onEndpointLost(endpointId: String) {
            // Optional: Tell JS to remove this room
            onEndpointLost?.invoke(endpointId)
        }
    }
}