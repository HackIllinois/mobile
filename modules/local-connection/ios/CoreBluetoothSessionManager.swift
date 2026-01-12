import CoreBluetooth
import UIKit

/// CoreBluetooth-based session manager for peer-to-peer game connectivity.
/// Replaces MultipeerSessionManager while maintaining the same callback interface.
class CoreBluetoothSessionManager: NSObject {
    // MARK: - Service & Characteristic UUIDs
    
    private static let serviceUUID = CBUUID(string: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890")
    private static let nameCharUUID = CBUUID(string: "A1B2C3D4-E5F6-7890-ABCD-EF1234567891")
    private static let dataCharUUID = CBUUID(string: "A1B2C3D4-E5F6-7890-ABCD-EF1234567892")
    private static let controlCharUUID = CBUUID(string: "A1B2C3D4-E5F6-7890-ABCD-EF1234567893")
    
    // MARK: - Callbacks (Matching MultipeerSessionManager)
    
    var onOpponentFound: ((String, String) -> Void)?        // (endpointId, endpointName)
    var onEndpointLost: ((String) -> Void)?                 // (endpointId)
    var onConnectionRequest: ((String, String) -> Void)?    // (endpointId, endpointName)
    var onPeerConnected: ((String) -> Void)?                // (peerName)
    var onPeerDisconnected: ((String) -> Void)?             // (peerName)
    var onDataReceived: ((Data, String) -> Void)?           // (data, peerName)
    
    // MARK: - State
    
    private var myPeerName: String
    private var myOpponentName: String?
    
    // Central (Guest) state
    private var centralManager: CBCentralManager?
    private var discoveredPeripherals: [String: CBPeripheral] = [:] // endpointId -> peripheral
    private var peripheralNames: [String: String] = [:]              // endpointId -> name
    private var connectedPeripheral: CBPeripheral?
    private var dataCharacteristic: CBCharacteristic?
    private var controlCharacteristic: CBCharacteristic?
    
    // Peripheral (Host) state
    private var peripheralManager: CBPeripheralManager?
    private var gameService: CBMutableService?
    private var nameCharacteristic: CBMutableCharacteristic?
    private var dataCharacteristicMutable: CBMutableCharacteristic?
    private var controlCharacteristicMutable: CBMutableCharacteristic?
    private var subscribedCentrals: [CBCentral] = []
    private var pendingConnections: [String: CBCentral] = [:] // endpointId -> central waiting for accept
    private var connectedCentral: CBCentral?                   // The connected central after acceptance
    private var connectedCentralName: String?
    
    // MARK: - Initialization
    
    override init() {
        self.myPeerName = UIDevice.current.name
        super.init()
    }
    
    // MARK: - Setup Functions
    
    func setPeerName(_ name: String) {
        myPeerName = name
    }
    
    func getOpponentName() -> String? {
        return myOpponentName
    }
    
    // MARK: - Host Functions (Peripheral Role)
    
    func startAdvertising() {
        stopAdvertising()
        peripheralManager = CBPeripheralManager(delegate: self, queue: .main)
        // Will start advertising once peripheralManagerDidUpdateState is called
    }
    
    func stopAdvertising() {
        peripheralManager?.stopAdvertising()
        // Don't nil peripheralManager - we need it for sending data after connection!
        // Only clear pending connections, not the connected central
        pendingConnections.removeAll()
    }
    
    private func teardownPeripheralManager() {
        peripheralManager?.stopAdvertising()
        peripheralManager = nil
        gameService = nil
        subscribedCentrals.removeAll()
        pendingConnections.removeAll()
        connectedCentral = nil
    }
    
    private func setupAndAdvertise() {
        guard let pm = peripheralManager, pm.state == .poweredOn else { return }
        
        // Create characteristics
        nameCharacteristic = CBMutableCharacteristic(
            type: Self.nameCharUUID,
            properties: [.read],
            value: myPeerName.data(using: .utf8),
            permissions: [.readable]
        )
        
        dataCharacteristicMutable = CBMutableCharacteristic(
            type: Self.dataCharUUID,
            properties: [.write, .writeWithoutResponse, .notify],
            value: nil,
            permissions: [.writeable]
        )
        
        controlCharacteristicMutable = CBMutableCharacteristic(
            type: Self.controlCharUUID,
            properties: [.write, .notify],
            value: nil,
            permissions: [.writeable]
        )
        
        // Create service
        gameService = CBMutableService(type: Self.serviceUUID, primary: true)
        gameService?.characteristics = [
            nameCharacteristic!,
            dataCharacteristicMutable!,
            controlCharacteristicMutable!
        ]
        
        pm.add(gameService!)
        
        // Start advertising
        pm.startAdvertising([
            CBAdvertisementDataServiceUUIDsKey: [Self.serviceUUID],
            CBAdvertisementDataLocalNameKey: myPeerName
        ])
    }
    
    // MARK: - Guest Functions (Central Role)
    
    func startScanning() {
        stopScanning()
        centralManager = CBCentralManager(delegate: self, queue: .main)
        // Will start scanning once centralManagerDidUpdateState is called
    }
    
    func stopScanning() {
        centralManager?.stopScan()
        
        // Disconnect any peripheral that isn't fully connected
        for (_, peripheral) in discoveredPeripherals {
            if peripheral != connectedPeripheral {
                centralManager?.cancelPeripheralConnection(peripheral)
            }
        }
        
        discoveredPeripherals.removeAll()
        peripheralNames.removeAll()
    }
    
    private func startScanningInternal() {
        guard let cm = centralManager, cm.state == .poweredOn else { return }
        cm.scanForPeripherals(withServices: [Self.serviceUUID], options: [
            CBCentralManagerScanOptionAllowDuplicatesKey: false
        ])
    }
    
    // MARK: - Connection Handshake
    
    /// Called by JS when user clicks a "Found" room (guest initiates connection)
    func joinRoom(_ endpointId: String) {
        guard let peripheral = discoveredPeripherals[endpointId] else {
            print("CoreBluetooth: Peripheral not found for endpointId \(endpointId)")
            return
        }
        
        centralManager?.stopScan()
        centralManager?.connect(peripheral, options: nil)
    }
    
    /// Called by JS when user accepts an "Invite" (host accepts connection)
    func acceptInvitation(_ endpointId: String) {
        guard let central = pendingConnections.removeValue(forKey: endpointId) else {
            print("CoreBluetooth: No pending connection for endpointId \(endpointId)")
            return
        }
        
        // Store the connected central for data transmission
        connectedCentral = central
        connectedCentralName = endpointId
        
        // Ensure central is in subscribedCentrals for notifications
        if !subscribedCentrals.contains(where: { $0.identifier == central.identifier }) {
            subscribedCentrals.append(central)
        }
        
        // Send acceptance via control characteristic
        if let pm = peripheralManager, let controlChar = controlCharacteristicMutable {
            let acceptMessage = "ACCEPT:\(myPeerName)".data(using: .utf8)!
            pm.updateValue(acceptMessage, for: controlChar, onSubscribedCentrals: [central])
        }
        
        // Note: myOpponentName was already set in handleControlMessage when JOIN was received
        
        // Stop advertising to save battery, but keep peripheralManager for data
        stopAdvertising()
        
        DispatchQueue.main.async {
            self.onPeerConnected?(self.myOpponentName ?? endpointId)
        }
    }
    
    func rejectInvitation(_ endpointId: String) {
        guard let central = pendingConnections.removeValue(forKey: endpointId) else { return }
        
        // Send rejection via control characteristic
        if let controlChar = controlCharacteristicMutable {
            let rejectMessage = "REJECT".data(using: .utf8)!
            peripheralManager?.updateValue(rejectMessage, for: controlChar, onSubscribedCentrals: [central])
        }
    }
    
    // MARK: - End Connection
    
    func endConnection() {
        // Teardown peripheral manager (host role)
        teardownPeripheralManager()
        
        // Stop scanning
        stopScanning()
        
        // Disconnect connected peripheral (guest role)
        if let peripheral = connectedPeripheral {
            centralManager?.cancelPeripheralConnection(peripheral)
        }
        connectedPeripheral = nil
        dataCharacteristic = nil
        controlCharacteristic = nil
        
        // Clear central manager
        centralManager = nil
        
        // Clear state
        discoveredPeripherals.removeAll()
        peripheralNames.removeAll()
        pendingConnections.removeAll()
        subscribedCentrals.removeAll()
        myOpponentName = nil
        connectedCentralName = nil
    }
    
    // MARK: - Send Data
    
    func send(data: Data) {
        // As Central (Guest): Write to peripheral's data characteristic
        if let peripheral = connectedPeripheral, let dataChar = dataCharacteristic {
            peripheral.writeValue(data, for: dataChar, type: .withoutResponse)
            return
        }
        
        // As Peripheral (Host): Notify the connected central
        if let pm = peripheralManager, let dataChar = dataCharacteristicMutable {
            // Prefer sending to connected central, fallback to all subscribed
            let targets = connectedCentral != nil ? [connectedCentral!] : subscribedCentrals
            if !targets.isEmpty {
                pm.updateValue(data, for: dataChar, onSubscribedCentrals: targets)
            }
        }
    }
    
    // MARK: - Helpers
    
    private func endpointId(for peripheral: CBPeripheral) -> String {
        return peripheral.identifier.uuidString
    }
    
    private func endpointId(for central: CBCentral) -> String {
        return central.identifier.uuidString
    }
}

// MARK: - CBCentralManagerDelegate (Guest Role)

extension CoreBluetoothSessionManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            startScanningInternal()
        } else {
            print("CoreBluetooth Central: Not powered on, state = \(central.state.rawValue)")
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        let endpointId = endpointId(for: peripheral)
        
        // Skip if already discovered
        guard discoveredPeripherals[endpointId] == nil else { return }
        
        // Get advertised name
        let name = advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? peripheral.name ?? "Unknown"
        
        discoveredPeripherals[endpointId] = peripheral
        peripheralNames[endpointId] = name
        
        DispatchQueue.main.async {
            self.onOpponentFound?(endpointId, name)
        }
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        connectedPeripheral = peripheral
        peripheral.delegate = self
        peripheral.discoverServices([Self.serviceUUID])
    }
    
    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("CoreBluetooth: Failed to connect: \(error?.localizedDescription ?? "unknown")")
        let endpointId = endpointId(for: peripheral)
        discoveredPeripherals.removeValue(forKey: endpointId)
    }
    
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        let endpointId = endpointId(for: peripheral)
        let name = peripheralNames[endpointId] ?? myOpponentName ?? "Unknown"
        
        if peripheral == connectedPeripheral {
            connectedPeripheral = nil
            dataCharacteristic = nil
            controlCharacteristic = nil
            myOpponentName = nil
            
            DispatchQueue.main.async {
                self.onPeerDisconnected?(name)
            }
        } else {
            DispatchQueue.main.async {
                self.onEndpointLost?(endpointId)
            }
        }
        
        discoveredPeripherals.removeValue(forKey: endpointId)
        peripheralNames.removeValue(forKey: endpointId)
    }
}

