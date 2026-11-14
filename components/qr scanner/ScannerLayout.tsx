import { useState, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { layoutStyles } from "../../lib/layout";

interface ScannerLayoutProps {
  camera: ReactNode;
  reason?: string;
  onClose?: () => void;
  footer?: ReactNode;
  children?: ReactNode;
}

const MASK_COLOR = "rgba(64, 26, 121, 0.7)";

export function ScannerLayout({ camera, reason, onClose, footer, children }: ScannerLayoutProps) {
  const [frameArea, setFrameArea] = useState({ width: 0, height: 0 });
  const frameSize = Math.max(0, Math.min(300, frameArea.width * 0.7, frameArea.height - 16));

  return (
    <View style={styles.container}>
      {camera}
      <SafeAreaView edges={onClose ? undefined : []} style={layoutStyles.fill}>
        <View style={styles.header}>
          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close scanner"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={26} color="#FFF" />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>Scan QR Code</Text>
            {!!reason && <Text style={styles.reason}>{reason}</Text>}
            <Text style={styles.instruction}>Place QR inside the frame to scan</Text>
          </View>
          {onClose && <View style={styles.headerSpacer} />}
        </View>

        <View
          style={styles.frameArea}
          onLayout={({ nativeEvent: { layout } }) =>
            setFrameArea({ width: layout.width, height: layout.height })
          }
        >
          <View style={styles.mask} />
          {frameSize > 0 && (
            <View style={styles.frameRow}>
              <View style={styles.mask} />
              <View style={{ width: frameSize, height: frameSize }}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.mask} />
            </View>
          )}
          <View style={styles.mask} />
        </View>

        {footer && <View style={styles.footer}>{footer}</View>}
      </SafeAreaView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: MASK_COLOR,
  },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 44 },
  headerText: { flex: 1, alignItems: "center", gap: 4 },
  title: { color: "#FFF", fontSize: 26, fontFamily: "Montserrat-Bold", textAlign: "center" },
  reason: { color: "#FFF", fontSize: 16, fontWeight: "600", textAlign: "center" },
  instruction: { color: "#E9E9E9", fontSize: 14, textAlign: "center" },
  frameArea: { flex: 1 },
  frameRow: { flexDirection: "row" },
  mask: { flex: 1, backgroundColor: MASK_COLOR },
  corner: {
    position: "absolute",
    width: "22%",
    height: "22%",
    borderColor: "#FFF",
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  footer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: MASK_COLOR,
  },
});
