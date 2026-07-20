import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { POST_CATEGORIES } from "./data/postCategories";

const posts = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		category: z.enum(POST_CATEGORIES),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
		heroImage: z.string().optional(),
	}),
});

const albums = defineCollection({
	loader: glob({ pattern: "*.json", base: "./src/content/albums" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			pubDate: z.coerce.date(),
			cover: image().optional(),
			photos: z
				.array(
					z.object({
						src: image(),
						alt: z.string().min(1),
						caption: z.string().optional(),
					}),
				)
				.min(1),
		}),
});

export const collections = { posts, albums };
