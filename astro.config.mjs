// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
	site: 'https://kiramenshov.com',
	integrations: [mdx(), sitemap()],
	markdown: {
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{ target: '_blank', rel: ['noopener', 'noreferrer'] },
			],
		],
	},
});
