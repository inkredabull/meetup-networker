import { basename } from 'path';

export interface EventInfo {
  eventName: string;
  fileName: string;
}

/**
 * Parse event name from file name
 * Expected format: "Event Name on MM-DD-YY.txt" or "Event Name on MM/DD/YY.txt" or "Event Name on MM_DD_YY.csv"
 *
 * Examples:
 * - "Tech Networking Mixer on 3-15-25.txt" -> "Tech Networking Mixer on 3-15-25"
 * - "Tech Meetup on 3/15/25.txt" -> "Tech Meetup on 3/15/25"
 * - "SF Codex Meetup on 1_13_26.csv" -> "SF Codex Meetup on 1/13/26"
 * - "names.txt" -> "names" (fallback)
 */
export function parseEventFromFileName(filePath: string): EventInfo {
  const fileName = basename(filePath);

  // Remove .txt or .csv extension if present
  let nameWithoutExt = fileName.replace(/\.(txt|csv)$/i, '');

  // Convert underscores to slashes in date portion (e.g., "1_13_26" -> "1/13/26")
  // Pattern: matches "on " followed by numbers separated by underscores
  nameWithoutExt = nameWithoutExt.replace(/on\s+(\d+)_(\d+)_(\d+)/, 'on $1/$2/$3');

  return {
    eventName: nameWithoutExt,
    fileName
  };
}
