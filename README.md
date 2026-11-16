# UTM Builder

A simple, static web app for building and fixing UTM parameters. Paste a URL, auto-detect the channel, and fix issues with one click.

Built with Vue 3, TypeScript, Vite, and Tailwind CSS.

## Features

- **Build or check links**: start from a plain landing page, or paste a tagged link to have it read and checked
- **Channel picker**: every platform is grouped (social, search, owned & partners), with paid / organic / display variants where they exist; picking one fills in `utm_source` and `utm_medium`
- **Auto-detect channel** from an existing link's `utm_source` / `utm_medium`
- **Inline validation**: each parameter shows its own errors and suggestions, with one-click fixes and example values
- **Link anatomy**: the finished link is colour-coded by parameter, matching the field it came from
- **Light and dark themes**, following the system setting

## How It Works

1. **Paste a URL** (or press *Try an example*)
2. **Pick or confirm the channel**
3. **Fill in or fix the parameters**: values are lowercased and spaces become underscores when you leave a field
4. **Copy the link** once the status reads *Ready to use*

## Validation Rules

### Global Rules (All Channels)
- Required parameters: `utm_source`, `utm_medium`, `utm_campaign`
- All values must be lowercase
- Only allowed characters: `a-z`, `0-9`, `_` (underscore)
- No spaces or special characters

### Channel-Specific Rules

| Channel | Type | utm_source | utm_medium |
|---------|------|-----------|------------|
| Google Ads | Paid | `google` | `cpc` |
| Facebook | Paid | `facebook` | `paid_social` |
| Facebook | Organic | `facebook` | `organic_social` |
| Instagram | Paid | `instagram` | `paid_social` |
| Instagram | Organic | `instagram` | `organic_social` |
| Pinterest | Paid | `pinterest` | `paid_social` |
| Pinterest | Organic | `pinterest` | `organic_social` |
| Email | - | `newsletter` | `email` |

## Development

### Prerequisites

- Node.js 18+ 
- npm

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
# Type-check and build
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` folder.

## Deployment

The site is a static Cloudflare Worker (`wrangler.jsonc`) on the custom domain [utm.alfhen.dev](https://utm.alfhen.dev). Log in with `npx wrangler login`, then:

```bash
npm run deploy
```

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS v4** - Utility-first styling

## License

MIT
