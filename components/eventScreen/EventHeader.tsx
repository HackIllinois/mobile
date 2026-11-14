import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const dayImage = require("../../assets/event/day.png");
const selectedDayImage = require("../../assets/event/selectedDay.png");
const savedEventsImage = require("../../assets/event/savedEventsFilter.png");

const ITEM_SIZE = 64;
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

  const showSavedButton = scheduleMode === 'events';
  
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
    <View style={styles.tabs}>
      {/* Render Date Buttons */}
      {eventDays.map((day) => {
        const isSelected = selectedDay === day.id;
        const isTodayDate = isToday(day.date);
        const [dayNum, weekDay] = day.label.split(' - ');

        return (
          <View key={day.id} style={styles.dayWrapper}>
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
        <View style={styles.dayWrapper}>
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
  );
};

const styles = StyleSheet.create({
  tabs: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: 8,
  },
  dayWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
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
