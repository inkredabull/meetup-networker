import { basename } from 'path';

export interface EventInfo {
  eventName: string;
  fileName: string;
}

/**
 * Parse event name from file name
 * Expected format: "Event Name on MM-DD-YY.txt" or "Event Name on MM/DD/YY.txt"
 *
 * Examples:
 * - "Tech Networking Mixer on 3-15-25.txt" -> "Tech Networking Mixer on 3-15-25"
 * - "Tech Meetup on 3/15/25.txt" -> "Tech Meetup on 3/15/25"
 * - "names.txt" -> "names" (fallback)
 */
export function parseEventFromFileName(filePath: string): EventInfo {
  const fileName = basename(filePath);

  // Remove .txt extension if present
  const nameWithoutExt = fileName.replace(/\.txt$/i, '');

  return {
    eventName: nameWithoutExt,
    fileName
  };
}
