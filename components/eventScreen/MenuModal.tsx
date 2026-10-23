import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Event } from '../../types';

interface MenuModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
}

export default function MenuModal({ visible, event, onClose }: MenuModalProps) {  
  if (!event) {
    return null;
  }

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
            <View style={styles.mainCard}>
                
                <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.headerSection}>
                    <Text style={styles.title}>Menu</Text>
                    <Text style={styles.subTitle}>{event.name}</Text>
                </View>

                <View style={styles.whiteContentBox}>
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {event.menu && event.menu.length > 0 ? (
                            event.menu.map((item, index) => (
                                <View key={index} style={styles.menuItemPlaceholder}>
                                    <Text style={styles.itemTitle}>• {item}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.placeholderText}>
                                Menu details will appear here ~10 minutes prior to the start time.
                            </Text>
                        )}
                    </ScrollView>
                </View>
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
    height: '60%', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e3e3e3',
    borderRadius: 20,
    padding: 24,
  },
  closeButton: {
    paddingBottom: 10,
    alignSelf: 'flex-start',
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    opacity: 0.5
  },
  headerSection: {
    marginBottom: 15,
    alignItems: 'center', 
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  whiteContentBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: 5,
    overflow: 'hidden',
    marginBottom: 10
  },
  scrollContent: {
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuItemPlaceholder: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
});
