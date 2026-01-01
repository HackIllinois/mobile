import MultipeerConnectivity
import UIKit

class MultipeerSessionManager: NSObject {
    private let SERVICE_TYPE = "shooter-game"
    private var myPeerId: MCPeerID
    
    private var session: MCSession!
    private var advertiser: MCNearbyServiceAdvertiser?
    private var browser: MCNearbyServiceBrowser?
    
    // Track discovered peers for joinRoom/acceptInvitation
    private var discoveredPeers: [String: MCPeerID] = [:] // endpointId -> MCPeerID
    private var pendingInvitations: [String: (Bool, MCSession?) -> Void] = [:] // endpointId -> invitationHandler
    private var connectedPeerNames: [String: String] = [:] // endpointId -> displayName
    
    private var myOpponentName: String?
    
    // --- CALLBACKS (Matching Android) ---
    var onOpponentFound: ((String, String) -> Void)?        // (endpointId, endpointName)
    var onEndpointLost: ((String) -> Void)?                 // (endpointId)
    var onConnectionRequest: ((String, String) -> Void)?    // (endpointId, endpointName)
    var onPeerConnected: ((String) -> Void)?                // (peerName)
    var onPeerDisconnected: ((String) -> Void)?             // (peerName)
    var onDataReceived: ((Data, String) -> Void)?           // (data, peerName)

    override init() {
        self.myPeerId = MCPeerID(displayName: UIDevice.current.name)
        super.init()
        setupSession()
    }
    
    private func setupSession() {
        self.session = MCSession(peer: myPeerId, securityIdentity: nil, encryptionPreference: .none)
        self.session.delegate = self
    }
    
    // --- SETUP FUNCTIONS ---
    
    func setPeerName(_ name: String) {
        // MCPeerID is immutable, so we need to recreate everything
        myPeerId = MCPeerID(displayName: name)
        setupSession()
    }
    
    func getOpponentName() -> String? {
        return myOpponentName
    }
    
    // --- HOST FUNCTIONS ---
    
    func startAdvertising() {
        stopAdvertising()
        advertiser = MCNearbyServiceAdvertiser(peer: myPeerId, discoveryInfo: nil, serviceType: SERVICE_TYPE)
        advertiser?.delegate = self
        advertiser?.startAdvertisingPeer()
    }
    
    func stopAdvertising() {
        advertiser?.stopAdvertisingPeer()
        advertiser = nil
    }
    
    // --- JOINER FUNCTIONS ---
    
    func startScanning() {
        stopScanning()
        browser = MCNearbyServiceBrowser(peer: myPeerId, serviceType: SERVICE_TYPE)
        browser?.delegate = self
        browser?.startBrowsingForPeers()
    }
    
    func stopScanning() {
        browser?.stopBrowsingForPeers()
        browser = nil
    }
    
    // --- CONNECTION HANDSHAKE ---
    
    // Called by JS when user clicks a "Found" room
    func joinRoom(_ endpointId: String) {
        guard let peer = discoveredPeers[endpointId] else {
            print("MultipeerSession: Peer not found for endpointId \(endpointId)")
            return
        }
        browser?.invitePeer(peer, to: session, withContext: nil, timeout: 30)
    }
    
    // Called by JS when user accepts an "Invite"
    func acceptInvitation(_ endpointId: String) {
        guard let handler = pendingInvitations.removeValue(forKey: endpointId) else {
            print("MultipeerSession: No pending invitation for endpointId \(endpointId)")
            return
        }
        handler(true, session)
    }
    
    func rejectInvitation(_ endpointId: String) {
        guard let handler = pendingInvitations.removeValue(forKey: endpointId) else { return }
        handler(false, nil)
    }
    
    // --- END CONNECTION ---
    
    func endConnection() {
        stopAdvertising()
        stopScanning()
        session.disconnect()
        discoveredPeers.removeAll()
        pendingInvitations.removeAll()
        connectedPeerNames.removeAll()
        myOpponentName = nil
    }
    
    // --- SEND DATA ---
    
    func send(data: Data) {
        guard !session.connectedPeers.isEmpty else { return }
        
        do {
            try session.send(data, toPeers: session.connectedPeers, with: .unreliable)
        } catch {
            print("Send error: \(error)")
        }
    }
    
    // --- HELPER ---
    
    private func endpointId(for peer: MCPeerID) -> String {
        // Use displayName as stable identifier (matches Android's endpointId concept)
        return peer.displayName
    }
}

// MARK: - MCSessionDelegate
extension MultipeerSessionManager: MCSessionDelegate {
    func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        let endpointId = endpointId(for: peerID)
        
        DispatchQueue.main.async {
            switch state {
            case .connected:
                self.myOpponentName = peerID.displayName
                self.connectedPeerNames[endpointId] = peerID.displayName
                
                // Stop advertising/scanning to save battery
                self.stopAdvertising()
                self.stopScanning()
                
                self.onPeerConnected?(peerID.displayName)
                
            case .notConnected:
                if let name = self.connectedPeerNames.removeValue(forKey: endpointId) {
                    self.onPeerDisconnected?(name)
                }
                
            case .connecting:
                break
                
            @unknown default:
                break
            }
        }
    }
    
    func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        DispatchQueue.main.async {
            self.onDataReceived?(data, peerID.displayName)
        }
    }
    
    func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    
    func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    
    func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

// MARK: - MCNearbyServiceAdvertiserDelegate (HOST)
extension MultipeerSessionManager: MCNearbyServiceAdvertiserDelegate {
    func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        let endpointId = endpointId(for: peerID)
        
        // Store the handler so JS can call acceptInvitation later
        pendingInvitations[endpointId] = invitationHandler
        
        DispatchQueue.main.async {
            // Emit "invite" event so JS can show alert and call acceptInvitation
            self.onConnectionRequest?(endpointId, peerID.displayName)
        }
    }
    
    func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
        print("Advertiser failed: \(error)")
    }
}

// MARK: - MCNearbyServiceBrowserDelegate (JOINER)
extension MultipeerSessionManager: MCNearbyServiceBrowserDelegate {
    func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        let endpointId = endpointId(for: peerID)
        
        // Store peer for later joinRoom call
        discoveredPeers[endpointId] = peerID
        
        DispatchQueue.main.async {
            // Emit "found" event so JS can display the room
            self.onOpponentFound?(endpointId, peerID.displayName)
        }
    }
    
    func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        let endpointId = endpointId(for: peerID)
        discoveredPeers.removeValue(forKey: endpointId)
        
        DispatchQueue.main.async {
            self.onEndpointLost?(endpointId)
        }
    }
    
    func browser(_ browser: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) {
        print("Browser failed: \(error)")
    }
}
