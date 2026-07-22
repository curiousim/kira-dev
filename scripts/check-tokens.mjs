#!/usr/bin/env node
/**
 * Fails if any `var(--token)` referenced under src/ has no matching
 * `--token:` declaration anywhere in src/ — either a shared design token
 * (src/styles/tokens/) or a component-local custom property declared in
 * its own <style> block. This is the check that would have caught
 * --button-colored-background, --button-link-color, and --shell-max being
 * referenced but never defined.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC_DIR = join(ROOT, "src");

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(path)));
		else files.push(path);
	}
	return files;
}

function extractDeclared(css) {
	const names = new Set();
	for (const match of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
		names.add(match[1]);
	}
	return names;
}

function extractUsed(source) {
	const names = new Set();
	for (const match of source.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
		names.add(match[1]);
	}
	return names;
}

const sourceFiles = (await walk(SRC_DIR)).filter((f) =>
	[".astro", ".css", ".ts"].includes(extname(f)),
);

const declared = new Set();
const contents = new Map();
for (const file of sourceFiles) {
	const content = await readFile(file, "utf8");
	contents.set(file, content);
	for (const name of extractDeclared(content)) declared.add(name);
}

const missing = new Map();
for (const [file, content] of contents) {
	for (const name of extractUsed(content)) {
		if (!declared.has(name)) {
			if (!missing.has(name)) missing.set(name, []);
			missing.get(name).push(file.replace(ROOT, ""));
		}
	}
}

if (missing.size > 0) {
	console.error("Undefined CSS custom properties referenced via var():\n");
	for (const [name, files] of missing) {
		console.error(`  ${name}`);
		for (const file of files) console.error(`    used in ${file}`);
	}
	console.error(
		`\n${missing.size} undefined token(s). Define them in src/styles/tokens/.`,
	);
	process.exit(1);
}

console.log(
	`OK — ${declared.size} tokens declared, all var() references resolve.`,
);
