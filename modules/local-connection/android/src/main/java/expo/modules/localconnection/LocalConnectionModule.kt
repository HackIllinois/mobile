package expo.modules.localconnection

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.content.Intent
import android.os.ParcelUuid
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

class LocalConnectionModule : Module() {
  private val SERVICE_UUID = UUID.fromString("0000180F-0000-1000-8000-00805f9b34fb")
  private val CHAR_UUID = UUID.fromString("00002A19-0000-1000-8000-00805f9b34fb")

  private var bluetoothManager: BluetoothManager? = null
  private var bluetoothAdapter: BluetoothAdapter? = null
  private var gattServer: BluetoothGattServer? = null
  private var leAdvertiser: BluetoothLeAdvertiser? = null

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context lost")

  override fun definition() = ModuleDefinition {
    // FIXED: Changed Name from "BleP2P" to "LocalConnection" to match your JS require
    Name("LocalConnection")

    Events("onMessageReceived", "onDeviceConnected", "onScanResult")

    OnCreate {
      bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
      bluetoothAdapter = bluetoothManager?.adapter
    }

    AsyncFunction("startAdvertising") { chatName: String ->
      if (!hasPermissions()) throw SecurityException("Missing Permissions")

      leAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser
      
      val settings = AdvertiseSettings.Builder()
        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
        .setConnectable(true) 
        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
        .build()

      val data = AdvertiseData.Builder()
        .setIncludeDeviceName(false) 
        .addServiceUuid(ParcelUuid(SERVICE_UUID))
        .build()

      leAdvertiser?.startAdvertising(settings, data, advertiseCallback)

      gattServer = bluetoothManager?.openGattServer(context, gattServerCallback)
      setupGattService()
      
      startForegroundService()
    }

    AsyncFunction("startScanning") {
      if (!hasPermissions()) throw SecurityException("Missing Permissions")

      val scanner = bluetoothAdapter?.bluetoothLeScanner
      
      val filter = ScanFilter.Builder()
        .setServiceUuid(ParcelUuid(SERVICE_UUID))
        .build()
        
      val settings = ScanSettings.Builder()
        .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
        .build()

      scanner?.startScan(listOf(filter), settings, scanCallback)
    }

    AsyncFunction("sendMessage") { message: String ->
       // Logic to write characteristic goes here
    }
  }

  // ... Callbacks (gattServerCallback, advertiseCallback, scanCallback) remain the same ...
  // ... Paste the callbacks from your previous file here ...
  
  // FIXED: Callbacks need to be inside the class. 
  // Ensure you include the callbacks from your original upload here.

  private val gattServerCallback = object : BluetoothGattServerCallback() {
     // ... (Keep existing implementation)
     @SuppressLint("MissingPermission")
    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      characteristic: BluetoothGattCharacteristic,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray
    ) {
      super.onCharacteristicWriteRequest(device, requestId, characteristic, preparedWrite, responseNeeded, offset, value)
      if (responseNeeded) {
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
      }
      val message = String(value, Charsets.UTF_8)
      sendEvent("onMessageReceived", mapOf(
        "sender" to device.address,
        "data" to message
      ))
    }
    
    override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
       if (newState == BluetoothProfile.STATE_CONNECTED) {
          sendEvent("onDeviceConnected", mapOf("deviceId" to device.address))
       }
    }
  }

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
      Log.d("LocalConnection", "Advertising started")
    }
    override fun onStartFailure(errorCode: Int) {
      Log.e("LocalConnection", "Advertising failed: $errorCode")
    }
  }

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
       sendEvent("onScanResult", mapOf(
         "name" to (result.device.name ?: "Unknown"),
         "id" to result.device.address
       ))
    }
  }

  @SuppressLint("MissingPermission")
  private fun setupGattService() {
    val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val characteristic = BluetoothGattCharacteristic(
      CHAR_UUID,
      BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_WRITE,
      BluetoothGattPermission.PERMISSION_READ or BluetoothGattPermission.PERMISSION_WRITE
    )
    service.addCharacteristic(characteristic)
    gattServer?.addService(service)
  }

  private fun startForegroundService() {
    // FIXED: Now references the correct LocalConnectionService class
    val intent = Intent(context, LocalConnectionService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(intent)
    }
  }

  private fun hasPermissions(): Boolean {
    return true 
  }
}