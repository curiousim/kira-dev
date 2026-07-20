export const POST_CATEGORIES = ["coding", "life"] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
	coding: "Coding",
	life: "Life",
};
