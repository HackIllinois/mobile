import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { layoutStyles, tabBackgrounds } from "../../lib/layout";
import { useRouter } from "expo-router";

import EventItem from "../../components/home/EventItem";
import EventInfoModal, { EventModalData } from "../../components/home/EventInfoModal";
import { getTimeRemaining } from "../../components/home/countdown";
import { useEvents } from "../../lib/fetchEvents";

const CheckInPng = require("../../assets/home/event_active-png.png");
const ScavengerPng = require("../../assets/home/event_active-png.png");
const OpeningPng = require("../../assets/home/event_active-png.png");
const HackingPng = require("../../assets/home/event_active-png.png");
const ShowcasePng = require("../../assets/home/event_active-png.png");
const ClosingPng = require("../../assets/home/event_active-png.png");


const ROADMAP_WIDTH = 393;
const ROADMAP_HEIGHT = 578;
const ROADMAP_ITEM_WIDTH = 128;

export type StageKey =
  | "checkin"
  | "scavenger"
  | "opening"
  | "showcase"
  | "hacking"
  | "closing";

const STAGE_ORDER: StageKey[] = ["checkin", "scavenger", "opening", "hacking", "showcase", "closing"];
const stageIndex = (s: StageKey) => STAGE_ORDER.indexOf(s);

const ROADMAP_ITEMS: { eventKey: StageKey; x: number; y: number }[] = [
  { eventKey: "closing", x: 145, y: 0 },
  { eventKey: "showcase", x: 35, y: 90 },
  { eventKey: "hacking", x: 225, y: 180 },
  { eventKey: "opening", x: 60, y: 270 },
  { eventKey: "scavenger", x: 225, y: 360 },
  { eventKey: "checkin", x: 145, y: 450 },
];

type HomeEventConfig = {
  title: string;
  description: string;
  location: string;
  format: "In-person" | "Virtual" | "Hybrid";
  tags: string[];
  start: string;
  end: string;
  focusEventId?: string
  focusEventName?: string;
};



const TIMER_PHASES: { label: string; targetDate: Date; activeUntil: Date }[] = [
  { // check in
    label: "Check-in begins in",
    targetDate: new Date("2026-02-27T14:00:00-06:00"),
    activeUntil: new Date("2026-02-27T14:00:00-06:00"), // show until check-in starts
  },
  { // opening ceremony
    label: "Opening Ceremony",
    targetDate: new Date("2026-02-27T17:00:00-06:00"),
    activeUntil: new Date("2026-02-27T17:00:00-06:00"), // show until check-in starts
  },
  { // project showcase
    label: "Project Showcase",
    targetDate: new Date("2026-03-01T09:00:00-06:00"),
    activeUntil: new Date("2026-03-01T09:00:00-06:00"), // show until check-in starts
  },
  {
    label: "Closing ceremony in",
    targetDate: new Date("2026-03-01T14:00:00-06:00"), // closing ceremony end
    activeUntil: new Date("2026-03-01T14:00:00-06:00"), // show until event ends
  },
];

const getActivePhase = (t: Date) => {
  for (let i = 0; i < TIMER_PHASES.length; i++) {
    if (t < TIMER_PHASES[i].activeUntil) return TIMER_PHASES[i];
  }
  return TIMER_PHASES[TIMER_PHASES.length - 1]; // fallback: last phase
};

// uncomment debug now and switch now to use debug now to test different times for different states

// const DEBUG_NOW: Date | null =
//   __DEV__ ? new Date("2026-02-28T19:00:00-06:00") : null;

// const now = () => DEBUG_NOW ?? new Date(); 
// uncomment this ^ to debug
const now = () => new Date();

