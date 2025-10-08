import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LinkedInProfile } from './profileLookup.js';

const CACHE_DIR = 'logs';

/**
 * Normalize event name for use as a directory name
 */
function normalizeEventName(eventName: string): string {
  return eventName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Ensure the cache directory exists for a given event
 */
function ensureCacheDir(eventName: string): void {
  const eventDir = join(CACHE_DIR, normalizeEventName(eventName));
  if (!existsSync(eventDir)) {
    mkdirSync(eventDir, { recursive: true });
  }
}

/**
 * Generate a cache key (filename) from a person's name
 * Normalizes the name to lowercase and replaces spaces with hyphens
 */
function getCacheKey(firstName: string, lastName: string): string {
  const normalized = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
  return `${normalized}.json`;
}

/**
 * Get cached lookup result for a person
 * Returns null if no cache exists or if the cache is invalid
 */
export function getCachedLookup(
  firstName: string,
  lastName: string,
  eventName: string
): LinkedInProfile | null {
  ensureCacheDir(eventName);

  const eventDir = join(CACHE_DIR, normalizeEventName(eventName));
  const cacheFile = join(eventDir, getCacheKey(firstName, lastName));

  if (!existsSync(cacheFile)) {
    return null;
  }

  try {
    const data = readFileSync(cacheFile, 'utf-8');
    const cached: LinkedInProfile & { cachedAt: string } = JSON.parse(data);

    // Return the profile without the cachedAt metadata
    const { cachedAt, ...profile } = cached;
    return profile;
  } catch (error) {
    // If we can't read or parse the cache, treat it as a cache miss
    console.warn(`  Warning: Could not read cache for ${firstName} ${lastName}`);
    return null;
  }
}

/**
 * Save a lookup result to the cache
 */
export function saveLookupToCache(
  firstName: string,
  lastName: string,
  profile: LinkedInProfile,
  eventName: string
): void {
  ensureCacheDir(eventName);

  const eventDir = join(CACHE_DIR, normalizeEventName(eventName));
  const cacheFile = join(eventDir, getCacheKey(firstName, lastName));

  try {
    const cacheData = {
      ...profile,
      cachedAt: new Date().toISOString()
    };

    writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf-8');
  } catch (error) {
    // Non-fatal: log warning but continue
    console.warn(`  Warning: Could not save cache for ${firstName} ${lastName}`);
  }
}
