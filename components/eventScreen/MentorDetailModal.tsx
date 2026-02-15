import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';

export type MentorshipSession = {
  id: string;
  mentorName: string;
  location: string;
  startTime: number; // unix seconds
  endTime: number;   // unix seconds

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
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function MentorDetailModal({ visible, session, onClose }: MentorDetailModalProps) {
  if (!session) return null;

  const topics = session.topics ?? [];
  const track = session.track?.trim() ? session.track : 'Mentor';
  const bio = session.bio?.trim() ? session.bio : 'No bio provided yet.';
  const contact = session.contact?.trim() ? session.contact : 'No contact provided yet.';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.cardWrapper}>
          <View style={styles.backgroundCard} />
          <View style={styles.mainCard}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{top: 30, bottom: 30, right: 30, left: 30}}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
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
                  {topics.map((t) => (
                    <View key={t} style={styles.topicChip}>
                      <Text style={styles.topicChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.bodyText}>No topics listed yet.</Text>
              )}

              <Text style={styles.sectionHeader}>Contact</Text>
              <Text style={styles.bodyText}>{contact}</Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrapper: {
    width: '85%',
    height: '70%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCard: {
    position: 'absolute',
    width: '100%',
    height: '90%',
    backgroundColor: '#F5C6FF',
    borderRadius: 20,
    transform: [{ rotate: '173deg' }],
  },
  mainCard: {
    width: '100%',
    height: '80%',
    backgroundColor: '#D9D9D9',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  closeButton: {
    paddingBottom: 10,
    alignSelf: 'flex-end',
  },
  closeText: { fontSize: 24, fontWeight: 'bold', color: '#000', opacity: 0.5 },

  title: { fontSize: 28, fontWeight: '800', color: '#000', marginBottom: 8 },
  pillRow: { flexDirection: 'row', marginBottom: 12, marginTop: 4 },
  trackPill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#eddbff',
  },
  trackText: { fontSize: 12, fontWeight: '900', color: '#222' },

  infoText: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 2 },

  sectionHeader: { marginTop: 14, fontSize: 16, fontWeight: '900', color: '#333' },
  bodyText: { marginTop: 6, fontSize: 14, color: '#333', lineHeight: 20 },

  topicsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  topicChipText: { fontSize: 12, fontWeight: '800', color: '#333' },
});