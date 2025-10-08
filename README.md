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
- **CEO** - Chief Executive Officers
- **Investor** - Angel investors, institutional investors

### Output Indicators

- ⭐ **[TARGET CONTACT]** - Appears next to the name
- ✅ **FOLLOW UP** - Clear action indicator with matching pattern
- ⏭️ **SKIP** - Non-target contacts
- **Summary** - Shows count: "Target contacts to follow up: 5/25"

### Example Output

```
1. John Doe [⭐ TARGET CONTACT]
   Job Title: Managing Partner at XYZ Capital
   Location: San Francisco, CA
   Status: ✅ FOLLOW UP - Matches target pattern (VC/CEO/Partner/Investor)

2. Jane Smith
   Job Title: Software Engineer at Tech Corp
   Location: San Jose, CA
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

Required environment variables in `.env`:

```
ENRICHLAYER_API_TOKEN=your_token_here
```

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
