import {
  paths,
  webhooks,
  components,
  $defs,
  operations,
} from "./generated-types";
// to generate types, run
// npx openapi-typescript https://adonix.hackillinois.org/docs/json -o types/generated-types.ts

export type AdmissionDecision = components["schemas"]["AdmissionDecision"];
export type Event = components["schemas"]["Event"];
export type ShopItem = components["schemas"]["ShopItem"];
export type Shifts = components["schemas"]["Shifts"];
// ... add types as needed


export type MentorOfficeHourDto = {
  mentorName: string;
  location: string;
  startTime: number; // ms
  endTime: number;   // ms
  mentorId: string;
};

export type MentorProfileDto = {
  mentorId: string;
  name: string;
  description: string;
};

export interface UserProfile {
  userId: string;
  displayName: string;
  discordTag: string;
  avatarUrl: string | null;
  avatarId?: string | null;
  points: number;
  pointsAccumulated: number;
  foodWave: number;
  track?: string;
  team?: string;
  teamBadge?: string;
  tier?: number;
}

export interface AdmissionRsvpResponse {
  userId: string;
  status: string;
  admittedPro: boolean;
  response: string;
  emailSent: boolean;
  reimbursementValue: number;
}

export type VersionCheckResult = {
  updateRequired: boolean;
};

export type RequiredVersionResponse = {
  version?: string;
  requiredVersion?: string;
};
