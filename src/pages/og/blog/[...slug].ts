import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import { brandedImage } from "../../../og/brand";

const posts = await getCollection("posts", ({ data }) => !data.draft);

const pages = Object.fromEntries(
	posts.map((post) => [
		post.id.replace(/\.mdx?$/, ""),
		{
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
		},
	]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
	param: "slug",
	pages,
	getImageOptions: (_path, page) =>
		brandedImage({
			title: page.title,
			description: page.description,
		}),
});
