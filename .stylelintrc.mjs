export default {
	extends: ["stylelint-config-standard"],
	plugins: ["./tools/stylelint-token-guard.mjs"],
	customSyntax: "postcss-html",
	rules: {
		// Astro's compiled markup and CSS nesting trip up several
		// standard-config rules that don't know about either.
		"function-no-unknown": null,
		"selector-class-pattern": null,
		"custom-property-pattern": null,
		"no-descending-specificity": null,
		"rule-empty-line-before": null,
		"at-rule-no-unknown": null,
		"declaration-empty-line-before": null,
		"at-rule-empty-line-before": null,
		"comment-empty-line-before": null,
		"selector-pseudo-class-no-unknown": [
			true,
			{ ignorePseudoClasses: ["global"] },
		],
		// Both are style preferences unrelated to the token system this
		// config exists to guard — not bugs.
		"media-feature-range-notation": null,
		"declaration-block-no-redundant-longhand-properties": null,
		// `break-word` is soft-deprecated in favor of `overflow-wrap`, but
		// still correct and widely supported; not worth chasing here.
		"declaration-property-value-keyword-no-deprecated": null,
	},
	overrides: [
		{
			files: ["src/components/**/*.astro", "src/layouts/**/*.astro"],
			rules: {
				"kira/token-guard-color": true,
				"kira/token-guard-spacing": [true, { severity: "warning" }],
			},
		},
	],
};
