export interface ParsedName {
  original: string;
  firstName?: string;
  lastName?: string;
  isValid: boolean;
}

/**
 * Parse a name string to extract first and last name
 * Only returns valid if both first and last name are present
 */
export function parseName(nameStr: string): ParsedName {
  const trimmed = nameStr.trim();

  if (!trimmed) {
    return { original: nameStr, isValid: false };
  }

  // Split by whitespace
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0);

  // Need at least 2 parts for first and last name
  if (parts.length < 2) {
    return {
      original: nameStr,
      isValid: false
    };
  }

  // Take first part as first name, last part as last name
  // (ignoring middle names/initials)
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  return {
    original: nameStr,
    firstName,
    lastName,
    isValid: true
  };
}

/**
 * Parse a list of names from text content
 */
export function parseNameList(content: string): ParsedName[] {
  const lines = content.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => parseName(line));
}
