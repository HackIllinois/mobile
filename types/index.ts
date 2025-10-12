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
// ... add types as needed