// Homepage planet UI config + fallback modal content.
// API data overrides time/location when a mapped schedule event is found.
const HOME_EVENT_CONFIG: Record<StageKey, HomeEventConfig> = {
  checkin: {
    title: "Check-In",
    description: "Check in, receive your merch, and get settled.",
    location: "Siebel Center for Computer Science",
    format: "In-person",
    tags: ["Mandatory", "Free Stuff"],
    start: "2026-02-27T14:00:00-06:00",
    end: "2026-02-27T17:00:00-06:00",
    // Prefer filling this with the backend eventId once confirmed.
    focusEventName: "Attendee Check-In",
  },
  scavenger: {
    title: "Scavenger Hunt",
    description: "Explore the venue, meet other attendees, and complete quick challenges to earn points.",
    location: "Siebel Center for Computer Science",
    format: "In-person",
    tags: ["Mini Event", "Team Activity"],
    start: "2026-02-27T14:30:00-06:00",
    end: "2026-02-27T16:30:00-06:00",
    // Prefer filling this with the backend eventId once confirmed.
    focusEventName: "Solar Search",
  },
  opening: {
    title: "Opening Ceremony",
    description: "Kickoff announcements, theme overview, sponsor intros, and important event logistics.",
    location: "Siebel Center for Computer Science (Room 1404)",
    format: "In-person",
    tags: ["Important", "Announcements"],
    start: "2026-02-27T16:30:00-06:00",
    end: "2026-02-27T18:00:00-06:00",
    // Prefer filling this with the backend eventId once confirmed.
    focusEventName: "Opening Ceremony",
  },
  hacking: {
    title: "Hacking",
    description: "Build your project, collaborate with teammates, and bring your ideas to life. Mentors are available throughout the venue.",
    location: "Siebel Center for CS & Siebel Center for Design",
    format: "In-person",
    tags: ["Mentors Available", "Food Provided"],
    start: "2026-02-27T18:00:00-06:00",
    end: "2026-03-01T06:00:00-06:00",
  },
  showcase: {
    title: "Project Showcase",
    description: "Demo your project to judges and attendees, gather feedback, and celebrate what you built.",
    location: "Siebel Center for Computer Science",
    format: "In-person",
    tags: ["Judging", "Demos"],
    start: "2026-03-01T09:00:00-06:00",
    end: "2026-03-01T11:30:00-06:00",
    // Prefer filling this with the backend eventId once confirmed.
    focusEventName: "[ALL ATTENDEES] Project Showcase",
  },
  closing: {
    title: "Closing Ceremony",
    description: "Final results, awards, and wrap-up announcements for the weekend.",
    location: "Siebel Center for Computer Science (Room 1404)",
    format: "In-person",
    tags: ["Awards", "Announcements"],
    start: "2026-03-01T14:00:00-06:00",
    end: "2026-03-01T15:00:00-06:00",
    // Prefer filling this with the backend eventId once confirmed.
    focusEventName: "Closing Ceremonies",
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const { events: apiEvents } = useEvents();
  
  const [timerTick, setTimerTick] = useState(0);
  const activePhase = useMemo(() => getActivePhase(now()), [timerTick]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(activePhase.targetDate));
  const [selectedEvent, setSelectedEvent] = useState<EventModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const SCHEDULE = useMemo(() => {
    return STAGE_ORDER.reduce((acc, key) => {
      acc[key] = {
        start: new Date(HOME_EVENT_CONFIG[key].start),
        end: new Date(HOME_EVENT_CONFIG[key].end),
      };
      return acc;
    }, {} as Record<StageKey, { start: Date; end: Date }>);
  }, []);

  const computeStage = (t: Date): StageKey => {
    let best: StageKey = "checkin";
    for (const key of STAGE_ORDER) {
      if (t >= SCHEDULE[key].start) best = key;
    }
    if (t > SCHEDULE.closing.end) return "closing";
    return best;
  };

  // const [currentStage, setCurrentStage] = useState<StageKey>(() => computeStage(new Date()));
  const [currentStage, setCurrentStage] = useState<StageKey>(() => computeStage(now()));

  // useEffect(() => {
  //   const id = setInterval(() => setCurrentStage(computeStage(new Date())), 1000);
  //   return () => clearInterval(id);
  // }, [SCHEDULE]);

  useEffect(() => {
    const id = setInterval(() => setCurrentStage(computeStage(now())), 1000);
    return () => clearInterval(id);
  }, [SCHEDULE]);

  const currentIdx = stageIndex(currentStage);

  const getVariantFor = (eventKey: StageKey): "normal" | "finished" => {
    const idx = stageIndex(eventKey);
    if (idx < currentIdx) return "finished";
    if (currentStage === "closing" && eventKey === "closing") return "finished";
    return "normal";
  };


  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick(t => t + 1);
      setTimeLeft(getTimeRemaining(getActivePhase(now()).targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, "0");

  const eventModalMap = useMemo(() => {
    const planetImage = {
      checkin: CheckInPng,
      scavenger: ScavengerPng,
      opening: OpeningPng,
      hacking: HackingPng,
      showcase: ShowcasePng,
      closing: ClosingPng,
    } as const;

    const apiEventByName = new Map(
      apiEvents.map((ev) => [ev.name?.trim().toLowerCase(), ev] as const)
    );
    const apiEventById = new Map(apiEvents.map((ev) => [ev.eventId, ev] as const));

    const t = now();
    return STAGE_ORDER.reduce((acc, key) => {
      const cfg = HOME_EVENT_CONFIG[key];
      // API-first: hydrate modal time/location from live schedule data when possible.
      // Fallback to local config so the homepage still works if API names/ids drift or data is unavailable.
      const matchedApiEvent =
        (cfg.focusEventId ? apiEventById.get(cfg.focusEventId) : undefined) ??
        (cfg.focusEventName ? apiEventByName.get(cfg.focusEventName.trim().toLowerCase()) : undefined);

      const startTime = matchedApiEvent?.startTime
        ? new Date(matchedApiEvent.startTime * 1000)
        : SCHEDULE[key].start;
      const endTime = matchedApiEvent?.endTime
        ? new Date(matchedApiEvent.endTime * 1000)
        : SCHEDULE[key].end;
      const locationFromApi =
        matchedApiEvent?.locations?.[0]?.description?.trim() || undefined;

      const status: EventModalData["status"] =
        t > endTime ? "ended" : t >= startTime ? (t >= new Date(endTime.getTime() - 30 * 60 * 1000) ? "closing" : "live") : "upcoming";

      acc[key] = {
        id: key,
        focusEventId: matchedApiEvent?.eventId,
        focusEventName: cfg.focusEventName,
        title: cfg.title,
        description: cfg.description || "Details coming soon",
        startTime,
        endTime,
        location: locationFromApi ?? cfg.location,
        format: cfg.format,
        status,
        tags: [...cfg.tags],
        image: planetImage[key],
      };
      return acc;
    }, {} as Record<StageKey, EventModalData>);
  }, [SCHEDULE, currentStage, apiEvents]);

  const handleEventPress = (key: StageKey) => {
    setSelectedEvent(eventModalMap[key] ?? null);
    setModalVisible(true);
  };

  const pushScheduleFocus = (params: { focusEvent?: string; focusEventId?: string }) => {
    router.push({
      pathname: "/Event",
      params: {
        ...(params.focusEvent ? { focusEvent: params.focusEvent } : {}),
        ...(params.focusEventId ? { focusEventId: params.focusEventId } : {}),
        // Unique request id ensures repeated "View Details" taps re-trigger focus in the Schedule screen.
        focusRequestId: String(Date.now()),
      },
    });
  };

  const getScheduleFocusTarget = (event: EventModalData | null) =>
    event ? { focusEventId: event.focusEventId, focusEvent: event.focusEventName } : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[layoutStyles.column, styles.scrollContent]}>
        <View style={styles.timer}>
          <Text style={styles.timerLabel}>{activePhase.label}</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>
              {formatTime(timeLeft.days)}:{formatTime(timeLeft.hours)}:
              {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
            </Text>
          </View>
        </View>

        <View style={styles.roadmap}>
          {ROADMAP_ITEMS.map(({ eventKey, x, y }) => (
            <EventItem
              key={eventKey}
              eventKey={eventKey}
              left={`${(x / ROADMAP_WIDTH) * 100}%`}
              top={`${(y / ROADMAP_HEIGHT) * 100}%`}
              width={`${(ROADMAP_ITEM_WIDTH / ROADMAP_WIDTH) * 100}%`}
              variant={getVariantFor(eventKey)}
              onPress={handleEventPress}
            />
          ))}
        </View>
      </ScrollView>

      <EventInfoModal
        visible={modalVisible}
        event={selectedEvent}
        onViewDetails={
          selectedEvent?.id &&
          (getScheduleFocusTarget(selectedEvent)?.focusEvent ||
            getScheduleFocusTarget(selectedEvent)?.focusEventId)
            ? () => {
                const target = getScheduleFocusTarget(selectedEvent);
                setModalVisible(false);
                setSelectedEvent(null);
                if (!target) return;
                pushScheduleFocus(target);
              }
            : undefined
        }
        onClose={() => {
          setModalVisible(false);
          setSelectedEvent(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tabBackgrounds.Home },
  scrollContent: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  roadmap: {
    width: "100%",
    maxWidth: ROADMAP_WIDTH,
    aspectRatio: ROADMAP_WIDTH / ROADMAP_HEIGHT,
  },
  timer: {
    alignItems: "center",
    marginBottom: 12,
  },
  timerLabel: {
    color: "#000000ff",
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  timerText: { color: "#050000ff", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  timerBox: {
    backgroundColor: "#8e8e8eff",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
});
