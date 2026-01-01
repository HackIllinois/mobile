import { NativeModule, requireNativeModule } from 'expo';

import { LocalConnectionModuleEvents } from './LocalConnection.types';

declare class LocalConnectionModule extends NativeModule<LocalConnectionModuleEvents> {
  // Setup
  InitPeerName(name: string): void;
  getOpponentName(): string | null;
  setConnectionMedium(medium: 'BLUETOOTH' | 'WIFI' | 'ALL'): void;
  
  // Advertising/Scanning
  startAdvertising(): void;
  startScanning(): void;
  stopAdvertising(): void;
  stopScanning(): void;
  
  // Connection
  joinRoom(endpointId: string): void;
  acceptInvitation(endpointId: string): void;
  EndConnection(): void;
  
  // Data
  sendData(message: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LocalConnectionModule>('LocalConnection');
