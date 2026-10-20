import { Image, Pressable } from "react-native";

const CheckInPng = require("../../assets/home/event_active-png.png");
const ScavengerPng = require("../../assets/home/event_active-png.png");
const OpeningPng = require("../../assets/home/event_active-png.png");
const HackingPng = require("../../assets/home/event_active-png.png");
const ShowcasePng = require("../../assets/home/event_active-png.png");
const ClosingPng = require("../../assets/home/event_active-png.png");

const CheckInFinishedPng = require("../../assets/home/event_finished-png.png");
const ScavengerFinishedPng = require("../../assets/home/event_finished-png.png");
const OpeningFinishedPng = require("../../assets/home/event_finished-png.png");
const HackingFinishedPng = require("../../assets/home/event_finished-png.png");
const ShowcaseFinishedPng = require("../../assets/home/event_finished-png.png");
const ClosingFinishedPng = require("../../assets/home/event_finished-png.png");

interface EventItemProps {
  x: number,
  y: number,
  size?: number;
  eventKey?: "checkin" | "scavenger" | "opening" | "showcase" | "hacking" | "closing";
  dimmed?: boolean;
  variant?: "normal" | "finished";
  onPress?: (eventKey: NonNullable<EventItemProps["eventKey"]>) => void;
}

export default function EventItem({
  x,
  y,
  size = 60,
  eventKey = "closing",
  variant = "normal",
  onPress,
}: EventItemProps) {


  const containerSize = size * 1.6;

  const eventSrc =
    variant === "finished"
      ? eventKey === "checkin"
        ? CheckInFinishedPng
        : eventKey === "scavenger"
        ? ScavengerFinishedPng
        : eventKey === "opening"
        ? OpeningFinishedPng
        : eventKey === "showcase"
        ? ShowcaseFinishedPng
        : eventKey === "hacking"
        ? HackingFinishedPng
        : ClosingFinishedPng
      : eventKey === "checkin"
      ? CheckInPng
      : eventKey === "scavenger"
      ? ScavengerPng
      : eventKey === "opening"
      ? OpeningPng
      : eventKey === "showcase"
      ? ShowcasePng
      : eventKey === "hacking"
      ? HackingPng
      : ClosingPng;
  const handlePress = () => {
    onPress?.(eventKey);
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={22}
      style={{ position: "absolute", width: containerSize, height: containerSize, left:x, top:y}}
    >
        <Image
          source={eventSrc}
          style={{
            width: containerSize,
            height: containerSize,
            opacity: 1,
          }}
          resizeMode="contain"
        />
    </Pressable>
  );
}
