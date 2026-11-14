import { useState } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface ResponsiveQRCodeProps {
  value: string;
  maxSize?: number;
  backgroundColor?: string;
}

export function ResponsiveQRCode({ value, maxSize = 200, backgroundColor }: ResponsiveQRCodeProps) {
  const [size, setSize] = useState(0);

  return (
    <View
      style={{ width: "100%", maxWidth: maxSize, alignSelf: "center" }}
      onLayout={({ nativeEvent: { layout } }) => setSize(layout.width)}
    >
      {size > 0 && <QRCode value={value} size={size} backgroundColor={backgroundColor} />}
    </View>
  );
}
