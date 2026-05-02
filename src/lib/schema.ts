const SITE_URL = "https://kira.dev";

export const personSchema = {
	"@context": "https://schema.org",
	"@type": "Person",
	name: "Kira Menshov",
	jobTitle: "Software Engineer",
	url: SITE_URL,
	sameAs: [
		"https://bsky.app/profile/kiramnshv.bsky.social",
		"https://github.com/curiousim",
		"https://www.linkedin.com/in/kira-menshov-b447b72a/",
	],
};

export const websiteSchema = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "kira.dev",
	url: SITE_URL,
	author: {
		"@type": "Person",
		name: "Kira Menshov",
		url: SITE_URL,
	},
};

export function blogPostingSchema(opts: {
	title: string;
	description: string;
	url: string;
	image: string;
	pubDate: Date;
	updatedDate?: Date;
	tags?: string[];
}) {
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: opts.title,
		description: opts.description,
		image: opts.image,
		datePublished: opts.pubDate.toISOString(),
		dateModified: (opts.updatedDate ?? opts.pubDate).toISOString(),
		author: {
			"@type": "Person",
			name: "Kira Menshov",
			url: SITE_URL,
		},
		publisher: {
			"@type": "Person",
			name: "Kira Menshov",
			url: SITE_URL,
		},
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": opts.url,
		},
		...(opts.tags && opts.tags.length > 0 ? { keywords: opts.tags.join(", ") } : {}),
	};
}
