// Global module declarations to silence missing type errors for third‑party packages
declare module '*';

// Specific third‑party module declarations to silence type errors
declare module 'mongoose' {
  export const Schema: any;
  export type Schema = any; // allow usage as a type
  export const model: any;
  export const Types: any;
  export const connection: any;
  export const models: any;
  export function connect(...args: any[]): any;
  export function disconnect(...args: any[]): any;
  export type Document = any;
  export type Model<T> = any;
  export type CallbackWithoutResultAndOptionalError = any;
  const mongoose: any;
  export default mongoose;
}

declare module '@xenova/transformers' {
  export const env: any;
  export const pipeline: any;
  export type Pipeline = any;
  export type FeatureExtractionPipeline = any;
}

declare module 'i18next' {
  const i18next: any;
  export default i18next;
}

declare module 'i18next-fs-backend' {
  const backend: any;
  export default backend;
}

declare module 'axios' {
  const axios: any;
  export default axios;
}
