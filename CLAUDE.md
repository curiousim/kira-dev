# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

All commands are run from the root of the project:

```bash
npm run dev       # Start local dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview production build locally
npm run astro ... # Run Astro CLI commands (e.g., astro check)
```

## Architecture Overview

This is an **Astro 7** static site with a blog, built with TypeScript and MDX support. The site features a custom theme switching system with three color themes (yellow, blue, pink).

### Technology Stack

- **Astro 7.1.1** - Static site generator with islands architecture
- **TypeScript** - Strict mode enabled
- **MDX** - Enhanced markdown with JSX components
- **CSS Custom Properties** - Design token system for theming

### Key Architectural Patterns

**1. Theme System**
The site implements a multi-theme system using CSS custom properties and `data-theme` attributes:

- Three themes defined across `src/styles/tokens/{primitives,semantic,components}.css`: yellow (default), blue, pink
- Theme tokens follow naming pattern: `--theme-btn-{color}-{state}-{property}`
- Theme state persists via localStorage (see `ThemeSwitcher.astro`)
- All color values use the token system, never hardcoded colors

**2. Component Organization**

```
src/components/
├── common/          # Reusable primitives (Block, LinkButton, Badge)
├── BlogRoll/        # Blog listing components
├── InfoCardContent/ # Contextual sidebar content
└── ThemeSwitcher/   # Theme switching UI (YellowButton, BlueButton, PinkButton)
```

**Common component patterns:**

- `Block.astro` - Base container with `backgroundColor` prop (primary/secondary)
- `LinkButton.astro` - Multi-variant button (outline/link/colored/secondary)
- `SectionHeader.astro` - Back-link + badge row used at the top of every content page
- `InfoCard.astro` - The sidebar "latest" card; page-specific copy lives in `InfoCardContent/`
- `PageLayout.astro` (in `src/layouts/`) - `BaseLayout`+`MainLayout`+`Block`+`SectionHeader` composed for you; reach for `BaseLayout`/`MainLayout` directly only when a page's body isn't a single `Block`
- `src/lib/{slug,date,posts}.ts` - shared helpers (`entrySlug`, `formatDate`, `getPublishedPosts`) — use these instead of re-deriving a slug or date format inline
- SVG icons embedded directly in components, using theme tokens for fills

**3. Layout System**

- Main layout uses CSS Grid with named areas and breakpoint at 900px
- Slots: `main`, `theme`, `latest` for content placement
- Sticky sidebar on desktop layouts
- Global styles organized in CSS layers: `reset`, `base`, `layout`, `components`, `utilities`

**4. Content Collections**
Blog posts in `src/content/posts/` use type-safe schemas:

```typescript
{
  title: string
  description: string
  category: "coding" | "life"
  pubDate: Date
  updatedDate?: Date
  tags: string[]
  draft: boolean        // Filters posts from blog listing
  heroImage?: string
}
```

Access posts via `getCollection('posts')` with automatic type checking.

## Styling Conventions

### Design Tokens (`src/styles/tokens/`)

Three tiers: `primitives.css` (raw scales, theme-agnostic), `semantic.css` (per-theme role overrides — the only tier a theme touches), `components.css` (component defaults expressed via tier-2 roles).

**Color naming:**

- Base colors: `--clr-{color}-{weight}` (e.g., `--clr-blueberry-500`)
- Semantic tokens: `--{context}-{property}` (e.g., `--surface-main`, `--text-inverse`)
- Theme-specific: `--theme-btn-{color}-{state}-{property}`

**Typography scale:**

```css
--fs-300: 0.875rem /* Small text */ --fs-1000: 3.45rem /* Largest headings */;
```

**Font stacks:**

- Headings: `--ff-heading` (JetBrains Mono)
- Body: `--ff-body` (SF Pro Display)

### Component Styling Rules

1. **Always use CSS custom properties** - Never hardcode colors, spacing, or typography values
2. **Component-scoped styles** - Each `.astro` file has its own `<style>` block (automatically scoped)
3. **Shared styles** - Extract to separate CSS file when used by multiple components
4. **SVG fills** - Use theme tokens (e.g., `fill="var(--theme-btn-yellow-background)"`)

### CSS Layers

Styles are organized in layers for proper cascade control:

```css
@layer reset, base, layout, components, utilities;
```

## File Organization

### Pages (File-based routing)

- `src/pages/index.astro` - Homepage
- `src/pages/blog/index.astro` - Blog listing
- `src/pages/blog/[...slug].astro` - Dynamic blog post pages
- `src/pages/rss.xml.ts` - RSS feed generation

### Layouts

- `MainLayout.astro` - Primary grid layout with slots
- `BlogPost.astro` - Blog post template with metadata
- `BaseHead.astro` - SEO meta tags (update `site` in `astro.config.mjs`)

### Static Assets

- `public/fonts/` - Custom fonts (JetBrains Mono, SF Pro Display)
- `public/pictures/` - Images and SVGs (though prefer inline SVG for icons)

## Code Style

**Formatting (Prettier):**

- Tabs for indentation (width: 4)
- Semicolons required
- Brackets on same line for JSX

**Naming conventions:**

- Components: PascalCase (`ThemeSwitcher.astro`)
- CSS variables: kebab-case with semantic names
- TypeScript types: PascalCase interfaces

## Important Notes

**When working with themes:**

1. Always define tokens in all three theme contexts (`:root`, `[data-theme="blue"]`, `[data-theme="pink"]`)
2. Use meaningful semantic names (e.g., `--theme-btn-yellow-background` not `--yellow-bg`)
3. Test all three themes when making visual changes

**When creating components:**

1. Add a typed `interface Props` — every field gets its own JSDoc comment (purpose, and `@default` if optional)
2. Add a component-level JSDoc block above `Props` explaining what it is and when (not) to use it, with an `@example`
3. Use `Block.astro` for consistent containers
4. Follow slot-based composition pattern
5. Keep hover states in component-scoped styles
6. Style with tokens from `src/styles/tokens/` only — stylelint rejects raw hex/rgb/px values in component styles
7. Add the new component to the `/design` style guide (`src/pages/design.astro`) so it renders in all three themes

**When adding blog content:**

1. Create `.md` or `.mdx` files in `src/content/posts/`
2. Include all required frontmatter fields (title, description, category, pubDate, tags)
3. Set `draft: true` to hide from production blog listing
4. Use `CollectionEntry<"posts">` type for blog post props

**SVG Icon Pattern:**
When converting SVGs to components with theme support:

1. Create separate component in appropriate directory
2. Include both regular and hover SVG states
3. Use semantic theme tokens for all fills
4. Wrap in container with hover state management
5. Container handles opacity transitions between states
