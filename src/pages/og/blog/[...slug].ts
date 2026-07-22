import { OGImageRoute } from "astro-og-canvas";
import { brandedImage, pickTheme } from "../../../og/brand";
import { getPublishedPosts } from "../../../lib/posts";
import { entrySlug } from "../../../lib/slug";

const posts = await getPublishedPosts();

const pages = Object.fromEntries(
	posts.map((post) => {
		const slug = entrySlug(post);
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
	pages,
	getImageOptions: (_path, page) =>
		brandedImage({
			title: page.title,
			description: page.description,
			theme: pickTheme(page.slug),
		}),
});
