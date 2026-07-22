import rss, { type RSSFeedItem } from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts } from "../lib/posts";
import { entrySlug } from "../lib/slug";

export async function GET(context: APIContext) {
	const posts = await getPublishedPosts();
	const items: RSSFeedItem[] = posts.map((post) => ({
		title: post.data.title,
		description: post.data.description,
		pubDate: post.data.pubDate,
		link: `/blog/${entrySlug(post)}/`,
	}));
	return rss({
		title: "Kira Menshov",
		description:
			"Notes on software, agentic AI, and things I learn while building.",
		site: context.site!,
		items,
	});
}
