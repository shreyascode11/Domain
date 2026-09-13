/**
 * A small, forgiving CSS tokenizer for the learner's stylesheet.
 *
 * It exists for three jobs, none of which is "decide how CSS behaves" (the
 * browser's engine does that):
 *   1. Validation while typing — so a half-typed value like `flex-direction: co`
 *      never reaches the world. Blueprint §9.2: "parse + validate (fail soft,
 *      keep last good render)".
 *   2. Plain-English error messages that teach ("lengths need a unit").
 *   3. Knowing where a rule lives in the file, for the inspector and the
 *      debrief's "what you changed".
 */

export type CssDecl = {
  prop: string;
  value: string;
  line: number;
  from: number;
  to: number;
};

export type CssRule = {
  selector: string;
  line: number;
  from: number;
  to: number;
  decls: CssDecl[];
};

export type CssIssue = {
  line: number;
  from: number;
  to: number;
  message: string;
  hint?: string;
};

export type ParsedCss = { rules: CssRule[]; issues: CssIssue[] };

function lineAt(text: string, offset: number) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

/** Replace comments with spaces (keeping newlines) so offsets stay exact. */
function blankComments(text: string, issues: CssIssue[]) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) {
        issues.push({
          line: lineAt(text, i),
          from: i,
          to: text.length,
          message: "This comment is never closed.",
          hint: "Comments start with /* and must end with */.",
        });
        out += text.slice(i).replace(/[^\n]/g, " ");
        break;
      }
      out += text.slice(i, end + 2).replace(/[^\n]/g, " ");
      i = end + 2;
    } else {
      out += text[i];
      i++;
    }
  }
  return out;
}

/** Pure structural parse: rules, declarations, brace/colon mistakes. */
export function parseCss(source: string): ParsedCss {
  const issues: CssIssue[] = [];
  const text = blankComments(source, issues);
  const rules: CssRule[] = [];

  let i = 0;
  const n = text.length;

  while (i < n) {
    // Skip whitespace between rules.
    while (i < n && /\s/.test(text[i])) i++;
    if (i >= n) break;

    if (text[i] === "}") {
      issues.push({
        line: lineAt(text, i),
        from: i,
        to: i + 1,
        message: "There's an extra `}` here with no rule to close.",
      });
      i++;
      continue;
    }

    // Selector (or at-rule prelude) runs to `{` or `;`.
    const selStart = i;
    while (i < n && text[i] !== "{" && text[i] !== ";" && text[i] !== "}") i++;
    const selector = text.slice(selStart, i).trim();

    if (i >= n) {
      issues.push({
        line: lineAt(text, selStart),
        from: selStart,
        to: n,
        message: `\`${selector}\` needs a \`{ … }\` block after it.`,
      });
      break;
    }

    if (text[i] === ";" || text[i] === "}") {
      if (selector.startsWith("@")) {
        i++; // statement at-rule, e.g. @import
        continue;
      }
      issues.push({
        line: lineAt(text, selStart),
        from: selStart,
        to: i + 1,
        message: `\`${selector}\` looks like a declaration outside of any rule.`,
        hint: "Declarations have to go inside a selector's { } block.",
      });
      i++;
      continue;
    }

    // text[i] === "{"
    const blockOpen = i;
    i++;

    if (selector.startsWith("@")) {
      // At-rule block: skip it, keeping brace balance honest.
      let depth = 1;
      while (i < n && depth > 0) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") depth--;
        i++;
      }
      if (depth > 0) {
        issues.push({
          line: lineAt(text, selStart),
          from: selStart,
          to: n,
          message: `\`${selector}\` is missing its closing \`}\`.`,
        });
      }
      continue;
    }

    if (!selector) {
      issues.push({
        line: lineAt(text, blockOpen),
        from: blockOpen,
        to: blockOpen + 1,
        message: "This `{` block has no selector in front of it.",
        hint: "Write which elements it styles first, e.g. `.stone {`.",
      });
    }

    const rule: CssRule = {
      selector,
      line: lineAt(text, selStart),
      from: selStart,
      to: n,
      decls: [],
    };

    let closed = false;
    let broken = false;
    while (i < n) {
      // One declaration, up to `;` or `}`, respecting parens and strings.
      const declStart = i;
      let paren = 0;
      let quote: string | null = null;
      while (i < n) {
        const c = text[i];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === "(") paren++;
        else if (c === ")") paren = Math.max(0, paren - 1);
        else if (paren === 0 && (c === ";" || c === "}" || c === "{")) break;
        i++;
      }

      const raw = text.slice(declStart, i);
      const trimmed = raw.trim();

      if (i < n && text[i] === "{") {
        // A `{` inside a rule means the previous rule was never closed.
        issues.push({
          line: rule.line,
          from: rule.from,
          to: rule.from + selector.length,
          message: `\`${selector}\` is missing its closing \`}\`.`,
          hint: "Every rule's { needs a matching } before the next rule starts.",
        });
        broken = true;
        break;
      }

      if (trimmed) {
        const lead = raw.length - raw.trimStart().length;
        const dFrom = declStart + lead;
        const dTo = dFrom + trimmed.length;
        const colon = trimmed.indexOf(":");
        if (colon === -1) {
          const words = trimmed.split(/\s+/);
          issues.push({
            line: lineAt(text, dFrom),
            from: dFrom,
            to: dTo,
            message:
              words.length > 1
                ? `\`${trimmed}\` is missing a colon.`
                : `\`${trimmed}\` needs a colon and a value.`,
            hint:
              words.length > 1
                ? `Write it as \`${words[0]}: ${words.slice(1).join(" ")};\``
                : `For example \`${trimmed}: …;\``,
          });
        } else {
          rule.decls.push({
            prop: trimmed.slice(0, colon).trim().toLowerCase(),
            value: trimmed.slice(colon + 1).trim(),
            line: lineAt(text, dFrom),
            from: dFrom,
            to: dTo,
          });
        }
      }

      if (i >= n) break;
      if (text[i] === "}") {
        closed = true;
        i++;
        break;
      }
      i++; // `;`
    }

    rule.to = i;
    rules.push(rule);

    if (broken) break;
    if (!closed) {
      issues.push({
        line: rule.line,
        from: rule.from,
        to: Math.min(n, rule.from + Math.max(1, selector.length)),
        message: `\`${selector}\` is missing its closing \`}\`.`,
      });
      break;
    }
  }

  return { rules, issues };
}

