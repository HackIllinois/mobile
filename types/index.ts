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
export type MentorOfficeHours = components["schemas"]["MentorOfficeHours"];
export type MentorProfile = components["schemas"]["MentorProfile"];
export type AttendeeProfile = components["schemas"]["AttendeeProfile"];
export type VersionResponse = components["schemas"]["VersionResponse"];
// ... add types as needed

// GET /profile/ plus fields the app adds or reads that the API spec does not list:
// track is set in fetchProfile from GET /admission/rsvp/; avatarId is read by ProfileScreen.
export type UserProfile = AttendeeProfile & {
  track?: "PRO" | "GENERAL";
  avatarId?: string | null;
};

export type VersionCheckResult = {
  updateRequired: boolean;
};
