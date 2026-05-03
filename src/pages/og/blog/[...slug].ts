import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import { brandedImage, pickTheme } from "../../../og/brand";

const posts = await getCollection("posts", ({ data }) => !data.draft);

const pages = Object.fromEntries(
	posts.map((post) => {
		const slug = post.id.replace(/\.mdx?$/, "");
		return [
			slug,
			{
				slug,
				title: post.data.title,
				description: post.data.description,
			},
		];
	}),
);

export const { getStaticPaths, GET } = await OGImageRoute({
	param: "slug",
	pages,
	getImageOptions: (_path, page) =>
		brandedImage({
			title: page.title,
			description: page.description,
			theme: pickTheme(page.slug),
		}),
});
