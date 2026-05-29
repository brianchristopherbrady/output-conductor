/// <reference types="vite/client" />

declare module '*.css' {}

interface ImportMetaEnv {
  readonly VITE_OUTPUT_API_URL?: string;
  readonly VITE_OUTPUT_API_KEY?: string;
}
