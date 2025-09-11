# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Primary Development
- `npm run dev` - Start development server with Turbopack bundler (runs on http://localhost:3000)
- `npm run build` - Build the production application with Turbopack
- `npm start` - Start the production server (requires build first)
- `npm run lint` - Run ESLint for code quality checks

### Alternative Package Managers
The project supports multiple package managers as documented in README.md:
- `yarn dev` / `pnpm dev` / `bun dev` - Alternative development server commands
- Use the same pattern for other npm scripts (`build`, `start`, `lint`)

### Common Development Tasks
- Edit main page: Modify `app/page.tsx` for homepage changes
- Add new pages: Create new files/folders in the `app/` directory following App Router conventions
- Add utility functions: Place in `lib/utils.ts` or create new files in `lib/`
- Styling: Edit `app/globals.css` for global styles or use Tailwind classes

## Architecture & Structure

### Technology Stack
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5 with React 19.1.0
- **Styling**: Tailwind CSS 4 with custom theming using OKLCH color space
- **UI Components**: shadcn/ui setup with "new-york" style variant
- **Bundler**: Turbopack (--turbopack flag used in dev/build scripts)
- **Icons**: Lucide React
- **Fonts**: Geist and Geist Mono via next/font/google

### Project Structure
```
app/                    # App Router directory (Next.js 13+ app directory)
├── layout.tsx         # Root layout with fonts and metadata
├── page.tsx           # Homepage component
└── globals.css        # Global Tailwind styles with custom theme

lib/
└── utils.ts           # Utility functions (cn for class merging)

components.json        # shadcn/ui configuration
```

### Key Configuration
- **Path Mapping**: `@/*` maps to root directory for clean imports
- **shadcn/ui**: Configured for RSC (React Server Components), aliases set up for components/utils
- **ESLint**: Modern flat config with Next.js core-web-vitals and TypeScript rules
- **Tailwind**: Uses CSS variables with OKLCH color space, includes dark mode support
- **TypeScript**: ES2017 target with strict mode enabled

### Styling System
- Uses CSS custom properties with OKLCH color format for better color manipulation
- Dark mode implemented via `.dark` class
- Custom radius variables for consistent border-radius
- Extensive color palette including chart colors and sidebar theming
- Font variables integrated into Tailwind theme

### Development Notes
- The application uses Turbopack for faster builds and development
- All components should be built with React Server Components in mind
- Import paths use `@/` prefix for cleaner relative imports
- Utility-first approach with Tailwind CSS and shadcn/ui components
