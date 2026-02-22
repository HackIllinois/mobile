import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, Pressable } from 'react-native';
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
            
            <View style={styles.backgroundCard} />
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
                                Menu details for this meal will appear here.
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
  backgroundCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#F5C6FF', 
    borderRadius: 20,
    transform: [{ rotate: '173deg' }],
  },
  mainCard: {
    width: '100%',
    height: '100%',
    backgroundColor: 'blue',
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
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
  paperclip: {
    position: 'absolute',
    top: -15,
    right: 30,
    width: 20,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    transform: [{ rotate: '15deg' }],
    backgroundColor: 'transparent',
    opacity: 0.6
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
  itemDesc: {
    fontSize: 14,
    color: '#666',
    paddingLeft: 10,
  }
});
