import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Moon from "../../assets/event/Moon.svg";
import Sun from "../../assets/event/Sun";
import PinkMoon from "../../assets/event/PinkMoon.svg";
let SCREEN_WIDTH = Dimensions.get('window').width;
SCREEN_WIDTH = Math.min(SCREEN_WIDTH, 450); // Cap width for larger devices


// --- SIZING CONSTANTS ---
const MAX_ITEM_SIZE = 180;
const ITEM_SIZE = Math.min(SCREEN_WIDTH * 0.18, MAX_ITEM_SIZE); // Width of the moon

const SUN_SCALE = 1.35; 

// --- DYNAMIC FONT SIZES ---
const FONT_DATE_NUM = ITEM_SIZE * 0.28; 
const FONT_DAY_LABEL = ITEM_SIZE * 0.16; 
const FONT_MAIN_LABEL = ITEM_SIZE * 0.22; 

// --- Types ---
export interface EventDay {
  id: string;
  label: string; 
  date: Date;
}

interface EventHeaderProps {
  eventDays: EventDay[];
  selectedDay: string | null;
  setSelectedDay: (id: string | null) => void;
  selectedSave: boolean;
  setSaveValue: (val: boolean) => void;
  scheduleMode?: 'events' | 'mentorship';
}

export const EventHeader: React.FC<EventHeaderProps> = ({
  eventDays,
  selectedDay,
  setSelectedDay,
  selectedSave,
  setSaveValue,
  scheduleMode = 'events', 
}) => {

  // 1. Determine how many items are visible
  const showSavedButton = scheduleMode === 'events';
  const itemCount = eventDays.length + (showSavedButton ? 1 : 0);

  // 2. Calculate Gap Dynamically based on visible items
  // Formula: (Available Width) / (Number of Gaps)
  // Available Width = Screen Width - (Total Item Widths) - (Side Padding * 2)
  const totalItemWidth = ITEM_SIZE * itemCount;
  const sidePadding = 40; // 20px on each side
  const numberOfGaps = itemCount > 1 ? itemCount - 1 : 1; // Prevent divide by zero

  const dynamicGap = (SCREEN_WIDTH - totalItemWidth - sidePadding) / numberOfGaps;

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const handleDayPress = (dayId: string) => {
    if (selectedDay === dayId) {
      setSelectedDay(null);
    } else {
      setSelectedDay(dayId);
    }
  };

  const handleSavePress = () => {
    setSaveValue(!selectedSave);
  };

  return (
    <View style={styles.container}>
      
      {/* Container with dynamic gap */}
      <View style={[styles.tabs, { gap: dynamicGap }]}>
        
        {/* Render Date Buttons */}
        {eventDays.map((day) => {
          const isSelected = selectedDay === day.id;
          const isTodayDate = isToday(day.date);
          const [dayNum, weekDay] = day.label.split(' - '); 

          return (
            <View key={day.id} style={[styles.dayWrapper, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
              {/* Background Layer */}
              <View style={styles.svgBackground}>
                {isSelected ? (
                  <Sun width={ITEM_SIZE * SUN_SCALE} height={ITEM_SIZE * SUN_SCALE} />
                ) : (
                  <Moon width={ITEM_SIZE} height={ITEM_SIZE} />
                )}
              </View>

              {/* Foreground Layer */}
              <TouchableOpacity
                style={styles.dayButtonOverlay}
                onPress={() => handleDayPress(day.id)}
                activeOpacity={0.7}
              >
                {isTodayDate ? (
                   <Text style={[styles.textBase, styles.textBlack]}>Today</Text>
                ) : (
                  <View style={styles.dateStack}>
                    <Text style={[styles.dateText, styles.textBlack]}>{dayNum}</Text>
                    <Text style={[styles.dayText, styles.textBlack]}>{weekDay}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Render "Saved" Button (Conditional) */}
        {showSavedButton && (
          <View style={[styles.dayWrapper, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
            <View style={styles.svgBackground}>
               <PinkMoon width={ITEM_SIZE} height={ITEM_SIZE} />
            </View>

            <TouchableOpacity
              style={[
                styles.dayButtonOverlay,
                selectedSave && { 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                  borderRadius: ITEM_SIZE / 2 
                }
              ]}
              onPress={handleSavePress} 
              activeOpacity={0.7}
            >
              <Text style={[styles.textBase, styles.textBlack]}>Saved</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
      
      {/* <Text style={styles.sectionTitle}>{sectionTitle}</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centers the group if gap calculation is slightly off
    width: '100%',
  },
  dayWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dayButtonOverlay: {
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2, 
  },
  
  // -- Text Styles --
  dateStack: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textBase: {
    fontSize: FONT_MAIN_LABEL,
    fontWeight: '800',
    textAlign: 'center',
  },
  dateText: {
    fontSize: FONT_DATE_NUM,
    fontWeight: '800',
    lineHeight: FONT_DATE_NUM + 4, 
    textAlign: 'center',
  },
  dayText: {
    fontSize: FONT_DAY_LABEL,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: -2, 
    textAlign: 'center',
  },
  textBlack: {
    color: '#000000', 
  },

  sectionTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'TsukimiRounded_700Bold',
    marginBottom: 10,
    marginTop: 15,
    letterSpacing: 0.2,
    alignSelf: 'center',
  },
});