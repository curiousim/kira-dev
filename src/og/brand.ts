import type { OGImageOptions } from "astro-og-canvas";

const fonts = [
	"./src/assets/fonts/JetBrainsMono-Bold.ttf",
	"./src/assets/fonts/JetBrainsMono-Regular.ttf",
];

const colors = {
	yellow: [255, 235, 92] as [number, number, number],
	pink: [251, 123, 171] as [number, number, number],
	ink: [25, 25, 25] as [number, number, number],
	inkSoft: [80, 80, 80] as [number, number, number],
};

export function brandedImage(opts: {
	title: string;
	description?: string;
	eyebrow?: string;
}): OGImageOptions {
	return {
		title: opts.title,
		description: opts.description ?? "",
		bgGradient: [colors.yellow],
		border: { color: colors.pink, width: 20, side: "inline-start" },
		padding: 70,
		font: {
			title: {
				families: ["JetBrains Mono"],
				weight: "Bold",
				color: colors.ink,
				size: 64,
				lineHeight: 1.15,
			},
			description: {
				families: ["JetBrains Mono"],
				weight: "Normal",
				color: colors.inkSoft,
				size: 28,
				lineHeight: 1.4,
			},
		},
		fonts,
		logo: undefined,
		quality: 90,
		format: "PNG",
	};
}
