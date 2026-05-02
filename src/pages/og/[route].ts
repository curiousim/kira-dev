import { OGImageRoute } from "astro-og-canvas";
import { brandedImage } from "../../og/brand";

const pages = {
	index: {
		title: "Kira Menshov",
		description: "Software engineer. I build, I write, I learn out loud.",
	},
	blog: {
		title: "Blog — Kira Menshov",
		description:
			"Notes on software, agentic AI, and things I learn while building.",
	},
	about: {
		title: "About — Kira Menshov",
		description:
			"Software engineer with a focus on frontend. Currently into agentic AI.",
	},
	default: {
		title: "kira.dev",
		description: "Software engineer. I build, I write, I learn out loud.",
	},
};

export const { getStaticPaths, GET } = await OGImageRoute({
	param: "route",
	pages,
	getImageOptions: (_route, page) =>
		brandedImage({ title: page.title, description: page.description }),
});
