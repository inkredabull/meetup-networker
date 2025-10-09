import { execSync } from 'child_process';
import { LinkedInProfile } from './profileLookup.js';

/**
 * Generate JavaScript code to automate LinkedIn connection flow
 */
function generateLinkedInScript(firstName: string, domain: string, message: string): string {
  // Escape the message for JavaScript string
  const escapedMessage = message
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

  // Build the script without template literals to avoid escaping issues
  const script = [
    '(function() {',
    '  function isVisible(elem) {',
    '    if (!elem) return false;',
    '    var style = window.getComputedStyle(elem);',
    '    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && elem.offsetParent !== null;',
    '  }',
    '  function clickAddNoteAndFillMessage() {',
    '    setTimeout(function() {',
    '      var buttons = Array.from(document.querySelectorAll("button"));',
    '      var addNoteBtn = buttons.find(function(b) {',
    '        return b.innerText && b.innerText.toLowerCase().includes("add a note");',
    '      });',
    '      if (addNoteBtn) {',
    '        addNoteBtn.click();',
    '        console.log("Clicked Add a note button");',
    '        setTimeout(function() {',
    '          var textarea = document.querySelector("textarea[name=\\"message\\"]");',
    '          if (textarea) {',
    `            textarea.value = "${escapedMessage}";`,
    '            textarea.dispatchEvent(new Event("input", { bubbles: true }));',
    '            textarea.dispatchEvent(new Event("change", { bubbles: true }));',
    '            console.log("Filled in message");',
    '          } else {',
    '            console.log("Message textarea not found");',
    '          }',
    '        }, 1000);',
    '      } else {',
    '        console.log("Add a note button not found");',
    '      }',
    '    }, 1500);',
    '  }',
    '  var allButtons = Array.from(document.querySelectorAll("button"));',
    '  var messageBtn = allButtons.find(function(b) {',
    '    var ariaLabel = b.getAttribute("aria-label");',
    '    return ariaLabel && ariaLabel.toLowerCase().startsWith("message ") && isVisible(b);',
    '  });',
    '  if (messageBtn) {',
    '    console.log("Message button visible, using More button flow");',
    '    var moreBtn = allButtons.find(function(b) {',
    '      var text = b.innerText && b.innerText.toLowerCase().trim();',
    '      var ariaLabel = b.getAttribute("aria-label");',
    '      return (text === "more" || (ariaLabel && ariaLabel.toLowerCase().includes("more"))) && isVisible(b);',
    '    });',
    '    if (moreBtn) {',
    '      moreBtn.click();',
    '      console.log("Clicked More button");',
    '      setTimeout(function() {',
    '        var allElems = Array.from(document.querySelectorAll("button, div[role=\\"button\\"]"));',
    '        var connectOption = allElems.find(function(b) {',
    '          var ariaLabel = b.getAttribute("aria-label");',
    '          return ariaLabel && ariaLabel.toLowerCase().startsWith("invite ");',
    '        });',
    '        if (connectOption) {',
    '          connectOption.click();',
    '          console.log("Clicked Connect from dropdown");',
    '          clickAddNoteAndFillMessage();',
    '        } else {',
    '          console.log("Connect option not found in dropdown");',
    '        }',
    '      }, 800);',
    '    } else {',
    '      console.log("More button not found");',
    '    }',
    '  } else {',
    '    console.log("No Message button, looking for direct Connect");',
    '    var connectBtn = document.querySelector("button[aria-label^=\\"Invite\\"]");',
    '    if (connectBtn && isVisible(connectBtn)) {',
    '      connectBtn.click();',
    '      console.log("Clicked direct Connect button");',
    '      clickAddNoteAndFillMessage();',
    '    } else {',
    '      console.log("No visible Connect button found");',
    '    }',
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

  // Get message template from env and replace placeholders
  const messageTemplate = process.env.LINKEDIN_MESSAGE_TEMPLATE ||
    'Hi {{firstName}}, looking forward to connecting!';

  const message = messageTemplate
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{domain\}\}/g, domain);

  const script = generateLinkedInScript(firstName, domain, message);

  console.log(`    Debug - Script length: ${script.length} chars`);

  // Wait a bit for the page to fully load before injecting
  await new Promise(resolve => setTimeout(resolve, 2000));

  injectJavaScriptIntoChrome(tabIndex, script);

  console.log(`    ✓ JavaScript injected into tab ${tabIndex}`);
}
