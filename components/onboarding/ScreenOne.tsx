import { StyleSheet, View, Image, Text } from "react-native";

export default function ScreenOne() {
    return (
        <View style={styles.background}>
            <Image source={require('../../assets/onboarding/hack_logo_top.png')} style={styles.logoTop} />
            <Image source={require('../../assets/onboarding/hack_logo_bottom.png')} style={styles.logoBottom} />
            <Text style={styles.hackText}>HACK ILLINOIS</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: '#FFFFFF'
    },
    logoTop: {
        width: 154.51,
        height: 91.68,
        marginTop: 238,
        marginLeft: 113
    },
    logoBottom: {
        width: 154.51,
        height: 91.68,
        marginTop: 40,
        marginLeft: 113   
    },
    hackText: {
        width: 186,
        marginLeft: 95,
        marginTop: 70,
        fontFamily: 'Montserrat',
        fontSize: 40,
        textAlign: 'center',
        fontWeight: '800',
        color: '#000000'
    }
})