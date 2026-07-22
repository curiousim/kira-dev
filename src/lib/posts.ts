import { getCollection, type CollectionEntry } from "astro:content";

/** Non-draft posts, newest first — the ordering every listing/feed uses. */
export async function getPublishedPosts(): Promise<CollectionEntry<"posts">[]> {
	const posts = await getCollection("posts", ({ data }) => !data.draft);
	return posts.sort(
		(a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
	);
}

/** Most recent non-draft post, or `undefined` if none exist yet. */
export async function getLatestPost(): Promise<
	CollectionEntry<"posts"> | undefined
> {
	const posts = await getPublishedPosts();
	return posts[0];
}
