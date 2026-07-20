import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
	const posts = (await getCollection("posts"))
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
	return rss({
		title: "Kira Menshov",
		description:
			"Notes on software, agentic AI, and things I learn while building.",
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: `/blog/${post.id.replace(/\.mdx?$/, "")}/`,
		})),
	});
}
