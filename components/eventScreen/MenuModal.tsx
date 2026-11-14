import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ModalLayout } from '../layout/ModalLayout';
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
    <ModalLayout
      visible={visible}
      onClose={onClose}
      header={(
        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close menu">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      )}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subTitle}>{event.name}</Text>
      </View>

      <View style={styles.whiteContentBox}>
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
      </View>
    </ModalLayout>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: 5,
    padding: 16,
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
