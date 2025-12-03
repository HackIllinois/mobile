import ExpoModulesCore

public class LocalConnectionModule: Module {
  private lazy var sessionManager: MultipeerSessionManager = {
    let manager = MultipeerSessionManager()
    manager.onPeerConnected = { [weak self] peerName in
      self?.sendEvent("onChange", ["type": "connected", "peer": peerName])
    }
    manager.onPeerDisconnected = { [weak self] peerName in
      self?.sendEvent("onChange", ["type": "disconnected", "peer": peerName])
    }
    manager.onDataReceived = { [weak self] data, peerName in
      if let message = String(data: data, encoding:.utf8) {
        self?.sendEvent("onChange", ["type": "data", "data": message, "peer": peerName])
      }
    }
    return manager
  }()

  public func definition() -> ModuleDefinition {
    Name("LocalConnection")
    Events("onChange")

    Function("startSession") {
      self.sessionManager.start()
    }
    
    Function("stopSession") {
      self.sessionManager.stop()
    }

    AsyncFunction("sendData") { (message: String) in
      if let data = message.data(using:.utf8) {
        self.sessionManager.send(data: data)
      }
    }
  }
}