/** Keyword values for the properties the lessons use, for friendly hints. */
export const KEYWORDS: Record<string, string[]> = {
  display: ["block", "inline", "inline-block", "flex", "inline-flex", "grid", "none"],
  "flex-direction": ["row", "row-reverse", "column", "column-reverse"],
  "justify-content": ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
  "align-items": ["stretch", "flex-start", "center", "flex-end", "baseline"],
  "align-self": ["auto", "stretch", "flex-start", "center", "flex-end", "baseline"],
  "flex-wrap": ["nowrap", "wrap", "wrap-reverse"],
  position: ["static", "relative", "absolute", "fixed", "sticky"],
  "box-sizing": ["content-box", "border-box"],
};

const SHORTHANDS = [
  "background", "border", "border-top", "border-right", "border-bottom", "border-left",
  "border-color", "border-width", "border-style", "border-radius", "margin", "padding",
  "flex", "flex-flow", "gap", "font", "grid", "grid-template", "grid-area", "inset",
  "outline", "overflow", "place-items", "place-content", "place-self", "transition",
  "animation", "text-decoration", "list-style", "columns",
];

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[a.length][b.length];
}

function closest(word: string, candidates: string[], maxDistance = 2) {
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = levenshtein(word, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best && bestD <= maxDistance && bestD > 0 ? best : null;
}

let knownProps: string[] | null = null;
function allPropertyNames() {
  if (knownProps) return knownProps;
  const names = new Set<string>(SHORTHANDS);
  const cs = getComputedStyle(document.documentElement);
  for (let i = 0; i < cs.length; i++) names.add(cs[i]);
  knownProps = [...names];
  return knownProps;
}

/**
 * Structural parse plus the browser's own verdict on every property and
 * value (`CSS.supports`). Browser-only — call from effects or editor
 * extensions, never during server render.
 */
export function validateCss(source: string): ParsedCss {
  const parsed = parseCss(source);
  const issues = [...parsed.issues];

  for (const rule of parsed.rules) {
    if (rule.selector) {
      try {
        document.createDocumentFragment().querySelector(rule.selector);
      } catch {
        issues.push({
          line: rule.line,
          from: rule.from,
          to: rule.from + rule.selector.length,
          message: `\`${rule.selector}\` isn't a valid selector.`,
        });
      }
    }

    for (const d of rule.decls) {
      if (d.prop.startsWith("--")) continue;

      // The single most common slip: a missing `;` swallows the next line.
      const nl = d.value.indexOf("\n");
      if (nl !== -1 && /^\s*[a-z-]+\s*:/i.test(d.value.slice(nl + 1))) {
        const lineEnd = source.indexOf("\n", d.from);
        issues.push({
          line: d.line,
          from: d.from,
          to: lineEnd === -1 ? d.to : lineEnd,
          message: "This line is missing a `;` at the end.",
          hint: "Without it, the browser reads this line and the next one as a single, broken declaration.",
        });
        continue;
      }

      if (!/^[a-z-]+$/.test(d.prop) || !CSS.supports(d.prop, "initial")) {
        const guess = closest(d.prop, allPropertyNames());
        issues.push({
          line: d.line,
          from: d.from,
          to: d.from + d.prop.length,
          message: `\`${d.prop}\` isn't a CSS property.`,
          hint: guess ? `Did you mean \`${guess}\`?` : undefined,
        });
        continue;
      }

      const value = d.value.replace(/!\s*important\s*$/i, "").trim();
      const valueFrom = source.indexOf(d.value, d.from + d.prop.length);
      const vFrom = valueFrom === -1 ? d.from : valueFrom;
      const vTo = valueFrom === -1 ? d.to : valueFrom + Math.max(1, d.value.length);

      if (!value) {
        issues.push({
          line: d.line,
          from: d.from,
          to: d.to,
          message: `\`${d.prop}\` needs a value.`,
          hint: KEYWORDS[d.prop] ? `Try one of: ${KEYWORDS[d.prop].join(", ")}.` : undefined,
        });
        continue;
      }

      if (!CSS.supports(d.prop, value)) {
        let hint: string | undefined;
        const keywords = KEYWORDS[d.prop];
        if (/^-?\d*\.?\d+$/.test(value) && value !== "0" && CSS.supports(d.prop, "10px")) {
          hint = `Lengths need a unit — try \`${value}px\`.`;
        } else if (keywords) {
          const guess = closest(value.toLowerCase(), keywords, 3);
          hint = guess
            ? `Did you mean \`${guess}\`? Valid values: ${keywords.join(", ")}.`
            : `Valid values: ${keywords.join(", ")}.`;
        }
        issues.push({
          line: d.line,
          from: vFrom,
          to: vTo,
          message: `\`${value}\` isn't a valid value for \`${d.prop}\`.`,
          hint,
        });
      }
    }
  }

  issues.sort((a, b) => a.from - b.from);
  return { rules: parsed.rules, issues };
}

/** selector -> property -> value, later declarations winning. */
export function declarationMap(rules: CssRule[]) {
  const map: Record<string, Record<string, string>> = {};
  for (const r of rules) {
    const bucket = (map[r.selector] ??= {});
    for (const d of r.decls) bucket[d.prop] = d.value.replace(/\s+/g, " ").trim();
  }
  return map;
}

export type CssChange = { selector: string; prop: string; before: string | null; after: string | null };

/** What the learner actually changed, rule by rule. */
export function diffCss(before: string, after: string): CssChange[] {
  const a = declarationMap(parseCss(before).rules);
  const b = declarationMap(parseCss(after).rules);
  const changes: CssChange[] = [];
  const selectors = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const sel of selectors) {
    const pa = a[sel] ?? {};
    const pb = b[sel] ?? {};
    for (const prop of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
      const va = pa[prop] ?? null;
      const vb = pb[prop] ?? null;
      if (va !== vb) changes.push({ selector: sel, prop, before: va, after: vb });
    }
  }
  return changes;
}

/** Parse a px length like "60px" or "0"; null if it isn't one. */
export function pxValue(value: string | undefined) {
  if (value == null) return null;
  const m = /^(-?\d*\.?\d+)(px)?$/.exec(value.trim());
  if (!m) return null;
  if (!m[2] && Number(m[1]) !== 0) return null;
  return Number(m[1]);
}
