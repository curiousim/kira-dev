# kira.dev

Personal site and blog of Kira Menshov. Built with [Astro 7](https://astro.build), MDX, and a custom three-theme design-token system (yellow/blue/pink). Deployed to Cloudflare Pages on push to `master`.

## Commands

| Command           | Action                                    |
| ----------------- | ----------------------------------------- |
| `npm install`     | Install dependencies                      |
| `npm run dev`     | Dev server at `localhost:4321`            |
| `npm run build`   | Production build to `./dist/`             |
| `npm run preview` | Preview the production build              |

Blog posts live in `src/content/posts/` as `.md`/`.mdx` with frontmatter (`title`, `description`, `pubDate`, `tags`, optional `draft`). See `CLAUDE.md` for architecture and styling conventions.
