import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './LocalConnection.types';

type LocalConnectionModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class LocalConnectionModule extends NativeModule<LocalConnectionModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(LocalConnectionModule, 'LocalConnectionModule');
