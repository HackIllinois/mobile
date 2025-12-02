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
                
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                        <Text style={styles.placeholderText}>
                            Menu details for this meal will appear here.
                        </Text>
                        {/* TODO: Map through actual menu items here */}
                        <View style={styles.menuItemPlaceholder}>
                            <Text style={styles.itemTitle}>• Main Course</Text>
                            <Text style={styles.itemDesc}>TBA</Text>
                        </View>
                        <View style={styles.menuItemPlaceholder}>
                            <Text style={styles.itemTitle}>• Vegetarian Option</Text>
                            <Text style={styles.itemDesc}>TBA</Text>
                        </View>
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
    backgroundColor: '#ffffff', 
    borderRadius: 20,
    transform: [{ rotate: '4deg' }],
  },
  mainCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9',
    borderRadius: 20,
    padding: 24,
    transform: [{ rotate: '-4deg' }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 20,
    padding: 5,
  },
  closeText: {
    fontSize: 20,
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
    marginTop: 20,
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