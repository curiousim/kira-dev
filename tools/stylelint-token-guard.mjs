import stylelint from "stylelint";

const COLOR_PROPS =
	/^(color|fill|stroke|background|background-color|border(-top|-bottom|-left|-right)?-color|outline-color|box-shadow)$/i;
const SPACING_PROPS =
	/^(padding|padding-(top|bottom|left|right|inline|block)|margin|margin-(top|bottom|left|right)|gap|row-gap|column-gap|font-size|border-radius|z-index)$/i;

const RAW_COLOR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;
const ALLOWED_LITERAL =
	/^(0|1px|2px|100%|auto|none|inherit|unset|initial|transparent|currentcolor)$/i;
// em/% are relative-to-context units (code padding scaling with font-size,
// line-height percentages) — legitimately outside the absolute spacing scale.
const RELATIVE_UNIT = /^-?[\d.]+(em|%)$/i;

function makeRule({ ruleName, propsPattern, isAllowed }) {
	const messages = stylelint.utils.ruleMessages(ruleName, {
		rejected: (prop, value) =>
			`"${prop}: ${value}" should reference a design token (var(--...)) from src/styles/tokens/ instead of a raw value`,
	});

	return stylelint.createPlugin(ruleName, (enabled) => {
		return (root, result) => {
			if (!enabled) return;
			root.walkDecls((decl) => {
				const prop = decl.prop.toLowerCase();
				if (!propsPattern.test(prop)) return;
				const value = decl.value.trim();
				if (decl.value.includes("var(")) return;
				if (isAllowed(value)) return;
				stylelint.utils.report({
					message: messages.rejected(decl.prop, decl.value),
					node: decl,
					result,
					ruleName,
				});
			});
		};
	});
}

/**
 * Two guards against design-system regressions in component/page styles
 * (scoped there via stylelint overrides — token files are where raw values
 * belong): no raw hex/rgb/hsl color, and no un-tokenized spacing/radius/
 * font-size/z-index literal. The color guard has zero known exceptions in
 * this codebase and runs as an error. The spacing guard is intentionally
 * looser — roughly 20 pre-existing declarations use one-off values that
 * don't cleanly fit the 8-step space scale (e.g. `gap: 10px`, `margin-top:
 * 50px`) and were left as deliberate fine-tuning rather than snapped onto
 * the nearest step. New code should still use tokens; this is a visible
 * warning trail for that cleanup, not a hard gate.
 */
export const tokenGuardColor = makeRule({
	ruleName: "kira/token-guard-color",
	propsPattern: COLOR_PROPS,
	isAllowed: (value) => !RAW_COLOR.test(value),
});

export const tokenGuardSpacing = makeRule({
	ruleName: "kira/token-guard-spacing",
	propsPattern: SPACING_PROPS,
	isAllowed: (value) =>
		value
			.split(/\s+/)
			.every((t) => ALLOWED_LITERAL.test(t) || RELATIVE_UNIT.test(t)),
});

export default [tokenGuardColor, tokenGuardSpacing];
