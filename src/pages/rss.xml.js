import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
	const posts = await getCollection("posts", ({ data }) => !data.draft);
	return rss({
		title: "Kira Menshov",
		description:
			"Notes on software, agentic AI, and things I learn while building.",
		site: context.site,
		items: posts
			.sort(
				(a, b) =>
					new Date(b.data.pubDate).getTime() -
					new Date(a.data.pubDate).getTime(),
			)
			.map((post) => ({
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.pubDate,
				link: `/blog/${post.id.replace(/\.mdx?$/, "")}/`,
			})),
	});
}
