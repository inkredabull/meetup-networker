import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
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
 * Searches across all event subdirectories to find any cached profile
 * Returns null if no cache exists or if the cache is invalid
 */
export function getCachedLookup(
  firstName: string,
  lastName: string,
  eventName: string
): LinkedInProfile | null {
  ensureCacheDir(eventName);

  // Check if logs directory exists
  if (!existsSync(CACHE_DIR)) {
    return null;
  }

  const cacheKey = getCacheKey(firstName, lastName);

  try {
    // Read all subdirectories in logs/
    const eventDirs = readdirSync(CACHE_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Search for the profile file across all event directories
    for (const eventDir of eventDirs) {
      const cacheFile = join(CACHE_DIR, eventDir, cacheKey);

      if (existsSync(cacheFile)) {
        try {
          const data = readFileSync(cacheFile, 'utf-8');
          const cached: LinkedInProfile & { cachedAt: string } = JSON.parse(data);

          // Return the profile without the cachedAt metadata
          const { cachedAt, ...profile } = cached;
          return profile;
        } catch (error) {
          // If this specific file is invalid, continue searching other directories
          continue;
        }
      }
    }

    // No cached profile found in any event directory
    return null;
  } catch (error) {
    // If we can't read the logs directory, treat it as a cache miss
    console.warn(`  Warning: Could not search cache for ${firstName} ${lastName}`);
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
