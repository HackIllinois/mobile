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
export type Event = components["schemas"]["Event"]
export type ShopItem = components["schemas"]["ShopItem"];
// ... add types as needed
