import type { CollectionEntry } from "astro:content";

/**
 * URL-safe slug for a Markdown/MDX collection entry.
 *
 * Astro's glob loader keys entries by file path relative to the collection
 * root, including the extension (`honcho-memory.mdx`). Every route and link
 * builder needs the extension stripped; this is the one place that does it.
 */
export function entrySlug(
	entry: CollectionEntry<"posts"> | CollectionEntry<"books">,
): string {
	return entry.id.replace(/\.mdx?$/, "");
}
