// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";

export default tseslint.config(
	{
		ignores: [
			"**/dist/**",
			"**/.astro/**",
			"**/node_modules/**",
			".claude/**",
		],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...eslintPluginAstro.configs["flat/recommended"],
	...eslintPluginAstro.configs["flat/jsx-a11y-recommended"],
	{
		// Root-level config files and one-off scripts run under Node, not
		// the browser globals the rest of the config assumes.
		files: [
			"*.config.js",
			"*.config.mjs",
			"scripts/**/*.mjs",
			"tools/**/*.mjs",
		],
		languageOptions: {
			globals: globals.node,
		},
	},
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			// role="list" on <ul>/<ol> is intentional here, not redundant: the
			// global reset (src/styles/global.css) strips list semantics via
			// `list-style: none`, and role="list" restores it for VoiceOver,
			// which drops the implicit role once list-style is removed.
			"astro/jsx-a11y/no-redundant-roles": "off",
		},
	},
);
