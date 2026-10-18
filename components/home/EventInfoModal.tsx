import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type EventModalStatus = "upcoming" | "live" | "closing" | "ended";

export interface EventModalData {
  id: string;
  focusEventId?: string;
  focusEventName?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  format: "In-person" | "Virtual" | "Hybrid";
  status: EventModalStatus;
  tags?: string[];
  image: ImageSourcePropType;
}

interface EventInfoModalProps {
  visible: boolean;
  event: EventModalData | null;
  onClose: () => void;
  onViewDetails?: (event: EventModalData) => void;
}



export default function EventInfoModal({ visible, event, onClose, onViewDetails }: EventInfoModalProps) {
  if (!visible || !event) return null;

  const statusLabel =
    event.status === "live"
      ? "Live"
      : event.status === "closing"
      ? "Closing Soon"
      : event.status === "ended"
      ? "Event Ended"
      : "Upcoming";

  const showPrimaryAction = !!onViewDetails;
  const primaryDisabled = event.status === "ended";

  const timeText = `${event.startTime.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })} - ${event.endTime.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <Modal 
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}/>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View>
                <Image source={event.image} style={styles.icon} resizeMode="contain" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{event.title}</Text>
                <View style={styles.statusPill}>
                  <View style={[styles.statusDot, event.status === "live" ? styles.statusLive : styles.statusMuted]} />
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close event details">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>

            <Text style={styles.description}>{event.description || "Details coming soon"}</Text>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>{timeText}</Text>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{event.location}</Text>
              <Text style={styles.metaLabel}>Format</Text>
              <Text style={styles.metaValue}>{event.format}</Text>
            </View>

            {!!event.tags?.length && (
              <View style={styles.tagsRow}>
                {event.tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {showPrimaryAction && (
              <View style={styles.footer}>
                <Pressable
                  disabled={primaryDisabled}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: primaryDisabled ? "#565A72" : "#776EFF",
                      opacity: primaryDisabled ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (!onViewDetails) return;
                    onClose();
                    onViewDetails(event);
                  }}
                >

                    <Text style={styles.primaryBtnText}>
                      {event.status === "ended" ? "Event Ended" : "View Details"}
                    </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  sheetWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  sheet: {
    backgroundColor: "#353838ff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderWidth: 1,
    minHeight: 360,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  icon: { width: 60, height: 60 },
  headerText: { flex: 1, gap: 6 },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLive: { backgroundColor: "#71FFAE" },
  statusMuted: { backgroundColor: "#B0A9D8" },
  statusText: { color: "#EFEAFF", fontSize: 12, fontWeight: "600" },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  closeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  description: {
    color: "#ECE6FF",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  metaBlock: { marginTop: 14, gap: 3 },
  metaLabel: {
    color: "#BDB4E4",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
  },
  metaValue: { color: "#FFFFFF", fontSize: 14, lineHeight: 19 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  tagPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(120, 186, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(120, 186, 255, 0.3)",
  },
  tagText: { color: "#DFF0FF", fontSize: 12, fontWeight: "600" },
  footer: { flexDirection: "row", gap: 10, marginTop: 18 },
  primaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
