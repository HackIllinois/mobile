import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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

const SHEET_HEIGHT = 420;

export default function EventInfoModal({ visible, event, onClose, onViewDetails }: EventInfoModalProps) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible && event) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: SHEET_HEIGHT, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [backdrop, event, sheetY, visible]);

  const closeAnimated = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: SHEET_HEIGHT, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) {
            sheetY.setValue(Math.min(g.dy, SHEET_HEIGHT));
          }
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 110 || g.vy > 0.9) {
            closeAnimated();
            return;
          }
          Animated.spring(sheetY, {
            toValue: 0,
            damping: 20,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        },
      }),
    [sheetY]
  );

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
    <Modal visible transparent animationType="none" onRequestClose={closeAnimated}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAnimated}>
          <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
        </Pressable>

        <Animated.View
          style={[styles.sheetWrap, { transform: [{ translateY: sheetY }] }]}
          {...panResponder.panHandlers}
        >
          <LinearGradient colors={["rgba(94,65,163,0.94)", "rgba(41,26,84,0.96)"]} style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Image source={event.image} style={styles.icon} resizeMode="contain" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                <View style={styles.statusPill}>
                  <View style={[styles.statusDot, event.status === "live" ? styles.statusLive : styles.statusMuted]} />
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
              </View>
              <Pressable onPress={closeAnimated} style={styles.closeBtn} accessibilityLabel="Close event details">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

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
                  style={[styles.primaryBtn, primaryDisabled && styles.primaryBtnDisabled]}
                  onPress={() => {
                    if (!onViewDetails) return;
                    onViewDetails(event);
                  }}
                >
                  <LinearGradient
                    colors={primaryDisabled ? ["#666A88", "#4E516A"] : ["#66A8FF", "#8A65FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnFill}
                  >
                    <Text style={styles.primaryBtnText}>
                      {event.status === "ended" ? "Event Ended" : "View Details"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(7, 8, 20, 0.62)" },
  sheetWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  sheet: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(196, 179, 255, 0.35)",
    shadowColor: "#B48CFF",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    minHeight: 360,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(234, 226, 255, 0.45)",
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: { width: 52, height: 52 },
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  closeText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
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
  primaryBtn: { flex: 1, borderRadius: 999, overflow: "hidden" },
  primaryBtnDisabled: { opacity: 0.8 },
  primaryBtnFill: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
