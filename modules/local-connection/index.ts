// Reexport the native module. On web, it will be resolved to LocalConnectionModule.web.ts
// and on native platforms to LocalConnectionModule.ts
export { default } from './src/LocalConnectionModule';
export { default as LocalConnectionView } from './src/LocalConnectionView';
export * from  './src/LocalConnection.types';
