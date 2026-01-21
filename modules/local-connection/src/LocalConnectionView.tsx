import { requireNativeView } from 'expo';
import * as React from 'react';

import { LocalConnectionViewProps } from './LocalConnection.types';

const NativeView: React.ComponentType<LocalConnectionViewProps> =
  requireNativeView('LocalConnection');

export default function LocalConnectionView(props: LocalConnectionViewProps) {
  return <NativeView {...props} />;
}
