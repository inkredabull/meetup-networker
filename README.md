# Meetup Networker

A TypeScript CLI tool that parses a list of names and looks up LinkedIn profiles using the EnrichLayer API.

## Features

- Parses name lists (one name per line)
- Identifies entries with both first and last names
- Skips entries with only a single name
- Looks up current job titles and locations via EnrichLayer
- Filters by region (California)
- Automatically detects event name from filename
- **Target contact filtering** - Identifies VCs, CEOs, Partners, and Investors for follow-up
- **Local caching** - Saves lookups to avoid burning credits on repeated queries
- **Credit tracking** - Shows before/after credit balance and cost

## Installation

```bash
npm install
```

## Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your EnrichLayer API token from [https://enrichlayer.com](https://enrichlayer.com)

3. Add your token to the `.env` file:
   ```
   ENRICHLAYER_API_TOKEN=your_token_here
   ```

## Usage

```bash
# Run with tsx (development)
npm start "examples/Tech Networking Mixer on 3-15-25.txt"

# Or use tsx directly
npx tsx src/index.ts "examples/Tech Networking Mixer on 3-15-25.txt"

# After building
npm run build
node dist/index.js "examples/Tech Networking Mixer on 3-15-25.txt"
```

## Input Format

Create a text file with one name per line. The filename can include an event name and date:

```
Alice Johnson
Bob Smith
charlie
Diana Martinez
```

The tool will:
- Process "Alice Johnson", "Bob Smith", and "Diana Martinez" (have first + last name)
- Skip "charlie" (only has one name)
- Look up their current job titles and locations using EnrichLayer

## How It Works

1. **Cache Check**: First checks the `logs/` directory for cached results
2. **Search**: If not cached, searches EnrichLayer for people by first name, last name, and region (California)
3. **Profile Fetch**: Retrieves detailed LinkedIn profile information
4. **Current Role**: Identifies the most recent job (where `ends_at` is null)
5. **Target Match**: Tests job title against pattern to identify follow-up priority contacts
6. **Cache Save**: Saves successful lookups to `logs/` for future use
7. **Display**: Shows name, current job title, location, and follow-up status

## Target Contact Filtering

The tool automatically identifies high-priority contacts based on their job titles. Contacts matching the following patterns are marked as **TARGET CONTACTS** for follow-up:

- **Partner** - VCs, law firms, consulting partners
- **Capital** - Anyone with "Capital" in their title (VCs, investment firms)
- **VC** - Venture Capitalists
- **C-Suite Executives** - CEO, CTO, CFO, COO, CMO, CIO, CPO, and any "Chief X Officer" title
- **Investor** - Angel investors, institutional investors

### Output Indicators

- ⭐ **[TARGET CONTACT]** - Appears next to the name
- ✅ **FOLLOW UP** - Clear action indicator with matching pattern
- ⏭️ **SKIP** - Non-target contacts
- **Summary** - Shows count: "Target contacts to follow up: 5/25"

### Example Output

```
1. John Doe [⭐ TARGET CONTACT]
   Current Title: Managing Partner
   Current Company: XYZ Capital
   Location: San Francisco, CA
   LinkedIn: https://www.linkedin.com/in/johndoe
   Status: ✅ FOLLOW UP - Matches target pattern (C-Suite/VC/Partner/Investor)

2. Jane Smith
   Current Title: Software Engineer
   Current Company: Tech Corp
   Location: San Jose, CA
   LinkedIn: https://www.linkedin.com/in/janesmith
   Status: ⏭️  SKIP - Does not match target pattern
```

## Caching

The tool automatically caches all successful lookups in the `logs/` directory to avoid burning API credits on repeated queries.

### How Caching Works

- **Cache Location**: `logs/firstname-lastname.json`
- **Automatic**: Caching happens automatically - no configuration needed
- **Cache Hit**: When a cached entry is found, you'll see `[CACHED]` in the output
- **Credit Savings**: Cached lookups don't consume API credits

### Managing the Cache

```bash
# View cached entries
ls logs/

# Clear all cached entries
rm -rf logs/

# Remove a specific cached entry
rm logs/alice-johnson.json
```

The cache persists across runs, so running the same name list multiple times will only consume credits on the first run.

## Environment Variables

Environment variables in `.env`:

```
# Required: EnrichLayer API Bearer Token
ENRICHLAYER_API_TOKEN=your_token_here

# Optional: Geographic region to filter searches (default: California)
SEARCH_REGION=California

# Optional: Target contact pattern (regex) to identify high-priority follow-ups
# Default matches: C-Suite (CEO, CTO, etc.), VCs, Partners, Investors, Engineering Leadership
TARGET_CONTACT_PATTERN=Partner|Capital|VC|Investor|C[TEOFMPI]O|Chief\s+\w+\s+Officer|VP|VPE|Director|DIR\s+ENG
```

### Customizing Target Contact Pattern

You can customize which job titles are flagged as target contacts by modifying the `TARGET_CONTACT_PATTERN` in your `.env` file. The pattern is a regular expression (case-insensitive) that tests both the job title and company name.

**Examples:**
- To only match VCs: `VC|Venture Capital`
- To match executives and directors: `C[TEOFMPI]O|Director|VP`
- To match specific roles: `Engineer|Product Manager|Designer`

The default pattern includes:
- **Partner** - VCs, law firms, consulting partners
- **Capital** - Investment firms
- **VC** - Venture Capitalists
- **Investor** - Angel investors, institutional investors
- **C[TEOFMPI]O** - CEO, CTO, CFO, COO, CMO, CIO, CPO
- **Chief\s+\w+\s+Officer** - Any "Chief X Officer" title
- **VP|VPE** - Vice Presidents, VP of Engineering
- **Director|DIR\s+ENG** - Directors, Director of Engineering

## Project Structure

```
src/
├── index.ts           # CLI entry point
├── nameParser.ts      # Name parsing logic
├── eventParser.ts     # Event name extraction from filename
├── linkedinLookup.ts  # EnrichLayer API integration
└── cache.ts           # Local caching for lookup results
logs/                  # Cached lookup results (auto-created)
examples/
└── Tech Networking Mixer on 3-15-25.txt  # Example input file
```

## Development

```bash
# Watch mode
npm run dev "examples/Tech Networking Mixer on 3-15-25.txt"

# Build
npm run build

# Run tests
npm test

# Test watch mode
npm run test:watch

# Type check
npx tsc --noEmit
```

## Testing

The project includes unit tests for core functionality:

```bash
npm test
```

Tests cover:
- Name parsing logic
- Event name extraction
- Edge cases and error handling

## License

MIT
