import { OGImageRoute } from "astro-og-canvas";
import { brandedImage, type Theme } from "../../og/brand";

interface Page {
	title: string;
	description: string;
	theme: Theme;
}

const pages: Record<string, Page> = {
	index: {
		title: "Kira Menshov",
		description: "Software engineer. I build, I write, I learn out loud.",
		theme: "yellow",
	},
	blog: {
		title: "Blog — Kira Menshov",
		description:
			"Notes on software, agentic AI, and things I learn while building.",
		theme: "blue",
	},
	about: {
		title: "About — Kira Menshov",
		description:
			"Software engineer with a focus on frontend. Currently into agentic AI.",
		theme: "pink",
	},
	default: {
		title: "kiramenshov.com",
		description: "Software engineer. I build, I write, I learn out loud.",
		theme: "yellow",
	},
};

export const { getStaticPaths, GET } = await OGImageRoute({
	param: "route",
	pages,
	getImageOptions: (_route, page) =>
		brandedImage({
			title: page.title,
			description: page.description,
			theme: page.theme,
		}),
});
