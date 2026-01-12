import ExpoModulesCore

public class LocalConnectionModule: Module {
  private lazy var sessionManager: CoreBluetoothSessionManager = {
    let manager = CoreBluetoothSessionManager()
    
    // 1. Discovery: Found a room/peer
    manager.onOpponentFound = { [weak self] endpointId, endpointName in
      self?.sendEvent("onChange", [
        "type": "found",
        "endpointId": endpointId,
        "endpointName": endpointName
      ])
    }
    
    manager.onEndpointLost = { [weak self] endpointId in
      self?.sendEvent("onChange", [
        "type": "lost",
        "endpointId": endpointId
      ])
    }
    
    // 2. Connection Request: Someone wants to join us
    manager.onConnectionRequest = { [weak self] endpointId, endpointName in
      self?.sendEvent("onChange", [
        "type": "invite",
        "endpointId": endpointId,
        "endpointName": endpointName
      ])
    }
    
    // 3. Connection Established
    manager.onPeerConnected = { [weak self] peerName in
      self?.sendEvent("onChange", [
        "type": "connected",
        "peer": peerName
      ])
    }
    
    // 4. Connection Lost
    manager.onPeerDisconnected = { [weak self] peerName in
      self?.sendEvent("onChange", [
        "type": "disconnected",
        "peer": peerName
      ])
    }
    
    // 5. Data Received
    manager.onDataReceived = { [weak self] data, peerName in
      if let message = String(data: data, encoding: .utf8) {
        self?.sendEvent("onChange", [
          "type": "data",
          "data": message,
          "peer": peerName
        ])
      }
    }
    
    return manager
  }()

  public func definition() -> ModuleDefinition {
    Name("LocalConnection")
    Events("onChange")

    // --- SETUP ---

    Function("InitPeerName") { (name: String) in
      self.sessionManager.setPeerName(name)
    }

    Function("getOpponentName") {
      return self.sessionManager.getOpponentName()
    }

    // iOS MultipeerConnectivity doesn't support medium selection - it auto-negotiates
    // This is a no-op stub for API consistency with Android
    Function("setConnectionMedium") { (medium: String) in
      print("LocalConnection: setConnectionMedium('\(medium)') - iOS auto-selects transport")
    }

    Function("startAdvertising") {
      self.sessionManager.startAdvertising()
    }

    Function("startScanning") {
      self.sessionManager.startScanning()
    }

    Function("stopAdvertising") {
      self.sessionManager.stopAdvertising()
    }

    Function("stopScanning") {
      self.sessionManager.stopScanning()
    }

    Function("EndConnection") {
      self.sessionManager.endConnection()
    }

    // --- CONNECTION HANDSHAKE ---

    // Called by JS when user clicks a "Found" room
    Function("joinRoom") { (endpointId: String) in
      self.sessionManager.joinRoom(endpointId)
    }

    // Called by JS when user accepts an "Invite"
    Function("acceptInvitation") { (endpointId: String) in
      self.sessionManager.acceptInvitation(endpointId)
    }

    // --- GAMEPLAY ---

    AsyncFunction("sendData") { (message: String) in
      if let data = message.data(using: .utf8) {
        self.sessionManager.send(data: data)
      }
    }
  }
}
