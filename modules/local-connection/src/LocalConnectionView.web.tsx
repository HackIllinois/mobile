import * as React from 'react';

import { LocalConnectionViewProps } from './LocalConnection.types';

export default function LocalConnectionView(props: LocalConnectionViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