// MARK: - CBPeripheralDelegate (Guest Role - After Connection)

extension CoreBluetoothSessionManager: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let services = peripheral.services else { return }
        
        for service in services where service.uuid == Self.serviceUUID {
            peripheral.discoverCharacteristics([Self.nameCharUUID, Self.dataCharUUID, Self.controlCharUUID], for: service)
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard let characteristics = service.characteristics else { return }
        
        for char in characteristics {
            switch char.uuid {
            case Self.nameCharUUID:
                peripheral.readValue(for: char)
            case Self.dataCharUUID:
                dataCharacteristic = char
                peripheral.setNotifyValue(true, for: char)
            case Self.controlCharUUID:
                controlCharacteristic = char
                peripheral.setNotifyValue(true, for: char)
                
                // Send join request
                let joinMessage = "JOIN:\(myPeerName)".data(using: .utf8)!
                peripheral.writeValue(joinMessage, for: char, type: .withResponse)
            default:
                break
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard let value = characteristic.value else { return }
        let endpointId = endpointId(for: peripheral)
        
        switch characteristic.uuid {
        case Self.nameCharUUID:
            // Got opponent's name
            if let name = String(data: value, encoding: .utf8) {
                myOpponentName = name
                peripheralNames[endpointId] = name
            }
            
        case Self.controlCharUUID:
            // Control messages
            if let message = String(data: value, encoding: .utf8) {
                if message.hasPrefix("ACCEPT:") {
                    // Connection accepted!
                    let name = String(message.dropFirst(7))
                    myOpponentName = name
                    
                    // Stop scanning to save battery
                    stopScanning()
                    
                    DispatchQueue.main.async {
                        self.onPeerConnected?(name)
                    }
                } else if message == "REJECT" {
                    // Connection rejected
                    centralManager?.cancelPeripheralConnection(peripheral)
                }
            }
            
        case Self.dataCharUUID:
            // Game data
            let peerName = myOpponentName ?? peripheralNames[endpointId] ?? "Unknown"
            DispatchQueue.main.async {
                self.onDataReceived?(value, peerName)
            }
            
        default:
            break
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("CoreBluetooth: Write error: \(error.localizedDescription)")
        }
    }
}

// MARK: - CBPeripheralManagerDelegate (Host Role)

extension CoreBluetoothSessionManager: CBPeripheralManagerDelegate {
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        if peripheral.state == .poweredOn {
            setupAndAdvertise()
        } else {
            print("CoreBluetooth Peripheral: Not powered on, state = \(peripheral.state.rawValue)")
        }
    }
    
    func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
        if let error = error {
            print("CoreBluetooth: Failed to add service: \(error.localizedDescription)")
        }
    }
    
    func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
        if let error = error {
            print("CoreBluetooth: Failed to start advertising: \(error.localizedDescription)")
        }
    }
    
    func peripheralManager(_ peripheral: CBPeripheralManager, central: CBCentral, didSubscribeTo characteristic: CBCharacteristic) {
        subscribedCentrals.append(central)
    }
    
    func peripheralManager(_ peripheral: CBPeripheralManager, central: CBCentral, didUnsubscribeFrom characteristic: CBCharacteristic) {
        subscribedCentrals.removeAll { $0.identifier == central.identifier }
        
        let endpointId = endpointId(for: central)
        if connectedCentralName == endpointId {
            let name = myOpponentName ?? endpointId
            connectedCentralName = nil
            myOpponentName = nil
            
            DispatchQueue.main.async {
                self.onPeerDisconnected?(name)
            }
        }
    }
    
    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
        for request in requests {
            guard let value = request.value else { continue }
            
            switch request.characteristic.uuid {
            case Self.controlCharUUID:
                handleControlMessage(value, from: request.central)
                peripheral.respond(to: request, withResult: .success)
                
            case Self.dataCharUUID:
                let endpointId = endpointId(for: request.central)
                let peerName = myOpponentName ?? endpointId
                DispatchQueue.main.async {
                    self.onDataReceived?(value, peerName)
                }
                peripheral.respond(to: request, withResult: .success)
                
            default:
                peripheral.respond(to: request, withResult: .requestNotSupported)
            }
        }
    }
    
    private func handleControlMessage(_ data: Data, from central: CBCentral) {
        guard let message = String(data: data, encoding: .utf8) else { return }
        let endpointId = endpointId(for: central)
        
        if message.hasPrefix("JOIN:") {
            let name = String(message.dropFirst(5))
            pendingConnections[endpointId] = central
            myOpponentName = name
            
            DispatchQueue.main.async {
                self.onConnectionRequest?(endpointId, name)
            }
        }
    }
    
    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
        if request.characteristic.uuid == Self.nameCharUUID {
            if let data = myPeerName.data(using: .utf8) {
                request.value = data
                peripheral.respond(to: request, withResult: .success)
            }
        } else {
            peripheral.respond(to: request, withResult: .requestNotSupported)
        }
    }
}
