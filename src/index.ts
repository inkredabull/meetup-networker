#!/usr/bin/env node

import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { Command } from 'commander';
import { parseNameList } from './nameParser.js';
import { lookupProfiles, getCreditBalance } from './profileLookup.js';
import { parseEventFromFileName } from './eventParser.js';
import { automateLinkedInConnect } from './linkedinAutomation.js';
import { loadAllCachedProfiles } from './cache.js';

const program = new Command();

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);

program
  .name('meetup-networker')
  .description('Look up LinkedIn profiles for a list of names')
  .version('1.0.0')
  .argument('<file>', 'Path to file containing list of names (one per line)')
  .option('--open', 'Open LinkedIn profiles in browser and automate connection', false)
  .action(async (filePath: string, options: { open: boolean }) => {
    try {
      // Parse event info from filename
      const eventInfo = parseEventFromFileName(filePath);
      console.log(`Event: ${eventInfo.eventName}`);
      console.log(`Reading names from: ${filePath}\n`);

      // Read file
      const content = readFileSync(filePath, 'utf-8');
      const allLines = content.split('\n');

      // Parse names
      const parsedNames = parseNameList(content);
      console.log(`Found ${parsedNames.length} names in file\n`);

      let profiles: Awaited<ReturnType<typeof lookupProfiles>> = [];
      let balanceBefore: number | null = null;
      let balanceAfter: number | null = null;
      let remainingNames: typeof parsedNames = [];

      // If file is empty, check for cached target contacts
      if (parsedNames.length === 0) {
        console.log('File is empty. Checking for cached target contacts...\n');
        const cachedProfiles = loadAllCachedProfiles(eventInfo.eventName);
        const targetContacts = cachedProfiles.filter(
          p => p.isTargetContact && !p.error && p.linkedinUrl
        );

        if (targetContacts.length > 0) {
          console.log(`Found ${targetContacts.length} cached target contact(s) for this event\n`);
          profiles = targetContacts;
        } else {
          console.log('No cached target contacts found for this event.\n');
        }
      } else {
        // Take first 10 names for processing
        const namesToProcess = parsedNames.slice(0, BATCH_SIZE);
        remainingNames = parsedNames.slice(BATCH_SIZE);

        console.log(`Processing ${namesToProcess.length} names in this batch`);
        if (remainingNames.length > 0) {
          console.log(`${remainingNames.length} names will remain in file for next batch\n`);
        } else {
          console.log(`This is the final batch\n`);
        }

        // Check credit balance before processing
        console.log('Checking credit balance...');
        balanceBefore = await getCreditBalance();
        if (balanceBefore !== null && balanceBefore !== undefined) {
          console.log(`Credit balance before: ${balanceBefore} credits\n`);
        } else {
          console.log('Unable to fetch credit balance\n');
        }

        // Lookup profiles
        console.log('Looking up LinkedIn profiles...\n');
        profiles = await lookupProfiles(namesToProcess, eventInfo.eventName);
      }

      // Check credit balance after processing (only if we did lookups)
      if (parsedNames.length > 0) {
        console.log('\nChecking credit balance...');
        balanceAfter = await getCreditBalance();
        if (balanceAfter !== null && balanceAfter !== undefined) {
          console.log(`Credit balance after: ${balanceAfter} credits`);
        } else {
          console.log('Unable to fetch credit balance');
        }

        // Calculate cost
        if (balanceBefore !== null && balanceBefore !== undefined &&
            balanceAfter !== null && balanceAfter !== undefined) {
          const cost = balanceBefore - balanceAfter;
          console.log(`\nCost: ${cost} credits used\n`);
        } else {
          console.log('\nCost: Unable to calculate (credit balance unavailable)\n');
        }
      }

      // Display results
      const isUsingCached = parsedNames.length === 0 && profiles.length > 0;
      const resultsHeader = isUsingCached 
        ? `=== ${eventInfo.eventName} - Cached Target Contacts ===`
        : `=== ${eventInfo.eventName} - Results ===`;
      console.log(`${resultsHeader}\n`);

      // Count target contacts
      const targetContacts = profiles.filter(p => p.isTargetContact);

      profiles.forEach((profile, index) => {
        const targetIndicator = profile.isTargetContact ? ' [⭐ TARGET CONTACT]' : '';
        console.log(`${index + 1}. ${profile.name}${targetIndicator}`);
        if (profile.error) {
          console.log(`   Error: ${profile.error}`);
        } else {
          console.log(`   Current Title: ${profile.currentTitle || 'N/A'}`);
          if (profile.currentCompany) {
            console.log(`   Current Company: ${profile.currentCompany}`);
          }
          console.log(`   Location: ${profile.location || 'N/A'}`);
          if (profile.condensedSummary) {
            console.log(`   Summary: ${profile.condensedSummary}`);
          }
          if (profile.linkedinUrl) {
            console.log(`   LinkedIn: ${profile.linkedinUrl}`);
          }
          if (profile.isTargetContact) {
            console.log(`   Status: ✅ FOLLOW UP - Matches target pattern (C-Suite/VC/Partner/Investor)`);
          } else {
            console.log(`   Status: ⏭️  SKIP - Does not match target pattern`);
          }
        }
        console.log('');
      });

      console.log(`Successfully processed ${profiles.length} profiles`);
      console.log(`Target contacts to follow up: ${targetContacts.length}/${profiles.length}`);

      // Open LinkedIn profiles in Chrome for target contacts (only if --open flag is passed)
      if (options.open) {
        const targetContactsWithUrls = targetContacts.filter(p => p.linkedinUrl);
        if (targetContactsWithUrls.length > 0) {
          console.log(`\nOpening ${targetContactsWithUrls.length} LinkedIn profile(s) in Chrome...`);

          // Get the current number of tabs in Chrome before opening new ones
          let startingTabCount = 1;
          try {
            const tabCountScript = `osascript -e 'tell application "Google Chrome" to count tabs of front window'`;
            const result = execSync(tabCountScript, { encoding: 'utf-8' }).trim();
            startingTabCount = parseInt(result, 10);
          } catch (error) {
            console.log('  Note: Could not detect existing tab count, assuming 1');
          }

          // Open each profile in a new tab
          for (let i = 0; i < targetContactsWithUrls.length; i++) {
            const profile = targetContactsWithUrls[i];

            // Open LinkedIn URL in Chrome
            execSync(`open -a "Google Chrome" "${profile.linkedinUrl}"`, { stdio: 'ignore' });
            console.log(`  Opened: ${profile.name}`);

            // Add random delay between 1250ms and 3000ms (except for last one)
            if (i < targetContactsWithUrls.length - 1) {
              const delay = Math.floor(Math.random() * (3000 - 1250 + 1)) + 1250;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          console.log('\nFinished opening LinkedIn profiles.');

          // Wait a bit for all pages to start loading
          console.log('\n🤖 Starting automation in 3 seconds...\n');
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Inject JavaScript into each opened tab
          console.log('Injecting JavaScript into tabs...\n');
          for (let i = 0; i < targetContactsWithUrls.length; i++) {
            const profile = targetContactsWithUrls[i];
            const tabIndex = startingTabCount + i + 1; // +1 because AppleScript tabs are 1-indexed

            await automateLinkedInConnect(profile, tabIndex, eventInfo.eventName);

            // Add delay between injections
            if (i < targetContactsWithUrls.length - 1) {
              const delay = Math.floor(Math.random() * (1500 - 800 + 1)) + 800;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          console.log('\n✅ Automation complete! Review the connection requests and send when ready.');
        }
      }

      // Update file with remaining names (only if we processed names from file)
      if (parsedNames.length > 0) {
        const namesToProcess = parsedNames.slice(0, BATCH_SIZE);
        const remainingNames = parsedNames.slice(BATCH_SIZE);

        if (remainingNames.length > 0) {
          console.log(`\n📝 Updating file with ${remainingNames.length} remaining names...`);
          const remainingContent = remainingNames.map(n => n.original).join('\n') + '\n';
          writeFileSync(filePath, remainingContent, 'utf-8');
          console.log(`✅ File updated. Run again to process next batch.`);
        } else {
          console.log(`\n🎉 All names processed! File is now empty.`);
          writeFileSync(filePath, '', 'utf-8');
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

program.parse();
