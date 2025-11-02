import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5, 
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    zIndex: 10, 
  },
  headerIconTouchable: { 
    padding: 15, 
  },
  headerIconRight: {
    padding: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    position: 'absolute', 
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 5, 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', 
  },
  darkModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5, 
    paddingVertical: 10, 
  },



  scrollContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60, 
    borderWidth: 3,
    borderColor: '#9A6AFF',
    marginBottom: 20,
    backgroundColor: '#333',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  editIcon: {
    marginLeft: 10,
    padding: 5,
  },
  editText: {
    color: '#9A6AFF',
    fontSize: 14,
  },
  points: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: '#9A6AFF',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden', 
    marginBottom: 30,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fieldLabel: {
    color: '#AAA',
    fontSize: 16,
    flex: 1, 
  },
  fieldValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1, 
    textAlign: 'right',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 18,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 15,
  },
  inlineTextInput: {
    width: 'auto',
    marginBottom: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 26, 
    fontWeight: 'bold',
    backgroundColor: '#333',
    minWidth: 150,
    textAlign: 'center',
  },
  fieldValueInput: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 0,
    padding: 8,
    flex: 2, 
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#9A6AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  logoutButton: {
    backgroundColor: '#C70039', 
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5555',
    fontSize: 18,
    marginBottom: 20,
  },
  qrSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333', // A light separator
    paddingTop: 20,
  },
  qrHelpText: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 15,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF', // QR codes need a light background
    padding: 15,
    borderRadius: 10,
    width: 250, // Container width (220 size + 15 padding * 2)
    height: 250, // Container height
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: '#555',
    marginTop: 10,
  },
  refreshButton: {
    marginTop: 15, 
    backgroundColor: '#333', 
    width: '80%', 
  },
});