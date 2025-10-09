import { execSync } from 'child_process';
import { LinkedInProfile } from './profileLookup.js';

/**
 * Generate JavaScript code to automate LinkedIn connection flow
 */
function generateLinkedInScript(firstName: string, domain: string): string {
  // Build the script without template literals to avoid escaping issues
  const script = [
    '(function() {',
    '  var btn = document.querySelector("button[aria-label^=\\"Invite\\"]");',
    '  if (btn) {',
    '    btn.click();',
    '    console.log("Clicked Connect button");',
    '  } else {',
    '    console.log("Connect button not found");',
    '  }',
    '})();'
  ].join('');

  return script;
}

/**
 * Inject JavaScript into a Chrome tab using AppleScript
 */
function injectJavaScriptIntoChrome(tabIndex: number, javascript: string): void {
  // Clean up the JavaScript - remove extra whitespace and newlines
  const cleanJs = javascript
    .trim()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');

  // Escape for AppleScript - need to escape backslashes and quotes
  const escapedJs = cleanJs
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  const appleScript = `tell application "Google Chrome"
  tell tab ${tabIndex} of front window
    execute javascript "${escapedJs}"
  end tell
end tell`;

  try {
    execSync(`osascript`, {
      input: appleScript,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    console.log(`    ⚠️  Error injecting JavaScript into tab ${tabIndex}`);
    if (error instanceof Error) {
      console.log(`    Error details: ${error.message}`);
    }
  }
}

/**
 * Automate LinkedIn connection for a profile by injecting JavaScript
 */
export async function automateLinkedInConnect(
  profile: LinkedInProfile,
  tabIndex: number
): Promise<void> {
  console.log(`  Automating connection for ${profile.name}...`);

  const firstName = profile.firstName || profile.name.split(' ')[0];
  const domain = profile.domain || 'your industry';

  const script = generateLinkedInScript(firstName, domain);

  console.log(`    Debug - Script length: ${script.length} chars`);

  // Wait a bit for the page to fully load before injecting
  await new Promise(resolve => setTimeout(resolve, 2000));

  injectJavaScriptIntoChrome(tabIndex, script);

  console.log(`    ✓ JavaScript injected into tab ${tabIndex}`);
}
