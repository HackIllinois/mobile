import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import { getConstrainedWidth } from "../../lib/layout";

const SCREEN_WIDTH = getConstrainedWidth();
const dayImage = require("../../assets/event/day.png");
const selectedDayImage = require("../../assets/event/selectedDay.png");
const savedEventsImage = require("../../assets/event/savedEventsFilter.png");

// --- SIZING CONSTANTS ---
const MAX_ITEM_SIZE = 130;
const ITEM_SIZE = Math.min(SCREEN_WIDTH * 0.18, MAX_ITEM_SIZE); // Width of the day tabs


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
  scheduleMode?: 'events' | 'mentorship' | 'shifts';
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
  const gap = Math.max(0, (SCREEN_WIDTH - ITEM_SIZE * itemCount - 40) / Math.max(1, itemCount - 1));
  
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
      <View style={[styles.tabs, { gap }]}>
        {/* Render Date Buttons */}
        {eventDays.map((day) => {
          const isSelected = selectedDay === day.id;
          const isTodayDate = isToday(day.date);
          const [dayNum, weekDay] = day.label.split(' - '); 

          return (
            <View key={day.id} style={[styles.dayWrapper, { width: ITEM_SIZE, height: ITEM_SIZE }]}>
              {/* Background Layer */}
              <View style={styles.dayBackground}>
                <Image 
                  source={isSelected? selectedDayImage : dayImage}
                  style={{
                      width: ITEM_SIZE,
                      height: ITEM_SIZE,
                      resizeMode: "contain"
                    }}
                  />
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
            <View style={styles.dayBackground}>
               <Image
                  source={savedEventsImage}
                  style={{
                    height: ITEM_SIZE,
                    width: ITEM_SIZE,
                    resizeMode: "contain"
                  }}
                  />
            </View>

            <TouchableOpacity
              style={[
                styles.dayButtonOverlay,
                selectedSave && { 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)', 
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
  dayBackground: {
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
});