#!/usr/bin/env node

import 'dotenv/config';
import { readFileSync } from 'fs';
import { Command } from 'commander';
import { parseNameList } from './nameParser.js';
import { lookupProfiles, getCreditBalance } from './linkedinLookup.js';
import { parseEventFromFileName } from './eventParser.js';

const program = new Command();

program
  .name('meetup-networker')
  .description('Look up LinkedIn profiles for a list of names')
  .version('1.0.0')
  .argument('<file>', 'Path to file containing list of names (one per line)')
  .action(async (filePath: string) => {
    try {
      // Parse event info from filename
      const eventInfo = parseEventFromFileName(filePath);
      console.log(`Event: ${eventInfo.eventName}`);
      console.log(`Reading names from: ${filePath}\n`);

      // Read file
      const content = readFileSync(filePath, 'utf-8');

      // Parse names
      const parsedNames = parseNameList(content);
      console.log(`Found ${parsedNames.length} names\n`);

      // Check credit balance before processing
      console.log('Checking credit balance...');
      const balanceBefore = await getCreditBalance();
      if (balanceBefore !== null && balanceBefore !== undefined) {
        console.log(`Credit balance before: ${balanceBefore} credits\n`);
      } else {
        console.log('Unable to fetch credit balance\n');
      }

      // Lookup profiles
      console.log('Looking up LinkedIn profiles...\n');
      const profiles = await lookupProfiles(parsedNames);

      // Check credit balance after processing
      console.log('\nChecking credit balance...');
      const balanceAfter = await getCreditBalance();
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

      // Display results
      console.log(`=== ${eventInfo.eventName} - Results ===\n`);
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name}`);
        if (profile.error) {
          console.log(`   Error: ${profile.error}`);
        } else {
          console.log(`   Job Title: ${profile.jobTitle || 'N/A'}`);
          console.log(`   Location: ${profile.location || 'N/A'}`);
        }
        console.log('');
      });

      console.log(`Successfully processed ${profiles.length} profiles`);
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
