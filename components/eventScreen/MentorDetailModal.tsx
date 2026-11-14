import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ModalLayout } from "../layout/ModalLayout";

export type MentorshipSession = {
  id: string;
  mentorName: string;
  location: string;
  startTime: number; // unix seconds
  endTime: number; // unix seconds

  // optional (backend doesn't provide these yet)
  track?: string;
  bio?: string;
  topics?: string[];
  contact?: string;
};

interface MentorDetailModalProps {
  visible: boolean;
  session: MentorshipSession | null;
  onClose: () => void;

  /**
   * ✅ NEW: pass true when user is a guest (no jwt)
   * In your screen: const { guest } = useMentorOfficeHours(...)
   * then: <MentorDetailModal guest={guest} ... />
   */
  guest?: boolean;

  /**
   * ✅ NEW: called when user taps "Log in to see mentors"
   * Hook this up to your login screen navigation.
   */
  onLoginPress?: () => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function MentorDetailModal({
  visible,
  session,
  onClose,
  guest = false,
  onLoginPress,
}: MentorDetailModalProps) {
  const showGuestPrompt = visible && guest;

  const topics = session?.topics ?? [];
  const track = session?.track?.trim() ? session.track : "Mentor";
  const bio = session?.bio?.trim() ? session.bio : "No bio provided yet.";
  const contact = session?.contact?.trim()
    ? session.contact
    : "No contact provided yet.";

  const handleLogin = () => {
    // close modal first so navigation feels clean
    onClose();
    onLoginPress?.();
  };

  return (
    <ModalLayout
      visible={visible}
      onClose={onClose}
      panelStyle={styles.panel}
      header={(
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close mentorship details">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      )}
    >
      {showGuestPrompt ? (
        <>
          <Text style={styles.title}>Mentorship</Text>
          <Text style={styles.bodyText}>Log in to view mentors and mentorship sessions.</Text>
          <TouchableOpacity style={styles.loginButton} activeOpacity={0.85} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log in to see mentors</Text>
          </TouchableOpacity>
        </>
      ) : session ? (
        <>
          <Text style={styles.title}>{session.mentorName}</Text>

          <View style={styles.pillRow}>
            <View style={styles.trackPill}>
              <Text style={styles.trackText}>{track}</Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </Text>
          <Text style={styles.infoText}>{session.location}</Text>

          <Text style={styles.sectionHeader}>About</Text>
          <Text style={styles.bodyText}>{bio}</Text>

          <Text style={styles.sectionHeader}>Topics</Text>
          {topics.length > 0 ? (
            <View style={styles.topicsWrap}>
              {topics.map((topic) => (
                <View key={topic} style={styles.topicChip}>
                  <Text style={styles.topicChipText}>{topic}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bodyText}>No topics listed yet.</Text>
          )}

          <Text style={styles.sectionHeader}>Contact</Text>
          <Text style={styles.bodyText}>{contact}</Text>
        </>
      ) : null}
    </ModalLayout>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#D9D9D9",
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  closeText: { fontSize: 24, fontWeight: "bold", color: "#000", opacity: 0.5 },

  loginButton: {
    marginTop: 18,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#eddbff",
  },
  loginButtonText: { fontSize: 14, fontWeight: "900", color: "#222" },

  title: { fontSize: 28, fontWeight: "800", color: "#000", marginBottom: 8 },
  pillRow: { flexDirection: "row", marginBottom: 12, marginTop: 4 },
  trackPill: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexShrink: 1,
    backgroundColor: "#eddbff",
  },
  trackText: { fontSize: 12, fontWeight: "900", color: "#222" },

  infoText: { fontSize: 20, fontWeight: "600", color: "#000", marginBottom: 2 },

  sectionHeader: { marginTop: 14, fontSize: 16, fontWeight: "900", color: "#333" },
  bodyText: { marginTop: 6, fontSize: 14, color: "#333", lineHeight: 20 },

  topicsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  topicChipText: { fontSize: 12, fontWeight: "800", color: "#333" },
});