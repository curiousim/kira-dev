// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import rehypeExternalLinks from "rehype-external-links";

// https://astro.build/config
export default defineConfig({
	site: "https://kiramenshov.com",
	trailingSlash: "always",
	integrations: [mdx(), sitemap()],
	markdown: {
		processor: unified({
			rehypePlugins: [
				[
					rehypeExternalLinks,
					{ target: "_blank", rel: ["noopener", "noreferrer"] },
				],
			],
		}),
	},
});
