// Keep family content and its unlisted URL out of the public repository.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createDecipheriv } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";

const secret = process.env.FAMILY_ATLAS_KEY;
if (secret) {
	const bytes = await readFile(
		new URL("../private-content/family-atlas.enc", import.meta.url),
	);
	const key = Buffer.from(secret, "base64");
	const decipher = createDecipheriv(
		"aes-256-gcm",
		key,
		bytes.subarray(0, 12),
	);
	decipher.setAuthTag(bytes.subarray(12, 28));
	const payload = JSON.parse(
		gunzipSync(
			Buffer.concat([
				decipher.update(bytes.subarray(28)),
				decipher.final(),
			]),
		).toString(),
	);
	if (
		!/^shared\/[a-f0-9]{48}\/index\.html$/.test(payload.path) ||
		typeof payload.html !== "string"
	) {
		throw new Error("Invalid family atlas payload");
	}
	const destination = resolve("public", payload.path);
	await mkdir(dirname(destination), { recursive: true });
	await writeFile(destination, payload.html);

	console.log("Prepared unlisted family atlas.");
} else if (process.env.REQUIRE_FAMILY_ATLAS === "true") {
	throw new Error("FAMILY_ATLAS_KEY is required for production deployment");
}
