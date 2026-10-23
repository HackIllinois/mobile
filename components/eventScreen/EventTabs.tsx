import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';

export type TabMode = 'events' | 'mentorship' | 'shifts';

interface EventTabsProps {
  activeTab: TabMode;
  onTabPress: (tab: TabMode) => void;
  showShifts?: boolean;
}

export default function EventTabs({ activeTab, onTabPress, showShifts = false }: EventTabsProps) {

  return (
    <View style={styles.container}>
        <Pressable
          onPress={()=>onTabPress("events")}
          style={[
            styles.tabButton, 
            activeTab === "events" && styles.activeTab,
          ]}
        >
          <Text style={styles.text}>
            Events
          </Text>
        </Pressable>

        <Pressable
          onPress={()=>onTabPress("mentorship")}
          style={[
            styles.tabButton, 
            activeTab === "mentorship" && styles.activeTab,
          ]}
        >
          <Text style={styles.text}>
            Mentorship
          </Text>
        </Pressable>

        {showShifts && (
         <Pressable
          onPress={() => onTabPress("shifts")}
          style={[
            styles.tabButton,
            activeTab === "shifts" && styles.activeTab,
          ]}
         > 
          <Text style={styles.text}>
            Shifts
          </Text>
         </Pressable>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'flex-start',
  },
  tabButton: {
    justifyContent: 'center',
    backgroundColor: "#575656ff",
    alignItems: 'center',
    height: 50,
    width: 100,
    borderRadius: 10,
    borderColor: "transparent",
    borderWidth: 5,
  },
  activeTab: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: "#0051ffff",
  },
  text: {
    flex: 1,
    color: '#ffffff',
  }
});

