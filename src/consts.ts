// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Kira Menshov";
export const SITE_DESCRIPTION =
	"Personal site and blog of Kira Menshov, front-end engineer. Notes on web development and whatever else I'm learning.";

export const INTERNAL_LINKS = [
	{ href: "/", title: "Home" },
	{ href: "/about/", title: "About" },
	{ href: "/blog/", title: "Blog" },
	{ href: "/books/", title: "Books" },
	{ href: "/photos/", title: "Photos" },
];

/**
 * Single source of truth for each static page's title/description — used
 * for both the page's own meta tags and its generated OG card
 * (`src/pages/og/[route].ts`), so the two can't drift apart.
 */
export const PAGE_META = {
	index: {
		title: "Kira Menshov – Software Engineer",
		description:
			"Personal site of Kira Menshov, software engineer focused on frontend. Notes on building things, agentic AI, and learning out loud.",
	},
	blog: {
		title: "Blog – Kira Menshov",
		description:
			"Blog posts by Kira Menshov on software, agentic AI, and the things I learn while building.",
	},
	about: {
		title: "About Me",
		description: "About Kira Menshov — front-end engineer.",
	},
} as const;
