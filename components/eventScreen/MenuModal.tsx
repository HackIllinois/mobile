import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Event } from '../../types';

interface MenuModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
}

export default function MenuModal({ visible, event, onClose }: MenuModalProps) {
    const insets = useSafeAreaInsets();
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
        <View
            style={[
            styles.overlay,
            {
                paddingTop: insets.top || (Platform.OS === 'android' ? 20 : 0),
                paddingBottom: insets.bottom || 0,
            },
            ]}
        >
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{event.name} Menu</Text>
            <Text style={styles.body}>Menu details will be shown here.</Text>
            {/* TODO: Add actual menu details when available in the API */}
        </ScrollView>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#1a0033',
        paddingTop: 20,
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 60,
        alignItems: 'flex-start',
        paddingBottom: 40,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        left: 25,
        zIndex: 10,
    },
    closeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    body: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'left',
        marginBottom: 10,
    },
});
