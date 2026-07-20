import type { OGImageOptions } from "astro-og-canvas";

const fonts = [
	"./src/assets/fonts/JetBrainsMono-Bold.ttf",
	"./src/assets/fonts/JetBrainsMono-Regular.ttf",
];

export type Theme = "yellow" | "blue" | "pink";
export const themes: readonly Theme[] = ["yellow", "blue", "pink"] as const;

const palette: Record<
	Theme,
	{
		bg: [number, number, number];
		accent: [number, number, number];
		logo: string;
	}
> = {
	yellow: {
		bg: [255, 234, 90],
		accent: [251, 123, 171],
		logo: "./src/og/assets/dog-yellow.png",
	},
	blue: {
		bg: [92, 130, 247],
		accent: [255, 234, 90],
		logo: "./src/og/assets/dog-blue.png",
	},
	pink: {
		bg: [251, 123, 171],
		accent: [255, 234, 90],
		logo: "./src/og/assets/dog-pink.png",
	},
};

const ink: [number, number, number] = [25, 25, 25];
const inkSoft: [number, number, number] = [60, 60, 60];

export function pickTheme(seed: string): Theme {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	}
	return themes[hash % themes.length];
}

export function brandedImage(opts: {
	title: string;
	description?: string;
	theme: Theme;
}): OGImageOptions {
	const c = palette[opts.theme];
	return {
		title: opts.title,
		description: opts.description ?? "",
		bgGradient: [c.bg],
		border: { color: c.accent, width: 20, side: "inline-start" },
		padding: 70,
		logo: { path: c.logo, size: [220, 220] },
		font: {
			title: {
				families: ["JetBrains Mono"],
				weight: "Bold",
				color: ink,
				size: 60,
				lineHeight: 1.15,
			},
			description: {
				families: ["JetBrains Mono"],
				weight: "Normal",
				color: inkSoft,
				size: 28,
				lineHeight: 1.4,
			},
		},
		fonts,
		quality: 90,
		format: "PNG",
	};
}
