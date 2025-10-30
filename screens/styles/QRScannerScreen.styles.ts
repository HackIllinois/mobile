import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

    // --- View 2 Styles ---
    menuContainer: {
      flex: 1,
      backgroundColor: 'white',
      paddingVertical: 20,
      paddingHorizontal: 30,
      paddingBottom: 100, 
    },
    menuTitle: {
      fontSize: 40,
      fontWeight: 'bold',
      color: 'black',
      marginTop: 20,
      marginBottom: 40,
    },
    menuButton: {
      backgroundColor: '#D9D9D9',
      padding: 20,
      borderRadius: 15,
      width: 300,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      alignSelf: 'center',
    },
    menuButtonSecondary: {
      backgroundColor: '#D9D9D9',
      padding: 10,
      borderRadius: 15,
      alignItems: 'center', 
      marginTop: 60,
      width: 150,
      height: 70,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    menuButtonBottom: {
      backgroundColor: '#ADADAD',
      alignItems: 'center', 
      height: 60,
      width: 200,
      justifyContent: 'center',
      marginTop: 'auto', 
      marginBottom: 20,
      alignSelf: 'center', 
    },
    menuButtonText: {
      fontSize: 18,
      fontWeight: '500',
      color: 'black',
      textAlign: 'center',
    },
    menuButtonArrow: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
    },
    eventListContainer: {
      width: '100%',
      maxHeight: 300, 
      marginVertical: 20,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#eee',
    },
    eventModalButton: {
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0', 
      width: '100%',
    },
    eventModalButtonText: {
      fontSize: 16,
      color: '#007AFF', 
      textAlign: 'center',
      fontWeight: '500',
    },
    cancelButton: {
      backgroundColor: '#8E8E93',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginTop: 10,
      width: '80%',
      alignItems: 'center',
    },




  
    // --- View 1 Styles  ---
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black', 
    },
    permissionContainer: { 
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: 'black',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20, 
    },
    loadingText: {
      color: '#ffffff',
      marginTop: 10,
      fontSize: 16,
    },
  
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#D9D9D9',
      height: 110, 
      flexDirection: 'row',
      alignItems: 'flex-end', 
      justifyContent: 'space-between',
      paddingHorizontal: 25,
      paddingBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 10, 
    },
    topBarButton: {
      width: 40,
      height: 40, 
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarButtonText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
    },
    topBarTitle: {
      height: 35,
      width: 150,
      backgroundColor: '#ADADAD',
      borderRadius: 20,
    },
    
    maskContainer: {
      ...StyleSheet.absoluteFillObject,
      paddingTop: 110,
      paddingBottom: 120,
      zIndex: 1, 
    },
    maskTop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      width: '100%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },
    maskMiddle: {
      height: 250, 
      flexDirection: 'row',
    },
    maskSide: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanWindow: {
      width: 250, 
      height: 250,
      position: 'relative', 
    },
    maskBottom: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 40, 
    },
  
    corner: {
      position: 'absolute',
      width: 50,
      height: 50,
      borderColor: 'black', 
      borderWidth: 5, 
    },
    cornerTopLeft: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    cornerTopRight: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
    },
    cornerBottomLeft: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
    },
    cornerBottomRight: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
  




    // --- Modal Styles  --- 
    scanHelpText: {
      fontSize: 16,
      color: 'white',
      backgroundColor: 'transparent',
      marginBottom: 30,
    },
    chooseImageButton: {
      backgroundColor: '#ADADAD', 
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 30, 
    },
    chooseImageButtonText: {
      fontSize: 18,
      color: '#333', 
      fontWeight: '500',
    },
    
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: 'white',
      paddingVertical: 40, 
      paddingHorizontal: 20,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    successContent: {
      alignItems: 'center',
      marginBottom: 25, 
    },
    checkMark: {
      fontSize: 90, 
      color: '#000000', 
      backgroundColor: '#ACACAC', 
      borderRadius: 60, 
      width: 120,
      height: 120,
      textAlign: 'center',
      lineHeight: 120, 
      marginBottom: 20, 
      overflow: 'hidden', 
    },
    modalEventName: {
      fontSize: 20,
      fontWeight: '600',
      color: '#333',
      marginBottom: 5,
    },
    modalTitle: {
      fontSize: 26, 
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
      color: '#333',
    },
    pointsEarned: {
      fontSize: 18,
      color: '#666',
      backgroundColor: '#D9D9D9', 
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 20, 
      fontWeight: 'bold',
      marginBottom: 30, 
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: '#555',
    },
    okButton: {
      backgroundColor: 'black', 
      paddingVertical: 15, 
      paddingHorizontal: 50,
      borderRadius: 10,
      width: '70%', 
    },
    okButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    }
    
  });