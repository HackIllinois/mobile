package expo.modules.localconnection

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.content.pm.ServiceInfo

// FIXED: Renamed from LocalConenctionService (typo) to LocalConnectionService
class LocalConnectionService : Service() {

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    createNotificationChannel()
    
    val notification = Notification.Builder(this, "BLE_P2P_CHANNEL")
      .setContentTitle("BLE P2P Active")
      .setContentText("Maintaining connection...")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .build()

    [cite_start]// Android 14 compliant foreground service type [cite: 162]
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
    } else {
      startForeground(1, notification)
    }

    return START_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        "BLE_P2P_CHANNEL",
        "BLE Connection",
        NotificationManager.IMPORTANCE_LOW
      )
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }
}