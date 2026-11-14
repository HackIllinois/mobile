import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { layoutStyles } from "../../lib/layout";

type ModalWindowProps = Omit<ModalProps, "onRequestClose"> & {
  onClose: () => void;
};
{/* Open the modal providing safe area viewing */}
export function ModalWindow({ children, onClose, ...props }: ModalWindowProps) {
  return (
    <Modal
      {...props}
      supportedOrientations={["portrait", "portrait-upside-down", "landscape-left", "landscape-right"]}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider style={layoutStyles.fill}>{children}</SafeAreaProvider>
    </Modal>
  );
}

interface ModalPanelProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  panelStyle?: StyleProp<ViewStyle>;
}
{/* Renders the pannel and scrollable body for children */}
export function ModalPanel({ children, header, footer, panelStyle }: ModalPanelProps) {
  return (
    <View accessibilityViewIsModal style={[layoutStyles.column, styles.panel, panelStyle]}>
      {header}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

interface ModalLayoutProps extends ModalPanelProps {
  visible: boolean;
  onClose: () => void;
  bottom?: boolean;
  animationType?: ModalProps["animationType"];
  backdropColor?: string;
  dismissOnBackdrop?: boolean;
}

export function ModalLayout({
  visible,
  onClose,
  bottom = false,
  animationType = "fade",
  backdropColor = "rgba(0, 0, 0, 0.5)",
  dismissOnBackdrop = true,
  ...panelProps
}: ModalLayoutProps) {
  return (
    <ModalWindow visible={visible} onClose={onClose} animationType={animationType} transparent>
      <SafeAreaView
        style={[layoutStyles.fill, styles.backdrop, bottom && styles.bottom, { backgroundColor: backdropColor }]}
      >
        {dismissOnBackdrop && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        )}
        <ModalPanel {...panelProps} />
      </SafeAreaView>
    </ModalWindow>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    justifyContent: "center",
    padding: 16,
  },
  bottom: {
    justifyContent: "flex-end",
  },
  panel: {
    maxHeight: "100%",
    flexShrink: 1,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#e3e3e3",
  },
  body: {
    flexShrink: 1,
  },
});
