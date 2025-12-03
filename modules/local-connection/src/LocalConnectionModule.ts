import { NativeModule, requireNativeModule } from 'expo';

import { LocalConnectionModuleEvents } from './LocalConnection.types';

declare class LocalConnectionModule extends NativeModule<LocalConnectionModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<LocalConnectionModule>('LocalConnection');
