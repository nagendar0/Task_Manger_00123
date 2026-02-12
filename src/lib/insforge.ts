import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL?.trim();
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY?.trim();

export const isInsforgeConfigured = Boolean(baseUrl && anonKey);

if (!isInsforgeConfigured) {
  console.warn(
    'InsForge credentials not found. Please set VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY in your .env file.'
  );
}

export const insforge = isInsforgeConfigured
  ? createClient({
      baseUrl: baseUrl as string,
      anonKey: anonKey as string,
    })
  : null;

