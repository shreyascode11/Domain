import type { CssIssue } from "./cssParse";

/**
 * A beginner-focused HTML checker. Browsers silently "repair" broken HTML,
 * which is exactly what makes it hard to learn: a missing `>` or `</div>`
 * quietly rearranges the page. This finds those mistakes first, so broken
 * markup never reaches the world and the learner gets a sentence explaining
 * what's wrong.
 */

export type HtmlIssue = CssIssue;

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

const KNOWN = new Set([
  "a", "abbr", "article", "aside", "b", "blockquote", "br", "button", "caption", "code", "dd", "details", "div", "dl", "dt",
  "em", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "input",
  "label", "li", "main", "mark", "nav", "ol", "p", "pre", "section", "select", "small", "span", "strong", "sub", "summary",
  "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "tr", "u", "ul", "option", "time", "picture", "source",
]);

function lineAt(text: string, offset: number) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function guessTag(name: string) {
  let best: string | null = null;
  let bestD = 3;
  for (const t of KNOWN) {
    const d = levenshtein(name, t);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

export function validateHtml(source: string): { issues: HtmlIssue[] } {
  const issues: HtmlIssue[] = [];
  const stack: { name: string; from: number; to: number }[] = [];
  const n = source.length;
  let i = 0;

  const push = (from: number, to: number, message: string, hint?: string) =>
    issues.push({ line: lineAt(source, from), from, to: Math.max(to, from + 1), message, hint });

  while (i < n) {
    const lt = source.indexOf("<", i);
    if (lt === -1) break;

    // Comments.
    if (source.startsWith("<!--", lt)) {
      const end = source.indexOf("-->", lt + 4);
      if (end === -1) {
        push(lt, n, "This comment is never closed.", "Comments start with `<!--` and end with `-->`.");
        break;
      }
      i = end + 3;
      continue;
    }

    // Find the end of this tag, respecting quoted attribute values.
    let j = lt + 1;
    let quote: string | null = null;
    let nextLt = -1;
    while (j < n) {
      const c = source[j];
      if (quote) {
        if (c === quote) quote = null;
        else if (c === "\n" || c === "<") {
          // A quote that runs onto the next tag is almost certainly unclosed.
          if (c === "<") break;
        }
      } else if (c === '"' || c === "'") quote = c;
      else if (c === ">") break;
      else if (c === "<") {
        nextLt = j;
        break;
      }
      j++;
    }

    const lineEnd = source.indexOf("\n", lt);
    const tagPreview = source.slice(lt, lineEnd === -1 ? Math.min(n, lt + 40) : Math.min(lineEnd, lt + 40));

    if (quote) {
      push(lt, j, "An attribute's quotes are never closed.", `Every \`"\` needs a matching \`"\`, like \`class="stone"\`.`);
      break;
    }
    if (j >= n || nextLt !== -1) {
      push(lt, nextLt === -1 ? n : nextLt, `\`${tagPreview.trim()}\` is missing its closing \`>\`.`, "Every tag ends with `>`.");
      if (nextLt === -1) break;
      i = nextLt;
      continue;
    }

    const raw = source.slice(lt + 1, j); // between < and >
    const tagEnd = j + 1;
    i = tagEnd;

    if (/^\s/.test(raw) || raw === "") {
      push(lt, tagEnd, "A tag can't start with a space.", "Write `<div>`, not `< div>`.");
      continue;
    }
    if (raw.startsWith("!")) continue; // doctype

    const closing = raw.startsWith("/");
    const body = closing ? raw.slice(1) : raw;
    const nameMatch = /^([a-zA-Z][a-zA-Z0-9-]*)/.exec(body);
    if (!nameMatch) {
      push(lt, tagEnd, `\`<${raw}>\` isn't a tag.`, "A tag name is letters, like `div` or `p`.");
      continue;
    }
    const name = nameMatch[1].toLowerCase();

    if (name === "script" || name === "style") {
      push(
        lt,
        tagEnd,
        `\`<${name}>\` isn't allowed in the HTML tab.`,
        name === "script" ? "JavaScript goes in the JS tab." : "CSS goes in the CSS tab."
      );
      continue;
    }

    if (!KNOWN.has(name) && !name.includes("-")) {
      const guess = guessTag(name);
      push(lt + 1 + (closing ? 1 : 0), lt + 1 + (closing ? 1 : 0) + name.length, `\`${name}\` isn't an HTML tag.`, guess ? `Did you mean \`${guess}\`?` : undefined);
      continue;
    }

    if (closing) {
      if (VOID.has(name)) {
        push(lt, tagEnd, `\`<${name}>\` never has a closing tag.`, `Just delete \`</${name}>\`.`);
        continue;
      }
      const top = stack[stack.length - 1];
      if (!top) {
        push(lt, tagEnd, `\`</${name}>\` closes something that was never opened.`, "Delete it, or add the opening tag above.");
        continue;
      }
      if (top.name !== name) {
        const opened = stack.findIndex((s) => s.name === name);
        if (opened === -1) {
          push(lt, tagEnd, `\`</${name}>\` doesn't match anything that's open.`, `The last open tag is \`<${top.name}>\` — close that first with \`</${top.name}>\`.`);
        } else {
          push(top.from, top.to, `\`<${top.name}>\` is never closed.`, `Add \`</${top.name}>\` before \`</${name}>\`. Tags close in the reverse order they open.`);
          stack.length = opened;
        }
        continue;
      }
      stack.pop();
      continue;
    }

    // Opening tag: check attributes.
    const attrs = body.slice(name.length).replace(/\/\s*$/, "");
    const attrRe = /\s+([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
    let consumed = 0;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrs))) {
      if (m.index !== consumed) break;
      consumed = attrRe.lastIndex;
      const attrName = m[1].toLowerCase();
      const value = m[2];
      const at = lt + 1 + name.length + m.index;
      if (attrName.startsWith("on")) {
        push(at, at + m[0].length, `\`${attrName}\` attributes aren't allowed here.`, "Add event listeners in the JS tab with `addEventListener`.");
      } else if (value !== undefined && !/^["']/.test(value)) {
        push(at, at + m[0].length, `The value of \`${attrName}\` needs quotes.`, `Write \`${attrName}="${value}"\`.`);
      } else if ((attrName === "class" || attrName === "id") && value === undefined) {
        push(at, at + m[0].length, `\`${attrName}\` needs a value.`, `Write \`${attrName}="…"\`.`);
      }
    }
    if (attrs.slice(consumed).trim()) {
      push(lt, tagEnd, `Something in \`<${raw}>\` isn't a valid attribute.`, 'Attributes look like `name="value"`, separated by spaces.');
    }

    if (!VOID.has(name) && !/\/\s*$/.test(body)) stack.push({ name, from: lt, to: tagEnd });
  }

  for (const open of stack.reverse()) {
    issues.push({
      line: lineAt(source, open.from),
      from: open.from,
      to: open.to,
      message: `\`<${open.name}>\` is never closed.`,
      hint: `Add \`</${open.name}>\` where this element should end.`,
    });
  }

  issues.sort((a, b) => a.from - b.from);
  return { issues };
}
