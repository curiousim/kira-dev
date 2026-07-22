import { OGImageRoute } from "astro-og-canvas";
import { brandedImage, type Theme } from "../../og/brand";
import { PAGE_META } from "../../consts";

interface Page {
	title: string;
	description: string;
	theme: Theme;
}

const pages: Record<string, Page> = {
	index: { ...PAGE_META.index, theme: "yellow" },
	blog: { ...PAGE_META.blog, theme: "blue" },
	about: { ...PAGE_META.about, theme: "pink" },
	default: { ...PAGE_META.index, theme: "yellow" },
};

export const { getStaticPaths, GET } = await OGImageRoute({
	pages,
	getImageOptions: (_route, page) =>
		brandedImage({
			title: page.title,
			description: page.description,
			theme: page.theme,
		}),
});
