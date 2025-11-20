import { StyleSheet, View, Image, Text, TouchableOpacity } from "react-native";

type OnSkipProps = {
  onFinish: () => void;
  onStart: () => void; 
};

export default function ScreenFour({ onFinish, onStart }: OnSkipProps) {
    return (
        <View style={styles.background}>
            <Image
                source={require("../../assets/onboarding/line.png")}
                style={styles.line}
            />
            <Image 
                source={require("../../assets/onboarding/large_rocket.png")}
                style={styles.miniRocket}
            />
            <View style={[styles.circle, { left: 15 }]} />
            <View style={[styles.circle, { left: 185 }]} />
            <View style={[styles.circle, { left: 265 }]} />
            <View style={[styles.circle, { left: 341 }]} />
            <Image 
                source={require("../../assets/onboarding/iphone.png")}
                style={styles.iphone}
            />
            <Text style={styles.headerText}>
                Schedule
            </Text>
            <Text style={styles.subtitleText}>
                See the time and details of all of our events
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.startButton} onPress={onStart}>
                    <Text style={styles.startButtonText}>NEXT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={onFinish}>
                    <Text style={styles.skipButtonText}>SKIP</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 24,
    },
    line: {
        alignSelf: 'center',
        marginTop: 140,
        width: 350,
        height: 2,
    },
    miniRocket: {
        position: "absolute",
        width: 50,
        height: 50,
        backgroundColor: "#FFFFFF", 
        top: 116,
        left: 85,
        transform: [{ rotate: "90deg" }],
    },
    circle: {
        position: "absolute",
        top: 127, 
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderColor: "#000000",
        borderWidth: 1,
    },
    iphone: {
        marginTop: 50,
    },
    headerText: {
        fontFamily: "Montserrat",
        marginTop: 30,
        fontSize: 30,
        textAlign: "center",
        fontWeight: "600",
        color: "#000000",
    },
    subtitleText: {
        fontFamily: "Montserrat",
        marginTop: 10,
        fontSize: 18,
        textAlign: "center",
        color: "#000000",
    },
    buttonContainer: {
        flexDirection: "row",    
        justifyContent: "space-between", 
        alignItems: "center",
        marginTop: 4,
        width: "80%",            
    },
    startButton: {
        left: 180,
        marginTop: 5,
        width: 125.93,
        height: 45,
        borderRadius:100,
        backgroundColor: "#cdcdcdff",
    },
    startButtonText: {
        marginTop: 15,
        fontFamily: "Montserrat",
        fontWeight: "500",
        textAlign: "center",
        fontSize: 16,
        color: "#000000",
        lineHeight: 13, 
        letterSpacing: 0
    },
    skipButton: {
        marginTop: 5,
        bottom: 2.5,
        right: 230,
        
    },
    skipButtonText: {
        fontFamily: "Montserrat",
        fontSize: 16,
        fontWeight: "500",
    }
});


