import { declarationMap, parseCss, pxValue } from "./cssParse";
import { REACH } from "./physics";
import type { JsEnv } from "./jsRun";
import { BASICS } from "./jsLevels/basics";
import { FUNCTIONS } from "./jsLevels/functions";
import { DATA } from "./jsLevels/data";
import { DOM } from "./jsLevels/dom";
import { ASYNC } from "./jsLevels/async";

/**
 * The curriculum. Blueprint §5 order, trimmed to what a beginner needs
 * first: HTML (what things are) → CSS (how they look and where they sit) →
 * Flexbox (arranging many things) → JavaScript (making things change).
 *
 * Every level is a real page that starts broken in a way you can *walk
 * into*. Level geometry is designed against lib/physics REACH: a broken
 * layout is well beyond what Dom can jump, a fixed one comfortably inside
 * it — so the code decides whether you get across, not your timing.
 */

export type FileKind = "html" | "css" | "js";

export type ReferenceEntry = { value: string; meaning: string };

export type Rubric = { gold: boolean; note?: string };

export type RubricContext = {
  html: string;
  css: string;
  js: string;
  /** How many elements in the live page match a selector. */
  count: (selector: string) => number;
};

export type ExampleLine = { code: string; note?: string };

export type Level = {
  id: string;
  chapter: number;
  number: number; // position within its chapter, 1-based
  title: string;
  concept: string; // the thing this level teaches, e.g. "gap"
  /** Which file the learner edits in this level. The others are read-only. */
  edit: FileKind;
  /** One line: what you'll be able to do after this level. */
  learn: string;
  objective: string;
  /** The idea, explained before you play. One short paragraph each. */
  lesson: string[];
  /** A worked example, annotated line by line. */
  example: { lang: FileKind; lines: ExampleLine[] };
  /** The task, as numbered steps. */
  steps: string[];
  reference: { title: string; syntax: string; entries: ReferenceEntry[] };
  /** Hint ladder (blueprint §7.6): Notice, Question, Narrow, Re-teach, Reveal. */
  hints: [string, string, string, string, string];
  debrief: { rule: string; seenIn: string; fableLine: string };
  quiz: { question: string; options: string[]; answer: number; explain: string };
  html: string;
  css: string;
  js?: string;
  /** Module files the level's JavaScript can import, keyed by path. */
  modules?: JsEnv["modules"];
  /** A pretend server for fetch, keyed like "GET /api/bridge". */
  api?: JsEnv["api"];
  /** Values already in localStorage / sessionStorage when the level starts. */
  storage?: JsEnv["storage"];
  rubric: (ctx: RubricContext) => Rubric;
};

export type Chapter = {
  number: number;
  subject: "HTML" | "CSS" | "Flexbox" | "JavaScript";
  title: string;
  /** What you'll be able to do by the end. */
  outcome: string;
  fable: string[];
  moral: string;
  /** Scene palette for this chapter's world. */
  biome: "meadow" | "desert" | "canyon" | "crystal";
};

export const HINT_RUNGS = ["Notice", "Question", "Narrow", "Re-teach", "Reveal"] as const;

const ACROSS = `${REACH.acrossPx}px`;
const UP = `${REACH.upPx}px`;

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    subject: "HTML",
    title: "The Builder Who Wrote Things Down",
    outcome: "Write HTML elements, name them with attributes, and nest them — then use the real tags of the web: semantic sections, headings, lists, links, images, forms and tables.",
    fable: [
      "There was once a builder who owned no stone, no wood and no tools. All she had was a pen.",
      "So she wrote the word stone — and a stone was there. She wrote it again, and there were two. When she wrote a name beside a thing, it took that name's shape. When she wrote one thing inside another, it stayed inside.",
      "The other builders laughed at her, until they saw she had built a road.",
    ],
    moral: "A web page is made of elements. Write one down, and it exists.",
    biome: "meadow",
  },
  {
    number: 2,
    subject: "CSS",
    title: "The Tailor of Stone",
    outcome: "Write real CSS: selectors and the cascade, the box model, units, positioning, colour, typography, motion and variables — the whole toolkit, not just one rule.",
    fable: [
      "The builder's stones were all the same: the same size, crowded together or scattered apart.",
      "A tailor arrived with a measuring tape. “I don't change what a thing is,” she said. “I change its shape, and the space around it.” She lengthened one stone into a bridge. She drew in the empty air between the others until they were close enough to step across.",
    ],
    moral: "HTML says what things are. CSS says what they look like, how big they are and where they sit.",
    biome: "desert",
  },
  {
    number: 3,
    subject: "Flexbox",
    title: "The Conveyor of Ants",
    outcome: "Really know flexbox: the container/item split, both axes, every alignment and sizing property, the classic gotchas, the everyday patterns, and when to reach for Grid instead.",
    fable: [
      "In the old hall, the ants would not move for the queen. She shouted at each one — “You, step left! You, stand taller!” — and still they tangled into a heap.",
      "An old ant said: “Stop talking to us one at a time. Talk to the line.”",
      "So the queen spoke to the line itself. “Line, stand side by side.” “Line, leave room between you.” “Line, spread yourselves along the floor.” “Line, stand with your feet on the ground.” “Line, rise.” And the line stood up into a tower.",
    ],
    moral: "In flexbox you don't place the children. You tell the container how to arrange them.",
    biome: "canyon",
  },
  {
    number: 4,
    subject: "JavaScript",
    title: "The Hands That Reach",
    outcome: "Really write JavaScript: values and types, control flow, functions and closures, arrays and objects, the DOM and events, async code with fetch, modules, debugging — and the tools worth knowing exist.",
    fable: [
      "The page was finished, and it was perfectly still. Nothing in it could change.",
      "Then a child came with a handful of instructions. “Find the gate,” she read. “When someone pulls the lever, open it.” She read another: “Build a step. Now build it again, taller — six times.”",
      "The builder watched the gate swing open by itself, and understood: a page that follows instructions can change long after it's built.",
    ],
    moral: "JavaScript is a list of instructions the browser follows — right away, or when something happens.",
    biome: "crystal",
  },
];

function rule(css: string, selector: string) {
  return declarationMap(parseCss(css).rules)[selector] ?? {};
}

const DECORATION = `
/* — colours only: nothing below moves anything — */
.start { background: #2f9e7a; border-color: #0f4d3c; }
.goal  { background: #e9a23b; border-color: #7a4a0c; }
`;

/* =========================================================================
 * Chapter 1 — HTML
 * ========================================================================= */

const HTML_LEVELS: Level[] = [
  {
    id: "html-1-elements",
    chapter: 1,
    number: 1,
    title: "Your First Element",
    concept: "<div>",
    edit: "html",
    learn: "Write an HTML element with an opening tag and a closing tag.",
    objective: "The path stops after one stone. Write more stones in the HTML until the path reaches the gold ledge.",
    lesson: [
      "A web page is built out of **elements**. Every element is a box on the page — and in this world, every box is a block you can stand on.",
      "You write an element with **tags**. An opening tag like `<div>` starts it, and a closing tag like `</div>` ends it. The closing tag has a `/` in it.",
      "`class=\"stone\"` inside the opening tag gives the element a name. The CSS for this level already says what a stone looks like, so every element named `stone` becomes a stone block.",
      `Dom can jump about ${ACROSS} across. Right now the gap after the last stone is 480px.`,
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<div class="stone"></div>', note: "one complete element" },
        { code: "<div", note: "the opening tag starts…" },
        { code: '    class="stone"', note: "…an attribute gives it a name…" },
        { code: ">", note: "…and the opening tag ends" },
        { code: "</div>", note: "the closing tag — note the /" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      'Find the one stone inside `<div class="path">`.',
      'On the empty line under the comment, type `<div class="stone"></div>`.',
      "Add a few more on new lines. Watch the path grow as you type.",
      "Walk and jump to the gold ledge.",
    ],
    reference: {
      title: "Elements",
      syntax: "<tag>content</tag>",
      entries: [
        { value: "<div></div>", meaning: "a box with nothing inside" },
        { value: '<div class="stone"></div>', meaning: "a box named stone" },
        { value: "<!-- a comment -->", meaning: "a note for people; the browser ignores it" },
      ],
    },
    hints: [
      "Look at the path: one stone, then a long empty gap. How many 100px stones would it take to fill 480px?",
      "There's already one stone in the HTML. What would a second one look like if you wrote it out?",
      'Look inside `<div class="path">`. Under the comment there is an empty line waiting for new stones.',
      'An element is an opening tag and a closing tag. `<div class="stone"></div>` is one whole stone with nothing inside it. Every copy you write inside the path adds one more block to the row.',
      'Under the comment, add this line four times: `<div class="stone"></div>`',
    ],
    debrief: {
      rule: "Every element is written as an opening tag and a closing tag. Write more elements, and the page has more boxes.",
      seenIn: 'Lists of posts, products or videos are the same element written again and again — one `<div class="card"></div>` per item.',
      fableLine: "She wrote the word stone — and a stone was there. She wrote it again, and there were two.",
    },
    quiz: {
      question: "Which of these is one complete element?",
      options: ['<div class="stone">', '<div class="stone"></div>', 'class="stone"', "</div>"],
      answer: 1,
      explain: "An element needs both its opening tag and its closing tag. The others are only pieces of one.",
    },
    html: `<div class="ledge start">start</div>

<div class="path">
  <div class="stone"></div>
  <!-- Write new stones on the lines below. -->

</div>

<div class="ledge goal">goal</div>
`,
    css: `/* The path lines its stones up side by side. */
.path {
  display: flex;
  position: absolute;
  left: 160px;
  bottom: 140px;
}

/* What every element named "stone" looks like. */
.stone {
  width: 100px;
  height: 30px;
  background: #8b9a7a;
  border: 4px solid #3f4b35;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".path > .stone") >= 4) return { gold: true };
      return { gold: false, note: "You made it across with fewer stones than planned — a brave jump. The path itself was the lesson." };
    },
  },

  {
    id: "html-2-attributes",
    chapter: 1,
    number: 2,
    title: "Names Give Things Shape",
    concept: "class",
    edit: "html",
    learn: "Use the class attribute to give an element a name that CSS can style.",
    objective: "Three elements in the path have no name, so they have no shape. Name them stone to fill the hole.",
    lesson: [
      "An **attribute** is extra information written inside an opening tag, like `class=\"stone\"`. It always looks like `name=\"value\"`.",
      "`class` is the most important one: it's how CSS finds an element. The CSS here only gives a height and colour to elements whose class is `stone`.",
      "The three plain `<div></div>` elements in the middle are really on the page — each takes up 110px of room — but with no class they have no height. There is nothing to stand on.",
      "Press **Flatten** to see the page itself: you'll see the gap, but not the unnamed elements.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<div></div>", note: "an element with no name" },
        { code: '<div class="stone"></div>', note: "the same element, named stone" },
        { code: '<div class="stone goal"></div>', note: "two names, separated by a space" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the three `<div></div>` lines with no class.",
      'Change each one to `<div class="stone"></div>`.',
      "Cross to the gold stone.",
    ],
    reference: {
      title: "Attributes",
      syntax: '<tag name="value">',
      entries: [
        { value: 'class="stone"', meaning: "a name CSS can select with .stone" },
        { value: 'class="stone goal"', meaning: "two classes on one element" },
        { value: 'id="exit"', meaning: "a unique name for one element" },
      ],
    },
    hints: [
      "Stand at the edge of the gap. The HTML has seven elements in the path, but you can only see four blocks. Where are the other three?",
      "What's different about the elements you can see and the ones you can't?",
      "Look at the three `<div></div>` lines in the middle of the path. Compare them with the lines above and below.",
      "CSS styles elements by their class. `.stone` gives height and colour only to elements with `class=\"stone\"`. An element with no class gets none of that — it takes up room but has no height.",
      'Change each of the three `<div></div>` lines to `<div class="stone"></div>`',
    ],
    debrief: {
      rule: 'Attributes add information to an element. `class="…"` is the name CSS uses to find it — no class, no style.',
      seenIn: 'Buttons on real sites often look different only because of a class: `<button class="primary">` versus `<button class="secondary">`.',
      fableLine: "When she wrote a name beside a thing, it took that name's shape.",
    },
    quiz: {
      question: 'What does class="stone" do?',
      options: ["It creates the element", "It gives the element a name CSS can select", "It makes the element 100px wide", "It closes the element"],
      answer: 1,
      explain: "The tags create the element. The class is a name — what the name looks like is decided by CSS.",
    },
    html: `<div class="path">
  <div class="stone start">start</div>
  <div class="stone"></div>
  <div></div>
  <div></div>
  <div></div>
  <div class="stone"></div>
  <div class="stone goal">goal</div>
</div>
`,
    css: `.path {
  display: flex;
  align-items: flex-start;
  position: absolute;
  left: 60px;
  bottom: 140px;
}

/* Every element in the path takes up 110px of room… */
.path > div {
  width: 110px;
}

/* …but only elements named "stone" get a height and a colour. */
.stone {
  height: 30px;
  background: #8b9a7a;
  border: 4px solid #3f4b35;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".path > div:not([class])") === 0) return { gold: true };
      return { gold: false, note: "You named enough of them to jump the rest. Every element can have a name — try naming all three next time." };
    },
  },

  {
    id: "html-3-nesting",
    chapter: 1,
    number: 3,
    title: "Boxes Inside Boxes",
    concept: "nesting",
    edit: "html",
    learn: "Put elements inside other elements, and see why the closing tag's position matters.",
    objective: "Three planks are lying outside the bridge. Move them inside it so the bridge reaches the gold ledge.",
    lesson: [
      "Elements can go **inside** other elements. The outer one is the **parent**; the ones inside it are its **children**.",
      "What's inside is decided by where the closing tag is. Everything between `<div class=\"bridge\">` and its `</div>` belongs to the bridge.",
      "The CSS says `.bridge .plank` — “a plank that is inside a bridge”. Planks outside the bridge don't match that rule, so they get no size at all.",
      "Indenting children with spaces doesn't change anything for the browser, but it makes the nesting easy for people to see.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<div class="bridge">', note: "the parent opens" },
        { code: '  <div class="plank"></div>', note: "a child: inside the parent" },
        { code: '  <div class="plank"></div>', note: "another child" },
        { code: "</div>", note: "the parent closes" },
        { code: '<div class="plank"></div>', note: "outside the parent" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      'Find the three `<div class="plank"></div>` lines below the bridge\'s closing `</div>`.',
      "Cut them and paste them above that `</div>`, next to the other two planks.",
      "Cross the bridge.",
    ],
    reference: {
      title: "Nesting",
      syntax: "<parent><child></child></parent>",
      entries: [
        { value: "parent", meaning: "the element that contains others" },
        { value: "child", meaning: "an element directly inside a parent" },
        { value: ".bridge .plank", meaning: "CSS: a plank anywhere inside a bridge" },
      ],
    },
    hints: [
      "The bridge has two planks. The HTML has five. Where are the missing three?",
      "Which `</div>` ends the bridge? Are all five planks before it?",
      'The last three planks come after the bridge\'s closing `</div>`, so they are not inside the bridge.',
      "An element contains everything between its opening and closing tags. `.bridge .plank` only styles planks inside the bridge — the three outside get no width or height, so they don't appear at all.",
      'Move the three `<div class="plank"></div>` lines up so they are above the bridge\'s `</div>`.',
    ],
    debrief: {
      rule: "An element contains everything between its opening and closing tags. Move the closing tag, and you change what's inside.",
      seenIn: "A navigation bar is a `<nav>` with links inside it. Put a link outside the `</nav>` and it stops looking like part of the menu.",
      fableLine: "When she wrote one thing inside another, it stayed inside.",
    },
    quiz: {
      question: 'In `<div class="a"><div class="b"></div></div>`, which element is the child?',
      options: ["a", "b", "both", "neither"],
      answer: 1,
      explain: "b is written between a's opening and closing tags, so b is inside a — b is the child, a is the parent.",
    },
    html: `<div class="ledge start">start</div>

<div class="bridge">
  <div class="plank"></div>
  <div class="plank"></div>
</div>

<div class="plank"></div>
<div class="plank"></div>
<div class="plank"></div>

<div class="ledge goal">goal</div>
`,
    css: `.bridge {
  display: flex;
  position: absolute;
  left: 160px;
  bottom: 140px;
}

/* Only planks INSIDE a bridge are planks. */
.bridge .plank {
  width: 120px;
  height: 24px;
  background: #a38a64;
  border: 4px solid #54432a;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; width: 140px; }
.goal { left: 760px; width: 120px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".bridge > .plank") >= 4) return { gold: true };
      return { gold: false, note: "Solved — the lesson's move was putting the planks inside the bridge." };
    },
  },

  {
    id: "html-4-div-span",
    chapter: 1,
    number: 4,
    title: "A Box of Its Own",
    concept: "div / span",
    edit: "html",
    learn: "Choose div for a block of its own, and turn bare words into real elements.",
    objective: "Two planks of the walkway are lying around as plain text, invisible to CSS. Wrap each one in a div, in the right spot, to raise it into place.",
    lesson: [
      "`<div>` and `<span>` do nothing by themselves — no colour, no size. They're the two plainest elements, and each has one job.",
      "`<div>` is a **block**: on its own line, made for holding a whole section. `<span>` is **inline**: it sits inside a line of text, for styling one word without breaking the sentence — like *“the price is `<span class=\"sale\">`$9`</span>` today.”*",
      "But `b2` and `b3` written as bare words, with no tags at all, aren't elements — they're just text sitting on the page. CSS can only select **elements**. A class, a tag name, an id — all of them point at an element. Plain text matches nothing.",
      "Each plank of this walkway is placed by its own class — `b1`, `b2`, `b3`, `b4`. Wrap a bare word in `<div class=\"board b2\"></div>` and it becomes a real, positioned element.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "b2", note: "plain text — not an element, invisible to CSS" },
        { code: '<div class="board b2"></div>', note: "a real, positioned element" },
        { code: '<p>Trail marker <span class="hl">this way</span>.</p>', note: "span styles one word inside a sentence" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the two bare lines that just say `b2` and `b3`, with no tags around them.",
      'Wrap each one: `<div class="board b2"></div>` and `<div class="board b3"></div>`.',
      "Cross the walkway.",
    ],
    reference: {
      title: "div and span",
      syntax: "<div>…</div>  ·  <span>…</span>",
      entries: [
        { value: "<div>", meaning: "a block-level box, on its own line — for structure" },
        { value: "<span>", meaning: "an inline box, inside a line — for styling text" },
        { value: "plain text", meaning: "not an element — no tag, so CSS can't select it" },
      ],
    },
    hints: [
      "Two of the four planks are missing. The HTML mentions them, though — look closely at what's actually written where they should be.",
      "The words \"b2\" and \"b3\" are right there in the code. Are they inside a tag, or just sitting on their own?",
      "Compare a working plank, `<div class=\"board b1\"></div>`, with the two bare lines that just say `b2` and `b3`.",
      "CSS selectors only match elements — a tag with a name or class. Bare text with no `<div>` around it isn't an element at all, so no rule can find it or size it. It needs both the `board` class (for its look) and its own position class.",
      'Change the bare lines to `<div class="board b2"></div>` and `<div class="board b3"></div>`.',
    ],
    debrief: {
      rule: "Only real elements can be styled. Bare text matches no CSS selector. div is a block for structure; span is inline, for styling text in place.",
      seenIn: "A price with a struck-through original: `<span class=\"old\">$40</span> <span class=\"sale\">$25</span>` — two inline spans in one line of text.",
      fableLine: "She wrote the word stone — and a stone was there.",
    },
    quiz: {
      question: "Why doesn't the bare word “b2” appear as a plank in the world?",
      options: ["It's spelled wrong", "It isn't inside any element, so no CSS rule can select it", "div only works with numbers", "It needs a semicolon"],
      answer: 1,
      explain: "CSS selects elements. Plain text with no tag around it is not an element, so `.board` and `.b2` have nothing to style.",
    },
    html: `<div class="ledge start">start</div>

<div class="board b1"></div>
board
board
<div class="board b4"></div>

<!-- span is for styling a word inside a line, e.g.: -->
<!-- <p>Trail marker <span class="hl">this way</span>.</p> -->

<div class="ledge goal">goal</div>
`,
    css: `.board {
  position: absolute;
  bottom: 140px;
  width: 110px;
  height: 28px;
  background: #6fa78f;
  border: 4px solid #2c5747;
  box-sizing: border-box;
}
.b1 { left: 160px; }
.b2 { left: 280px; }
.b3 { left: 400px; }
.b4 { left: 520px; }

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 650px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".board.b2") >= 1 && ctx.count(".board.b3") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the missing planks needed to become real elements, wrapped in a div." };
    },
  },

  {
    id: "html-5-semantic",
    chapter: 1,
    number: 5,
    title: "The Watchtower",
    concept: "semantic tags",
    edit: "html",
    learn: "Use tags that describe what a section is for — header, nav, main and footer — instead of an unlabelled div.",
    objective: "Two floors of the watchtower are just unlabelled boxes, and no rule styles those. Give them their real tags to climb to the flag.",
    lesson: [
      "A `<div>` says nothing about what it holds. HTML also has **semantic** tags that name a section by its job: `<header>` (top matter), `<nav>` (links to get around), `<main>` (the page's one main content area) and `<footer>` (bottom matter).",
      "They act just like a `<div>` on the page — but their name is real information. Browsers, search engines, and people using screen readers all use it to understand the page's shape, not just its looks.",
      "The CSS for this tower has a separate rule for each tag: `header`, `nav`, `main`, `footer`. Only an element with the *exact right tag name* gets floor-sized — a `<div>`, whatever its class, matches none of them.",
      "Each floor needs to be no more than " + UP + " above the one below, so the tags have to climb in the same order the CSS expects.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<header>site title</header>", note: "top matter" },
        { code: "<nav>links</nav>", note: "navigation" },
        { code: "<main>the content</main>", note: "the one main area" },
        { code: "<footer>copyright</footer>", note: "bottom matter" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the two `<div class=\"deck\">` floors partway up the tower.",
      "Change their tags to the ones the CSS is waiting for: `<header>` and `<nav>`.",
      "Climb the tower to the flag.",
    ],
    reference: {
      title: "Semantic landmarks",
      syntax: "<header> <nav> <main> <footer>",
      entries: [
        { value: "<header>", meaning: "top matter — a logo, a title" },
        { value: "<nav>", meaning: "a block of links for getting around" },
        { value: "<main>", meaning: "the one main content area of the page" },
        { value: "<footer>", meaning: "bottom matter — copyright, links" },
      ],
    },
    hints: [
      "You can climb the bottom floor, but the next two rungs aren't there. The HTML has boxes at that height — so why doesn't the CSS see them?",
      "Every real floor has a different tag: `header`, `nav`, `main`, `footer`. Do the missing two use one of those, or something else?",
      "Look for `<div class=\"deck\">` — twice. Compare its tag to the floors above and below it.",
      "The CSS rules here are written for exact tag names — `header { … }`, `nav { … }` — not for a class. A `<div class=\"deck\">`, whatever it's called, will never match `header { … }`.",
      'Change the two `<div class="deck">` tags to `<header>` and `<nav>` (keep their closing tags matching).',
    ],
    debrief: {
      rule: "Semantic tags like header, nav, main and footer are elements just like div — but their tag name is meaningful information, not just a hook for CSS.",
      seenIn: "View source on almost any real site: the page is usually a header, a nav, one main, and a footer, with divs only inside them for layout.",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "What is the main practical difference between <div> and <header>?",
      options: [
        "header is bigger by default",
        "div can't hold other elements",
        "header's tag name itself says what the section is for",
        "There is no difference",
      ],
      answer: 2,
      explain: "Both are ordinary block boxes. header's name is meaningful to browsers, search engines and screen readers — div's isn't.",
    },
    html: `<footer class="ground start">start</footer>
<div class="deck"></div>
<div class="deck"></div>
<main class="flag goal">flag</main>
`,
    css: `header, nav, main, footer {
  position: absolute;
  left: 40px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}

footer { bottom: 40px;  width: 240px; background: #8b7a5a; border-color: #423824; }
header { bottom: 130px; width: 190px; background: #7c8fbf; border-color: #33436e; }
nav    { bottom: 220px; width: 150px; background: #d7a34c; border-color: #6e4f11; }
main   { bottom: 310px; width: 110px; background: #6fb08a; border-color: #275036; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("header") >= 1 && ctx.count("nav") >= 1 && ctx.count(".deck") === 0) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was naming the two decks with their real semantic tags." };
    },
  },

  {
    id: "html-6-id-class",
    chapter: 1,
    number: 6,
    title: "The Keystone",
    concept: "id / class",
    edit: "html",
    learn: "Tell an id (one, unique element) apart from a class (any number of elements).",
    objective: "The keystone in the middle of the bridge has no shape. Give it the one attribute its CSS rule is looking for.",
    lesson: [
      "`class` names a *kind* of element — any number of elements can share one. `id` names *one specific* element — it should only ever be used once on a page.",
      "In CSS, a class is selected with a dot: `.stone`. An id is selected with a hash: `#keystone`. They are not interchangeable — `#keystone` matches only `id=\"keystone\"`, never `class=\"keystone\"`.",
      "The ordinary stones on this bridge all share `class=\"stone\"`. The keystone in the middle is special: only one exists, so it gets an `id` instead, and a CSS rule written with `#`.",
      "IDs have a second job you'll meet later: a link like `href=\"#keystone\"` can jump straight to the element with that id.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<div class="stone"></div>', note: "one of several — class" },
        { code: '<div class="stone"></div>', note: "another one — same class" },
        { code: '<div id="keystone"></div>', note: "the only one — id" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the middle block of the bridge — it currently has `class=\"keystone\"`.",
      "The CSS rule for it is `#keystone`, not `.keystone`. Change its attribute to `id=\"keystone\"`.",
      "Cross the bridge.",
    ],
    reference: {
      title: "id vs class",
      syntax: '#name { }  ·  .name { }',
      entries: [
        { value: 'class="stone"', meaning: "any number of elements — selected with .stone" },
        { value: 'id="keystone"', meaning: "exactly one element — selected with #keystone" },
        { value: "#keystone", meaning: "CSS: matches id=\"keystone\" only, never a class" },
      ],
    },
    hints: [
      "Every other stone on the bridge is solid. The middle one, the keystone, has no shape at all — but it's written in the HTML.",
      "Look at the CSS: is the keystone's rule written with a dot or a hash? Now look at the HTML's attribute on that block.",
      "The CSS has `#keystone { … }`. The HTML block currently has `class=\"keystone\"`.",
      "A hash selector (`#keystone`) only matches an element whose `id` is exactly that — it ignores class entirely. `class=\"keystone\"` and `id=\"keystone\"` look similar but mean different things to CSS.",
      'Change `class="keystone"` to `id="keystone"` on the middle block.',
    ],
    debrief: {
      rule: "class (`.name`) can label many elements; id (`#name`) should label exactly one, and only an id matches a `#` selector.",
      seenIn: "A page usually has one `id=\"main-nav\"` for its single navigation bar, but many elements share `class=\"nav-link\"`.",
      fableLine: "When she wrote a name beside a thing, it took that name's shape.",
    },
    quiz: {
      question: "Which attribute should never be reused on more than one element in a page?",
      options: ["class", "id", "style", "href"],
      answer: 1,
      explain: "id names one specific element. Reusing it is invalid — that's exactly why #keystone couldn't find a class=\"keystone\" element.",
    },
    html: `<div class="ledge start">start</div>

<div class="stone st1"></div>
<div class="keystone"></div>
<div class="stone st2"></div>

<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 120px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 670px; }

.stone, #keystone {
  position: absolute;
  bottom: 140px;
  width: 90px;
  height: 26px;
  box-sizing: border-box;
}
.stone { background: #9aa3ad; border: 4px solid #454d57; }
.st1 { left: 190px; }
.st2 { left: 530px; }

/* The one keystone — selected by id, not class. */
#keystone {
  left: 360px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("#keystone") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the keystone's rule was written as an id selector, so it needed id=\"keystone\", not a class." };
    },
  },

  {
    id: "html-7-data-attrs",
    chapter: 1,
    number: 7,
    title: "The Sleeping Drawbridge",
    concept: "data-*",
    edit: "html",
    learn: "Store your own information on an element with a data-* attribute, and let CSS read it.",
    objective: "The drawbridge is marked as closed. Change its data attribute so it's open wide enough to cross.",
    lesson: [
      "You can invent your own attributes, as long as the name starts with `data-`. The browser doesn't know what they mean — but your own CSS (and later, JavaScript) can read them.",
      "`data-open=\"false\"` and `data-open=\"true\"` are just text values on the drawbridge. This level's CSS has a rule that only matches when that value is exactly `\"true\"`.",
      "This is the same idea as `class`, generalised: instead of a name that's just on or off, an attribute can hold any value you choose — a state, a count, an id from a database.",
      "Later, in JavaScript, you'll flip a `data-*` attribute like this one with code instead of typing it by hand.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<div class="gate" data-open="false"></div>', note: "closed" },
        { code: '<div class="gate" data-open="true"></div>', note: "open" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find `data-open=\"false\"` on the drawbridge.",
      'Change it to `data-open="true"`.',
      "Cross the moat.",
    ],
    reference: {
      title: "data-* attributes",
      syntax: 'data-name="value"',
      entries: [
        { value: 'data-open="true"', meaning: "a custom flag CSS or JS can read" },
        { value: '.gate[data-open="true"]', meaning: "CSS: a gate whose data-open is exactly true" },
        { value: 'data-count="3"', meaning: "any text you like — not just true/false" },
      ],
    },
    hints: [
      "The drawbridge is in the HTML, sitting right at the edge of the moat — but it's far too narrow to stand on.",
      "The drawbridge has an attribute that starts with `data-`. What value does it currently hold?",
      "Look for `data-open=\"false\"`. The CSS has a rule for a gate whose `data-open` is `\"true\"`.",
      "`[data-open=\"true\"]` in CSS matches only when that attribute's value is exactly the text `true`. `\"false\"` doesn't match it, so the bridge stays at its narrow, closed width.",
      'Change `data-open="false"` to `data-open="true"`.',
    ],
    debrief: {
      rule: "A data-* attribute holds a value you invent. `[data-name=\"value\"]` in CSS matches only that exact value.",
      seenIn: "A tabs widget often marks the open tab with `data-state=\"active\"`, and its CSS styles `[data-state=\"active\"]` differently.",
      fableLine: "When she wrote a name beside a thing, it took that name's shape.",
    },
    quiz: {
      question: "Which attribute name is a valid custom data attribute?",
      options: ["open-data", "data-open", "data_open", "open"],
      answer: 1,
      explain: "Custom attributes must start with the exact prefix `data-`, followed by your own name.",
    },
    html: `<div class="bank start">start</div>
<div class="gate" data-open="false"></div>
<div class="bank goal">goal</div>
`,
    css: `.bank {
  position: absolute;
  bottom: 140px;
  width: 160px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

.gate {
  position: absolute;
  left: 200px;
  bottom: 140px;
  width: 20px;
  height: 30px;
  background: #8c7ad1;
  border: 4px solid #3b2f73;
  box-sizing: border-box;
  transition: width 0.3s ease;
}

/* Only a gate with data-open="true" widens into a bridge. */
.gate[data-open="true"] {
  width: 380px;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count('.gate[data-open="true"]') >= 1) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was flipping data-open to \"true\"." };
    },
  },

  {
    id: "html-8-headings",
    chapter: 1,
    number: 8,
    title: "The Order of Voices",
    concept: "headings",
    edit: "html",
    learn: "Use h1–h6 in order, one h1 per page, instead of picking a heading by how big you want it.",
    objective: "A second heading is shouting the same rank as the first, so this world doesn't show it at all. Give it its proper, lower rank.",
    lesson: [
      "`<h1>` through `<h6>` are headings — `<h1>` is the most important, `<h6>` the least. A page should have exactly one `<h1>` (its title), then `<h2>`s for its main sections, `<h3>`s inside those, and so on.",
      "Screen readers let people jump between headings like a table of contents — so the order has to make sense, not just look right. Don't pick `<h3>` because you want smaller text; that's what CSS is for.",
      "This level's CSS enforces the rule literally: a second `<h1>` is simply not shown, because a page should only ever have one. It isn't a real browser default — this world just makes the rule impossible to ignore.",
      "The next rank down, `<h2>`, has no such limit here and renders normally.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<h1>Page Title</h1>", note: "one per page" },
        { code: "<h2>A Section</h2>", note: "a main section" },
        { code: "<h3>A Subsection</h3>", note: "inside that section" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the second `<h1>` heading — it's there in the code, but not in the world.",
      "Change it to `<h2>` (both its opening and closing tag).",
      "Cross the row of headings.",
    ],
    reference: {
      title: "Heading levels",
      syntax: "<h1> … <h6>",
      entries: [
        { value: "<h1>", meaning: "the page's one title" },
        { value: "<h2>", meaning: "a main section" },
        { value: "<h3>…<h6>", meaning: "nested subsections, in order" },
      ],
    },
    hints: [
      "The first heading is solid ground. After it, there's a long empty stretch — but the HTML has another heading written right there.",
      "Count the `<h1>` tags in the HTML. How many are there?",
      "There are two `<h1>`s, one right after the other. This CSS only shows the *first* heading of each level.",
      "A page should only have one `<h1>`. This level makes that literal: `h1:not(:first-of-type) { display: none; }` hides any h1 after the first. Ranking the second one down to `<h2>` gets it its own, visible spot.",
      "Change the second `<h1>…</h1>` to `<h2>…</h2>`.",
    ],
    debrief: {
      rule: "Headings form an outline: one h1, then h2, h3 and so on in order. Pick a level for its meaning, not for its size.",
      seenIn: "Article pages: one h1 for the headline, h2 for each major section, h3 for a subsection inside one of those.",
      fableLine: "A web page is made of elements. Write one down, and it exists.",
    },
    quiz: {
      question: "How many <h1> elements should a typical page have?",
      options: ["As many as you like", "Exactly one", "One per section", "Zero — use <h2> instead"],
      answer: 1,
      explain: "h1 marks the page's single title. Using it more than once confuses the outline the heading levels are meant to describe.",
    },
    html: `<h1 class="start">start</h1>
<h1 class="voice"></h1>
<h4 class="goal">goal</h4>
`,
    css: `h1, h2, h3, h4 {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}

h1 { background: #c96a6a; border-color: #6e2323; }
h2 { background: #cf9a52; border-color: #6e4f11; }
h3 { background: #cbb84a; border-color: #665e10; }
h4 { background: #8fbf7d; border-color: #33502b; }

/* A page should only have one h1 — a second one isn't shown. */
h1:not(:first-of-type) {
  display: none;
}

.start { left: 20px; }
.voice { left: 210px; }
.goal { left: 500px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("h1") === 1 && ctx.count("h2.voice") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the fix was ranking the second heading h2, not repeating h1." };
    },
  },

  {
    id: "html-9-paragraphs",
    chapter: 1,
    number: 9,
    title: "The Scroll of Notes",
    concept: "<p>",
    edit: "html",
    learn: "Write separate paragraphs with <p>, one per idea, instead of one long block of text.",
    objective: "The scout's notes are one giant paragraph. Split them into three, one per stepping stone, to cross the gap.",
    lesson: [
      "`<p>` marks one **paragraph** — a self-contained block of text, one idea at a time. Like `<div>`, it's a block: each one starts on its own line.",
      "Every `<p>` in this trail becomes its own stepping stone, however long or short its text is — the CSS gives every paragraph the same fixed width.",
      "So cramming three ideas into one `<p>` doesn't make a wider stone — it just makes one stone with a lot of text in it. Three separate `<p>`s make three stones.",
      "This mirrors real writing: a wall of text is one paragraph no matter how long; breaking it into a few gives the reader three places to land, not one.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<p>First idea.</p>", note: "one paragraph" },
        { code: "<p>Second idea.</p>", note: "another — a new stone" },
        { code: "<p>First idea. Second idea.</p>", note: "still just one stone" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the single `<p>` holding all three notes.",
      "Split its text into three separate `<p>…</p>` elements.",
      "Step across the notes.",
    ],
    reference: {
      title: "Paragraphs",
      syntax: "<p>one idea</p>",
      entries: [
        { value: "<p>text</p>", meaning: "one paragraph — one block" },
        { value: "<p>a</p><p>b</p>", meaning: "two paragraphs — two blocks" },
        { value: "<p>a b</p>", meaning: "one paragraph, however long" },
      ],
    },
    hints: [
      "There's one wide stepping stone where three are needed. The HTML has all the text already — just not split up.",
      "Count the `<p>` tags in the trail. How many separate paragraphs are there, versus how many stones are needed?",
      "All three notes — “left”, “right”, “straight on” — are sitting inside one pair of `<p></p>` tags.",
      "Each `<p>` becomes one stone, sized the same regardless of its text. One long paragraph is one stone; three short ones are three stones with gaps a jump can cross.",
      "Split the one `<p>` into three: `<p>left</p><p>right</p><p>straight on</p>`.",
    ],
    debrief: {
      rule: "A paragraph is a block, however much or little text it holds. Splitting text into more paragraphs means more elements, not more content.",
      seenIn: "A blog post is a stack of `<p>` elements, one per paragraph — never one `<p>` for the whole article.",
      fableLine: "She wrote the word stone — and a stone was there. She wrote it again, and there were two.",
    },
    quiz: {
      question: "Does putting more sentences inside one <p> make it a wider box?",
      options: ["Yes, always", "No — this CSS gives every <p> the same width regardless of its text", "Only if the sentences rhyme", "Only inside a <div>"],
      answer: 1,
      explain: "The element's size here comes from CSS, not its content. More text in one paragraph is still one element.",
    },
    html: `<div class="ledge start">start</div>

<div class="trail">
  <p class="note">left, right, straight on</p>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.trail {
  display: flex;
  gap: 6px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.note {
  width: 100px;
  height: 28px;
  margin: 0;
  background: #d8c090;
  border: 4px solid #7a5a2a;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 560px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".trail > .note") >= 3) return { gold: true };
      return { gold: false, note: "Solved — the fix was splitting the one paragraph into three separate <p> elements." };
    },
  },

  {
    id: "html-10-emphasis",
    chapter: 1,
    number: 10,
    title: "The Unspoken Word",
    concept: "strong / em",
    edit: "html",
    learn: "Use strong and em to mark up a word's real importance, not just to make it bold or italic.",
    objective: "One word on the ledge is floating loose, unwrapped, so it has no weight. Give it the tag its rock is waiting for.",
    lesson: [
      "`<strong>` marks text of **strong importance** — a warning, a key term. `<em>` marks text with **emphasis** — the word you'd stress if you said the sentence aloud. Browsers show them bold and italic by default, but that's a side effect, not their meaning.",
      "Like any tag, they only work if the text is actually wrapped in them. The word `raise` sitting on its own, with no tags, is invisible to CSS — the same trap as a bare word left out of a `<div>`.",
      "This level's CSS gives `strong` a real size and colour of its own, turning it into a stepping stone the moment it exists as an element.",
      "Notice the torch made from `<em>rise</em>` a little further on — already correctly wrapped, lighting the way. Yours should look the same shape.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "raise", note: "plain text — no element, no style" },
        { code: "<strong>raise</strong>", note: "a real element: important text" },
        { code: "<em>rise</em>", note: "a real element: emphasised text" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the bare word `raise`, with no tags around it.",
      "Wrap it: `<strong>raise</strong>`.",
      "Step onto it, then on to the goal.",
    ],
    reference: {
      title: "strong and em",
      syntax: "<strong>…</strong>  ·  <em>…</em>",
      entries: [
        { value: "<strong>", meaning: "strong importance (shown bold by default)" },
        { value: "<em>", meaning: "stressed emphasis (shown italic by default)" },
        { value: "<b> / <i>", meaning: "bold/italic look only, with no meaning attached" },
      ],
    },
    hints: [
      "There's a lit torch further along made from a tag you already know the shape of. The stone before it is missing — but the word for it is right there in the HTML.",
      "Find the word `raise` in the HTML. Is it inside any tag at all?",
      "Compare it to `<em>rise</em>` just after it — same idea, different tag, same shape of fix.",
      "Bare text isn't an element, so no CSS rule can give it a size. `<strong>` is a real tag with its own CSS rule here, exactly like `<em>` does for the torch beside it.",
      "Wrap the bare word: `<strong>raise</strong>`.",
    ],
    debrief: {
      rule: "strong and em are real elements with real meaning — importance and emphasis — not just a bold or italic switch. Bare text is never an element.",
      seenIn: "A warning banner's key phrase is usually wrapped in `<strong>`, not just given a bold CSS style, so screen readers announce it as important.",
      fableLine: "She wrote the word stone — and a stone was there.",
    },
    quiz: {
      question: "What's the main difference between <strong> and <b>?",
      options: [
        "strong is bigger",
        "strong marks real importance; b is just a bold look with no meaning",
        "b can't hold text",
        "There is no difference",
      ],
      answer: 1,
      explain: "Both often render bold, but <strong> tells browsers, search engines and screen readers the text actually matters.",
    },
    html: `<div class="ledge start">start</div>
raise
<em class="light">rise</em>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

strong, em.light {
  display: inline-block;
  position: absolute;
  bottom: 140px;
  width: 130px;
  height: 30px;
  box-sizing: border-box;
  text-indent: -9999px;
}
strong { left: 220px; background: #cf9a52; border: 4px solid #6e4f11; }
em.light { left: 400px; background: #e0b85f; border: 4px solid #6b4e1a; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("strong") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the missing stone needed the real <strong> element, not just its text." };
    },
  },

  {
    id: "html-11-lists",
    chapter: 1,
    number: 11,
    title: "The Numbered Trail",
    concept: "ul / ol / li",
    edit: "html",
    learn: "Build a list with ol/ul and li, and see why an li outside its list doesn't count as one.",
    objective: "Two steps of the trail are stray divs sitting outside the list. Turn them into list items and move them inside it.",
    lesson: [
      "A list has a container — `<ol>` for an **ordered** (numbered) list, `<ul>` for an **unordered** one — and each entry is an `<li>`, a **list item**.",
      "An `<li>` belongs *inside* an `<ol>` or `<ul>`. This level's CSS selects `.trail li` — “an `<li>` somewhere inside `.trail`” — combining two things you've already learned: the right tag, nested in the right place.",
      "A `<div>`, whatever it's called, is not a list item — and an `<li>` sitting outside the list isn't “somewhere inside `.trail`” either. Both need fixing.",
      "Order matters in an `<ol>`: it numbers steps 1, 2, 3… in the order you write them, which is exactly the order Dom needs to cross them.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<ol class=\"trail\">", note: "an ordered list" },
        { code: "  <li>first step</li>", note: "a list item, inside" },
        { code: "  <li>second step</li>", note: "another" },
        { code: "</ol>", note: "" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the two `<div class=\"notch\"></div>` lines sitting after the `</ol>`.",
      "Change each to `<li></li>`, and move both lines above the `</ol>`.",
      "Walk the trail to the goal.",
    ],
    reference: {
      title: "Lists",
      syntax: "<ol>/<ul> then <li> inside",
      entries: [
        { value: "<ol><li>…</li></ol>", meaning: "a numbered list — order matters" },
        { value: "<ul><li>…</li></ul>", meaning: "a bulleted list — order doesn't matter" },
        { value: ".trail li", meaning: "CSS: an li that is somewhere inside .trail" },
      ],
    },
    hints: [
      "The trail has two solid steps, then a gap, then two more elements sitting outside the trail entirely.",
      "Look at those two stray boxes after the list closes. What tag are they, and are they inside the `<ol>`?",
      "They're `<div class=\"notch\">`, sitting below the list's closing `</ol>` — wrong tag, and outside the list, both at once.",
      "`.trail li` needs both things true: the element must be an `<li>`, and it must be nested inside `.trail`. A div, or an li outside the list, matches neither the tag nor the nesting.",
      'Change both `<div class="notch"></div>` lines to `<li></li>` and move them above the `</ol>`, next to the other steps.',
    ],
    debrief: {
      rule: "li is a list item, meaningful only inside ol or ul. A selector like `.trail li` needs the right tag *and* the right nesting.",
      seenIn: "Every navigation menu's links usually sit inside `<li>`s inside a `<ul>` — `nav ul li a { … }` is one of the most common selectors on the web.",
      fableLine: "When she wrote one thing inside another, it stayed inside.",
    },
    quiz: {
      question: "For the selector `.trail li` to match an element, what must be true?",
      options: [
        "It must be an li, anywhere on the page",
        "It must be inside .trail, whatever its tag",
        "It must be an li AND be nested inside an element with class trail",
        "It must be the first child of .trail",
      ],
      answer: 2,
      explain: "A descendant selector like `.trail li` requires both conditions: the right tag, nested inside the right ancestor.",
    },
    html: `<div class="ledge start">start</div>

<ol class="trail">
  <li></li>
  <li></li>
</ol>
<div class="notch"></div>
<div class="notch"></div>

<div class="ledge goal">goal</div>
`,
    css: `.trail {
  display: flex;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.trail li {
  width: 100px;
  height: 30px;
  background: #a38a64;
  border: 4px solid #54432a;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".trail > li") >= 4) return { gold: true };
      return { gold: false, note: "Solved — the fix needed both the li tag and moving it inside the ol." };
    },
  },

  {
    id: "html-12-links",
    chapter: 1,
    number: 12,
    title: "The Open Door",
    concept: "a href",
    edit: "html",
    learn: "Turn text into a real link with <a href>, and see why href is what makes it one.",
    objective: "A signpost sits on the path with no destination. Give it an href so it becomes a real, crossable link.",
    lesson: [
      "`<a>` makes a **link** — but only once it has an `href` attribute, the address it points to. An `<a>` with no `href` isn't clickable and isn't really a link yet, just text sitting in an anchor tag.",
      "`href` can point to another page (`href=\"/about\"`), somewhere else on the same page (`href=\"#keystone\"`, matching an `id` you met earlier), or, for practice, a placeholder like `href=\"#\"`.",
      "This level's CSS only widens the signpost into a full plank once it has *some* `href` — `a[href]` matches any anchor with that attribute present, whatever it points to.",
      "You'll meet what a link's address actually looks like — relative to this page, or a full absolute address — in the next lesson.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<a>next</a>", note: "not a real link yet — no href" },
        { code: '<a href="#next">next</a>', note: "a real link" },
        { code: '<a href="https://example.com">example</a>', note: "a link to another site" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the `<a class=\"sign\">next</a>` with no `href`.",
      'Add an address: `<a href="#next" class="sign">next</a>`.',
      "Cross to the goal.",
    ],
    reference: {
      title: "Links",
      syntax: '<a href="…">text</a>',
      entries: [
        { value: 'href="#next"', meaning: "a place on this page" },
        { value: 'href="/about"', meaning: "another page on this site" },
        { value: "a[href]", meaning: "CSS: any anchor that has an href at all" },
      ],
    },
    hints: [
      "The signpost is right there, just too narrow to stand on. It's already an `<a>` tag.",
      "A link needs a destination to really be a link. Does this `<a>` have one?",
      "Look for `<a class=\"sign\">next</a>` — there's no `href` attribute at all.",
      "The CSS rule `a[href]` only matches an anchor that has an `href` attribute present. Without one, it stays at its narrow default width.",
      'Add `href="#next"` to the anchor: `<a href="#next" class="sign">next</a>`.',
    ],
    debrief: {
      rule: "An <a> only becomes a real, followable link once it has an href. No href, no destination.",
      seenIn: "A styled “button” on a site that does nothing when clicked is almost always an <a> with no href, or one pointing at \"#\".",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "What makes <a>next</a> a working link?",
      options: ["Nothing needs to change — it already is one", "Adding an href attribute", "Making the text blue", "Wrapping it in a <div>"],
      answer: 1,
      explain: "Without href, an <a> has no destination — it isn't really a link yet, just anchor-shaped text.",
    },
    html: `<div class="ledge start">start</div>
<a class="sign">next</a>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

a.sign {
  display: inline-block;
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 20px;
  height: 30px;
  box-sizing: border-box;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  text-indent: -9999px;
}

/* Only an anchor that actually has an href widens into a plank. */
a.sign[href] {
  width: 300px;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("a.sign[href]") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was giving the anchor a real href." };
    },
  },

  {
    id: "html-13-link-target",
    chapter: 1,
    number: 13,
    title: "The Unlatched Door",
    concept: "target / rel",
    edit: "html",
    learn: "Open a link in a new tab safely, with target=\"_blank\" and rel=\"noopener\".",
    objective: "The portal only fully opens for a link that leaves a new tab AND locks the door behind it. Add both attributes.",
    lesson: [
      "`target=\"_blank\"` opens a link in a **new tab** instead of replacing the page you're on — handy for sending someone away without losing your own page.",
      "But a new tab opened this way can, by default, reach back into the page that opened it with JavaScript — enough to quietly redirect it. This is a real, well-known risk called *reverse tabnabbing*.",
      "`rel=\"noopener\"` closes that door: the new tab can no longer see or control the page that opened it. Whenever you write `target=\"_blank\"`, get in the habit of writing `rel=\"noopener\"` right beside it.",
      "This level's CSS only fully opens the portal when *both* attributes are present together — one alone isn't enough.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<a href="https://x.com" target="_blank">visit</a>', note: "opens a new tab — but unsafely" },
        { code: '<a href="https://x.com" target="_blank" rel="noopener">visit</a>', note: "new tab, door locked behind it" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the portal's `<a href=\"#\">` link.",
      'Add `target="_blank" rel="noopener"` to it.',
      "Step through the portal.",
    ],
    reference: {
      title: "Safe new-tab links",
      syntax: 'target="_blank" rel="noopener"',
      entries: [
        { value: 'target="_blank"', meaning: "open the link in a new tab" },
        { value: 'rel="noopener"', meaning: "stop the new tab reaching back into this page" },
        { value: 'a[target="_blank"][rel~="noopener"]', meaning: "CSS: both attributes present together" },
      ],
    },
    hints: [
      "The portal is dim and narrow. Its `<a>` tag already has an `href`, like the last lesson — but something more is needed here.",
      "What's the extra risk of a link that opens a whole new tab, that a same-page link doesn't have?",
      "The CSS is looking for two attributes on the same anchor, together: one that opens a new tab, one that locks it down.",
      "`target=\"_blank\"` opens a new tab; on its own, that new tab can reach back and redirect this page. `rel=\"noopener\"` prevents that. Both are needed together.",
      'Add `target="_blank" rel="noopener"` to the portal\'s `<a>` tag.',
    ],
    debrief: {
      rule: "target=\"_blank\" opens a new tab; pair it with rel=\"noopener\" so that tab can't reach back into the page that opened it.",
      seenIn: "Almost every “opens in a new tab” link on a well-built site — ads, share buttons, outbound links — carries rel=\"noopener\" (or \"noopener noreferrer\").",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "Why pair target=\"_blank\" with rel=\"noopener\"?",
      options: [
        "It makes the link load faster",
        "Without it, the new tab can reach back and control the page that opened it",
        "It's required by every browser or the link won't work",
        "It changes the link's colour",
      ],
      answer: 1,
      explain: "By default, a target=\"_blank\" tab can access window.opener and redirect the original page — rel=\"noopener\" blocks that.",
    },
    html: `<div class="ledge start">start</div>
<a href="#" class="portal">beyond</a>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 660px; }

a.portal {
  display: inline-block;
  position: absolute;
  left: 240px;
  bottom: 140px;
  width: 60px;
  height: 30px;
  box-sizing: border-box;
  background: #5b4a6e;
  border: 4px dashed #2b2140;
  text-indent: -9999px;
}

/* Fully materialises only with both attributes present. */
a.portal[target="_blank"][rel~="noopener"] {
  width: 340px;
  background: #6fa78f;
  border: 4px solid #2c5747;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count('a.portal[target="_blank"][rel~="noopener"]') >= 1) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was adding both target=\"_blank\" and rel=\"noopener\" together." };
    },
  },

  {
    id: "html-14-images",
    chapter: 1,
    number: 14,
    title: "The Framed Picture",
    concept: "<img>",
    edit: "html",
    learn: "Size an image with its own width and height attributes, not with CSS.",
    objective: "The picture on the wall has no size at all. Give it width and height attributes so it becomes a full-sized plank.",
    lesson: [
      "`<img>` is a **void** element — it never has a closing tag or content, just attributes. `src` says which picture to load; `alt` describes it in words, for anyone who can't see it.",
      "Unlike most elements, `width` and `height` can be set as **HTML attributes**, right on the tag — `<img width=\"140\" height=\"30\">` — not just in CSS. This lets the browser reserve the right space before the picture even finishes loading, so the page doesn't jump around.",
      "This picture's file is a tiny, valid image — but with no width or height given anywhere, it has no size to speak of, so there's nothing to stand on.",
      "You'll meet `alt` properly, and why it matters, in a later lesson — for now, notice this picture already has a good one.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<img src="bridge.png" alt="a stone bridge" />', note: "no size given" },
        { code: '<img src="bridge.png" alt="a stone bridge" width="140" height="30" />', note: "sized by attributes" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the `<img>` tag on the wall.",
      'Add `width="140" height="30"` to it.',
      "Step onto the picture, then across.",
    ],
    reference: {
      title: "Images",
      syntax: '<img src="…" alt="…" width="…" height="…" />',
      entries: [
        { value: "src", meaning: "which image file to show" },
        { value: "alt", meaning: "text description, for anyone who can't see it" },
        { value: 'width="140" height="30"', meaning: "reserve this exact size, as HTML attributes" },
      ],
    },
    hints: [
      "The picture frame is on the wall, in the right place — but it has no width and no height, so it's collapsed to almost nothing.",
      "What decides an image's box size before it's even loaded? Look at the img tag's attributes.",
      "The `<img>` here has `src` and `alt`, but no `width` or `height` at all.",
      "For a replaced element like `<img>`, the `width` and `height` *attributes* (not CSS properties) set its box directly, in pixels — no unit needed, just the number.",
      'Add `width="140" height="30"` to the `<img>` tag.',
    ],
    debrief: {
      rule: "An <img>'s width and height can be set as plain HTML attributes (numbers, no unit), which size its box even before the picture loads.",
      seenIn: "Every well-built site's images carry width and height attributes, precisely to stop the page jumping as pictures load in.",
      fableLine: "She wrote the word stone — and a stone was there.",
    },
    quiz: {
      question: "On <img width=\"140\">, what does 140 mean?",
      options: ["140%", "140px, as a plain HTML attribute", "It's invalid without a unit", "140 seconds"],
      answer: 1,
      explain: "The width/height attributes on img take a plain number of pixels — no unit, unlike a CSS length.",
    },
    html: `<div class="ledge start">start</div>
<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="a stone bridge" class="frame" />
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.frame {
  display: block;
  position: absolute;
  left: 220px;
  bottom: 140px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("img.frame[width][height]") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was sizing the image with its own width and height attributes." };
    },
  },

  {
    id: "html-15-forms",
    chapter: 1,
    number: 15,
    title: "The Control Room",
    concept: "form controls",
    edit: "html",
    learn: "Recognise the everyday form elements — input, its type, label, and button — and why an exact type value matters.",
    objective: "One control has a typo in its type, so it's stuck at its narrow default. Fix the exact value so it widens into a plank.",
    lesson: [
      "A `<form>` holds **controls**: `<input>` for most fields, `<textarea>` for multi-line text, `<select>` for a dropdown, and `<button>` for an action. Every `<input>` has a `type` — `text`, `email`, `password`, `checkbox`, `date` and more — which decides how it behaves.",
      "A `<label>` should be linked to its control so clicking the label focuses the input — that's a real accessibility feature, not decoration, usually done by matching a `for` on the label to an `id` on the input.",
      "CSS attribute selectors match the **exact text** of a value. `input[type=\"text\"]` matches only `type=\"text\"` — a typo like `type=\"txt\"` matches nothing, even though it's an easy mistake to make.",
      "The checkbox beside it already has the right type, sized small on purpose — checkboxes and text fields aren't meant to look the same.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<label for="name">Name</label>', note: "linked by for/id" },
        { code: '<input id="name" type="text" />', note: "a text field" },
        { code: '<input type="checkbox" />', note: "a checkbox — a different type" },
        { code: "<button>Submit</button>", note: "an action" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the input with `type=\"txt\"`.",
      'Fix the typo: `type="text"`.',
      "Cross the control room.",
    ],
    reference: {
      title: "Form basics",
      syntax: '<input type="…" />',
      entries: [
        { value: "text, email, password", meaning: "one-line text fields" },
        { value: "checkbox, radio", meaning: "on/off or pick-one controls" },
        { value: "date, number, file", meaning: "specialised input types" },
      ],
    },
    hints: [
      "One plank in the control room is stuck narrow, like an un-typed anchor from before. It already has a type attribute, though.",
      "Read the type's value carefully, letter by letter, and compare it with the working checkbox beside it.",
      "It says `type=\"txt\"` — that's not a real value this CSS is watching for.",
      "`input[type=\"text\"]` only matches an input whose type is spelled exactly `text`. `txt` is a different string entirely, even though a browser would still treat it as a plain field.",
      'Fix the input\'s type: `type="text"`.',
    ],
    debrief: {
      rule: "input's type decides its behaviour and its default look. CSS attribute selectors match exact text, so a typo in a value matches nothing.",
      seenIn: "A sign-up form: text for a name, email for an email (with built-in format checking), password for a hidden field, checkbox for “remember me”.",
      fableLine: "When she wrote a name beside a thing, it took that name's shape.",
    },
    quiz: {
      question: "Why does input[type=\"txt\"] not match <input type=\"txt\">... wait, why doesn't the CSS rule for type=\"text\" apply to it?",
      options: [
        "txt and text mean the same thing to CSS",
        "CSS attribute selectors match the exact text, and \"txt\" isn't \"text\"",
        "Inputs can't be selected by type",
        "You need type=\"input\" instead",
      ],
      answer: 1,
      explain: "Attribute selectors are exact-string matches. \"txt\" is simply a different value from \"text\", typo or not.",
    },
    html: `<form class="room">
  <div class="ledge start">start</div>
  <input type="txt" class="plank" />
  <input type="checkbox" class="tick" />
  <div class="ledge goal">goal</div>
</form>
`,
    css: `.room { position: relative; }

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 640px; }

input.plank {
  display: block;
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 20px;
  height: 30px;
  box-sizing: border-box;
  background: #7c8aa3;
  border: 4px solid #3a4459;
}
input[type="text"].plank {
  width: 300px;
}

input.tick {
  display: block;
  position: absolute;
  left: 540px;
  bottom: 140px;
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  background: #6fa78f;
  border: 4px solid #2c5747;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count('input[type="text"].plank') >= 1) return { gold: true };
      return { gold: false, note: "Solved — the fix was correcting the typo so type matched exactly \"text\"." };
    },
  },

  {
    id: "html-16-validation",
    chapter: 1,
    number: 16,
    title: "The Locked Gate",
    concept: "required",
    edit: "html",
    learn: "Mark a field required with a boolean attribute — present or absent, no value needed.",
    objective: "The gate-field only opens for a field that's marked required. Add the attribute — it needs no value at all.",
    lesson: [
      "HTML has **native form validation**: attributes the browser itself understands and enforces, with no JavaScript at all. `required` is the simplest one — a field the form won't submit without.",
      "`required` is a **boolean attribute**: its presence alone means true. You don't write `required=\"true\"` — just `required`. Compare that to `data-open=\"true\"` from an earlier lesson, which needed an actual value.",
      "Related attributes work together the same way: `pattern` checks text against a shape, `min`/`max` bound a number or date, `minlength`/`maxlength` bound text length. All are read by the browser itself, before any form is even submitted.",
      "This level's CSS opens the gate for any input that simply *has* `required` written on it, however it's used.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<input />", note: "optional — a boolean attribute is simply absent" },
        { code: "<input required />", note: "required — the attribute needs no value" },
        { code: '<input required pattern="[0-9]{4}" />', note: "required, and shaped like a 4-digit code" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the `<input class=\"gate\">` with no attribute beyond its class.",
      "Add `required` to it — just the word, no `=`.",
      "Cross through the gate.",
    ],
    reference: {
      title: "Native validation",
      syntax: "required, pattern, min, max, minlength, maxlength",
      entries: [
        { value: "required", meaning: "boolean — can't submit empty" },
        { value: 'pattern="[0-9]{4}"', meaning: "text must match this shape" },
        { value: 'min="1" max="10"', meaning: "bounds a number" },
        { value: "minlength / maxlength", meaning: "bounds text length" },
      ],
    },
    hints: [
      "The gate-field sits in the room, narrow and closed. It doesn't yet carry the one attribute the CSS is watching for.",
      "Is there an attribute you could add that needs no `=\"value\"` at all — just the word itself?",
      "Compare it with `<input required />` in the reference tab: no equals sign, no quotes.",
      "`required` is a boolean attribute. Writing the bare word on the tag is enough — `required=\"true\"` isn't the normal way to write it, though the plain word alone is what CSS here is checking for with `input[required]`.",
      "Add `required` to the gate's input: `<input class=\"gate\" required />`.",
    ],
    debrief: {
      rule: "Boolean HTML attributes like required mean true just by being present — no value is written or needed.",
      seenIn: "Every sign-up form's “required” red asterisk fields are backed by the required attribute, so the browser itself blocks an empty submit.",
      fableLine: "When she wrote a name beside a thing, it took that name's shape.",
    },
    quiz: {
      question: "How do you correctly mark an input as required?",
      options: ['required="required"', "required", 'required="true"', "isRequired"],
      answer: 1,
      explain: "required is a boolean attribute — its bare presence on the tag is the correct, complete way to write it.",
    },
    html: `<div class="ledge start">start</div>
<input class="gate" />
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

input.gate {
  display: block;
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 20px;
  height: 30px;
  box-sizing: border-box;
  background: #8c7ad1;
  border: 4px solid #3b2f73;
}
input.gate[required] {
  width: 300px;
  background: #6fa78f;
  border: 4px solid #2c5747;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("input.gate[required]") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was adding the bare required attribute." };
    },
  },

  {
    id: "html-17-tables",
    chapter: 1,
    number: 17,
    title: "The Tile Bridge",
    concept: "table structure",
    edit: "html",
    learn: "Structure tabular data correctly: table, then tr for each row, then td for each cell inside it.",
    objective: "Two tiles of the bridge are stuck outside the table, in the wrong tags. Rebuild them as real cells, inside the row.",
    lesson: [
      "A `<table>` holds rows (`<tr>`), and each row holds cells (`<td>` for data, `<th>` for a header cell). Nesting has to be exact: cells belong inside a row, which belongs inside the table.",
      "`<th scope=\"col\">` marks a header cell and says whether it heads a column or a row — real information a screen reader announces, letting someone navigate a large table by column and row name.",
      "`colspan=\"2\"` on a `<td>` makes it stretch across two columns instead of one — useful for a cell spanning a whole section, though you won't need it for this bridge.",
      "This level's CSS gives shape only to real `<td>` elements that are inside a `.grid tr`. A `<div>` standing in for either tag, or sitting outside the table, matches nothing.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<table>", note: "" },
        { code: "  <tr>", note: "a row" },
        { code: "    <td></td>", note: "a cell, inside the row" },
        { code: "    <td></td>", note: "another cell, same row" },
        { code: "  </tr>", note: "" },
        { code: "</table>", note: "" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the two stray tiles after `</table>`: `<div class=\"row\">` holding two `<div class=\"cell\">`s.",
      "Change each `<div class=\"cell\">` to `<td>`, and move both inside the table's `<tr>`, after the two tiles already there.",
      "Cross the tile bridge.",
    ],
    reference: {
      title: "Tables",
      syntax: "<table><tr><td></td></tr></table>",
      entries: [
        { value: "<tr>", meaning: "one row of the table" },
        { value: "<td>", meaning: "one ordinary cell, inside a row" },
        { value: '<th scope="col">', meaning: "a header cell for a column" },
        { value: 'colspan="2"', meaning: "a cell spanning two columns" },
      ],
    },
    hints: [
      "The first two tiles of the bridge are solid. After them, there's a long gap — but two more tiles are written right there in the HTML.",
      "Look at the tags used for those two extra tiles, and where they sit relative to `</table>`.",
      "They're written as `<div class=\"cell\">`, wrapped in a `<div class=\"row\">`, entirely after the table closes.",
      "This CSS styles `.grid tr td` — a cell needs the right tag, `<td>`, *and* to be nested inside the table's row. A div outside the table matches neither condition.",
      'Change each `<div class="cell">` to `<td>`, and move both lines inside the `<tr>`, next to the two tiles already there.',
    ],
    debrief: {
      rule: "A table's structure has to be exact: tr for rows, td (or th) for cells, nested directly inside them, inside the table.",
      seenIn: "A pricing table or a spreadsheet-like report on the web is real table/tr/td markup — not divs styled to look like a grid.",
      fableLine: "When she wrote one thing inside another, it stayed inside.",
    },
    quiz: {
      question: "Inside a <table>, where does a <td> belong?",
      options: ["Directly inside <table>", "Inside a <tr>, which is inside the <table>", "Inside a <div>", "It doesn't need a parent"],
      answer: 1,
      explain: "Cells (td/th) belong inside a row (tr); rows belong inside the table. Skipping the row breaks the structure.",
    },
    html: `<div class="ledge start">start</div>

<table class="grid">
  <tr>
    <td></td>
    <td></td>
  </tr>
</table>
<div class="row">
  <div class="cell"></div>
  <div class="cell"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.grid {
  border-collapse: collapse;
  display: table;
  position: absolute;
  left: 60px;
  bottom: 140px;
}
.grid tr {
  display: table-row;
}
.grid tr td {
  display: table-cell;
  width: 100px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 120px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 490px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".grid tr td") >= 4) return { gold: true };
      return { gold: false, note: "Solved — the fix was rebuilding both stray tiles as real td cells, nested inside the row." };
    },
  },

  {
    id: "html-18-head",
    chapter: 1,
    number: 18,
    title: "The Scroll of the Head",
    concept: "the <head>",
    edit: "html",
    learn: "Know what belongs in a page's <head> — title, charset, viewport, description, and more — even though it's invisible.",
    objective: "Two runes on the scroll are unlabelled. Mark them with the head tag they stand for, then cross.",
    lesson: [
      "Every real HTML page has a `<head>` before its `<body>` — invisible on the page itself, but read by the browser and by search engines. This game builds worlds from a `<body>` directly, so you won't type a `<head>` here — but you do need to recognise what belongs in one.",
      "`<title>Page Name</title>` sets the browser tab's text. `<meta charset=\"utf-8\">` tells the browser how to read the file's characters. `<meta name=\"viewport\" content=\"width=device-width\">` makes the page render sensibly on a phone.",
      "`<meta name=\"description\" content=\"…\">` is the summary search engines often show under your page's title. Open Graph tags (`<meta property=\"og:title\" …>`) control how a link looks when shared on social media.",
      "`<link rel=\"stylesheet\" href=\"styles.css\">` loads your CSS, and `<link rel=\"icon\">` sets the little tab favicon. `<script src=\"app.js\" defer></script>` loads JavaScript without blocking the page from showing while it downloads.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<head>", note: "" },
        { code: '  <meta charset="utf-8" />', note: "read the file correctly" },
        { code: "  <title>My Page</title>", note: "the browser tab's text" },
        { code: '  <meta name="viewport" content="width=device-width, initial-scale=1" />', note: "sane sizing on phones" },
        { code: '  <link rel="stylesheet" href="styles.css" />', note: "load the CSS" },
        { code: '  <script src="app.js" defer></script>', note: "load JS without blocking the page" },
        { code: "</head>", note: "" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the two unlabelled runes: `<div class=\"rune\"></div>`.",
      'Mark them `data-tag="title"` and `data-tag="viewport"`.',
      "Cross the scroll.",
    ],
    reference: {
      title: "Essentials of <head>",
      syntax: "<head> … </head>",
      entries: [
        { value: "<title>", meaning: "the browser tab's text" },
        { value: 'meta charset="utf-8"', meaning: "how to read the page's characters" },
        { value: "meta name=\"viewport\"", meaning: "sane sizing on phone screens" },
        { value: "meta name=\"description\"", meaning: "the summary shown in search results" },
        { value: "link rel=\"stylesheet\" / \"icon\"", meaning: "the page's CSS file, and its tab icon" },
      ],
    },
    hints: [
      "Two runes on the scroll are dark — plain, unlabelled boxes. Every lit rune has a `data-tag` naming a real `<head>` element.",
      "This isn't about tags you type as `<title>` here — this world only has a `<body>`. Look at how the lit runes are marked.",
      "Each lit rune has `data-tag=\"…\"` naming a head element, like `data-tag=\"charset\"`. The two dark ones have no such attribute.",
      "The CSS lights up any rune whose `data-tag` matches one it's listening for — including `\"title\"` (the tab's text) and `\"viewport\"` (sane sizing on phones).",
      'Add `data-tag="title"` to the first dark rune, and `data-tag="viewport"` to the second.',
    ],
    debrief: {
      rule: "A page's <head> — title, charset, viewport, description, stylesheet and script links — never appears on the page, but browsers, phones and search engines all read it.",
      seenIn: "View source on any real site: before its visible content, a <head> with exactly this handful of tags.",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "Which tag sets the text shown in the browser's tab?",
      options: ["<header>", "<title>", "<meta name=\"tab\">", "<h1>"],
      answer: 1,
      explain: "<title>, inside <head>, sets the browser tab's text — it's easy to confuse with the very different <header> element.",
    },
    html: `<div class="ledge start">start</div>

<div class="scroll">
  <div class="rune" data-tag="charset"></div>
  <div class="rune"></div>
  <div class="rune"></div>
  <div class="rune" data-tag="stylesheet"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.scroll {
  display: flex;
  gap: 20px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.rune {
  width: 90px;
  height: 30px;
  background: #4a3e2e;
  border: 4px solid #262016;
  box-sizing: border-box;
  opacity: 0.35;
}

.rune[data-tag="charset"],
.rune[data-tag="title"],
.rune[data-tag="viewport"],
.rune[data-tag="stylesheet"] {
  background: #e0b85f;
  border-color: #6b4e1a;
  opacity: 1;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count('.rune[data-tag="title"]') >= 1 && ctx.count('.rune[data-tag="viewport"]') >= 1) return { gold: true };
      return { gold: false, note: "Solved — though naming both runes correctly (title, viewport) is what earns a seal here." };
    },
  },

  {
    id: "html-19-alt-text",
    chapter: 1,
    number: 19,
    title: "The Unseen Picture",
    concept: "accessibility: alt text",
    edit: "html",
    learn: "Write meaningful alt text for images that matter, and understand why this world makes one without it disappear.",
    objective: "The picture plank has empty alt text, so — in this world — it doesn't exist. Give it real words to make it solid.",
    lesson: [
      "`alt` describes an image in words. Someone using a screen reader hears the `alt` text instead of seeing the picture; if an image fails to load, the browser shows the `alt` text in its place.",
      "Real browsers don't hide an image just because its `alt` is missing or empty — but this level's CSS does exactly that, on purpose, as a blunt way to make the point felt: an image with no meaningful `alt` might as well not be there for someone who can't see it.",
      "There's one real exception: a *purely decorative* image — one that adds nothing a description would help with — should have `alt=\"\"` on purpose, so a screen reader skips it silently instead of reading a useless filename aloud.",
      "This picture shows the way across, so it's a meaningful image: it needs real, descriptive `alt` text, not an empty one.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: '<img src="bridge.png" alt="" />', note: "empty alt — only correct for a decorative image" },
        { code: '<img src="bridge.png" alt="a stone bridge over the ravine" />', note: "meaningful alt, for a meaningful image" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the `<img>` with `alt=\"\"`.",
      'Write a real description, like `alt="a stone bridge"`.',
      "Cross the bridge, now that it's there for everyone.",
    ],
    reference: {
      title: "Alt text",
      syntax: 'alt="a description"',
      entries: [
        { value: 'alt="a stone bridge"', meaning: "a real description of a meaningful image" },
        { value: 'alt=""', meaning: "correct only for a purely decorative image" },
        { value: "no alt at all", meaning: "worse than empty — screen readers may read the filename instead" },
      ],
    },
    hints: [
      "The picture on the wall is there in the HTML, with a real src — but it isn't holding you up.",
      "Look at its `alt` attribute. Is it missing, or is it there but empty?",
      "It's `alt=\"\"` — present, but empty, as if the picture were purely decorative.",
      "This world treats a meaningless alt exactly like a missing one, since either way someone using a screen reader gets nothing useful from the image. A real, short description fixes that.",
      'Change `alt=""` to something real, like `alt="a stone bridge"`.',
    ],
    debrief: {
      rule: "Meaningful images need real alt text. Empty alt (alt=\"\") is only correct for purely decorative images that a screen reader should skip.",
      seenIn: "A product photo needs a real alt (\"red running shoe, side view\"); a purely ornamental background swirl gets alt=\"\".",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "When is alt=\"\" the correct choice?",
      options: ["Never — always write a description", "For a purely decorative image that adds no information", "Only on the homepage", "When the image is very large"],
      answer: 1,
      explain: "Empty alt tells a screen reader to skip the image silently — right for decoration, wrong for anything meaningful.",
    },
    html: `<div class="ledge start">start</div>
<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="" width="140" height="30" class="frame" />
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.frame {
  display: block;
  position: absolute;
  left: 220px;
  bottom: 140px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

/* In this world, an image with no real alt text isn't really there. */
img.frame:not([alt]),
img.frame[alt=""] {
  display: none;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count('img.frame[alt=""]') === 0 && ctx.count("img.frame") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the fix was writing real, descriptive alt text instead of leaving it empty." };
    },
  },

  {
    id: "html-20-capstone",
    chapter: 1,
    number: 20,
    title: "The Final Gate",
    concept: "putting it together",
    edit: "html",
    learn: "Combine everything this chapter taught — nesting, semantic tags, lists, attributes and images — in one page.",
    objective: "Four tiles of the final gate are broken, each in a way you've already fixed once this chapter. Repair all four to walk all the way across.",
    lesson: [
      "Every element you write becomes part of the page's **DOM tree** — a structure of nested boxes the browser keeps in memory. HTML is really just a way of writing that tree down. In the next chapter, JavaScript will walk this exact tree to find and change things.",
      "One more tag worth knowing: `<template>` holds markup that does nothing on its own — invisible, inert — until JavaScript clones it onto the page. You'll see the idea again once you're writing JavaScript of your own.",
      "One more caution worth carrying forward: never insert text someone else typed directly as HTML. A comment field that gets dropped straight into the page as markup is exactly how attackers inject their own scripts — a class of bug called **XSS**. Real sites always escape or sanitise text like that first.",
      "For now: this hall combines four things you already know how to fix. Look carefully — nothing here is a new trick.",
    ],
    example: {
      lang: "html",
      lines: [
        { code: "<section>", note: "a semantic container" },
        { code: "  <header>title</header>", note: "the right tag, in the right place" },
        { code: "  <ul><li>one</li></ul>", note: "a list item, nested correctly" },
        { code: "</section>", note: "" },
      ],
    },
    steps: [
      "Open the **HTML** tab.",
      "Find the first broken tile — a `<div>` where a `<header>` is needed — and rename its tag.",
      "Find the `<div>` sitting inside `<ul class=\"steps\">` and rename it `<li>`.",
      'Give the picture tile real `width="80" height="30" alt="a stepping tile"`.',
      "Add `id=\"keystone\"` to the last tile, next to its existing class.",
    ],
    reference: {
      title: "Chapter recap",
      syntax: "elements → attributes → nesting → tags with meaning",
      entries: [
        { value: "<header>, <li>", meaning: "the right tag, matched by this CSS" },
        { value: 'width, height, alt', meaning: "a complete, accessible image" },
        { value: "id vs class", meaning: "one unique keystone, selected by #, not ." },
      ],
    },
    hints: [
      "Four tiles of the gate are missing, one after another, and you've fixed each kind of problem before — just not all in one level.",
      "Tile 1 is the wrong tag entirely. Tile 2 is a list item written as the wrong tag. Tile 3 is a picture with no size or description. Tile 4 has a class where an id is needed.",
      "Compare each against the working lessons before it: a semantic tag matched by its name, an `<li>` inside its list, an `<img>` with attributes, and `#keystone` needing a real id.",
      "Fix them one at a time: (1) the first `<div>` → `<header>`, (2) the `<div>` inside `<ul class=\"steps\">` → `<li>`, (3) add `width=\"80\" height=\"30\" alt=\"a stepping tile\"` to the picture, (4) add `id=\"keystone\"` to the last tile.",
      "Apply all four fixes, then walk the whole gate to the flag.",
    ],
    debrief: {
      rule: "HTML is a tree of nested, named elements — the same handful of ideas (elements, attributes, nesting, meaningful tags) combine to build anything, however large.",
      seenIn: "Every real web page, however complex, is built from exactly these pieces — nothing in a large site's markup is a fundamentally new idea beyond what this chapter covered.",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "What does the browser build from your HTML as it reads it?",
      options: ["A single flat list of text", "A tree of nested elements — the DOM", "An image", "Nothing until CSS is added"],
      answer: 1,
      explain: "The DOM (Document Object Model) is the nested tree structure your HTML describes — the very thing JavaScript will explore next.",
    },
    html: `<div class="ledge start">start</div>

<div class="p1"></div>

<ul class="steps p2">
  <div></div>
</ul>

<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" class="p3" />

<div class="keystone p4"></div>

<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 780px; }

.p1, .p2, .p3, .p4 {
  position: absolute;
  bottom: 140px;
}
.p1 { left: 188px; }
.p2 { left: 336px; }
.p3 { left: 484px; }
.p4 { left: 632px; }

/* Tile 1: needs the real semantic tag. */
header {
  width: 80px;
  height: 30px;
  background: #7c8fbf;
  border: 4px solid #33436e;
  box-sizing: border-box;
}

/* Tile 2: needs to be a real li, inside this list. */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
}
.steps li {
  width: 80px;
  height: 30px;
  background: #d7a34c;
  border: 4px solid #6e4f11;
  box-sizing: border-box;
}

/* Tile 3: needs real width, height and alt attributes. */
.p3 {
  display: block;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

/* Tile 4: needs a real id — a class won't match #keystone. */
#keystone {
  width: 80px;
  height: 30px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const ok =
        ctx.count("header.p1") >= 1 &&
        ctx.count(".steps > li") >= 1 &&
        ctx.count("img.p3[width][height][alt]") >= 1 &&
        ctx.count("#keystone") >= 1;
      if (ok) return { gold: true };
      return { gold: false, note: "You reached the flag without every fix in place — a gold seal here needs all four: the header tag, the real li, the described image, and the keystone's id." };
    },
  },
];

/* =========================================================================
 * Chapter 2 — CSS basics
 * ========================================================================= */

const CSS_LEVELS: Level[] = [
  {
    id: "css-1-rules",
    chapter: 2,
    number: 1,
    title: "Your First CSS Rule",
    concept: "width",
    edit: "css",
    learn: "Read and change a CSS rule: selector, property and value.",
    objective: "The bridge is only 80px long. Change its width in the CSS so it reaches the gold ledge.",
    lesson: [
      "CSS is written as **rules**. A rule chooses some elements, then sets **properties** on them.",
      "`.bridge` is a **selector**. The dot means “elements whose class is bridge”.",
      "Inside the `{ }` are **declarations**: a property, a colon, a value and a semicolon — like `width: 80px;`.",
      "`px` means **pixels**. `80px` is 80 dots wide. The gap from the end of the bridge to the ledge is 500px, and Dom can only jump about " + ACROSS + ".",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".bridge {", note: "selector: which elements this rule styles" },
        { code: "  width: 80px;", note: "property: value;" },
        { code: "  height: 30px;", note: "one declaration per line" },
        { code: "}", note: "the rule ends" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the `.bridge` rule and its `width: 80px;` line.",
      "Change `80px` to a bigger number, like `580px`.",
      "Watch the bridge stretch, then walk across it.",
    ],
    reference: {
      title: "CSS rules",
      syntax: "selector { property: value; }",
      entries: [
        { value: ".bridge", meaning: 'elements with class="bridge"' },
        { value: "width: 580px;", meaning: "580 pixels wide" },
        { value: "height: 30px;", meaning: "30 pixels tall" },
      ],
    },
    hints: [
      "Stand at the end of the bridge. It's short — the ledge is a long way off. What decides how long the bridge is?",
      "Which CSS rule styles the bridge? Look for its class name.",
      "In `.bridge { … }`, one line sets how wide it is.",
      "`width: 80px;` makes the bridge 80 pixels wide. It starts 160px from the left and the ledge starts at 740px, so a width near 580px closes the gap completely.",
      "In `.bridge`, change `width: 80px;` to `width: 580px;`",
    ],
    debrief: {
      rule: "A CSS rule is a selector followed by declarations in braces. Each declaration is `property: value;`.",
      seenIn: "Every page you've seen sets widths: a centred article is often just `max-width: 700px;`.",
      fableLine: "She lengthened one stone into a bridge.",
    },
    quiz: {
      question: "In `width: 80px;`, which part is the value?",
      options: ["width", "80px", ";", ".bridge"],
      answer: 1,
      explain: "`width` is the property, `80px` is its value, and the semicolon ends the declaration.",
    },
    html: `<div class="ledge start">start</div>
<div class="bridge"></div>
<div class="ledge goal">goal</div>
`,
    css: `.bridge {
  width: 80px;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
  position: absolute;
  left: 160px;
  bottom: 140px;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }
${DECORATION}`,
    rubric: (ctx) => {
      const bridge = rule(ctx.css, ".bridge");
      const goal = rule(ctx.css, ".goal");
      if (goal["left"] && goal["left"] !== "740px") return { gold: false, note: "You moved the ledge instead of growing the bridge. It works — but the lesson's tool was `width`." };
      if ((pxValue(bridge["width"]) ?? 0) > 80) return { gold: true };
      return { gold: false, note: "Solved — the intended change was the bridge's `width`." };
    },
  },

  {
    id: "css-2-margin",
    chapter: 2,
    number: 2,
    title: "Space Outside the Box",
    concept: "margin",
    edit: "css",
    learn: "Use margin to control the empty space around an element.",
    objective: "Each stone pushes the next one 250px away. Shrink that space so you can hop to the gold stone.",
    lesson: [
      "Every element is a box with layers: its **content**, then **padding** (space inside the border), then the **border**, then **margin** (space outside the border).",
      "**Margin** is empty air around an element. Nothing can stand in it, and it pushes neighbouring elements away.",
      "`margin-right: 250px;` puts 250px of air to the right of every stone. That's more than Dom's " + ACROSS + " jump.",
      "The row uses `display: flex` to keep the stones side by side — you'll learn that in the next chapter.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".stone {", note: "" },
        { code: "  margin-right: 40px;", note: "air outside, on the right" },
        { code: "  padding: 10px;", note: "space inside, around the content" },
        { code: "  border: 4px solid;", note: "the edge between them" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `margin-right: 250px;` in the `.stone` rule.",
      "Make the number much smaller — try `60px`.",
      "Hop across to the gold stone.",
    ],
    reference: {
      title: "The box model",
      syntax: "margin → border → padding → content",
      entries: [
        { value: "margin-right: 60px;", meaning: "60px of empty space to the right, outside the border" },
        { value: "margin: 20px;", meaning: "20px on all four sides" },
        { value: "padding: 10px;", meaning: "10px inside the border" },
      ],
    },
    hints: [
      "The stones are fine — it's the empty space between them that's the problem. Where does that space come from?",
      "Is the space coming from the row, or from each stone?",
      "Look at the `.stone` rule. One line adds space outside every stone.",
      "`margin` is space outside an element's border. `margin-right: 250px;` makes 250px of air after every stone — too far to jump. A smaller margin brings the next stone closer.",
      "In `.stone`, change `margin-right: 250px;` to `margin-right: 60px;`",
    ],
    debrief: {
      rule: "Margin is space outside an element's border; padding is space inside it. Margin pushes other elements away.",
      seenIn: "The space between paragraphs in an article is margin: `p { margin-bottom: 1em; }`.",
      fableLine: "She drew in the empty air between the others until they were close enough to step across.",
    },
    quiz: {
      question: "Which property adds empty space outside an element's border?",
      options: ["margin", "padding", "width", "border"],
      answer: 0,
      explain: "Margin is outside the border. Padding is inside it, between the border and the content.",
    },
    html: `<div class="row">
  <div class="stone start">start</div>
  <div class="stone"></div>
  <div class="stone goal">goal</div>
</div>
`,
    css: `.row {
  display: flex;
  position: absolute;
  left: 30px;
  bottom: 140px;
}

.stone {
  width: 100px;
  height: 30px;
  margin-right: 250px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const stone = rule(ctx.css, ".stone");
      if (stone["width"] && stone["width"] !== "100px") return { gold: false, note: "You made the stones wider to close the gap. It works — but the space was coming from `margin`." };
      return { gold: true };
    },
  },

  {
    id: "css-3-selector-types",
    chapter: 2,
    number: 3,
    title: "Choose the Right Selector",
    concept: "type / class / id selectors",
    edit: "css",
    learn: "Pick the right kind of selector — tag, class or id — for what you're trying to style.",
    objective: "The lever is styled with a class selector, but the lever has no class — only an id. Fix the selector.",
    lesson: [
      "CSS has three basic ways to pick an element: a **type selector** (`div`) matches every element with that tag; a **class selector** (`.name`) matches every element with that class; an **id selector** (`#name`) matches the one element with that id.",
      "They aren't interchangeable. `.lever` only matches `class=\"lever\"`. If the element actually has `id=\"lever\"` and no class at all, `.lever` matches nothing.",
      "As a habit: reach for a class when several elements share a look, and an id only for the one-off element a page has exactly one of.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "div { }", note: "every <div> on the page" },
        { code: ".lever { }", note: "every element with class=\"lever\"" },
        { code: "#lever { }", note: "the one element with id=\"lever\"" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the `.lever` rule.",
      "Change the selector to `#lever`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Selector types",
      syntax: "type · .class · #id",
      entries: [
        { value: "div", meaning: "every div — a type selector" },
        { value: ".lever", meaning: "every element with class=\"lever\"" },
        { value: "#lever", meaning: "the element with id=\"lever\"" },
      ],
    },
    hints: [
      "The lever is written in the HTML, sitting right where it should be — but it has no size at all.",
      "Look at the HTML tab (read-only here): does the lever have a class, or an id?",
      "It has `id=\"lever\"` — no class attribute at all.",
      "A class selector (`.lever`) only matches an element with that class. This element has an id instead, so it needs an id selector, written with `#`.",
      "Change `.lever { … }` to `#lever { … }`.",
    ],
    debrief: {
      rule: "A class selector matches class attributes; an id selector matches id attributes. They don't cross over, however similar the name looks.",
      seenIn: "A one-off page header styled with `#site-header`, while its many nav links share `.nav-link`.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "An element has id=\"lever\" and no class. Which selector matches it?",
      options: [".lever", "lever", "#lever", "*lever"],
      answer: 2,
      explain: "id selectors use #. A class selector needs a class attribute, which this element doesn't have.",
    },
    html: `<div class="ledge start">start</div>
<div id="lever"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.lever {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 300px;
  height: 30px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("#lever") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the fix was matching the id with an id selector." };
    },
  },

  {
    id: "css-4-descendant-child",
    chapter: 2,
    number: 4,
    title: "Inside, or Directly Inside?",
    concept: "descendant vs child (>) combinator",
    edit: "css",
    learn: "Tell a descendant selector (any depth) apart from a child selector (one level only).",
    objective: "One torch is nested two levels deep, and the child selector can't reach it. Widen the selector so both torches light.",
    lesson: [
      "`.hall .torch` is a **descendant selector**: it matches a `.torch` *anywhere* inside `.hall`, however deeply nested.",
      "`.hall > .torch` is a **child combinator**: the `>` restricts it to a `.torch` that is a *direct* child of `.hall` — one level in, no more.",
      "This level's CSS uses `.hall > .torch`. One torch sits directly inside `.hall` and lights up fine. The second is inside a `.nook` inside `.hall` — two levels down — so the child combinator misses it.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".hall .torch { }", note: "a torch anywhere inside .hall" },
        { code: ".hall > .torch { }", note: "a torch that is a direct child of .hall" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.hall > .torch`.",
      "Remove the `>` so it becomes a plain descendant selector.",
      "Cross both torches to the goal.",
    ],
    reference: {
      title: "Combinators",
      syntax: "ancestor descendant  ·  parent > child",
      entries: [
        { value: ".hall .torch", meaning: "a torch anywhere inside .hall" },
        { value: ".hall > .torch", meaning: "a torch one level directly inside .hall" },
      ],
    },
    hints: [
      "The first torch is solid. The second is written in the HTML too, further along — but it isn't lit.",
      "Look at where the second torch sits in the HTML: is it a direct child of `.hall`, or inside something else first?",
      "It's inside a `<div class=\"nook\">`, which is itself inside `.hall` — two levels down.",
      "`.hall > .torch` only reaches direct children. A torch nested inside a nook is a *grandchild*, not a child, so it doesn't match. Dropping the `>` makes it match at any depth.",
      "Change `.hall > .torch` to `.hall .torch`.",
    ],
    debrief: {
      rule: "A plain space means \"anywhere inside\"; `>` means \"directly inside, one level only\". Use `>` when depth matters.",
      seenIn: "`nav > ul > li` targets only a menu's own top-level items, ignoring li's inside a nested dropdown list.",
      fableLine: "When she wrote one thing inside another, it stayed inside.",
    },
    quiz: {
      question: "With `.a > .b`, which .b elements match?",
      options: ["Any .b inside .a, any depth", "Only a .b that is a direct child of .a", "Only .b elements with no children", "None — > is invalid"],
      answer: 1,
      explain: "> restricts the match to one level of nesting: a direct child, not a deeper descendant.",
    },
    html: `<div class="ledge start">start</div>

<div class="hall">
  <div class="torch t1"></div>
  <div class="nook">
    <div class="torch t2"></div>
  </div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.hall {
  position: absolute;
  left: 220px;
  bottom: 140px;
}

/* Both torches are positioned side by side regardless — only their SIZE
   depends on the selector below, so a missing torch is flat, not a wall. */
.torch {
  position: absolute;
  bottom: 0;
}
.t1 { left: 0; }
.t2 { left: 160px; }

.hall > .torch {
  width: 140px;
  height: 30px;
  background: #cf9a52;
  border: 4px solid #6e4f11;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".hall .torch") >= 2) return { gold: true };
      return { gold: false, note: "Solved — the fix was widening the selector from a child combinator to a descendant selector." };
    },
  },

  {
    id: "css-5-grouping",
    chapter: 2,
    number: 5,
    title: "One Rule, Several Selectors",
    concept: "grouping selectors (,)",
    edit: "css",
    learn: "Style several different selectors at once by separating them with commas.",
    objective: "Two planks need the same style, but the rule only lists one of them. Group the selectors so both are covered.",
    lesson: [
      "A comma between selectors means \"or\": `.a, .b { }` applies the same declarations to every `.a` *and* every `.b`.",
      "It's the tidy alternative to writing the whole rule out twice for two unrelated classes that happen to need identical styling.",
      "This level styles `.plankA` only. `.plankB` needs the exact same look, so instead of duplicating the rule, add it to the selector list.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".plankA {", note: "styles only plankA" },
        { code: "  width: 140px;", note: "" },
        { code: "}", note: "" },
        { code: ".plankA, .plankB { width: 140px; }", note: "styles both, in one rule" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the `.plankA` rule.",
      "Add `, .plankB` to its selector.",
      "Cross both planks to the goal.",
    ],
    reference: {
      title: "Grouping",
      syntax: "selectorA, selectorB { }",
      entries: [
        { value: ".a, .b", meaning: "elements matching .a OR .b" },
        { value: "h1, h2, h3", meaning: "any of three tags, one rule" },
      ],
    },
    hints: [
      "PlankA holds you up fine. PlankB, right after it, has no size at all — but it's the exact same kind of plank.",
      "Is there a rule anywhere for `.plankB`? Or does only `.plankA` get styled?",
      "Only `.plankA { … }` exists. PlankB needs identical styling, not a whole new rule.",
      "A comma joins selectors into one rule: `.plankA, .plankB { … }` styles both without repeating the declarations.",
      "Change the `.plankA` selector to `.plankA, .plankB`.",
    ],
    debrief: {
      rule: "A comma-separated list of selectors all receive the same declarations — one rule, several targets.",
      seenIn: "Headings are often grouped once: `h1, h2, h3 { font-family: … }` sets a shared typeface in a single rule.",
      fableLine: "She wrote the word stone — and a stone was there. She wrote it again, and there were two.",
    },
    quiz: {
      question: "What does `.a, .b { color: red; }` do?",
      options: ["Only .a turns red", "Only .b turns red", "Both .a and .b turn red", "Nothing — commas aren't allowed here"],
      answer: 2,
      explain: "The comma groups the selectors; every element matching either one gets the declarations.",
    },
    html: `<div class="ledge start">start</div>
<div class="plankA"></div>
<div class="plankB"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

.plankA {
  position: absolute;
  left: 170px;
  bottom: 140px;
  width: 180px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}
.plankB {
  position: absolute;
  left: 400px;
  bottom: 140px;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".plankB") >= 1 && ctx.count(".plankA") >= 1) return { gold: true };
      return { gold: false, note: "Solved — the fix was grouping .plankB into the existing rule with a comma." };
    },
  },

  {
    id: "css-6-first-last-child",
    chapter: 2,
    number: 6,
    title: "The Ends of the Line",
    concept: ":first-child / :last-child",
    edit: "css",
    learn: "Select the first or last child of a container with :first-child and :last-child.",
    objective: "The wrong end of the row is being widened. Select the last stone instead, so the final gap closes.",
    lesson: [
      "`:first-child` matches an element that is the first child of its parent; `:last-child` matches the last one.",
      "They're written straight after the selector they refine: `.row .stone:last-child` means \"a `.stone` that is also the last child of its parent\".",
      "This row needs its *last* stone widened to reach the goal. The CSS currently says `:first-child`, which widens the wrong end.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".row .stone:first-child { }", note: "only the first stone in the row" },
        { code: ".row .stone:last-child { }", note: "only the last stone in the row" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.row .stone:first-child`.",
      "Change it to `.row .stone:last-child`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Structural pseudo-classes",
      syntax: "selector:first-child  ·  selector:last-child",
      entries: [
        { value: ":first-child", meaning: "the first child of its parent" },
        { value: ":last-child", meaning: "the last child of its parent" },
      ],
    },
    hints: [
      "The row starts wide but the far end, right before the goal, stays narrow — a gap too wide to jump.",
      "Which stone in the row is currently wide: the first one, or the last one?",
      "The first stone is wide. The rule that does it ends in `:first-child`.",
      "`:first-child` and `:last-child` pick opposite ends of a container's children. Swapping to `:last-child` widens the stone that actually needs it.",
      "Change `.row .stone:first-child` to `.row .stone:last-child`.",
    ],
    debrief: {
      rule: ":first-child and :last-child single out an element by its position among its siblings, not by class or id.",
      seenIn: "A list of items with dividers between them often uses `li:last-child { border: none }` to drop the trailing divider.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "In a row of 4 stones, which does `.row .stone:last-child` match?",
      options: ["The first stone", "All four stones", "Only the 4th stone", "Only the 4th stone's parent"],
      answer: 2,
      explain: ":last-child matches only the final child among its siblings — one element, not the whole group.",
    },
    html: `<div class="ledge start">start</div>

<div class="row">
  <div class="stone s1"></div>
  <div class="stone s2"></div>
  <div class="stone s3"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.row {
  position: absolute;
  bottom: 140px;
}

.stone {
  position: absolute;
  bottom: 0;
  width: 90px;
  height: 30px;
  background: #9aa3ad;
  border: 4px solid #454d57;
  box-sizing: border-box;
}
.s1 { left: 160px; }
.s2 { left: 270px; }
.s3 { left: 490px; }

.row .stone:first-child {
  width: 320px;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 800px; }
${DECORATION}`,
    rubric: (ctx) => {
      const r = rule(ctx.css, ".row .stone:last-child");
      if ((pxValue(r["width"]) ?? 0) >= 250) return { gold: true };
      return { gold: false, note: "Solved — the fix was targeting :last-child instead of :first-child." };
    },
  },

  {
    id: "css-7-nth-child",
    chapter: 2,
    number: 7,
    title: "Counting Down the Row",
    concept: ":nth-child()",
    edit: "css",
    learn: "Pick a specific child by position with :nth-child(), including patterns like every other one.",
    objective: "The wrong stone in the row is widened. Count to the right one with :nth-child().",
    lesson: [
      "`:nth-child(n)` matches the child at position `n` (counting from 1). `:nth-child(3)` is the third child.",
      "It also takes patterns: `:nth-child(2n)` matches every even child, `:nth-child(2n+1)` every odd one — useful for striping a table or a list.",
      "The row's third stone is the one that needs widening to bridge the gap. The CSS currently says `:nth-child(2)`.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".row .stone:nth-child(3) { }", note: "the third stone only" },
        { code: ":nth-child(2n) { }", note: "every even one: 2nd, 4th, 6th…" },
        { code: ":nth-child(2n + 1) { }", note: "every odd one: 1st, 3rd, 5th…" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.row .stone:nth-child(2)`.",
      "Change `2` to `3`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "nth-child",
      syntax: ":nth-child(n)",
      entries: [
        { value: ":nth-child(1)", meaning: "the first child" },
        { value: ":nth-child(3)", meaning: "the third child" },
        { value: ":nth-child(2n)", meaning: "every even child" },
      ],
    },
    hints: [
      "The second stone in the row is unusually wide, but the gap that actually needs closing is one stone further along.",
      "Count the stones in the row. Which position — first, second, third, fourth — is next to the too-wide gap?",
      "The third stone is next to the gap. The rule currently targets position 2.",
      "`:nth-child(n)` counts from 1. To move the wide styling from the 2nd stone to the 3rd, change the number inside the parentheses.",
      "Change `:nth-child(2)` to `:nth-child(3)`.",
    ],
    debrief: {
      rule: ":nth-child(n) selects by numeric position among siblings, and accepts patterns like 2n for every other one.",
      seenIn: "Striped tables use `tr:nth-child(2n) { background: #f4f4f4 }` to shade every other row.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "Which children does :nth-child(2n+1) match?",
      options: ["Every even child", "Every odd child", "Only the first child", "Only the last child"],
      answer: 1,
      explain: "2n+1 produces 1, 3, 5… — the odd positions.",
    },
    html: `<div class="ledge start">start</div>

<div class="row">
  <div class="stone s1"></div>
  <div class="stone s2"></div>
  <div class="stone s3"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.row {
  position: absolute;
  bottom: 140px;
}

.stone {
  position: absolute;
  bottom: 0;
  width: 90px;
  height: 30px;
  background: #9aa3ad;
  border: 4px solid #454d57;
  box-sizing: border-box;
}
.s1 { left: 160px; }
.s2 { left: 270px; }
.s3 { left: 490px; }

.row .stone:nth-child(2) {
  width: 320px;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 800px; }
${DECORATION}`,
    rubric: (ctx) => {
      const r = rule(ctx.css, ".row .stone:nth-child(3)");
      if ((pxValue(r["width"]) ?? 0) >= 250) return { gold: true };
      return { gold: false, note: "Solved — the fix was counting to the third child." };
    },
  },

  {
    id: "css-8-not",
    chapter: 2,
    number: 8,
    title: "Everyone Except One",
    concept: ":not()",
    edit: "css",
    learn: "Exclude one element from an otherwise broad selector with :not().",
    objective: "A rule meant for every ordinary stone is also shrinking the goal ledge. Exclude the goal so it keeps its own size.",
    lesson: [
      "`:not(selector)` matches everything *except* what's inside its parentheses. `.stone:not(.goal)` means \"a `.stone`, as long as it isn't also `.goal`\".",
      "It's useful when a broad, convenient selector would otherwise also catch one element you need to leave alone.",
      "Here, `.row div { width: 90px; }` is meant for the ordinary stepping stones, but the goal ledge is *also* a `<div>` inside `.row` — so this broad rule shrinks it too, undoing its own `.goal` width.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".row div { width: 90px; }", note: "every div in .row, goal included" },
        { code: ".row div:not(.goal) { width: 90px; }", note: "every div in .row EXCEPT .goal" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.row div { width: 90px; }`.",
      "Add `:not(.goal)` right after `div`.",
      "Cross to the goal.",
    ],
    reference: {
      title: ":not()",
      syntax: "selector:not(exception)",
      entries: [
        { value: ".stone:not(.goal)", meaning: "a stone, unless it's also the goal" },
        { value: "div:not(.goal)", meaning: "any div except one with class goal" },
      ],
    },
    hints: [
      "The stepping stones are the right size, but the goal ledge itself looks squeezed, narrower than a goal should be.",
      "The goal ledge has its own width rule (150px) elsewhere in the CSS. Is something else also setting its width?",
      "`.row div { width: 90px; }` matches every div inside `.row` — and the goal ledge is a div inside `.row` too, so this rule is overriding its width.",
      "`:not(.goal)` excludes an element from an otherwise-matching selector. Adding it here keeps the broad rule from also touching the goal.",
      "Change `.row div { width: 90px; }` to `.row div:not(.goal) { width: 90px; }`.",
    ],
    debrief: {
      rule: ":not() narrows a selector by excluding one case, so a broad, convenient rule can still leave a special element alone.",
      seenIn: "A rule like `input:not([type=\"checkbox\"])` styles every text-like input while leaving checkboxes' native look untouched.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What does `.item:not(.featured)` select?",
      options: ["Only .featured items", "Every .item, including .featured ones", "Every .item that does NOT have class featured", "Nothing — :not() needs no argument"],
      answer: 2,
      explain: ":not(.featured) removes anything matching .featured from the results, leaving the rest of .item.",
    },
    html: `<div class="ledge start">start</div>

<div class="row">
  <div></div>
  <div></div>
  <div class="goal">goal</div>
</div>
`,
    css: `.row {
  display: flex;
  gap: 60px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.row div {
  width: 90px;
  height: 30px;
  background: #9aa3ad;
  border: 4px solid #454d57;
  box-sizing: border-box;
}

.goal {
  width: 150px;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count(".row div:not(.goal)") >= 2) return { gold: true };
      return { gold: false, note: "Solved — the fix was excluding .goal with :not() so its own width survives." };
    },
  },

  {
    id: "css-9-checked",
    chapter: 2,
    number: 9,
    title: "The Latch",
    concept: ":checked",
    edit: "css",
    learn: "Style an element based on real interaction state with :checked — no JavaScript needed.",
    objective: "A checkbox latch controls the gate. Style it so ticking it (click it in the world) opens the way — then tick it.",
    lesson: [
      "Some pseudo-classes describe a live *state*, not a fixed position: `:checked` matches a checkbox or radio button only while it's ticked.",
      "`input:checked + .gate` — a **sibling combinator** (`+`) — selects the `.gate` that comes immediately *after* a checked input. No JavaScript is involved; the browser updates this the instant you click.",
      "This is real, native interactivity from CSS alone. Click the latch in the world to tick it, and watch the rule take effect live.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "input:checked { }", note: "matches only while ticked" },
        { code: "input:checked + .gate { height: 30px; }", note: "the .gate right after a checked input" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the `.gate` rule — it never shrinks, however the latch is set.",
      "Add a new rule: `input:checked + .gate { height: 30px; }`.",
      "Click the latch in the world to tick it, then walk through.",
    ],
    reference: {
      title: "Interactive pseudo-classes",
      syntax: "input:checked",
      entries: [
        { value: ":checked", meaning: "a ticked checkbox or radio, live" },
        { value: "input:checked + .gate", meaning: "a .gate right after a checked input" },
      ],
    },
    hints: [
      "There's a small square latch before the tall gate. Clicking it in the world does tick it — but nothing about the gate changes yet.",
      "Is there any CSS rule that reacts to the latch being ticked at all?",
      "There isn't one yet — only a plain `.gate { … }` rule that never changes.",
      "`input:checked + .gate` selects the gate immediately after a ticked checkbox. Write that rule, giving the gate a short height once checked, and it'll open the instant you click the latch.",
      "Add `input:checked + .gate { height: 30px; }`, then click the latch.",
    ],
    debrief: {
      rule: ":checked reflects live interaction state. Combined with a sibling combinator, CSS alone can react to a click.",
      seenIn: "Pure-CSS toggle menus and accordions are usually a hidden checkbox plus a `:checked ~ .panel` rule — no JavaScript at all.",
      fableLine: "A page that follows instructions can change long after it's built.",
    },
    quiz: {
      question: "When does input:checked match a checkbox?",
      options: ["Always", "Only while it's ticked", "Only in the HTML file", "Only after a page reload"],
      answer: 1,
      explain: ":checked is a live state — it applies exactly while the checkbox is ticked, and stops the moment it's unticked.",
    },
    html: `<div class="ledge start">start</div>
<input type="checkbox" class="latch" />
<div class="gate"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 130px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 480px; }

.latch {
  display: block;
  position: absolute;
  left: 220px;
  bottom: 145px;
  width: 24px;
  height: 24px;
  box-sizing: border-box;
}

.gate {
  position: absolute;
  left: 280px;
  bottom: 140px;
  width: 130px;
  height: 220px;
  background: #5b4a6e;
  border: 4px solid #2b2140;
  box-sizing: border-box;
  transition: height 0.4s ease-in;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (/input\s*:\s*checked\s*\+\s*\.gate/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "Solved — the intended tool was an input:checked + .gate rule." };
    },
  },

  {
    id: "css-10-focus",
    chapter: 2,
    number: 10,
    title: "Where Attention Lands",
    concept: ":focus",
    edit: "css",
    learn: "Style whichever element currently has keyboard/click focus with :focus.",
    objective: "The bridge only extends for a button that has real focus. Style it, then click the button to focus it.",
    lesson: [
      "`:focus` matches whichever element currently has **focus** — the thing that would receive your next keystroke. Clicking a button, or tabbing to it, gives it real focus in the real browser.",
      "`button:focus { }` only applies while that exact button is focused — it turns off the instant something else is clicked.",
      "This is genuinely live, browser-native state, the same one that shows a focus outline around a button you've tabbed to.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "button { }", note: "always, however it's used" },
        { code: "button:focus { }", note: "only while this button has focus" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the `.plank` rule — it's narrow and never changes.",
      "Add `.plank:focus { width: 300px; }`.",
      "Click the plank (a button) in the world to focus it, then cross.",
    ],
    reference: {
      title: ":focus",
      syntax: "selector:focus",
      entries: [
        { value: "button:focus", meaning: "a button, only while focused" },
        { value: ":focus-visible", meaning: "focused AND shown with a visible outline (usually keyboard use)" },
      ],
    },
    hints: [
      "The plank is a button sitting in the gap, but it's much too narrow to stand on.",
      "What happens to a button the instant you click it, that isn't reflected in any CSS rule here yet?",
      "Clicking it gives it focus — but no rule reacts to `:focus` at all right now.",
      "`.plank:focus { width: 300px; }` only applies while the button actually has focus. Add the rule, then click the plank in the world to trigger it.",
      "Add `.plank:focus { width: 300px; }`, then click the plank.",
    ],
    debrief: {
      rule: ":focus is live, native interaction state — it applies only while that exact element has keyboard/click focus.",
      seenIn: "Every accessible form highlights its focused field with `:focus` so keyboard users can see where they are.",
      fableLine: "A page that follows instructions can change long after it's built.",
    },
    quiz: {
      question: "When does .plank:focus stop applying?",
      options: ["Never, once it's been focused once", "The moment focus moves somewhere else", "Only after the page reloads", "It never applies at all"],
      answer: 1,
      explain: ":focus is a live state that tracks exactly one element at a time — moving focus elsewhere removes it immediately.",
    },
    html: `<div class="ledge start">start</div>
<button class="plank">plank</button>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.plank {
  display: block;
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 20px;
  height: 30px;
  box-sizing: border-box;
  background: #7c8aa3;
  border: 4px solid #3a4459;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (/\.plank\s*:\s*focus/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "Solved — the intended tool was a .plank:focus rule." };
    },
  },

  {
    id: "css-11-pseudo-elements",
    chapter: 2,
    number: 11,
    title: "Content From Nowhere",
    concept: "::before / ::after",
    edit: "css",
    learn: "Generate extra, purely visual content with ::before and ::after, without adding an HTML element.",
    objective: "Read the runestone, then mark two banners with the correct pseudo-element so the seal recognises them.",
    lesson: [
      "`::before` and `::after` insert generated content right inside an element, before or after its real content — without you writing a new tag in the HTML.",
      "They need a `content` declaration to appear at all, even if it's just `content: \"\";` — an empty string is the usual choice when you only want a decorative shape, not text.",
      "Because they aren't real DOM elements, they can't become platforms in this world — but they're everywhere on the real web: little corner ribbons, decorative quote marks, and icon-free bullet styling are all `::before`/`::after`.",
      "Below, two banners are marked `data-part=\"before\"` and `data-part=\"after\"`. Match each to its real pseudo-element name to seal them.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".quote::before {", note: "" },
        { code: '  content: "“";', note: "inserted right before the real content" },
        { code: "}", note: "" },
        { code: '.quote::after { content: "”"; }', note: "inserted right after" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Read the runestone comment for the two blanks.",
      'Mark the first banner\'s data-tag as "before" and the second as "after".',
      "Cross to the goal.",
    ],
    reference: {
      title: "Pseudo-elements",
      syntax: "selector::before  ·  selector::after",
      entries: [
        { value: "::before", meaning: "generated content, inserted first inside the element" },
        { value: "::after", meaning: "generated content, inserted last inside the element" },
        { value: "content: \"\";", meaning: "required — even empty, to show a decorative shape" },
      ],
    },
    hints: [
      "The banners already stand — this lesson is about naming what you see correctly, not about jumping.",
      "Two of the four banners have no `data-tag` yet. Compare their position (first vs second) with the runestone's example.",
      "The runestone shows `.quote::before` inserts content first, `.quote::after` inserts it last.",
      "The banner positioned FIRST corresponds to ::before; the one positioned LAST corresponds to ::after.",
      'Give the first blank banner `data-tag="before"` and the second `data-tag="after"`.',
    ],
    debrief: {
      rule: "::before and ::after generate visual-only content from CSS, positioned first or last inside the real element — never a substitute for real content.",
      seenIn: "A required-field asterisk, added purely visually with `label.required::after { content: \" *\"; }`, instead of typing it into every label.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Why can't ::before content become a platform in this world?",
      options: [
        "It's invisible by default",
        "It isn't a real DOM element, so nothing can measure or click it",
        "It only works on <div>",
        "It's removed when the page loads",
      ],
      answer: 1,
      explain: "Pseudo-elements are rendered by the browser but never appear in the DOM tree — there's no real element there to measure.",
    },
    html: `<div class="ledge start">start</div>

<div class="banners">
  <div class="banner" data-tag="before"></div>
  <div class="banner"></div>
  <div class="banner"></div>
  <div class="banner" data-tag="after"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `/* .quote::before { content: "“"; }  ← inserted FIRST inside .quote   */
/* .quote::after  { content: "”"; }  ← inserted LAST  inside .quote   */
/* Mark the two blank banners below with data-tag="before" / "after". */

.banners {
  display: flex;
  gap: 20px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.banner {
  width: 90px;
  height: 30px;
  background: #4a3e2e;
  border: 4px solid #262016;
  box-sizing: border-box;
  opacity: 0.4;
}
.banner[data-tag="before"],
.banner[data-tag="after"] {
  background: #e0b85f;
  border-color: #6b4e1a;
  opacity: 1;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count('.banner:nth-child(2)[data-tag="before"]') >= 1 && ctx.count('.banner:nth-child(3)[data-tag="after"]') >= 1) return { gold: true };
      return { gold: false, note: "You crossed without labelling both banners correctly." };
    },
  },

  {
    id: "css-12-specificity",
    chapter: 2,
    number: 12,
    title: "Whose Rule Wins",
    concept: "specificity & the cascade",
    edit: "css",
    learn: "Predict which of two conflicting rules wins, using specificity: id beats class beats type.",
    objective: "Two rules both set the plank's width, and the less specific one is winning by accident. Make the id rule specific enough to win.",
    lesson: [
      "When two rules match the same element and set the same property, the browser has to pick one. That's the **cascade**, and the main tiebreaker is **specificity**.",
      "Roughly, from strongest to weakest: an id selector beats a class selector, which beats a type (tag) selector. `!important` (next lesson) beats all of them.",
      "Here, `.plank { width: 20px; }` and `#plank { width: 300px; }` both target the same element. An id selector is more specific than a class selector, so `#plank` *should* win — but right now it's written as `.plank`, a class selector with the SAME specificity as the other rule, so whichever comes later in the file wins, and that happens to be the narrow one.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".plank { width: 20px; }", note: "class selector" },
        { code: "#plank { width: 300px; }", note: "id selector — wins over a class, regardless of order" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the rule meant to widen the plank — it's written as `.plank`.",
      "Change its selector to `#plank`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Specificity (low → high)",
      syntax: "type < class < id < !important",
      entries: [
        { value: "div", meaning: "type selector — weakest" },
        { value: ".plank", meaning: "class selector — stronger" },
        { value: "#plank", meaning: "id selector — stronger still" },
      ],
    },
    hints: [
      "The plank is narrow, even though there's clearly a rule further down meant to widen it to 300px.",
      "Both the narrow rule and the wide rule use the same kind of selector. Does either of them actually outrank the other?",
      "Both are written as `.plank` — same specificity, so the later one in the file loses this time because of ordering. Making one genuinely MORE specific settles it regardless of order.",
      "The element actually has `id=\"plank\"`. Selecting it by id (`#plank`) is more specific than any class selector, so it will win no matter which rule comes first.",
      "Change the widening rule's selector from `.plank` to `#plank`.",
    ],
    debrief: {
      rule: "When rules conflict, higher specificity wins regardless of order: id beats class beats type. Equal specificity falls back to \"last one written wins\".",
      seenIn: "A component library's default button style (class-based) gets safely overridden by a page-specific id rule, without touching the library's CSS.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "`.box { color: blue; }` and `#box { color: red; }` both match the same element. Which colour wins?",
      options: ["Blue — classes win", "Red — an id selector is more specific", "Whichever is written last", "Neither — the browser picks the average"],
      answer: 1,
      explain: "An id selector outranks a class selector regardless of source order.",
    },
    html: `<div class="ledge start">start</div>
<div id="plank" class="plank"></div>
<div class="ledge goal">goal</div>
`,
    css: `/* Meant to size the plank properly — but as a class, it only ties with
   the rule below, and a tie goes to whichever is written later. */
.plank {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 300px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

/* An unrelated, later rule that also happens to set width — same
   specificity as the rule above, so being later, it's the one that wins. */
.plank {
  width: 20px;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (ctx.count("#plank") >= 1 && /#plank\s*\{[^}]*width\s*:\s*300px/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "Solved — the intended fix used specificity (an id selector) to settle the conflict." };
    },
  },

  {
    id: "css-13-inheritance",
    chapter: 2,
    number: 13,
    title: "What Passes Down",
    concept: "inheritance, inherit / initial / unset",
    edit: "css",
    learn: "Know which properties inherit from a parent by default, and override that with inherit, initial or unset.",
    objective: "The container sets a colour that should pass to its child banner, but the child cancels it. Let it inherit instead.",
    lesson: [
      "Some CSS properties **inherit** by default — a child element automatically takes a parent's value unless it sets its own. `color` and `font-family` inherit; `width`, `height`, `border` and `background` do not.",
      "`.banner { border-color: initial; }` resets a property to its default, ignoring both its parent and any other rule — that's what's blocking the colour here.",
      "Writing `border-color: inherit;` instead explicitly takes the parent's value, however it's set — the reliable choice when you want a child to genuinely match its container.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".hall { border-color: gold; }", note: "sets its own border colour" },
        { code: ".banner { border-color: initial; }", note: "resets to the browser default, ignoring the parent" },
        { code: ".banner { border-color: inherit; }", note: "takes the parent's actual value" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.banner { border-color: initial; }`.",
      "Change `initial` to `inherit`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "inherit / initial / unset",
      syntax: "property: inherit | initial | unset;",
      entries: [
        { value: "inherit", meaning: "take the parent's actual value" },
        { value: "initial", meaning: "reset to the property's default, ignoring everything" },
        { value: "unset", meaning: "inherit if the property normally inherits, else initial" },
      ],
    },
    hints: [
      "The banner is solid but oddly colourless at the edges compared to its glowing container.",
      "Look at `.banner`'s border-color declaration. Is it taking a value from somewhere, or resetting itself?",
      "It says `border-color: initial;` — that resets it to the browser default, ignoring the hall's gold border colour entirely.",
      "`border-color` doesn't inherit by default, so writing `inherit` explicitly is how you make a child genuinely take its parent's colour.",
      "Change `border-color: initial;` to `border-color: inherit;`.",
    ],
    debrief: {
      rule: "Not every property inherits by default. `inherit` explicitly takes the parent's value; `initial` explicitly resets to the property's default.",
      seenIn: "A design system often sets `color` once on `body` and lets it inherit everywhere, only overriding it on specific components like buttons.",
      fableLine: "HTML says what things are. CSS says what they look like.",
    },
    quiz: {
      question: "Does border-color inherit from a parent by default?",
      options: ["Yes, always", "No — it must be inherited explicitly with the inherit keyword", "Only inside a <div>", "Only if the parent has no id"],
      answer: 1,
      explain: "Visual box properties like border-color don't inherit automatically; text-related ones like color and font-family do.",
    },
    html: `<div class="ledge start">start</div>

<div class="hall">
  <div class="banner"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.hall {
  position: absolute;
  left: 220px;
  bottom: 140px;
  padding: 10px;
  border: 6px solid #e0b85f;
  box-sizing: border-box;
}

.banner {
  width: 288px;
  height: 18px;
  background: #333;
  border: 6px solid;
  border-color: initial;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (/border-color\s*:\s*inherit/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was border-color: inherit." };
    },
  },

  {
    id: "css-14-important",
    chapter: 2,
    number: 14,
    title: "The Rule That Cheats",
    concept: "!important",
    edit: "css",
    learn: "Understand why !important overrides normal specificity — and why it's a last resort, not a first move.",
    objective: "An old, forgotten rule uses !important to force the bridge narrow. The only way past it is another !important, closer to the actual fix.",
    lesson: [
      "`!important` after a value makes that declaration win over *any* normal rule, no matter its specificity or how it's ordered — even an id selector loses to a class with `!important`.",
      "That power is exactly why it causes trouble: once something is marked `!important`, the only way to override it later is with *another* `!important` of equal or higher specificity — and this can spiral across a real codebase.",
      "Here, an old rule has already used `!important` to force a narrow width. The fix isn't to “clean it up” by removing it (you can't touch that rule) — it's to reach for `!important` yourself, deliberately, in the rule meant to fix the bridge.",
      "In real projects: reach for `!important` rarely, and only when you fully intend to override everything else — a more specific selector is almost always the better first move.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".bridge { width: 80px !important; }", note: "wins over anything, any specificity" },
        { code: "#bridge { width: 80px; }", note: "an id alone still loses to the !important rule above" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the rule meant to widen `.bridge` — it's currently losing.",
      "Add `!important` to its width declaration.",
      "Cross the bridge.",
    ],
    reference: {
      title: "!important",
      syntax: "property: value !important;",
      entries: [
        { value: "width: 80px !important;", meaning: "overrides any normal rule, any specificity" },
        { value: "last resort", meaning: "prefer a more specific selector first, in real code" },
      ],
    },
    hints: [
      "The bridge is stuck at a stubborn 80px, and there's a rule right below it clearly trying to widen it to 500px — with no effect.",
      "Look above the 500px rule. Is there another rule for `.bridge`, and does it have anything unusual after its value?",
      "There's an old `.bridge { width: 80px !important; }` rule. `!important` makes it win over the plain rule below it, regardless of specificity.",
      "The only way to override an `!important` declaration is with another `!important` of at least equal specificity. You can't delete the old rule here, so the fix rule needs `!important` too.",
      "Add `!important` to the `width: 500px;` line, so it reads `width: 500px !important;`.",
    ],
    debrief: {
      rule: "!important overrides normal specificity entirely. It's powerful exactly because it's hard to undo later — use it rarely and deliberately.",
      seenIn: "Utility CSS frameworks sometimes mark tiny helper classes `!important` on purpose, since they're meant to always win — everywhere else, it's usually a sign something upstream should be fixed instead.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What beats a rule marked !important?",
      options: ["A rule with an id selector", "Nothing except another !important rule of equal or higher specificity", "A rule written later in the file", "Nothing — !important can never be overridden"],
      answer: 1,
      explain: "!important rules only lose to other !important rules — normal specificity and order no longer matter once it's involved.",
    },
    html: `<div class="ledge start">start</div>
<div class="bridge"></div>
<div class="ledge goal">goal</div>
`,
    css: `/* An old rule nobody remembers writing — you can't edit this comment or rule away. */
.bridge {
  width: 80px !important;
}

.bridge {
  position: absolute;
  left: 160px;
  bottom: 140px;
  width: 500px;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (/width\s*:\s*500px\s*!important/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "Solved — the intended fix used !important to override the old rule." };
    },
  },

  {
    id: "css-15-box-sizing",
    chapter: 2,
    number: 15,
    title: "What Width Actually Measures",
    concept: "box-sizing",
    edit: "css",
    learn: "Understand the difference between content-box (the default) and border-box, and why border-box is usually easier.",
    objective: "Padding and border are inflating both stones past their intended width, so the row is too wide for its space and the second stone wraps away entirely. Switch to border-box to fix it.",
    lesson: [
      "By default (`box-sizing: content-box`), `width` sets only the **content** area — padding and border are added *on top*, making the element bigger than the number you wrote.",
      "`box-sizing: border-box` changes the meaning of `width`: it now includes padding and border, so the element's actual rendered size matches the number exactly.",
      "These stones have real padding and a thick border, and are set to `content-box` — so despite `width: 100px`, each renders wider than expected. Their container is only just wide enough for two *correctly*-measured stones, so the oversized second one has nowhere to go and wraps onto a row of its own, far from the path.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "box-sizing: content-box;", note: "width = content only (padding/border added on top) — the default" },
        { code: "box-sizing: border-box;", note: "width = content + padding + border, all included" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.stone { box-sizing: content-box; }`.",
      "Change it to `border-box`.",
      "Cross the row.",
    ],
    reference: {
      title: "box-sizing",
      syntax: "box-sizing: content-box | border-box;",
      entries: [
        { value: "content-box", meaning: "width excludes padding and border (default)" },
        { value: "border-box", meaning: "width includes padding and border" },
      ],
    },
    hints: [
      "The first stone is there, but the second one is nowhere near it — as if it didn't fit and got pushed elsewhere.",
      "Each stone has real padding and a thick border. Does box-sizing: content-box add those on top of the width, or include them in it?",
      "content-box (the default) adds padding and border ON TOP of the width you set, making each stone wider than the 100px written — too wide for both to fit their container in one row, so the second one wraps away.",
      "border-box makes `width` include padding and border, so the actual rendered box matches the number you wrote — both stones then fit exactly where the row expects them.",
      "Change `box-sizing: content-box;` to `box-sizing: border-box;`.",
    ],
    debrief: {
      rule: "content-box (default) adds padding/border on top of width; border-box includes them, so width matches the real rendered size.",
      seenIn: "Most CSS resets set `* { box-sizing: border-box; }` globally on day one, precisely to avoid this surprise everywhere.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "An element has width: 100px, 10px padding on each side, and box-sizing: content-box. How wide does it actually render?",
      options: ["100px", "110px", "120px", "90px"],
      answer: 2,
      explain: "content-box adds padding on both sides on top of the width: 100 + 10 + 10 = 120px (plus any border, on top of that).",
    },
    html: `<div class="ledge start">start</div>

<div class="row">
  <div class="stone"></div>
  <div class="stone"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `/* Just wide enough for two properly-measured stones, side by side. */
.row {
  display: flex;
  flex-wrap: wrap;
  width: 222px;
  gap: 20px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.stone {
  width: 100px;
  height: 30px;
  padding: 8px;
  background: #d8c090;
  border: 6px solid #7a5a2a;
  box-sizing: content-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }
${DECORATION}`,
    rubric: (ctx) => {
      const stone = rule(ctx.css, ".stone");
      if (stone["box-sizing"] === "border-box") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was box-sizing: border-box." };
    },
  },

  {
    id: "css-16-width-height",
    chapter: 2,
    number: 16,
    title: "Room to Grow, a Limit Not to Cross",
    concept: "min-width / max-width",
    edit: "css",
    learn: "Constrain a flexible size with min-width, max-width, min-height and max-height.",
    objective: "The banner is allowed to grow, but a max-width is capping it short of the goal. Raise the cap.",
    lesson: [
      "`width` sets a size directly. `min-width` and `max-width` instead set *limits* — the element can be anything in between, decided by its content or another rule.",
      "`max-width` is why a banner that's `width: 100%` still doesn't grow forever: `max-width: 300px` caps it, however wide its container is.",
      "Here, the banner wants to be quite wide, but `max-width: 200px` is holding it back short of the goal.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "width: 90%;", note: "flexible, relative to its container" },
        { code: "max-width: 300px;", note: "…but never wider than this" },
        { code: "min-width: 120px;", note: "…and never narrower than this" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.banner { max-width: 200px; }`.",
      "Raise the number so the banner can reach far enough.",
      "Cross to the goal.",
    ],
    reference: {
      title: "min-/max- sizing",
      syntax: "min-width, max-width, min-height, max-height",
      entries: [
        { value: "max-width: 300px", meaning: "never wider than 300px" },
        { value: "min-width: 120px", meaning: "never narrower than 120px" },
      ],
    },
    hints: [
      "The banner grows to fill its container, but stops short of the goal — as if something is holding a ceiling over it.",
      "Its `width` is set generously (90%). Is anything else limiting how far that can actually go?",
      "`max-width: 200px` caps it well below what `width: 90%` would otherwise allow.",
      "max-width sets a hard ceiling regardless of what width or its container would otherwise allow. Raising it lets the banner actually reach 90% of its wide container.",
      "Change `max-width: 200px;` to something like `max-width: 500px;`.",
    ],
    debrief: {
      rule: "min-/max-width and min-/max-height cap a flexible size without fixing it outright — the element can be anything between the limits.",
      seenIn: "A responsive image is often `width: 100%; max-width: 600px;` — fills its column, but never blows up huge on a wide screen.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "An element has width: 90% and max-width: 200px, inside a 600px-wide container. How wide does it render?",
      options: ["540px (90% of 600px)", "200px — max-width caps it", "600px", "90px"],
      answer: 1,
      explain: "90% of 600px would be 540px, but max-width: 200px caps it well below that.",
    },
    html: `<div class="ledge start">start</div>

<div class="wide">
  <div class="banner"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.wide {
  position: absolute;
  left: 170px;
  bottom: 140px;
  width: 600px;
}

.banner {
  width: 90%;
  max-width: 200px;
  height: 30px;
  background: #6fa78f;
  border: 4px solid #2c5747;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      const banner = rule(ctx.css, ".banner");
      if ((pxValue(banner["max-width"]) ?? 0) >= 480) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was raising max-width." };
    },
  },

  {
    id: "css-17-margin-collapsing",
    chapter: 2,
    number: 17,
    title: "When Two Gaps Become One",
    concept: "margin collapsing",
    edit: "css",
    learn: "Recognise margin collapsing: two vertical margins between block siblings combine into one, not add up.",
    objective: "Step two's margin is a leftover, accidentally huge value. Shrink it to match step one's, so the real, collapsed gap is climbable.",
    lesson: [
      "When two block elements stack vertically, the bottom margin of one and the top margin of the next don't add together — they **collapse** into a single margin, the size of the *larger* one.",
      "A step with `margin-bottom: 20px` sitting above one with `margin-top: 20px` leaves only 20px between them, not 40px — that's the everyday, harmless version of collapsing.",
      "The surprising part shows up when the two values *differ*: step one asks for a careful 20px gap below it, but step two's `margin-top` is a leftover 110px — and collapsing always keeps the **larger** value. Step one's careful 20px counts for nothing; the real gap is 110px.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".stepOne { margin-bottom: 20px; }", note: "a careful, small gap…" },
        { code: ".stepTwo { margin-top: 110px; }", note: "…overruled by a much bigger one" },
        { code: "/* real gap: 110px — the larger value always wins */", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.stepTwo { margin-top: 110px; }`.",
      "Change `110px` to `20px`, matching step one's margin.",
      "Climb to the goal.",
    ],
    reference: {
      title: "Margin collapsing",
      syntax: "margin-bottom + margin-top → the larger one, not the sum",
      entries: [
        { value: "20px + 20px", meaning: "collapses to 20px, not 40px" },
        { value: "20px + 110px", meaning: "collapses to 110px — the larger value wins, always" },
      ],
    },
    hints: [
      `Dom can climb about ${UP} at a time. The gap between the two steps is clearly more than that.`,
      "Step one sets a small margin-bottom. Step two sets its own margin-top. Do these add together, or does one of them simply not matter?",
      "They collapse into one gap: whichever value is larger. Step one's 20px doesn't get a say once step two's margin-top is bigger.",
      "`.stepTwo { margin-top: 110px; }` is the real, collapsed gap — 110px, too far to climb. Making it match step one's 20px collapses down to an easy climb instead.",
      "Change `.stepTwo`'s `margin-top` from `110px` to `20px`.",
    ],
    debrief: {
      rule: "Adjacent vertical margins between block siblings collapse into one margin — the larger of the two — not their sum. A small, careful margin can be overruled by a bigger neighbour.",
      seenIn: "Two paragraphs each with `margin: 1em 0` end up 1em apart, not 2em, which is exactly why default paragraph spacing looks even.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Two stacked block elements have margin-bottom: 20px and margin-top: 50px between them. How big is the actual gap?",
      options: ["70px", "50px", "20px", "35px"],
      answer: 1,
      explain: "Adjacent vertical margins collapse to the larger value — 50px — not the sum of both.",
    },
    html: `<div class="ground start">start</div>
<div class="stairs">
  <div class="step stepOne"></div>
  <div class="step stepTwo"></div>
</div>
<div class="summit goal">summit</div>
`,
    css: `.ground {
  position: absolute;
  left: 20px;
  bottom: 40px;
  width: 160px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}

.stairs {
  position: absolute;
  left: 220px;
  bottom: 70px;
  /* A hairline of padding keeps the steps' own margins contained inside
     this box, instead of collapsing straight through it. */
  padding: 1px 0;
}

.step {
  width: 140px;
  height: 30px;
  background: #8c7ad1;
  border: 4px solid #3b2f73;
  box-sizing: border-box;
}
.stepOne {
  margin-bottom: 20px;
}
/* A leftover from an earlier draft — meant to be 20px, like stepOne's. */
.stepTwo {
  margin-top: 110px;
}

.summit {
  position: absolute;
  left: 220px;
  bottom: 195px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const stepTwo = rule(ctx.css, ".stepTwo");
      const mt = pxValue(stepTwo["margin-top"]) ?? 110;
      if (mt <= 40 && mt >= 0) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was matching stepTwo's margin-top to stepOne's 20px." };
    },
  },

  {
    id: "css-18-display",
    chapter: 2,
    number: 18,
    title: "Block, Inline, or Gone",
    concept: "display",
    edit: "css",
    learn: "Choose the right display value: block, inline-block, or none — from the CSS side.",
    objective: "A plank is set to display: none, erasing it completely. Give it a real display so it exists again.",
    lesson: [
      "`display` decides an element's fundamental layout behaviour. `block` takes a full line and respects width/height. `inline` sits in a line of text and ignores width/height. `inline-block` sits in a line but still respects width/height. `none` removes it from the page entirely — not just hidden, genuinely gone from layout.",
      "`display: none` is different from being invisible: a `display: none` element takes up no space at all, as if it were never written.",
      "This plank has `display: none` — no width or height will help until it has a real display value again.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "display: block;", note: "full line, respects width/height" },
        { code: "display: inline-block;", note: "sits in a line, respects width/height" },
        { code: "display: none;", note: "removed from layout entirely" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.plank { display: none; }`.",
      "Change it to `display: block;`.",
      "Cross the plank.",
    ],
    reference: {
      title: "display",
      syntax: "display: <keyword>;",
      entries: [
        { value: "block", meaning: "own line, width/height respected" },
        { value: "inline-block", meaning: "in a line, width/height still respected" },
        { value: "none", meaning: "removed from the page completely" },
      ],
    },
    hints: [
      "The plank is written in the HTML, fully styled with a width, height, colour and border — yet nothing is there at all.",
      "Every other property looks fine. Is there a display value that would remove an element from the page regardless of its other styles?",
      "`.plank { display: none; }` — this removes it from the layout entirely; width and height stop mattering.",
      "display: none genuinely erases an element from the rendered page. Any other display value (block, inline-block…) brings it back, letting its width and height apply again.",
      "Change `display: none;` to `display: block;`.",
    ],
    debrief: {
      rule: "display: none removes an element from layout entirely — it isn't hidden, it simply isn't there. Any other display value restores it.",
      seenIn: "Tabs interfaces set every inactive panel to `display: none` and the active one to `display: block`, swapping which one applies.",
      fableLine: "A web page is made of elements. Write one down, and it exists.",
    },
    quiz: {
      question: "What's true of a display: none element that isn't true of one with opacity: 0?",
      options: [
        "It takes up no space in the layout at all",
        "It's brighter",
        "It still receives clicks",
        "There's no difference",
      ],
      answer: 0,
      explain: "opacity: 0 is invisible but still occupies its layout space; display: none removes the space entirely.",
    },
    html: `<div class="ledge start">start</div>
<div class="plank"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }

.plank {
  display: none;
  position: absolute;
  left: 160px;
  bottom: 140px;
  width: 580px;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const plank = rule(ctx.css, ".plank");
      if (plank["display"] && plank["display"] !== "none") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was changing display away from none." };
    },
  },

  {
    id: "css-19-units-relative",
    chapter: 2,
    number: 19,
    title: "Pixels, Percent, and the Letter M",
    concept: "px / % / em / rem",
    edit: "css",
    learn: "Tell px, %, em and rem apart — and know what each one is relative to.",
    objective: "The banner's width is set in em, relative to a huge font-size, making it enormous. Switch to rem so it's predictable.",
    lesson: [
      "`px` is an absolute length — always the same size. `%` is relative to a containing measurement (often the parent's size). `em` is relative to *the current element's own font-size* — which makes it multiply unexpectedly when font-size is also large. `rem` is relative to the **root** (`<html>`) font-size, which stays constant however nested you are.",
      "This banner sets `font-size: 40px` for a big decorative number, and then sizes its own width in `em` — so the width scales with that same huge font-size, blowing it up far past what was intended.",
      "Switching to `rem` (or a plain `px` value) breaks that accidental link between font-size and width.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "font-size: 40px;", note: "" },
        { code: "width: 8em;", note: "8 × this element's OWN font-size = 320px" },
        { code: "width: 8rem;", note: "8 × the root font-size (usually 16px) = 128px, unaffected" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.banner { font-size: 40px; width: 8em; }`.",
      "Change `width: 8em;` to `width: 8rem;`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Length units",
      syntax: "px · % · em · rem",
      entries: [
        { value: "px", meaning: "an absolute length" },
        { value: "em", meaning: "relative to this element's own font-size" },
        { value: "rem", meaning: "relative to the root (<html>) font-size — stable" },
      ],
    },
    hints: [
      "The banner is a huge, oversized slab — far bigger than the row it's supposed to fit into.",
      "It sets a large font-size for its number, and its width is also written in a unit relative to font-size. Which unit is that?",
      "`width: 8em` — em is relative to the element's OWN font-size, so a 40px font-size makes 8em equal 320px.",
      "`rem` is always relative to the root's font-size, not the current element's — switching to it decouples the width from this banner's own oversized text.",
      "Change `width: 8em;` to `width: 8rem;`.",
    ],
    debrief: {
      rule: "em scales with the current element's own font-size — which can compound unexpectedly. rem always scales with the root font-size, staying predictable.",
      seenIn: "Design systems favour rem for spacing and sizing precisely so a component's own font-size changes don't silently resize everything else about it.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "The root (html) font-size is 16px. An element with font-size: 40px sets width: 2rem. How wide is it?",
      options: ["80px (2 × 40px)", "32px (2 × 16px)", "2px", "It depends on the parent's width"],
      answer: 1,
      explain: "rem always relates to the root font-size (16px here), never the element's own — so 2rem = 32px regardless of this element's 40px font-size.",
    },
    html: `<div class="ledge start">start</div>
<div class="banner">9</div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

.banner {
  position: absolute;
  left: 220px;
  bottom: 140px;
  font-size: 40px;
  width: 8em;
  height: 30px;
  overflow: hidden;
  background: #d8c090;
  border: 4px solid #7a5a2a;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const banner = rule(ctx.css, ".banner");
      if (/rem$/.test((banner["width"] ?? "").trim()) || /^\d+px$/.test((banner["width"] ?? "").trim())) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was switching away from em to rem (or a plain px value)." };
    },
  },

  {
    id: "css-20-units-viewport",
    chapter: 2,
    number: 20,
    title: "Sized to the Screen Itself",
    concept: "vw / vh",
    edit: "css",
    learn: "Size something relative to the viewport itself with vw and vh, not its container.",
    objective: "The curtain is sized in px and covers too little of the stage. Size it in vh so it always reaches full height.",
    lesson: [
      "`vw` and `vh` are relative to the **viewport** — the visible window — not to any parent element. `1vw` is 1% of the viewport's width; `1vh` is 1% of its height.",
      "They're useful for something that should always span the full screen, whatever else is on the page: a full-height hero section, or a curtain that always reaches the ground regardless of the stage's own size.",
      "Newer `dvh` (\"dynamic viewport height\") behaves like `vh` but adjusts for mobile browser UI sliding in and out — worth knowing exists, even though this stage doesn't need it.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "width: 100vw;", note: "always the full viewport width" },
        { code: "height: 100vh;", note: "always the full viewport height" },
        { code: "height: 100dvh;", note: "like vh, but adjusts for mobile browser chrome" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.curtain { height: 140px; }`.",
      "Change it to a `vh` value large enough to reach the top.",
      "Walk past the curtain to the goal.",
    ],
    reference: {
      title: "Viewport units",
      syntax: "vw · vh · dvh",
      entries: [
        { value: "1vw", meaning: "1% of the viewport's width" },
        { value: "1vh", meaning: "1% of the viewport's height" },
        { value: "100dvh", meaning: "like 100vh, but stable on mobile browsers" },
      ],
    },
    hints: [
      "The curtain blocks the path low down, but there's clearly open space above it that a taller curtain would fill.",
      "Its height is set as a fixed pixel number. What unit would make it track the stage's own height instead?",
      "`height: 140px;` is fixed and short. `vh` is relative to the full viewport height, so a large `vh` value reaches much higher.",
      "Since this stage's visible area is a set height, a `vh` value comfortably above 100 fills it fully, wherever the top of the stage happens to be.",
      "Change `height: 140px;` to something like `height: 150vh;`.",
    ],
    debrief: {
      rule: "vw and vh size relative to the viewport itself, not a parent element — the right tool for something that should always span the visible screen.",
      seenIn: "A full-bleed hero banner at the top of a homepage is usually `height: 100vh` — always fills the screen, on any device.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What is 50vh relative to?",
      options: ["The element's parent height", "The viewport's height", "The element's own font-size", "50 pixels, always"],
      answer: 1,
      explain: "vh units are always relative to the viewport (visible window) height, regardless of any parent element.",
    },
    html: `<div class="ledge start">start</div>
<div class="curtain"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }

.curtain {
  position: absolute;
  left: 220px;
  bottom: 0;
  width: 300px;
  height: 140px;
  background: #5b4a6e;
  border: 4px solid #2b2140;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const curtain = rule(ctx.css, ".curtain");
      if (/vh$/.test((curtain["height"] ?? "").trim())) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was sizing the curtain in vh." };
    },
  },

  {
    id: "css-21-calc",
    chapter: 2,
    number: 21,
    title: "Arithmetic Inside a Value",
    concept: "calc()",
    edit: "css",
    learn: "Mix units in one value with calc(), for sizes plain CSS can't express any other way.",
    objective: "The plank needs to fill its 900px stage minus a fixed 400px on each side. Write that with calc().",
    lesson: [
      "`calc()` lets you write CSS arithmetic that **mixes units** — something a plain value can never do. `calc(100% - 40px)` means \"the full available width, minus a fixed 40px\", which no single percentage or pixel value could express.",
      "Spacing must have a space around `+` and `-` inside calc() (`calc(100% - 40px)`, never `calc(100%-40px)`) — `*` and `/` don't need one, but it's fine to keep it consistent.",
      "This plank needs to span the 900px stage minus 400px reserved on the left and right combined — a mix no fixed pixel width alone can express as the stage size varies.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "width: calc(100% - 40px);", note: "all available width, minus a fixed 40px" },
        { code: "width: calc(50% + 20px);", note: "half the container, plus a fixed 20px" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.plank { width: 100px; }`.",
      "Change it to `width: calc(100% - 400px);`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "calc()",
      syntax: "calc(expression)",
      entries: [
        { value: "calc(100% - 40px)", meaning: "mixes a percentage and a fixed length" },
        { value: "calc(50% + 20px)", meaning: "half the container, plus extra" },
      ],
    },
    hints: [
      "The plank fills only a small corner of its full-width container, leaving most of the way to the goal empty.",
      "Its width is a plain, small pixel number. Is there a way to express \"fill everything, minus a bit\" instead of a fixed number?",
      "`width: 100px;` never adapts. `calc()` can combine a percentage and a fixed length in one value.",
      "`calc(100% - 400px)` takes the full available width and subtracts a fixed 400px — exactly the gap this level needs closed.",
      "Change `width: 100px;` to `width: calc(100% - 400px);`.",
    ],
    debrief: {
      rule: "calc() combines different units in a single value — the only way to express a mix like \"100% minus a fixed amount\".",
      seenIn: "A sidebar layout is often `width: calc(100% - 240px)` for the main column, leaving a fixed 240px for the sidebar beside it.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "In a 900px-wide container, how wide does calc(100% - 400px) render?",
      options: ["400px", "500px", "900px", "It's invalid CSS"],
      answer: 1,
      explain: "100% of 900px is 900px; subtracting the fixed 400px leaves 500px.",
    },
    html: `<div class="ledge start">start</div>

<div class="stage">
  <div class="plank"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.stage {
  position: absolute;
  left: 170px;
  bottom: 140px;
  width: 700px;
}

.plank {
  width: 100px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 800px; }
${DECORATION}`,
    rubric: (ctx) => {
      const plank = rule(ctx.css, ".plank");
      if (/^calc\(/.test((plank["width"] ?? "").trim())) return { gold: true };
      return { gold: false, note: "Solved — the intended tool was calc()." };
    },
  },

  {
    id: "css-22-clamp",
    chapter: 2,
    number: 22,
    title: "A Size With Guardrails",
    concept: "clamp() / min() / max()",
    edit: "css",
    learn: "Set a size that flexes between a minimum and a maximum with clamp(), in one declaration.",
    objective: "The banner's flexible width is capped too low by a plain max-width. Use clamp() to give it more room while still keeping guardrails.",
    lesson: [
      "`clamp(min, preferred, max)` picks the `preferred` value, but never lets it go below `min` or above `max` — a minimum, a flexible ideal, and a maximum, in one declaration.",
      "It's equivalent to writing `min-width`, `width` and `max-width` together, but as a single value that reads as one idea: \"flexible, within these guardrails\".",
      "`min()` and `max()` are the simpler building blocks: `min(50%, 300px)` picks whichever is *smaller*; `max()` picks whichever is *larger*.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "width: clamp(200px, 50%, 500px);", note: "50% of the container, never below 200px or above 500px" },
        { code: "width: min(50%, 300px);", note: "whichever is smaller" },
        { code: "width: max(50%, 300px);", note: "whichever is larger" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.banner { width: 50%; max-width: 150px; }`.",
      "Replace both lines with a single `width: clamp(100px, 50%, 500px);`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "clamp()",
      syntax: "clamp(min, preferred, max)",
      entries: [
        { value: "clamp(100px, 50%, 500px)", meaning: "50%, but never under 100px or over 500px" },
        { value: "min(a, b)", meaning: "whichever is smaller" },
        { value: "max(a, b)", meaning: "whichever is larger" },
      ],
    },
    hints: [
      "The banner is flexible in principle, but it never grows past a small, fixed cap, however wide its container is.",
      "It uses `width: 50%` alongside a separate `max-width`. Is there one declaration that could express \"flexible, with both a floor and a ceiling\"?",
      "`max-width: 150px;` is capping it well short of what 50% of its wide container would allow.",
      "clamp(min, preferred, max) replaces both lines: it stays flexible at the preferred size, while still respecting a minimum and a (much higher) maximum.",
      "Replace both declarations with `width: clamp(100px, 50%, 500px);`.",
    ],
    debrief: {
      rule: "clamp(min, preferred, max) expresses a flexible size with both a floor and a ceiling in a single, readable declaration.",
      seenIn: "Fluid typography is usually `font-size: clamp(1rem, 2vw + 1rem, 2.5rem)` — scales with the viewport, within sane limits.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "clamp(100px, 50%, 500px) is used in a container 1200px wide. What width results?",
      options: ["100px", "500px — the max always wins", "500px, because 50% (600px) exceeds it", "600px"],
      answer: 2,
      explain: "50% of 1200px is 600px, which is above the 500px ceiling, so the value clamps down to 500px.",
    },
    html: `<div class="ledge start">start</div>

<div class="stage">
  <div class="banner"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.stage {
  position: absolute;
  left: 170px;
  bottom: 140px;
  width: 700px;
}

.banner {
  width: 50%;
  max-width: 150px;
  height: 30px;
  background: #cf9a52;
  border: 4px solid #6e4f11;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 800px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (/clamp\(/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "Solved — the intended tool was clamp()." };
    },
  },

  {
    id: "css-23-colors",
    chapter: 2,
    number: 23,
    title: "Every Way to Write a Colour",
    concept: "hex / rgb() / hsl() / alpha",
    edit: "css",
    learn: "Read and write colours as hex, rgb(), hsl(), with an alpha channel for transparency.",
    objective: "The gate should be half-transparent so you can see the goal through it, but its colour has no alpha channel. Add one.",
    lesson: [
      "A colour can be written as **hex** (`#6b4e1a`), **rgb()** (`rgb(107, 78, 26)`), or **hsl()** (`hsl(35, 61%, 26%)`) — hue, saturation, lightness, which is often more intuitive to adjust by hand.",
      "Any of them can take a fourth **alpha** value for transparency: `rgba(0,0,0,0.5)`, `hsla(0,0%,0%,0.5)`, or 2 extra hex digits (`#00000080`). `0` is fully transparent, `1` (or `ff`) is fully opaque.",
      "`currentColor` is a special keyword: it reuses the element's own text colour anywhere else a colour is expected, like a border.",
      "This gate's background is a plain opaque `rgb()`. Adding a fourth, alpha value lets you see through it.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "background: #6b4e1a;", note: "opaque hex colour" },
        { code: "background: rgb(107, 78, 26);", note: "same colour, as rgb()" },
        { code: "background: rgba(107, 78, 26, 0.5);", note: "50% see-through" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.gate { background: rgb(91, 74, 110); }`.",
      "Change `rgb` to `rgba` and add a fourth value around `0.35`.",
      "Look through the gate, then walk past it to the goal.",
    ],
    reference: {
      title: "Colour formats",
      syntax: "#hex · rgb() · hsl()",
      entries: [
        { value: "#6b4e1a", meaning: "hex — 6 digits, opaque" },
        { value: "rgba(0,0,0,0.5)", meaning: "rgb with 50% alpha" },
        { value: "hsl(35, 61%, 26%)", meaning: "hue, saturation, lightness" },
      ],
    },
    hints: [
      "The gate is fully solid-looking — you can't tell what's beyond it at all.",
      "Its background is written with `rgb()`, which has no transparency built in. Is there a version of rgb() that adds one?",
      "`rgba()` is `rgb()` plus a fourth value: alpha, from 0 (invisible) to 1 (solid).",
      "Add a fourth number between 0 and 1 to make the gate translucent — try around 0.35 so it's still clearly there, just see-through.",
      "Change `rgb(91, 74, 110)` to `rgba(91, 74, 110, 0.35)`.",
    ],
    debrief: {
      rule: "hex, rgb() and hsl() are equivalent ways to write the same colours; any of them can add an alpha channel for transparency.",
      seenIn: "A modal's dark backdrop is almost always `rgba(0, 0, 0, 0.5)` — black, half see-through, so the page behind is still faintly visible.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What does the 4th value in rgba(0, 0, 0, 0.25) control?",
      options: ["Hue", "Brightness", "Alpha (opacity) — 0 invisible, 1 solid", "Blur radius"],
      answer: 2,
      explain: "The 4th value in rgba()/hsla() is alpha: opacity from fully transparent (0) to fully opaque (1).",
    },
    html: `<div class="ledge start">start</div>
<div class="gate"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 400px; }

.gate {
  position: absolute;
  left: 200px;
  bottom: 140px;
  width: 120px;
  height: 30px;
  background: rgb(91, 74, 110);
  border: 4px solid #2b2140;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (/rgba\s*\(\s*91\s*,\s*74\s*,\s*110\s*,\s*0?\.\d+\)/.test(ctx.css)) return { gold: true };
      return { gold: false, note: "You crossed, but the lesson was giving the gate's colour a real alpha channel." };
    },
  },

  {
    id: "css-24-position-relative",
    chapter: 2,
    number: 24,
    title: "Nudged, Not Removed",
    concept: "position: relative",
    edit: "css",
    learn: "Nudge an element from its normal spot with position: relative, without taking it out of the flow.",
    objective: "The plank is nudged the wrong way with a negative offset. Fix the direction so it lines up with the gap.",
    lesson: [
      "`position: relative` moves an element from where it *would have been* in normal flow, using `top`/`right`/`bottom`/`left` — but its original space is still reserved, and nothing else shifts to fill it.",
      "This is different from `position: absolute` (next lesson), which removes an element from the flow entirely.",
      "This plank has `position: relative; left: -60px;` — nudging it 60px to the LEFT of its normal spot, away from the gap it's meant to fill.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "position: relative;", note: "stays in flow, but can be nudged" },
        { code: "top: 10px;", note: "nudge 10px down from its normal spot" },
        { code: "left: -20px;", note: "nudge 20px left of its normal spot" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.plank { position: relative; left: -60px; }`.",
      "Change `-60px` to a positive number, like `60px`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "position: relative",
      syntax: "position: relative; + top/right/bottom/left",
      entries: [
        { value: "left: 20px", meaning: "nudge 20px right of its normal spot" },
        { value: "left: -20px", meaning: "nudge 20px left of its normal spot" },
        { value: "top: 20px", meaning: "nudge 20px down from its normal spot" },
      ],
    },
    hints: [
      "The plank sits noticeably to the left of the gap it's meant to fill, even though it's roughly the right size.",
      "Its offset is negative. Which direction does a negative `left` value nudge a relatively positioned element?",
      "`left: -60px` moves it 60px to the LEFT of its normal position — away from the gap, not toward it.",
      "A positive `left` value nudges a relatively positioned element to the right instead. Flipping the sign moves it the other way.",
      "Change `left: -60px;` to `left: 60px;`.",
    ],
    debrief: {
      rule: "position: relative offsets an element from its normal spot with top/right/bottom/left, while its original space stays reserved.",
      seenIn: "A small badge nudged slightly to overlap the corner of a card is usually position: relative (or absolute) with a small top/left offset.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "An element in normal flow gets position: relative; left: 20px;. What happens to the space it originally occupied?",
      options: [
        "It's freed up for other elements to use",
        "It stays reserved — nothing else moves to fill it",
        "The element disappears from that spot",
        "The whole page shifts 20px",
      ],
      answer: 1,
      explain: "Relative positioning only offsets where the element is painted — its original space in the flow is still reserved.",
    },
    html: `<div class="ledge start">start</div>

<div class="socket">
  <div class="plank"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `/* The socket marks where the plank sits before any offset is applied. */
.socket {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 90px;
  height: 30px;
}

.plank {
  position: relative;
  left: -60px;
  width: 90px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 560px; }
${DECORATION}`,
    rubric: (ctx) => {
      const plank = rule(ctx.css, ".plank");
      if ((pxValue(plank["left"]) ?? -1) > 0) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was flipping the offset's direction." };
    },
  },

  {
    id: "css-25-position-absolute",
    chapter: 2,
    number: 25,
    title: "Whose Corner Is Zero",
    concept: "position: absolute & the containing block",
    edit: "css",
    learn: "Understand that an absolutely positioned element is placed relative to its nearest positioned ancestor.",
    objective: "The banner is positioned absolute, but its frame isn't a positioned ancestor, so it's placed against the whole page instead. Fix the frame.",
    lesson: [
      "`position: absolute` places an element relative to its nearest ancestor that has `position` set to anything other than `static` (the default) — its **containing block**. If no ancestor qualifies, it falls back to the whole page.",
      "This banner's `.frame` is meant to be that containing block, so `left: 20px` should mean \"20px from the frame's edge\" — but `.frame` never actually sets a `position`, so it defaults to `static` and doesn't count.",
      "As a result, the banner's `left: 20px` is measured from the page itself, not the frame — landing it far from where it's meant to be.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".frame { position: relative; }", note: "now a valid containing block" },
        { code: ".banner { position: absolute; left: 20px; }", note: "20px from .frame's edge, not the page's" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.frame { }` — it has no position set.",
      "Add `position: relative;` to it.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Containing blocks",
      syntax: "position: absolute is relative to the nearest positioned ancestor",
      entries: [
        { value: "position: static", meaning: "the default — does NOT count as a containing block" },
        { value: "position: relative", meaning: "the simplest way to make an ancestor count" },
      ],
    },
    hints: [
      "The banner is stuck all the way over near the very start of the page, nowhere near its own frame.",
      "It's `position: absolute; left: 20px;`. 20px from what, exactly — its frame, or the whole page?",
      "It's measuring from the page, because `.frame` has no `position` set at all, and stays at the default (`static`), which doesn't count as a containing block.",
      "Any position value other than `static` — even `relative` with no offset — makes an ancestor into a valid containing block for its absolutely positioned children.",
      "Add `position: relative;` to `.frame`.",
    ],
    debrief: {
      rule: "An absolutely positioned element anchors to its nearest ancestor with position set to anything but static — not automatically its visual parent.",
      seenIn: "A tooltip inside a card is `position: absolute`, and the card itself needs `position: relative` — a very common thing to forget.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "A .banner is position: absolute inside a .frame that never sets position. Where is the banner actually placed relative to?",
      options: [".frame's edges", "The whole page (or the next positioned ancestor above .frame)", "Its own original spot in normal flow", "It renders nowhere"],
      answer: 1,
      explain: "static (the default) doesn't create a containing block, so absolute positioning skips past .frame to look further up the tree.",
    },
    html: `<div class="ledge start">start</div>

<div class="frame">
  <div class="banner"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.frame {
  width: 300px;
  height: 60px;
}

.banner {
  position: absolute;
  left: 20px;
  bottom: 140px;
  width: 280px;
  height: 30px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }
${DECORATION}`,
    rubric: (ctx) => {
      const frame = rule(ctx.css, ".frame");
      if (frame["position"] && frame["position"] !== "static") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was giving .frame a real position value." };
    },
  },

  {
    id: "css-26-position-fixed-sticky",
    chapter: 2,
    number: 26,
    title: "Stuck to the Screen, or Stuck at a Line",
    concept: "position: fixed vs sticky",
    edit: "css",
    learn: "Tell position: fixed (pinned to the viewport) apart from position: sticky (pinned once you scroll to it).",
    objective: "The medallion should scroll with the page until it reaches a point, then stick. It's fixed instead, pinned from the very start.",
    lesson: [
      "`position: fixed` pins an element to the **viewport** — it never moves, however much the page scrolls, as if bolted to the screen.",
      "`position: sticky` behaves like a normal element *until* it reaches a scroll threshold you set (usually `top: 0`), then behaves like `fixed` from that point on.",
      "This medallion is `position: fixed`, so it's already pinned before you've moved at all, floating over everything.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "position: fixed; top: 0;", note: "always pinned to the viewport" },
        { code: "position: sticky; top: 0;", note: "normal, until scrolled to the top, then pinned" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.medallion { position: fixed; }`.",
      "Change it to `position: sticky;`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "fixed vs sticky",
      syntax: "position: fixed | sticky;",
      entries: [
        { value: "fixed", meaning: "pinned to the viewport, always" },
        { value: "sticky", meaning: "normal until a scroll threshold, then pinned" },
      ],
    },
    hints: [
      "The medallion floats in place over the whole scene, blocking the path, from the very start.",
      "Is it meant to always float like that, or only once you've scrolled somewhere specific?",
      "It's `position: fixed`, which pins it to the screen immediately and permanently — not what a scroll-triggered badge should do.",
      "`position: sticky` only pins once a scroll threshold (like `top: 0`) is reached — it behaves normally before that.",
      "Change `position: fixed;` to `position: sticky;`.",
    ],
    debrief: {
      rule: "fixed is always pinned to the viewport; sticky is normal until a scroll threshold, then pins — often the better choice for in-page elements.",
      seenIn: "A table's header row that stays visible while you scroll its body is almost always `position: sticky; top: 0;`.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Which position value behaves normally until a scroll threshold, then pins in place?",
      options: ["fixed", "absolute", "sticky", "relative"],
      answer: 2,
      explain: "sticky switches from normal flow to pinned exactly at the scroll threshold you set — fixed is pinned from the start.",
    },
    html: `<div class="ledge start">start</div>
<div class="medallion"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }

.medallion {
  position: fixed;
  left: 160px;
  bottom: 140px;
  width: 580px;
  height: 30px;
  background: #c79a3e;
  border: 4px solid #6e4f11;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const m = rule(ctx.css, ".medallion");
      if (m["position"] === "sticky") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was switching from fixed to sticky." };
    },
  },

  {
    id: "css-27-zindex",
    chapter: 2,
    number: 27,
    title: "Which Layer Sits on Top",
    concept: "z-index & stacking contexts",
    edit: "css",
    learn: "Control which overlapping element renders in front with z-index — and only on positioned elements.",
    objective: "A decorative fog panel is covering the bridge. Give the bridge a higher z-index so it renders on top.",
    lesson: [
      "When elements overlap, `z-index` decides which one paints on top: a higher number wins. It only has an effect on elements that are already positioned (`relative`, `absolute`, `fixed` or `sticky`) — it does nothing on a plain static element.",
      "Elements with the same (or no) z-index simply stack in the order they're written — later in the HTML paints on top.",
      "Here, a semi-transparent `.fog` panel has `z-index: 5`, and the bridge underneath has no z-index at all (so it counts as 0) — the fog wins and visually (though not physically) sits in front.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".fog { position: absolute; z-index: 5; }", note: "" },
        { code: ".bridge { position: absolute; z-index: 10; }", note: "higher — paints on top of .fog" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.bridge` — it has no z-index.",
      "Add `z-index: 10;` (anything higher than the fog's 5).",
      "Cross the bridge.",
    ],
    reference: {
      title: "z-index",
      syntax: "z-index: <number>;",
      entries: [
        { value: "z-index: 5", meaning: "stacks above anything lower, below anything higher" },
        { value: "z-index only works on positioned elements", meaning: "relative, absolute, fixed or sticky" },
      ],
    },
    hints: [
      "The bridge is there and correctly sized, but a hazy panel visually sits in front of part of it.",
      "The fog panel has a z-index. Does the bridge have one at all?",
      "The bridge has no z-index, which counts as 0 — lower than the fog's 5, so the fog paints on top.",
      "Giving the bridge a higher z-index than the fog's puts it back on top, visually — its actual walkability was never affected, only what renders in front.",
      "Add `z-index: 10;` to `.bridge`.",
    ],
    debrief: {
      rule: "z-index only affects positioned elements, and only decides paint order among overlapping ones — higher numbers render in front.",
      seenIn: "A dropdown menu needs a high z-index so it isn't hidden behind other page content it happens to overlap.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Does z-index: 100 do anything on an element with position: static (the default)?",
      options: ["Yes, it always works", "No — z-index only affects positioned elements", "Only if it's the only element on the page", "Only inside a flex container"],
      answer: 1,
      explain: "z-index is ignored on statically positioned elements; the element needs relative, absolute, fixed or sticky first.",
    },
    html: `<div class="ledge start">start</div>
<div class="bridge"></div>
<div class="fog"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }

.bridge {
  position: absolute;
  left: 160px;
  bottom: 140px;
  width: 580px;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

.fog {
  position: absolute;
  left: 300px;
  bottom: 130px;
  width: 250px;
  height: 60px;
  background: rgba(200, 220, 255, 0.5);
  z-index: 5;
}
${DECORATION}`,
    rubric: (ctx) => {
      const bridge = rule(ctx.css, ".bridge");
      if ((Number(bridge["z-index"]) || 0) > 5) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was giving the bridge a higher z-index than the fog." };
    },
  },

  {
    id: "css-28-overflow",
    chapter: 2,
    number: 28,
    title: "What Happens at the Edge",
    concept: "overflow",
    edit: "css",
    learn: "Control content that's bigger than its box with overflow: visible, hidden, scroll or auto.",
    objective: "A tall banner is clipped by its short frame's overflow: hidden. Change it so the banner is fully visible.",
    lesson: [
      "`overflow` decides what happens when content is bigger than its box. `visible` (the default) lets it spill out. `hidden` clips it at the box's edge, cutting it off entirely. `scroll`/`auto` add scrollbars instead of clipping.",
      "This banner is taller than its frame, and the frame has `overflow: hidden` — so the top of the banner is being clipped clean off, hiding the part you need to stand on.",
      "Changing it to `visible` lets the banner spill out past the frame's edge, fully intact.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "overflow: visible;", note: "content spills out (default)" },
        { code: "overflow: hidden;", note: "content is clipped at the edge" },
        { code: "overflow: auto;", note: "a scrollbar appears only if needed" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.frame { overflow: hidden; }`.",
      "Change it to `overflow: visible;`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "overflow",
      syntax: "overflow: visible | hidden | scroll | auto;",
      entries: [
        { value: "visible", meaning: "content spills out, uncut (default)" },
        { value: "hidden", meaning: "content is clipped at the box edge" },
        { value: "auto", meaning: "scrollbar appears only if content overflows" },
      ],
    },
    hints: [
      "The banner is supposed to be a tall block, but only a short sliver of it is actually visible.",
      "Its frame is shorter than the banner itself. What does the frame do with content that doesn't fit?",
      "`.frame { overflow: hidden; }` clips anything taller than the frame clean off at its edge.",
      "Switching to `overflow: visible` lets the banner's full height spill out past its short frame instead of being cut off.",
      "Change `overflow: hidden;` to `overflow: visible;`.",
    ],
    debrief: {
      rule: "overflow: hidden clips content at the box's edge; overflow: visible (the default) lets it spill out uncut.",
      seenIn: "A dropdown menu that gets clipped by a parent card almost always traces back to that parent having overflow: hidden.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "A 200px-tall element sits inside a 100px-tall box with overflow: hidden. How much of it is visible?",
      options: ["All 200px, spilling out below", "Only the top 100px — the rest is clipped", "None of it", "It automatically resizes the box to 200px"],
      answer: 1,
      explain: "overflow: hidden clips anything beyond the box's own bounds, cutting off the bottom 100px entirely.",
    },
    html: `<div class="ledge start">start</div>

<div class="frame">
  <div class="banner"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.frame {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 300px;
  height: 30px;
  overflow: hidden;
}

.banner {
  width: 300px;
  height: 220px;
  background: #6fa78f;
  border: 4px solid #2c5747;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }
${DECORATION}`,
    rubric: (ctx) => {
      const frame = rule(ctx.css, ".frame");
      if (frame["overflow"] === "visible") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was overflow: visible." };
    },
  },

  {
    id: "css-29-grid",
    chapter: 2,
    number: 29,
    title: "Rows and Columns at Once",
    concept: "CSS Grid basics",
    edit: "css",
    learn: "Lay elements out in a real two-dimensional grid with display: grid and grid-template-columns.",
    objective: "The tile grid only has one column defined, so three tiles pile into it. Define enough columns to spread them out.",
    lesson: [
      "`display: grid` turns a container into a **grid**, arranging children by rows and columns at once — flexbox only really controls one dimension at a time.",
      "`grid-template-columns` defines how many columns exist and how wide each is. `grid-template-columns: 100px 100px 100px` makes three 100px columns; `repeat(3, 100px)` is a shorter way to write the same thing.",
      "`gap` works in grid exactly like it does in flexbox: space between cells, none at the outer edges.",
      "This grid only defines one column, so all three tiles stack into it instead of spreading across a row.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".grid {", note: "" },
        { code: "  display: grid;", note: "" },
        { code: "  grid-template-columns: repeat(3, 100px);", note: "three 100px columns" },
        { code: "  gap: 10px;", note: "" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.tiles { grid-template-columns: 100px; }`.",
      "Change it to `repeat(3, 100px)`.",
      "Cross the tiles.",
    ],
    reference: {
      title: "CSS Grid",
      syntax: "display: grid; grid-template-columns: …;",
      entries: [
        { value: "grid-template-columns: 100px 100px", meaning: "two fixed 100px columns" },
        { value: "repeat(3, 100px)", meaning: "shorthand for three 100px columns" },
        { value: "1fr 1fr", meaning: "two equal, flexible columns" },
      ],
    },
    hints: [
      "The three tiles are all stacked directly on top of each other in one column, instead of spreading across.",
      "How many columns does `grid-template-columns` currently define?",
      "Just one: `grid-template-columns: 100px;` — so every tile falls into that same single column.",
      "Defining three columns instead of one gives the grid somewhere to place each tile side by side. `repeat(3, 100px)` is shorthand for three 100px columns.",
      "Change `grid-template-columns: 100px;` to `grid-template-columns: repeat(3, 100px);`.",
    ],
    debrief: {
      rule: "display: grid plus grid-template-columns lays children out in real rows and columns — how many tracks you define decides the shape.",
      seenIn: "A photo gallery or a card layout — display: grid with grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) — is almost always CSS Grid, not flexbox.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "What does grid-template-columns: repeat(3, 100px) define?",
      options: ["3 rows of 100px", "3 columns, each 100px wide", "A single 300px column", "3 gaps of 100px"],
      answer: 1,
      explain: "repeat(3, 100px) is shorthand for three column tracks, each 100px wide.",
    },
    html: `<div class="ledge start">start</div>

<div class="tiles">
  <div class="tile"></div>
  <div class="tile"></div>
  <div class="tile"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.tiles {
  display: grid;
  grid-template-columns: 100px;
  gap: 10px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.tile {
  width: 100px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      const tiles = rule(ctx.css, ".tiles");
      if (/repeat\(\s*3/.test(tiles["grid-template-columns"] ?? "") || /100px\s+100px\s+100px/.test(tiles["grid-template-columns"] ?? "")) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was defining three grid columns." };
    },
  },

  {
    id: "css-30-opacity-visibility",
    chapter: 2,
    number: 30,
    title: "Faded, Hidden, or Gone",
    concept: "opacity vs visibility vs display",
    edit: "css",
    learn: "Tell opacity, visibility and display apart — three different ways to make something disappear.",
    objective: "The plank has visibility: hidden — invisible, but still holding its space and blocking nothing. Something else is stopping you. Reveal it.",
    lesson: [
      "Three properties can make something vanish, and they behave very differently. `opacity: 0` is invisible but fully present — still clickable, still occupying space. `visibility: hidden` is invisible AND unclickable, but still occupies its space in the layout. `display: none` removes it from layout entirely, taking up no space at all.",
      "This plank is `visibility: hidden` — it isn't gone from the layout (the space is still there, and so is the platform underneath it for measurement), but it can't be seen. Since it's already correctly sized and positioned, simply making it visible is the whole fix.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "opacity: 0;", note: "invisible, but present and clickable" },
        { code: "visibility: hidden;", note: "invisible, unclickable, space still reserved" },
        { code: "display: none;", note: "gone — no space reserved at all" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.plank { visibility: hidden; }`.",
      "Change it to `visibility: visible;`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Three ways to disappear",
      syntax: "opacity · visibility · display",
      entries: [
        { value: "opacity: 0", meaning: "invisible, present, clickable, occupies space" },
        { value: "visibility: hidden", meaning: "invisible, NOT clickable, still occupies space" },
        { value: "display: none", meaning: "gone entirely — no space reserved" },
      ],
    },
    hints: [
      "The plank simply can't be seen — but this isn't quite the same as the display: none you met earlier. Notice the gap it's in isn't collapsed to nothing.",
      "Check which specific property is making it disappear: opacity, visibility, or display?",
      "It's `visibility: hidden;` — a plank that's invisible but still fully occupying its intended space.",
      "`visibility: hidden` just needs flipping back to visible — unlike display: none, the size and position were never lost.",
      "Change `visibility: hidden;` to `visibility: visible;`.",
    ],
    debrief: {
      rule: "opacity: 0 is invisible but interactive; visibility: hidden is invisible and non-interactive, but still takes up space; display: none removes it entirely.",
      seenIn: "A fade-out animation typically animates opacity (so it can transition smoothly), then switches to display: none only once the fade finishes.",
      fableLine: "The other builders laughed at her, until they saw she had built a road.",
    },
    quiz: {
      question: "Which of these still reserves its layout space while invisible?",
      options: ["display: none", "visibility: hidden", "Removing the element from the HTML", "None of them"],
      answer: 1,
      explain: "visibility: hidden hides an element from view but leaves its space in the layout untouched — unlike display: none.",
    },
    html: `<div class="ledge start">start</div>
<div class="plank"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }

.plank {
  visibility: hidden;
  position: absolute;
  left: 160px;
  bottom: 140px;
  width: 580px;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const plank = rule(ctx.css, ".plank");
      if (plank["visibility"] === "visible") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was visibility: visible." };
    },
  },

  {
    id: "css-31-background",
    chapter: 2,
    number: 31,
    title: "Painting the Surface",
    concept: "background-image, size, position, repeat",
    edit: "css",
    learn: "Control a background image's size and repetition with background-size and background-repeat.",
    objective: "The banner's background image is tiling in tiny copies. Make it cover the whole banner as one image instead.",
    lesson: [
      "`background-image` sets a picture as an element's background — layered behind its content, unlike an `<img>` which is real content.",
      "By default, a background image **repeats** (tiles) to fill the element, at its own natural size. `background-repeat: no-repeat` stops that; `background-size: cover` scales the image to fill the whole box, cropping if needed.",
      "This banner's texture is tiling in small repeated copies. Stopping the repeat and covering the box gives one clean, full-size image instead.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "background-image: url(texture.png);", note: "" },
        { code: "background-repeat: no-repeat;", note: "one copy only" },
        { code: "background-size: cover;", note: "scaled to fill the box" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.banner` — its background has no repeat or size set.",
      "Add `background-repeat: no-repeat; background-size: cover;`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Background images",
      syntax: "background-image, -repeat, -size, -position",
      entries: [
        { value: "background-repeat: no-repeat", meaning: "show it once, not tiled" },
        { value: "background-size: cover", meaning: "scale to fill the box, cropping if needed" },
        { value: "background-position: center", meaning: "which part of the image shows" },
      ],
    },
    hints: [
      "The banner's surface looks busy — the same small pattern repeating many times across it, rather than one smooth image.",
      "Backgrounds tile by default. Is anything here turning that off, or scaling the image to fit?",
      "Neither `background-repeat` nor `background-size` is set — so the browser falls back to its defaults: repeating, at natural size.",
      "`background-repeat: no-repeat` shows the image once; `background-size: cover` scales it to fill the whole box.",
      "Add both `background-repeat: no-repeat;` and `background-size: cover;` to `.banner`.",
    ],
    debrief: {
      rule: "Background images tile by default. background-repeat and background-size control whether, and how, that happens.",
      seenIn: "A full-bleed hero image is almost always background-size: cover; background-position: center — fills the box, no tiling, cropped sensibly.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What does background-size: cover do?",
      options: ["Repeats the image to fill the box", "Scales the image to fill the box, cropping if needed", "Hides the background entirely", "Centers the image at its natural size"],
      answer: 1,
      explain: "cover scales the image up or down so it fully covers the element, cropping any excess.",
    },
    html: `<div class="ledge start">start</div>
<div class="banner"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.banner {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 300px;
  height: 30px;
  background-color: #6e4f11;
  background-image: linear-gradient(45deg, #e0b85f 25%, transparent 25%, transparent 75%, #e0b85f 75%);
  background-size: 16px 16px;
  border: 4px solid #6e4f11;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const banner = rule(ctx.css, ".banner");
      if (banner["background-repeat"] === "no-repeat" && /cover/.test(banner["background-size"] ?? "")) return { gold: true };
      return { gold: false, note: "You crossed, but the lesson's fix was no-repeat plus background-size: cover." };
    },
  },

  {
    id: "css-32-border-radius-shadow",
    chapter: 2,
    number: 32,
    title: "Softening the Edges",
    concept: "border-radius, box-shadow",
    edit: "css",
    learn: "Round corners with border-radius and lift an element visually with box-shadow.",
    objective: "The lever is a sharp, flat square, hard to spot against the stone. Round it and give it a shadow to make it read as raised.",
    lesson: [
      "`border-radius` rounds an element's corners — a small value softens them, and a value of `50%` (on a square box) makes a perfect circle.",
      "`box-shadow: offset-x offset-y blur-radius color` casts a shadow behind an element, which reads visually as \"raised\" off the surface behind it.",
      "Neither one changes an element's actual clickable box or its size — purely visual polish.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "border-radius: 8px;", note: "softly rounded corners" },
        { code: "border-radius: 50%;", note: "a full circle, on a square box" },
        { code: "box-shadow: 0 4px 10px rgba(0,0,0,0.4);", note: "soft shadow below, reads as raised" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.lever { }`.",
      "Add `border-radius: 50%;` and a `box-shadow`.",
      "Click the rounded lever, then cross.",
    ],
    reference: {
      title: "border-radius & box-shadow",
      syntax: "border-radius: …;  box-shadow: x y blur color;",
      entries: [
        { value: "border-radius: 8px", meaning: "gently rounded corners" },
        { value: "border-radius: 50%", meaning: "a circle, on a square box" },
        { value: "box-shadow: 0 4px 10px rgba(0,0,0,.4)", meaning: "soft shadow, reads as raised" },
      ],
    },
    hints: [
      "The lever works fine to stand on, but it's a plain, hard-edged square that barely reads as an object at all.",
      "What two purely visual properties would round its corners and give it some depth?",
      "Nothing here sets a border-radius or a box-shadow yet.",
      "`border-radius: 50%` turns a square into a circle; `box-shadow` adds a soft shadow that reads as lifted off the ground.",
      "Add `border-radius: 50%;` and `box-shadow: 0 4px 10px rgba(0,0,0,0.4);` to `.lever`.",
    ],
    debrief: {
      rule: "border-radius rounds corners (up to a full circle at 50% on a square); box-shadow adds a shadow, both purely visual.",
      seenIn: "Almost every modern button and card uses a small border-radius plus a subtle box-shadow for depth.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What border-radius value turns a perfectly square element into a circle?",
      options: ["100px", "50%", "0", "round"],
      answer: 1,
      explain: "50% rounds each corner by half the box's own size, which meets in the middle on a square to form a circle.",
    },
    html: `<div class="ledge start">start</div>
<div class="lever"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.lever {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 300px;
  height: 30px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const lever = rule(ctx.css, ".lever");
      if (lever["border-radius"] && lever["box-shadow"]) return { gold: true };
      return { gold: false, note: "You crossed, but the lesson was adding both border-radius and box-shadow." };
    },
  },

  {
    id: "css-33-gradients",
    chapter: 2,
    number: 33,
    title: "A Colour That Changes Along Its Length",
    concept: "linear-gradient()",
    edit: "css",
    learn: "Paint a smooth colour transition as a background with linear-gradient().",
    objective: "The sky-bridge should shimmer from dawn to dusk along its length. Give it a linear-gradient background.",
    lesson: [
      "`linear-gradient(direction, colour, colour, …)` paints a smooth transition between colours as a background — no image file needed.",
      "The direction can be a keyword (`to right`, `to bottom`) or an angle (`45deg`). You can add more than two colours, and even control where each one starts with a percentage.",
      "This bridge's background is a single flat colour where a gradient was intended.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "background: linear-gradient(to right, #222, #eee);", note: "dark to light, left to right" },
        { code: "background: linear-gradient(45deg, red, orange, yellow);", note: "three colours, at an angle" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.bridge { background: #6b4e9c; }`.",
      "Replace it with a `linear-gradient(to right, …)` using two or more colours.",
      "Cross the bridge.",
    ],
    reference: {
      title: "linear-gradient()",
      syntax: "linear-gradient(direction, colour, colour, …)",
      entries: [
        { value: "to right", meaning: "left → right" },
        { value: "to bottom", meaning: "top → bottom" },
        { value: "45deg", meaning: "a specific angle" },
      ],
    },
    hints: [
      "The bridge is a single flat purple — solid, but not what a dawn-to-dusk shimmer should look like.",
      "Its background is a plain colour. What function paints a smooth transition between colours instead?",
      "`background: #6b4e9c;` is one flat colour — no gradient function is being used at all.",
      "`linear-gradient(to right, colourA, colourB)` paints a smooth blend across the element in the direction you choose.",
      "Change `background: #6b4e9c;` to something like `background: linear-gradient(to right, #ff9a3c, #6b4e9c);`.",
    ],
    debrief: {
      rule: "linear-gradient() paints a smooth colour transition as a background, in a direction and with any number of colour stops you choose.",
      seenIn: "A hero section's backdrop, or a subtle button hover effect, is very often a two-colour linear-gradient rather than a flat fill.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What does linear-gradient(to right, black, white) paint?",
      options: ["A flat grey fill", "A smooth blend from black on the left to white on the right", "A striped pattern", "Nothing — gradients need an image file"],
      answer: 1,
      explain: "linear-gradient smoothly blends between the listed colours, in the given direction — here, black to white, left to right.",
    },
    html: `<div class="ledge start">start</div>
<div class="bridge"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }

.bridge {
  position: absolute;
  left: 160px;
  bottom: 140px;
  width: 580px;
  height: 30px;
  background: #6b4e9c;
  border: 4px solid #33265a;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const bridge = rule(ctx.css, ".bridge");
      if (/linear-gradient\(/.test(bridge["background"] ?? "")) return { gold: true };
      return { gold: false, note: "You crossed, but the lesson's fix was a linear-gradient background." };
    },
  },

  {
    id: "css-34-typography-family",
    chapter: 2,
    number: 34,
    title: "A Sign Anyone Can Read",
    concept: "font-family, font-size, font-weight, line-height",
    edit: "css",
    learn: "Set a font stack with fallbacks, and control size, weight and line-height.",
    objective: "The signpost's font-family is a single, unusual name with no fallback. Give it a proper stack so it always renders something readable.",
    lesson: [
      "`font-family` takes a **list** of names, tried in order — the browser uses the first one it actually has installed. Always end a stack with a generic family like `sans-serif` or `serif`, as a guaranteed fallback.",
      "`font-weight` sets boldness (`400` normal, `700` bold, or keywords like `bold`). `line-height` sets the space a line of text occupies — usually a unitless number like `1.5`, multiplying the font-size.",
      "This signpost names only one exact, uncommon font with nothing after it — if that font isn't available, the browser falls back to something unpredictable rather than a sensible default.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "font-family: 'Special Font';", note: "no fallback — risky" },
        { code: "font-family: 'Special Font', Georgia, serif;", note: "tries each in turn, ending in a safe generic" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.sign { font-family: 'Nonexistent Display'; }`.",
      "Add at least one fallback, ending in a generic family like `sans-serif`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Font stacks",
      syntax: "font-family: name, name, generic;",
      entries: [
        { value: "'Georgia', serif", meaning: "a named font, falling back to any serif" },
        { value: "system-ui, sans-serif", meaning: "the OS's own UI font, then any sans-serif" },
        { value: "font-weight: 700", meaning: "bold" },
      ],
    },
    hints: [
      "This one isn't about the sign's size or position — it's already solid and standable. The lesson here is what happens if the named font never loads.",
      "Look at `.sign`'s font-family. Is there more than one name listed?",
      "Just one: `'Nonexistent Display'`, with nothing to fall back to if it's unavailable — which, on this stage, it always will be.",
      "A font stack should end in a generic family (serif, sans-serif, monospace) so there's always a sensible fallback, whatever fonts are actually installed.",
      "Change `font-family: 'Nonexistent Display';` to `font-family: 'Nonexistent Display', sans-serif;`.",
    ],
    debrief: {
      rule: "font-family should list fallbacks in order, always ending in a generic family, so text never falls back to something unpredictable.",
      seenIn: "Almost every real site's CSS starts with a font stack like `-apple-system, Segoe UI, Roboto, sans-serif` for exactly this reason.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Why should a font-family list end in a generic name like sans-serif?",
      options: [
        "It makes the text bold",
        "It guarantees a sensible fallback if none of the named fonts are available",
        "It's required syntax, or the CSS is invalid",
        "It changes the font's colour",
      ],
      answer: 1,
      explain: "Generic families (serif, sans-serif, monospace…) are always available, so ending the stack with one guarantees a reasonable result.",
    },
    html: `<div class="ledge start">start</div>
<div class="sign">this way</div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 520px; }

.sign {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 300px;
  height: 30px;
  font-family: 'Nonexistent Display';
  font-weight: 700;
  line-height: 30px;
  text-align: center;
  color: #2b2140;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const sign = rule(ctx.css, ".sign");
      if (/,/.test(sign["font-family"] ?? "") && /(sans-serif|serif|monospace)\s*$/.test((sign["font-family"] ?? "").trim())) return { gold: true };
      return { gold: false, note: "You crossed, but the lesson was giving font-family a real fallback stack ending in a generic name." };
    },
  },

  {
    id: "css-35-text-align-truncate",
    chapter: 2,
    number: 35,
    title: "One Tidy Line",
    concept: "text-align, text-overflow: ellipsis",
    edit: "css",
    learn: "Truncate overflowing text into one tidy line with white-space, overflow and text-overflow together.",
    objective: "A long caption is wrapping onto a second line and breaking the row's height. Truncate it to one line with an ellipsis instead.",
    lesson: [
      "Truncating text to one line with a trailing “…” takes **three** properties working together: `white-space: nowrap` (never wrap), `overflow: hidden` (clip what doesn't fit), and `text-overflow: ellipsis` (show “…” at the clipped edge).",
      "Leave any one of the three out and it doesn't work: without `nowrap` the text still wraps; without `hidden` there's nothing to visually clip; without `ellipsis` it just clips silently, with no “…”.",
      "This caption is missing all three, so a long line wraps and grows taller than the row expects.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "white-space: nowrap;", note: "never wrap onto a new line" },
        { code: "overflow: hidden;", note: "clip whatever doesn't fit" },
        { code: "text-overflow: ellipsis;", note: "show … at the clipped edge" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.caption { }`.",
      "Add all three: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`.",
      "Cross to the goal.",
    ],
    reference: {
      title: "Single-line truncation",
      syntax: "white-space + overflow + text-overflow, together",
      entries: [
        { value: "white-space: nowrap", meaning: "forces one line" },
        { value: "overflow: hidden", meaning: "clips the overflow" },
        { value: "text-overflow: ellipsis", meaning: "shows … at the cut" },
      ],
    },
    hints: [
      "The caption plank is taller than the row expects, because its text is wrapping onto a second line.",
      "Truncating text onto one line with a trailing … actually needs three separate properties together. Are any of them set here?",
      "None of `white-space`, `overflow` or `text-overflow` are set on `.caption` at all.",
      "All three are required together: nowrap stops wrapping, hidden clips the overflow, and ellipsis shows the … — missing any one breaks the effect.",
      "Add all three declarations to `.caption`.",
    ],
    debrief: {
      rule: "Truncating text to one line with an ellipsis always needs white-space: nowrap, overflow: hidden and text-overflow: ellipsis together.",
      seenIn: "A file name or a long product title in a narrow card almost always uses this exact three-property combination.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Which of these is NOT required for single-line text truncation with an ellipsis?",
      options: ["white-space: nowrap", "overflow: hidden", "text-overflow: ellipsis", "font-weight: bold"],
      answer: 3,
      explain: "font-weight has nothing to do with truncation — the other three are all required together.",
    },
    html: `<div class="ledge start">start</div>

<div class="row">
  <div class="caption">A very long caption that would otherwise wrap</div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `.row {
  position: absolute;
  left: 170px;
  bottom: 140px;
  width: 300px;
  height: 30px;
}

.caption {
  width: 300px;
  height: 30px;
  padding: 4px 8px;
  background: #d8c090;
  border: 4px solid #7a5a2a;
  box-sizing: border-box;
  color: #3b2a10;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      const c = rule(ctx.css, ".caption");
      if (c["white-space"] === "nowrap" && c["overflow"] === "hidden" && c["text-overflow"] === "ellipsis") return { gold: true };
      return { gold: false, note: "You crossed, but the lesson needed all three: nowrap, hidden and ellipsis together." };
    },
  },

  {
    id: "css-36-custom-properties",
    chapter: 2,
    number: 36,
    title: "A Value You Can Reuse",
    concept: "CSS custom properties (variables)",
    edit: "css",
    learn: "Define a reusable value with a custom property (--name), and read it back with var().",
    objective: "A gap-width variable is defined but never used. Read it with var() so the bridge actually uses it.",
    lesson: [
      "A **custom property** (also called a CSS variable) is defined with two leading dashes: `--gap-width: 500px;`. It doesn't do anything by itself — you read it elsewhere with `var(--gap-width)`.",
      "Defined on `:root`, a custom property is available anywhere in the stylesheet — change it in one place, and everything reading it updates together.",
      "`var()` can also take a fallback: `var(--gap-width, 400px)` uses `400px` if `--gap-width` isn't defined at all.",
      "This bridge's width is a fixed number, while a `--bridge-width` variable sits right above it, completely unused.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ":root { --gap-width: 500px; }", note: "defined once" },
        { code: ".bridge { width: var(--gap-width); }", note: "read here" },
        { code: "width: var(--missing, 300px);", note: "300px, if --missing isn't defined" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `:root { --bridge-width: 500px; }` and `.bridge { width: 80px; }`.",
      "Change the bridge's width to `var(--bridge-width)`.",
      "Cross the bridge.",
    ],
    reference: {
      title: "Custom properties",
      syntax: "--name: value;   ·   var(--name)",
      entries: [
        { value: "--gap-width: 500px;", meaning: "define it, usually on :root" },
        { value: "var(--gap-width)", meaning: "read it back anywhere" },
        { value: "var(--x, 10px)", meaning: "10px if --x isn't defined" },
      ],
    },
    hints: [
      "There's a variable defined right at the top of the file, clearly meant to control the bridge's width — but the bridge doesn't seem to notice it at all.",
      "Is `.bridge`'s width reading from that variable, or is it just a plain fixed number?",
      "`.bridge { width: 80px; }` — a fixed number, completely ignoring `--bridge-width: 500px;` defined above.",
      "`var(--name)` reads a custom property's value back wherever you use it. Replacing the fixed number with `var(--bridge-width)` connects the two.",
      "Change `width: 80px;` to `width: var(--bridge-width);`.",
    ],
    debrief: {
      rule: "A custom property (--name) is defined once and read anywhere with var(--name) — change the definition, and every use updates together.",
      seenIn: "A site's whole colour theme is usually a handful of custom properties on :root (--brand-color, --text-color), read by var() throughout every component.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "How do you read back a custom property named --gap?",
      options: ["gap()", "var(--gap)", "$gap", "--gap()"],
      answer: 1,
      explain: "var(--name) is the only way to read a custom property's current value.",
    },
    html: `<div class="ledge start">start</div>
<div class="bridge"></div>
<div class="ledge goal">goal</div>
`,
    css: `:root {
  --bridge-width: 500px;
}

.bridge {
  position: absolute;
  left: 160px;
  bottom: 140px;
  width: 80px;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 740px; }
${DECORATION}`,
    rubric: (ctx) => {
      const bridge = rule(ctx.css, ".bridge");
      if (/var\(\s*--bridge-width/.test(bridge["width"] ?? "")) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was reading the width from var(--bridge-width)." };
    },
  },

  {
    id: "css-37-transition-transform",
    chapter: 2,
    number: 37,
    title: "The Gate That Answers",
    concept: "transition, transform, :target",
    edit: "css",
    learn: "Animate a state change smoothly with transition, using transform for the cheapest, smoothest motion.",
    objective: "Clicking the rune should swing the gate open, smoothly. Give the gate a transition, and use :target to react to the click.",
    lesson: [
      "`:target` matches the one element on the page whose id matches the current URL fragment (`#gate`) — and a real click on an `<a href=\"#gate\">` changes that fragment, live, with no JavaScript.",
      "`transform: scaleX()` (or `translate`, `rotate`) changes an element's size or position cheaply — `transform` and `opacity` are the two properties browsers can animate most smoothly.",
      "`transition: property duration timing-function;` tells the browser to animate a property's change smoothly instead of jumping instantly. Without it, `:target` would still work, but the gate would snap open instead of swinging.",
      "This gate already reacts correctly to `:target` — the only thing missing is a transition, so the change is instant instead of smooth. Add one, then click the rune.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "#gate { transform: scaleX(0.1); }", note: "closed" },
        { code: "#gate:target { transform: scaleX(1); }", note: "open — while linked to" },
        { code: "#gate { transition: transform 0.5s ease; }", note: "animate the change smoothly" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `#gate { }` — it changes instantly when targeted, with no transition.",
      "Add `transition: transform 0.5s ease;`.",
      "Click the rune (an anchor) in the world, then walk through the gate.",
    ],
    reference: {
      title: "transition & transform",
      syntax: "transition: property duration timing;",
      entries: [
        { value: "transform: scaleX(0.1)", meaning: "squashed to 10% width" },
        { value: "transform: translateX(50px)", meaning: "shifted 50px right" },
        { value: "transition: transform 0.5s ease", meaning: "animate transform changes over 0.5s" },
      ],
    },
    hints: [
      "Click the rune — the gate does open, but it just snaps instantly rather than swinging.",
      "The gate already has an `#gate:target` rule that changes its transform. Is there a transition telling the browser to animate that change?",
      "There isn't — `#gate` has no `transition` property at all, so the transform jumps instantly instead of easing.",
      "`transition: transform 0.5s ease;` on the base `#gate` rule (not the :target one) makes any future change to its transform animate smoothly over half a second.",
      "Add `transition: transform 0.5s ease;` to `#gate`, then click the rune.",
    ],
    debrief: {
      rule: ":target reacts live to a real link click with no JavaScript; transition makes any property change (ideally transform or opacity) animate smoothly instead of snapping.",
      seenIn: "A pure-CSS lightbox or mobile nav toggle is often built entirely from :target plus a transition — no script involved.",
      fableLine: "A page that follows instructions can change long after it's built.",
    },
    quiz: {
      question: "Which two properties are cheapest for browsers to animate smoothly?",
      options: ["width and height", "transform and opacity", "margin and padding", "color and background"],
      answer: 1,
      explain: "transform and opacity can be animated without the browser recalculating page layout, making them the smoothest choice for motion.",
    },
    html: `<div class="ledge start">start</div>
<a href="#gate" class="rune">open</a>
<div id="gate"></div>
<div class="ledge goal">goal</div>
`,
    css: `.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 580px; }

.rune {
  display: inline-block;
  position: absolute;
  left: 140px;
  bottom: 190px;
  width: 40px;
  height: 24px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  box-sizing: border-box;
  text-indent: -9999px;
}

#gate {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 200px;
  height: 30px;
  transform: scaleX(0.1);
  transform-origin: left;
  background: #5b4a6e;
  border: 4px solid #2b2140;
  box-sizing: border-box;
}
#gate:target {
  transform: scaleX(1);
}
${DECORATION}`,
    rubric: (ctx) => {
      const gate = rule(ctx.css, "#gate");
      if (/transform/.test(gate["transition"] ?? "") || /\ball\b/.test(gate["transition"] ?? "")) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was a transition on #gate's transform." };
    },
  },

  {
    id: "css-38-capstone",
    chapter: 2,
    number: 38,
    title: "The Tailor's Masterwork",
    concept: "putting it together",
    edit: "css",
    learn: "Combine specificity, box-sizing, position and units in one page — and know where to look next.",
    objective: "The workshop needs several fixes at once: a losing selector, a content-box surprise, a missing containing block, and an unread variable.",
    lesson: [
      "One idea worth carrying forward that doesn't fit neatly into a single physical puzzle: **responsive design**. A real site's CSS uses `@media (max-width: 600px) { … }` to apply different rules on a small screen — this stage is always a fixed size, so you won't write one here, but recognise the pattern when you see it.",
      "Fluid alternatives you've already met — `%`, `clamp()`, `min()`/`max()` — often reach the same goal without a media query at all, and are worth reaching for first.",
      "This workshop combines four fixes you already know: a selector losing a specificity fight, a box-sizing surprise, a missing containing block for an absolutely positioned child, and a custom property nobody's reading. Nothing here is a new trick.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "@media (max-width: 600px) {", note: "only applies on narrow screens" },
        { code: "  .card { flex-direction: column; }", note: "" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.tileA` — it's losing to a later, equally-specific rule. Give it an id selector instead.",
      "Find `.tileB` — switch its box-sizing to border-box.",
      "Find `.wrap` — give it a real position so `.tileC` anchors to it.",
      "Find `.tileD` — read its width from `var(--tile-width)`.",
    ],
    reference: {
      title: "Chapter recap",
      syntax: "specificity → box model → position → variables",
      entries: [
        { value: "#id beats .class", meaning: "specificity" },
        { value: "box-sizing: border-box", meaning: "width includes padding/border" },
        { value: "position: relative", meaning: "makes an ancestor a containing block" },
        { value: "var(--name)", meaning: "reads a custom property" },
      ],
    },
    hints: [
      "Four tiles, four separate problems, each one you've solved once already this chapter.",
      "TileA: a later rule with equal specificity is winning. TileB: padding is inflating it past its width. TileC: it's anchored to the wrong ancestor. TileD: a variable is defined but unused.",
      "Compare each tile against the lesson that first taught its fix, earlier in this chapter.",
      "Fix them one at a time: (1) give tileA's rule an id selector matching `id=\"tileA\"`, (2) set tileB's box-sizing to border-box, (3) give `.wrap` `position: relative;`, (4) set tileD's width to `var(--tile-width)`.",
      "Apply all four fixes, then cross the whole workshop.",
    ],
    debrief: {
      rule: "A real stylesheet is built from exactly these ideas, repeated at scale: selectors and specificity, the box model, positioning, and reusable values.",
      seenIn: "Any real site's CSS, however large, is these same handful of ideas combined — nothing beyond what this chapter covered.",
      fableLine: "HTML says what things are. CSS says what they look like, how big they are and where they sit.",
    },
    quiz: {
      question: "What's the usual first tool for a responsive layout, before reaching for a media query?",
      options: ["Fixed pixel widths everywhere", "Flexible units like %, clamp() and min()/max()", "!important on every rule", "Removing box-sizing"],
      answer: 1,
      explain: "Flexible sizing often adapts without any media query at all; media queries are for when the layout itself needs to change shape.",
    },
    html: `<div class="ledge start">start</div>

<div class="workshop">
  <div id="tileA" class="tile"></div>
  <div id="tileB" class="tile"></div>
  <div class="wrap">
    <div id="tileC" class="tile"></div>
  </div>
  <div id="tileD" class="tile"></div>
</div>

<div class="ledge goal">goal</div>
`,
    css: `:root {
  --tile-width: 90px;
}

.workshop {
  display: flex;
  gap: 20px;
  position: absolute;
  left: 170px;
  bottom: 140px;
}

.tile {
  width: 90px;
  height: 30px;
  background: #9aa3ad;
  border: 4px solid #454d57;
  box-sizing: border-box;
}

.tileA {
  width: 90px;
}

#tileB {
  width: 90px;
  padding: 10px;
  box-sizing: content-box;
}

.wrap {
  width: 90px;
  height: 30px;
}
#tileC {
  position: absolute;
  left: 0;
  top: 0;
}

#tileD {
  width: 20px;
}

/* Some later rule, same specificity as .tileA above — and it wins. */
.tileA {
  width: 20px;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      const tileA = rule(ctx.css, "#tileA");
      const tileB = rule(ctx.css, "#tileB");
      const wrap = rule(ctx.css, ".wrap");
      const tileD = rule(ctx.css, "#tileD");
      const ok =
        (pxValue(tileA["width"]) ?? 0) >= 90 &&
        tileB["box-sizing"] === "border-box" &&
        wrap["position"] &&
        wrap["position"] !== "static" &&
        /var\(\s*--tile-width/.test(tileD["width"] ?? "");
      if (ok) return { gold: true };
      return { gold: false, note: "You reached the flag without every fix in place — a gold seal needs all four tiles properly fixed." };
    },
  },
];

/* =========================================================================
 * Chapter 3 — Flexbox
 * ========================================================================= */

const FLEX_LEVELS: Level[] = [
  {
    id: "flex-1-container-item",
    chapter: 3,
    number: 1,
    title: "Two Kinds of Property",
    concept: "container vs item",
    edit: "css",
    learn: "Tell a flex container property from a flex item property — the single most common flexbox mistake.",
    objective: "The ants are huddled at one end. The property meant to spread them out is written on an ant instead of their line — move it to where it belongs.",
    lesson: [
      "Every flexbox property belongs to one of two groups, and they only work in their own group. **Container** properties — `display: flex`, `flex-direction`, `flex-wrap`, `justify-content`, `align-items`, `align-content`, `gap` — go on the parent, and describe how it arranges its children.",
      "**Item** properties — `flex-grow`, `flex-shrink`, `flex-basis`, `align-self`, `order` — go on the children themselves, and only describe that one child.",
      "Writing a container property on an item (or the reverse) isn't an error — the browser just silently ignores it, since it doesn't apply there. Nothing highlights the mistake for you.",
      "This chapter also uses two directions constantly: the **main axis** (the direction items line up in — decided by `flex-direction`) and the **cross axis** (perpendicular to it). Container properties like `justify-content` work along the main axis; `align-items` works along the cross axis.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".line { justify-content: space-between; }", note: "correct — a container property, on the container" },
        { code: ".ant { justify-content: space-between; }", note: "does nothing — .ant is an item, not a container" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `justify-content: space-between;` — it's written on `.ant`.",
      "Move it into the `.conveyor` rule instead.",
      "Cross to the nest.",
    ],
    reference: {
      title: "Container vs item properties",
      syntax: "container { … }  vs  item { … }",
      entries: [
        { value: "display, flex-direction, flex-wrap, justify-content, align-items, align-content, gap", meaning: "container properties" },
        { value: "flex-grow, flex-shrink, flex-basis, align-self, order", meaning: "item properties" },
      ],
    },
    hints: [
      "The ants are all bunched at the start of the conveyor, with empty room stretching out ahead of them.",
      "There's a `justify-content` declaration in the CSS already — but is it on the container the ants are inside, or on one of the ants themselves?",
      "It's written inside `.ant { … }`. `.ant` is a flex item, not the flex container — this property does nothing there.",
      "`justify-content` is a container property: it only has an effect on the element with `display: flex`, which here is `.conveyor`.",
      "Move `justify-content: space-between;` out of `.ant` and into `.conveyor`.",
    ],
    debrief: {
      rule: "Flexbox properties split into container properties (on the parent) and item properties (on each child). A container property on an item is silently ignored.",
      seenIn: "A very common bug report — \"justify-content isn't working\" — is almost always this: the property landed on the wrong element.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "Which of these is an item property, not a container property?",
      options: ["justify-content", "flex-wrap", "align-self", "gap"],
      answer: 2,
      explain: "align-self is written on one child, overriding the container's align-items just for that child. The other three are container properties.",
    },
    html: `<div class="conveyor">
  <div class="ant start">start</div>
  <div class="ant"></div>
  <div class="ant"></div>
  <div class="ant"></div>
</div>
<div class="nest goal">nest</div>
`,
    css: `.conveyor {
  display: flex;
  position: absolute;
  left: 30px;
  bottom: 110px;
  width: 660px;
}

.ant {
  width: 110px;
  height: 30px;
  justify-content: space-between;
  background: #b0643a;
  border: 4px solid #5a2a12;
  box-sizing: border-box;
}

.nest {
  position: absolute;
  right: 30px;
  bottom: 110px;
  width: 110px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const conveyor = rule(ctx.css, ".conveyor");
      const value = conveyor["justify-content"];
      if (["space-between", "space-around", "space-evenly"].includes(value ?? "")) return { gold: true };
      return { gold: false, note: "Solved — the fix was moving justify-content onto the container, .conveyor." };
    },
  },

  {
    id: "flex-2-display",
    chapter: 3,
    number: 2,
    title: "Stand in a Line",
    concept: "display: flex",
    edit: "css",
    learn: "Turn a container into a flex container so its children line up in a row.",
    objective: "The ants are stacked in a heap. Line them up side by side so they reach the gold ledge.",
    lesson: [
      "Most elements are **block** elements. Each block starts on a new line, so a group of them stacks from top to bottom, like lines of text.",
      "`display: flex` changes that — but not on the ants. You write it on the **container** (the parent), and it changes how the container arranges its **children**.",
      "A flex container lines its children up in a row, one after another.",
      "`display: inline-flex` does the exact same thing to the children — the only difference is how the *container itself* behaves in whatever it's sitting inside (like a block vs. inline element). You'll almost always reach for plain `flex`.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".line {", note: "the container — the parent" },
        { code: "  display: flex;", note: "its children now sit in a row" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find the `.line` rule — `.line` is the container the ants are inside.",
      "Add a new line inside it: `display: flex;`",
      "Walk along the ants to the gold ledge.",
    ],
    reference: {
      title: "display",
      syntax: "display: <keyword>;",
      entries: [
        { value: "block", meaning: "starts on a new line; blocks stack downward" },
        { value: "flex", meaning: "children line up in a row" },
        { value: "inline-flex", meaning: "same for children; the container itself behaves inline" },
      ],
    },
    hints: [
      "The five ants are all there — they're just piled on top of each other. What decides that they stack instead of standing in a row?",
      "Should the fix go on each `.ant`, or on the `.line` they're all inside?",
      "The `.line` rule has a position but nothing about how to arrange its children.",
      "Block elements stack downward by default. `display: flex` on a container makes its children sit side by side instead. It goes on the parent, not on the children.",
      "Inside `.line { … }`, add `display: flex;`",
    ],
    debrief: {
      rule: "`display: flex` goes on the container. Its children then line up in a row instead of stacking.",
      seenIn: "A website's top menu is usually a `<nav>` with `display: flex` so its links sit in a row.",
      fableLine: "“Line, stand side by side.”",
    },
    quiz: {
      question: "To put five `.ant` elements in a row, where does `display: flex` go?",
      options: ["On .ant", "On their container, .line", "On the goal", "On every page element"],
      answer: 1,
      explain: "Flexbox is set on the parent. The container decides how its children are arranged.",
    },
    html: `<div class="ledge start">start</div>
<div class="line">
  <div class="ant"></div>
  <div class="ant"></div>
  <div class="ant"></div>
  <div class="ant"></div>
  <div class="ant"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.line {
  position: absolute;
  left: 160px;
  bottom: 140px;
}

.ant {
  width: 110px;
  height: 30px;
  background: #b0643a;
  border: 4px solid #5a2a12;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 710px; }
${DECORATION}`,
    rubric: (ctx) => {
      const line = rule(ctx.css, ".line");
      if (line["display"] === "flex") return { gold: true };
      return { gold: false, note: "Solved — the lesson's line was `display: flex` on `.line`." };
    },
  },

  {
    id: "flex-3-direction",
    chapter: 3,
    number: 3,
    title: "The Tower",
    concept: "flex-direction",
    edit: "css",
    learn: "Turn a flex row into a column with flex-direction — and see which axis becomes 'main'.",
    objective: "The tower's floors are lying flat along the ground. Stack them into a column and climb to the gold flag.",
    lesson: [
      "Every flex container has a **main axis**. `flex-direction` chooses it — and everything else in this chapter is relative to whichever axis is currently main.",
      "`row` runs the main axis left to right. `column` runs it top to bottom — the first child on top.",
      "When the axis turns, the other settings turn with it: `gap` becomes space between floors, and `align-items` now lines children up left and right instead of vertically.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".tower {", note: "" },
        { code: "  display: flex;", note: "" },
        { code: "  flex-direction: column;", note: "children stacked top to bottom" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `flex-direction: row;` in `.tower`.",
      "Change the direction so the floors stack.",
      "Climb to the flag.",
    ],
    reference: {
      title: "flex-direction",
      syntax: "flex-direction: <keyword>;",
      entries: [
        { value: "row", meaning: "main axis left → right (the default)" },
        { value: "row-reverse", meaning: "main axis right → left" },
        { value: "column", meaning: "main axis top → bottom" },
        { value: "column-reverse", meaning: "main axis bottom → top" },
      ],
    },
    hints: [
      "The blocks are wide and thin, like floors of a building — but every one is lying on the ground.",
      "What would happen to these blocks if the container arranged them top-to-bottom instead of left-to-right?",
      "`.tower` has a line that decides which direction its children flow — which decides which axis is currently main.",
      "`flex-direction: row` makes left-right the main axis. `column` turns the main axis vertical, so the children stack in HTML order: the first on top, the last at the bottom. Here that gives narrow floors on top of wide ones — a tower you can climb.",
      "In `.tower`, change `flex-direction: row;` to `flex-direction: column;`",
    ],
    debrief: {
      rule: "`flex-direction` picks the main axis. Turn it, and `justify-content`, `align-items` and `gap` all turn with it.",
      seenIn: "Responsive layouts: a row of cards on a laptop often becomes `flex-direction: column` on a phone.",
      fableLine: "“Line, rise,” and the line stood up into a tower.",
    },
    quiz: {
      question: "With `flex-direction: column`, which child ends up at the top?",
      options: ["The first one in the HTML", "The last one in the HTML", "The widest one", "The tallest one"],
      answer: 0,
      explain: "A column follows HTML order from top to bottom. `column-reverse` would put the last child on top.",
    },
    html: `<div class="tower">
  <div class="floor f4"></div>
  <div class="floor f3"></div>
  <div class="floor f2"></div>
  <div class="floor f1"></div>
</div>
<div class="ground start">start</div>
<div class="flag goal">flag</div>
`,
    css: `.tower {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 30px;
  position: absolute;
  left: 40px;
  bottom: 40px;
  width: 400px;
}

.floor {
  height: 24px;
  background: #8f9fc4;
  border: 4px solid #3d4a6e;
  box-sizing: border-box;
}

.f1 { width: 400px; }
.f2 { width: 320px; }
.f3 { width: 240px; }
.f4 { width: 160px; }

.ground {
  position: absolute;
  left: 460px;
  bottom: 40px;
  width: 160px;
  height: 24px;
  border: 4px solid;
  box-sizing: border-box;
}

.flag {
  position: absolute;
  left: 40px;
  bottom: 266px;
  width: 70px;
  height: 24px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (rule(ctx.css, ".tower")["flex-direction"] === "column") return { gold: true };
      return { gold: false, note: "Solved — the lesson's line is `flex-direction: column` on the container." };
    },
  },

  {
    id: "flex-4-wrap",
    chapter: 3,
    number: 4,
    title: "Break the Line",
    concept: "flex-wrap",
    edit: "css",
    learn: "Let overflowing items drop onto a new line with flex-wrap, instead of overflowing in one.",
    objective: "The second plank refuses to fit and shoots off past the frame. Let the row wrap so it drops to a step of its own.",
    lesson: [
      "By default, `flex-wrap: nowrap` keeps every item on a **single line**, however little room there is — the row simply overflows, or items shrink if they're allowed to.",
      "`flex-wrap: wrap` lets items that don't fit move onto a **new line** instead. Each new line stacks in the cross-axis direction — for a row, that's downward.",
      "`flex-flow` is a shorthand for `flex-direction` and `flex-wrap` together: `flex-flow: row wrap;` sets both in one declaration.",
      "These planks have `flex-shrink: 0`, so they refuse to shrink — with `nowrap`, the second one simply spills out past the frame instead.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "flex-wrap: nowrap;", note: "everything stays on one line (default)" },
        { code: "flex-wrap: wrap;", note: "overflow drops to a new line" },
        { code: "flex-flow: row wrap;", note: "shorthand for direction + wrap" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.frame { flex-wrap: nowrap; }`.",
      "Change it to `flex-wrap: wrap;`.",
      "Step down onto the dropped plank, then to the goal.",
    ],
    reference: {
      title: "flex-wrap",
      syntax: "flex-wrap: nowrap | wrap | wrap-reverse;",
      entries: [
        { value: "nowrap", meaning: "one line, however much overflows (default)" },
        { value: "wrap", meaning: "overflow moves to a new line" },
        { value: "wrap-reverse", meaning: "like wrap, but new lines stack the other way" },
      ],
    },
    hints: [
      "The first plank is fine. The second one is nowhere near the goal — it's shot off far to the right instead.",
      "The frame is narrower than both planks together. With `nowrap`, where does an item that doesn't fit actually go?",
      "`flex-wrap: nowrap` keeps everything on one line no matter what, so the second plank just continues past the frame's edge.",
      "`flex-wrap: wrap` lets an item that doesn't fit drop to a new line instead of overflowing — here, a line below the first plank, within easy reach.",
      "Change `flex-wrap: nowrap;` to `flex-wrap: wrap;`.",
    ],
    debrief: {
      rule: "nowrap keeps everything on one line, however much overflows. wrap moves what doesn't fit onto a new line instead.",
      seenIn: "A row of tags or chips that moves extra tags onto a second line on a narrow screen is `flex-wrap: wrap` at work.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "With flex-wrap: nowrap (the default), what happens to an item that doesn't fit?",
      options: ["It moves to a new line", "It's deleted", "It stays on the same line, overflowing if needed", "It shrinks to nothing"],
      answer: 2,
      explain: "nowrap forces a single line — an item that doesn't fit simply overflows it (or shrinks, if flex-shrink allows).",
    },
    html: `<div class="frame">
  <div class="plank start">start</div>
  <div class="plank"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.frame {
  display: flex;
  flex-wrap: nowrap;
  width: 150px;
  position: absolute;
  left: 220px;
  bottom: 260px;
}

.plank {
  width: 150px;
  height: 30px;
  flex-shrink: 0;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (rule(ctx.css, ".frame")["flex-wrap"] === "wrap") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was flex-wrap: wrap." };
    },
  },

  {
    id: "flex-5-justify-content",
    chapter: 3,
    number: 5,
    title: "The Huddle",
    concept: "justify-content",
    edit: "css",
    learn: "Spread flex children along the main axis with justify-content.",
    objective: "The ants are huddled at one end of the conveyor. Spread them out so you can reach the golden nest.",
    lesson: [
      "The `.conveyor` is 660px wide, but its four ants only take up 440px. The other 220px is **leftover space** along the main axis.",
      "`justify-content` decides where that leftover space goes: all at the end, all at the start, or shared out between the children.",
      "It doesn't resize the ants. It only moves them.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".conveyor {", note: "" },
        { code: "  display: flex;", note: "" },
        { code: "  justify-content: center;", note: "leftover space split before and after" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `justify-content: flex-start;` in `.conveyor`.",
      "Try the values in the field guide. Which one puts the last ant at the far end?",
      "Cross to the nest.",
    ],
    reference: {
      title: "justify-content",
      syntax: "justify-content: <keyword>;",
      entries: [
        { value: "flex-start", meaning: "pack at the start, spare space at the end" },
        { value: "center", meaning: "pack in the middle" },
        { value: "flex-end", meaning: "pack at the end" },
        { value: "space-between", meaning: "first and last at the edges, spare space shared between" },
        { value: "space-evenly", meaning: "exactly equal space everywhere" },
      ],
    },
    hints: [
      "The conveyor is much wider than the ants on it. Where has all that extra room gone?",
      "Is the conveyor's leftover space shared between the ants, or dumped at one end?",
      "The `.conveyor` rule has a line that decides where leftover space goes along the main axis.",
      "`justify-content: flex-start` packs children at the start and leaves the spare room at the end. `space-between` shares it out between them instead, so the last ant ends up at the far edge — next to the nest.",
      "In `.conveyor`, change `justify-content: flex-start;` to `justify-content: space-between;`",
    ],
    debrief: {
      rule: "`justify-content` distributes spare space along the main axis. It moves items; it never resizes them.",
      seenIn: "Almost every site header: logo on the left, menu on the right is `justify-content: space-between`.",
      fableLine: "“Line, spread yourselves along the floor.”",
    },
    quiz: {
      question: "Which value puts the first child at the start and the last child at the end?",
      options: ["center", "flex-start", "space-between", "flex-end"],
      answer: 2,
      explain: "space-between pins the first and last children to the edges and shares the rest between them.",
    },
    html: `<div class="conveyor">
  <div class="ant start">start</div>
  <div class="ant"></div>
  <div class="ant"></div>
  <div class="ant"></div>
</div>
<div class="nest goal">nest</div>
`,
    css: `.conveyor {
  display: flex;
  justify-content: flex-start;
  position: absolute;
  left: 30px;
  bottom: 110px;
  width: 660px;
}

.ant {
  width: 110px;
  height: 30px;
  background: #b0643a;
  border: 4px solid #5a2a12;
  box-sizing: border-box;
}

.nest {
  position: absolute;
  right: 30px;
  bottom: 110px;
  width: 110px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const value = rule(ctx.css, ".conveyor")["justify-content"];
      if (["space-between", "space-around", "space-evenly"].includes(value ?? "")) return { gold: true };
      if (value === "flex-end") return { gold: false, note: "`flex-end` works here only because the nest is at the end. To spread items along a row, reach for `space-between`." };
      return { gold: false, note: "Solved — though the intended tool was `justify-content`." };
    },
  },

  {
    id: "flex-6-align-items",
    chapter: 3,
    number: 6,
    title: "The Hanging Stairs",
    concept: "align-items",
    edit: "css",
    learn: "Line flex children up on the cross axis with align-items — and meet its default, stretch.",
    objective: "The steps hang from the top of their container, out of reach. Stand them on the floor so they make a staircase.",
    lesson: [
      "`align-items` lines children up on the **cross axis** — in a row, that's up and down: by their tops, their middles, or their bottoms.",
      `These steps are different heights. Dom can climb about ${UP} at a time. Which edge you line them up by decides whether they form stairs.`,
      "If you never set `align-items` at all, its default is `stretch` — every child grows to fill the cross axis, which is exactly why flex children so often end up all the same height without anyone asking for it. Setting an explicit height (like these steps do) opts an item out of stretching.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".stairs {", note: "" },
        { code: "  display: flex;", note: "" },
        { code: "  align-items: center;", note: "children lined up by their middles" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `align-items: flex-start;` in `.stairs`.",
      "Change it so the steps' bottoms line up.",
      "Climb to the summit.",
    ],
    reference: {
      title: "align-items",
      syntax: "align-items: <keyword>;",
      entries: [
        { value: "stretch", meaning: "fill the cross axis (the default!)" },
        { value: "flex-start", meaning: "line up the tops" },
        { value: "center", meaning: "line up the middles" },
        { value: "flex-end", meaning: "line up the bottoms" },
      ],
    },
    hints: [
      "Look underneath the steps. Their tops all sit at the same height — but their bottoms don't. Nothing holds them up.",
      "`justify-content` moves things along the main axis. Which property moves them on the cross axis?",
      "The `.stairs` rule has a line that decides how its children line up vertically.",
      "`align-items: flex-start` pins each child's top edge to the top of the container, so short steps dangle. `flex-end` pins their bottom edges to the floor instead, and steps of different heights become a staircase.",
      "In `.stairs`, change `align-items: flex-start;` to `align-items: flex-end;`",
    ],
    debrief: {
      rule: "align-items works on the cross axis. Its default, stretch, is why flex children so often come out equal-height unasked — an explicit height opts out.",
      seenIn: "A chat box: the message field grows as you type, while the send button stays lined up with its bottom edge.",
      fableLine: "“Line, stand with your feet on the ground.”",
    },
    quiz: {
      question: "If align-items is never set, what happens to flex children with no height of their own?",
      options: ["They collapse to 0 height", "They stretch to fill the container's cross axis", "They stay their content's natural height", "The layout breaks"],
      answer: 1,
      explain: "stretch is align-items' default value — children fill the cross axis unless they have their own height or opt out.",
    },
    html: `<div class="ledge start">start</div>
<div class="stairs">
  <div class="step s1"></div>
  <div class="step s2"></div>
  <div class="step s3"></div>
  <div class="step s4"></div>
</div>
<div class="summit goal">summit</div>
`,
    css: `.stairs {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  position: absolute;
  left: 170px;
  bottom: 60px;
  height: 240px;
}

.step {
  width: 100px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

.s1 { height: 60px; }
.s2 { height: 120px; }
.s3 { height: 180px; }
.s4 { height: 240px; }

.ledge {
  position: absolute;
  left: 30px;
  bottom: 60px;
  width: 120px;
  height: 20px;
  border: 4px solid;
  box-sizing: border-box;
}

.summit {
  position: absolute;
  left: 650px;
  bottom: 280px;
  width: 120px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      if (rule(ctx.css, ".stairs")["align-items"] === "flex-end") return { gold: true };
      return { gold: false, note: "Solved — the idiomatic line is `align-items: flex-end` on the container." };
    },
  },

  {
    id: "flex-7-align-content",
    chapter: 3,
    number: 7,
    title: "Room Between the Rows",
    concept: "align-content",
    edit: "css",
    learn: "Space out wrapped lines with align-content — a property that does nothing without flex-wrap: wrap.",
    objective: "Both rows of tiles are bunched at the top of a tall rack. Spread the rows apart so the lower one reaches the floor.",
    lesson: [
      "When a wrapped container has **more than one line**, `align-content` positions those lines within the container's cross axis — the same idea as `justify-content`, but for whole rows instead of individual items.",
      "It only has an effect when there's leftover cross-axis space *and* more than one line — which means it does **nothing at all** without `flex-wrap: wrap` (or `wrap-reverse`) already set. This trips up almost everyone the first time.",
      "This rack is tall (240px) but its two single-tile rows only need 60px, leaving 180px of leftover cross-axis space. `align-content: flex-start` (the default-like behaviour here) bunches both rows at the top.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "flex-wrap: wrap;", note: "required, or align-content does nothing" },
        { code: "align-content: space-between;", note: "first line at the top, last at the bottom" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `align-content: flex-start;` in `.rack`.",
      "Change it to `align-content: space-between;`.",
      "Step down onto the lower row, then to the goal.",
    ],
    reference: {
      title: "align-content",
      syntax: "align-content: <keyword>;  (needs flex-wrap: wrap)",
      entries: [
        { value: "flex-start", meaning: "lines packed at the start" },
        { value: "space-between", meaning: "first line at the start, last at the end, rest shared" },
        { value: "stretch", meaning: "lines stretch to fill the cross axis (default)" },
      ],
    },
    hints: [
      "There are two rows of tiles, and both are stuck high up near the top of the tall rack — nowhere near the floor.",
      "The rack wraps its tiles into two lines. Is there a property that positions the *lines themselves* within the rack's extra height?",
      "`align-content: flex-start` is currently bunching both lines at the top, leaving all the rack's extra height unused below them.",
      "`align-content` needs `flex-wrap: wrap` to matter at all — which this rack already has. `space-between` puts the first line at the very top and the last at the very bottom, using the full height.",
      "Change `align-content: flex-start;` to `align-content: space-between;`.",
    ],
    debrief: {
      rule: "align-content positions wrapped lines within extra cross-axis space — but only exists when flex-wrap creates more than one line.",
      seenIn: "A tag list that wraps onto several lines inside a tall container uses align-content to decide whether those lines bunch together or spread out.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "What does align-content do on a container with flex-wrap: nowrap?",
      options: ["Positions the single line, same as align-items", "Nothing — it needs more than one line to have any effect", "Causes an error", "Reverses the item order"],
      answer: 1,
      explain: "align-content only affects the space between multiple wrapped lines — with nowrap there's only ever one line, so it does nothing.",
    },
    html: `<div class="ledge start">start</div>
<div class="rack">
  <div class="tile"></div>
  <div class="tile"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.rack {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  width: 100px;
  height: 250px;
  position: absolute;
  left: 220px;
  bottom: 100px;
}

.tile {
  width: 90px;
  height: 30px;
  background: #9aa3ad;
  border: 4px solid #454d57;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 100px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 350px; }
${DECORATION}`,
    rubric: (ctx) => {
      const v = rule(ctx.css, ".rack")["align-content"];
      if (["space-between", "space-around", "space-evenly"].includes(v ?? "")) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was align-content: space-between." };
    },
  },

  {
    id: "flex-8-gap",
    chapter: 3,
    number: 8,
    title: "The Unbridgeable Void",
    concept: "gap",
    edit: "css",
    learn: "Control the space between flex children with gap, row-gap and column-gap.",
    objective: "The stones are too far apart to jump. Close the distance and hop to the gold stone.",
    lesson: [
      "`.walkway` is a flex container, so its children sit in a row.",
      "`gap` is the empty space the container puts **between** each pair of children. It never goes before the first one or after the last.",
      "`gap` is shorthand for `row-gap` (between lines, when wrapped) and `column-gap` (between items in a row) together — you can set either alone when you only need to space one direction.",
      `Dom can jump about ${ACROSS} across. Right now each gap is 300px.`,
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".walkway {", note: "" },
        { code: "  display: flex;", note: "children in a row" },
        { code: "  gap: 40px;", note: "40px between each pair" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `gap: 300px;` in `.walkway`.",
      "Make it smaller than Dom's jump — try `60px`.",
      "Hop across.",
    ],
    reference: {
      title: "gap",
      syntax: "gap: <length>;  ·  row-gap / column-gap",
      entries: [
        { value: "gap: 60px", meaning: "60px of empty space between each pair, both directions" },
        { value: "row-gap: 20px", meaning: "space between wrapped lines only" },
        { value: "column-gap: 20px", meaning: "space between items in a row only" },
      ],
    },
    hints: [
      "Walk to the edge of the green stone and look at the empty space ahead. The stones didn't make that space — something else adds it.",
      "Which element owns the space between the stones: each `.stone`, or the `.walkway` they sit inside?",
      "Look at the `.walkway` rule. One of its lines sets the distance between every pair of stones at once.",
      `\`gap\` is a spacer the container slides between its children. \`gap: 300px\` puts 300px of nothing between neighbours, and Dom's jump covers about ${ACROSS}.`,
      "In `.walkway`, change `gap: 300px;` to `gap: 60px;`",
    ],
    debrief: {
      rule: "`gap` belongs to the container. Change it once and every space between the children changes together — no margins on each item.",
      seenIn: "Rows of buttons and navigation links: a nav bar is usually a flex row with a `gap` between the links.",
      fableLine: "“Line, leave room between you.”",
    },
    quiz: {
      question: "A flex container has 3 children and `gap: 20px`. How many 20px gaps are there?",
      options: ["1", "2", "3", "4"],
      answer: 1,
      explain: "Gap only goes between neighbours: child 1–2 and child 2–3. None before the first or after the last.",
    },
    html: `<div class="walkway">
  <div class="stone start">start</div>
  <div class="stone"></div>
  <div class="stone goal">goal</div>
</div>
`,
    css: `.walkway {
  display: flex;
  gap: 300px;
  position: absolute;
  left: 20px;
  bottom: 110px;
}

.stone {
  width: 90px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (ctx) => {
      const stone = rule(ctx.css, ".stone");
      if (stone["margin"] || stone["margin-left"] || stone["margin-right"]) return { gold: false, note: "You made it using margins on the stones. It works, but `gap` does the same job from one place." };
      if (stone["width"] && stone["width"] !== "90px") return { gold: false, note: "You made it by resizing the stones — but the lesson's tool is `gap`, which leaves the stones alone." };
      if (pxValue(rule(ctx.css, ".walkway")["gap"]) == null) return { gold: false, note: "Solved — though the intended fix was to change `gap`." };
      return { gold: true };
    },
  },

  {
    id: "flex-9-grow-shrink-basis",
    chapter: 3,
    number: 9,
    title: "The Growing Bridge",
    concept: "flex-grow / flex-shrink / flex-basis",
    edit: "css",
    learn: "Let one item consume leftover space with flex-grow, starting from its flex-basis.",
    objective: "The bridge starts tiny and leaves the rest of the frame empty. Let it grow to fill the leftover space.",
    lesson: [
      "Three properties control an item's size along the main axis. `flex-basis` is its **starting size**, before anything else happens — like `width`, but specific to flex. `flex-grow` says how much of any **leftover space** it should soak up. `flex-shrink` says how much it gives up if there isn't enough room.",
      "`flex-grow: 0` (the default) means an item never grows past its basis, however much empty space is left in the container. `flex-grow: 1` means it takes all of it.",
      "In practice you almost always write the **`flex` shorthand** instead of the three separately: `flex: 1` means `flex: 1 1 0` (grow, shrink, start from nothing — the classic \"fill the space\" item). `flex: 0 0 auto` means \"never grow or shrink, stay at your natural size\" — the classic fixed-size item, like a sidebar.",
      "This bridge has `flex-basis: 20px` and `flex-grow: 0` — it starts tiny and, since it isn't allowed to grow, stays that way, no matter how much room is left.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: "flex: 1;", note: "= flex: 1 1 0 — grow to fill, starting from nothing" },
        { code: "flex: 0 0 auto;", note: "fixed size — never grow or shrink" },
        { code: "flex-grow: 1;", note: "just the growing part, on its own" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.bridge { flex-basis: 20px; flex-grow: 0; }`.",
      "Change `flex-grow: 0;` to `flex-grow: 1;`.",
      "Cross the bridge.",
    ],
    reference: {
      title: "grow / shrink / basis",
      syntax: "flex: <grow> <shrink> <basis>;",
      entries: [
        { value: "flex-basis: 20px", meaning: "the starting size, before grow/shrink" },
        { value: "flex-grow: 1", meaning: "take all the leftover space" },
        { value: "flex: 1", meaning: "shorthand for grow:1, shrink:1, basis:0" },
      ],
    },
    hints: [
      "The bridge is a tiny sliver at the start of a much wider frame, with a long stretch of empty frame after it going nowhere.",
      "The bridge has both a `flex-basis` and a `flex-grow`. Is it allowed to use any of that leftover space?",
      "`flex-grow: 0` means never grow, however much room is left over in the frame — so the bridge stays at its 20px basis forever.",
      "Changing `flex-grow` to `1` lets the bridge claim all the frame's leftover space, growing from its tiny 20px basis to fill it.",
      "Change `flex-grow: 0;` to `flex-grow: 1;` on `.bridge`.",
    ],
    debrief: {
      rule: "flex-basis sets an item's starting size; flex-grow decides how much leftover space it claims; flex-shrink decides how much it gives up when there's too little room.",
      seenIn: "A typical two-column layout is a fixed sidebar (`flex: 0 0 240px`) beside a fluid content area (`flex: 1`) that grows to fill whatever's left.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "What does flex: 1 expand to?",
      options: ["flex-grow: 1 only", "flex: 1 1 0 (grow, shrink, basis 0)", "flex: 0 1 auto", "It's not valid shorthand"],
      answer: 1,
      explain: "The flex shorthand always sets all three values; flex: 1 is shorthand for flex-grow: 1, flex-shrink: 1, flex-basis: 0.",
    },
    html: `<div class="frame">
  <div class="anchor start">start</div>
  <div class="bridge"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.frame {
  display: flex;
  position: absolute;
  left: 20px;
  bottom: 140px;
  width: 600px;
}

.anchor {
  flex: 0 0 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}

.bridge {
  flex-basis: 20px;
  flex-grow: 0;
  flex-shrink: 0;
  height: 30px;
  background: #c9a36b;
  border: 4px solid #6e4f24;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.goal { left: 700px; }
${DECORATION}`,
    rubric: (ctx) => {
      const bridge = rule(ctx.css, ".bridge");
      if ((Number(bridge["flex-grow"]) || 0) > 0) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was raising the bridge's flex-grow above 0." };
    },
  },

  {
    id: "flex-10-align-self-order",
    chapter: 3,
    number: 10,
    title: "One Item, Its Own Rules",
    concept: "align-self / order",
    edit: "css",
    learn: "Override the container's align-items for a single item with align-self.",
    objective: "The key plank hangs from the top of a tall rack, out of reach. Give just that plank its own alignment.",
    lesson: [
      "`align-self` does exactly what `align-items` does, but for **one item only** — it overrides whatever the container set, for just that child.",
      "This is the item-property counterpart to a container-wide decision: instead of changing `align-items` for every child, `align-self` singles one out.",
      "`order` is a different item property: it changes an item's **visual** position in the row, independent of where it's written in the HTML. Low numbers come first (the default is `0` for everything).",
      "`order` is worth using carefully: it changes what you *see*, but not the order a keyboard or screen reader moves through the elements in — that still follows the HTML. A row re-ordered with `order` can visually make sense while being confusing to navigate by keyboard.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".rack { align-items: flex-start; }", note: "every child, by default" },
        { code: ".key { align-self: flex-end; }", note: "just this one, overridden" },
        { code: ".first { order: -1; }", note: "moves visually first, wherever it is in the HTML" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.key { align-self: flex-start; }`.",
      "Change it to `align-self: flex-end;`.",
      "Step across to the goal.",
    ],
    reference: {
      title: "align-self and order",
      syntax: "align-self: <keyword>;  ·  order: <number>;",
      entries: [
        { value: "align-self: flex-end", meaning: "overrides align-items, for this item only" },
        { value: "order: -1", meaning: "moves this item earlier, visually only" },
        { value: "order: 0", meaning: "the default, for every item" },
      ],
    },
    hints: [
      "The key plank is up near the top of the rack, far above the start ledge — nothing else in the rack is causing that.",
      "Is there a property on the plank itself, rather than on the rack, that decides its own vertical position?",
      "`.key { align-self: flex-start; }` — this overrides the rack's own alignment, just for this one item, pinning it to the top.",
      "`align-self` on an item beats `align-items` on the container, for that one item. Changing it to `flex-end` drops the plank to the bottom of the rack, level with the start ledge.",
      "Change `.key`'s `align-self: flex-start;` to `align-self: flex-end;`.",
    ],
    debrief: {
      rule: "align-self overrides the container's align-items for a single item. order changes visual order only — never tab or reading order.",
      seenIn: "A form row where every field aligns to the top except one taller \"notes\" field, deliberately bottom-aligned with align-self.",
      fableLine: "So the queen spoke to the line itself.",
    },
    quiz: {
      question: "Does giving an item order: -1 change the order a keyboard user tabs through the page?",
      options: ["Yes, tab order always follows order", "No — order changes visual position only; tab order follows the HTML", "Only in Firefox", "Only if align-self is also set"],
      answer: 1,
      explain: "order is purely visual. Keyboard and screen-reader navigation still follow the document's actual HTML order — a real accessibility trap.",
    },
    html: `<div class="ledge start">start</div>
<div class="rack">
  <div class="key"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.rack {
  display: flex;
  align-items: flex-start;
  height: 200px;
  position: absolute;
  left: 220px;
  bottom: 140px;
}

.key {
  align-self: flex-start;
  width: 300px;
  height: 30px;
  background: #6fa78f;
  border: 4px solid #2c5747;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 560px; }
${DECORATION}`,
    rubric: (ctx) => {
      if (rule(ctx.css, ".key")["align-self"] === "flex-end") return { gold: true };
      return { gold: false, note: "Solved — the intended fix was align-self: flex-end on .key." };
    },
  },

  {
    id: "flex-11-gotchas",
    chapter: 3,
    number: 11,
    title: "The Item That Wouldn't Shrink",
    concept: "min-width: auto",
    edit: "css",
    learn: "Fix the classic flex overflow bug: a flex item's default min-width: auto refuses to let it shrink below its content.",
    objective: "The second plank holds one long, unbreakable word and refuses to shrink, so the third plank gets squeezed much smaller than it should be. Free it with min-width: 0.",
    lesson: [
      "A few things about flex catch almost everyone out at least once. Two worth knowing by name: `flex-basis` wins over `width` when both are set on a flex item (basis is more specific to flex layout) — and `align-items: stretch`, the default, is why flex children so often come out equal-height with no one asking for it (you met that one already).",
      "The big one: every flex item has an invisible `min-width: auto` by default. It means an item will never shrink smaller than its own **content's** minimum size, *even if* `flex-shrink` says it should — the shrink factor is powerless below that floor.",
      "That's exactly what's happening here: `.plankB` is set to shrink, but it holds one long, unbroken word with nowhere to break — so its content can't get any narrower. `.plankB` can't shrink below fitting it. Something else has to give — and `.plankC` gets crushed instead, absorbing all the overflow.",
      "The fix is almost always the same one line: `min-width: 0;` on the stubborn item removes that invisible floor and lets it shrink properly, so the space it was hogging goes back to whoever actually needed it.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".plankB { flex: 1 1 auto; }", note: "should shrink to fit…" },
        { code: "/* …but min-width: auto (default) won't let it shrink below its content */", note: "" },
        { code: ".plankB { min-width: 0; }", note: "removes the floor — now it can actually shrink" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.plankB { flex: 1 1 auto; }`.",
      "Add `min-width: 0;` to it.",
      "Cross all three planks to the goal.",
    ],
    reference: {
      title: "Flexbox gotchas",
      syntax: "min-width: 0;",
      entries: [
        { value: "flex-basis", meaning: "wins over width, when both are set" },
        { value: "min-width: auto (default)", meaning: "an item won't shrink below its content's size" },
        { value: "min-width: 0", meaning: "the usual fix — lets it shrink freely" },
      ],
    },
    hints: [
      "PlankA is fine. PlankC, at the end, is squeezed down much smaller than it should be — even though it's meant to be a normal, shrinkable plank like the others.",
      "PlankB sits between them, holding one long, unbroken word. Is plankB actually shrinking to make room, or is something stopping it?",
      "PlankB is `flex: 1 1 auto`, which should let it shrink — but a flex item can never shrink below its own content's size unless told otherwise, and one long unbreakable word sets that floor high.",
      "`min-width: 0` on plankB removes that invisible floor, letting it shrink as much as the layout actually needs — which frees up the space plankC was missing.",
      "Add `min-width: 0;` to `.plankB`.",
    ],
    debrief: {
      rule: "Every flex item defaults to min-width: auto, refusing to shrink below its content's size regardless of flex-shrink. min-width: 0 removes that floor.",
      seenIn: "A row with a fixed icon, a long unbroken filename, and a delete button is the single most common place this bug shows up — the filename won't shrink, so the button gets pushed off.",
      fableLine: "A tailor arrived with a measuring tape.",
    },
    quiz: {
      question: "Why doesn't flex-shrink alone guarantee an item can shrink to fit?",
      options: [
        "flex-shrink is ignored in row layouts",
        "Every flex item has min-width: auto by default, which can override flex-shrink",
        "flex-shrink only works with flex-direction: column",
        "It always works — there's no such limit",
      ],
      answer: 1,
      explain: "min-width: auto sets an invisible floor at the item's content size. flex-shrink can't push it any smaller than that unless min-width is overridden.",
    },
    html: `<div class="row">
  <div class="plankA start">start</div>
  <div class="plankB">lockedwordlockedword</div>
  <div class="plankC"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.row {
  display: flex;
  position: absolute;
  left: 220px;
  bottom: 140px;
  width: 320px;
}

.plankA {
  flex: 0 0 90px;
  height: 30px;
  box-sizing: border-box;
}

.plankB {
  flex: 1 1 auto;
  height: 30px;
  white-space: nowrap;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.plankC {
  flex: 1 1 200px;
  height: 30px;
  background: #6fa78f;
  border: 4px solid #2c5747;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.goal { left: 570px; }
${DECORATION}`,
    rubric: (ctx) => {
      const plankB = rule(ctx.css, ".plankB");
      if (pxValue(plankB["min-width"]) === 0) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was min-width: 0 on .plankB." };
    },
  },

  {
    id: "flex-12-patterns-and-grid",
    chapter: 3,
    number: 12,
    title: "The Builder's Toolkit",
    concept: "real patterns, and when to reach for Grid",
    edit: "css",
    learn: "Recognise the handful of layouts flexbox builds every day — and know when to reach for Grid instead.",
    objective: "These tiles need to line up in real rows and columns at once, which this flex row can't quite pin down. Switch to Grid.",
    lesson: [
      "A short field guide to layouts you'll build constantly with everything in this chapter: a **navbar** (`justify-content: space-between`), a **card with a footer pinned to the bottom** (`flex-direction: column` on the card, `margin-top: auto` on the footer), a **sidebar beside fluid content** (`flex: 0 0 240px` beside `flex: 1`), a **media object** (a fixed-size image beside flexible text), **equal-width columns** (`flex: 1` on each), a **wrapping chip list** (`flex-wrap: wrap` plus `gap`), **perfect centering** (`justify-content: center` with `align-items: center`), and a **sticky footer** on a short page (a column layout where the main content area is `flex: 1`).",
      "`margin: auto` on a flex item is a neat trick worth knowing on its own: an automatic margin absorbs *all* the leftover space on that side, which is exactly how you push one item (like a footer, or a single nav link) to the far end without touching `justify-content` at all.",
      "Two more things worth knowing before you move on: **flex doesn't cascade** — an element is only a flex *item* of its immediate parent; its own children need their own `display: flex` to become a flex container in turn. And **nesting flex containers** inside each other, each handling its own small piece, is how almost every real layout is actually built — a page-level row containing a column containing another row.",
      "Flexbox is **one-dimensional**: it's genuinely excellent at a single row or column, but it was never designed to line things up across rows *and* columns at once. These four tiles need to sit in a real 2×2 grid — and a flex row, however you wrap it, can't pin both dimensions down together. That's the signal to reach for **Grid** instead — often the two are combined, Grid for a page's overall structure and flex for the components inside it.",
    ],
    example: {
      lang: "css",
      lines: [
        { code: ".navbar { display: flex; justify-content: space-between; }", note: "logo left, links right" },
        { code: ".footer { margin-top: auto; }", note: "pushed to the bottom of a column" },
        { code: ".tiles { display: grid; grid-template-columns: repeat(2, 1fr); }", note: "real rows AND columns" },
      ],
    },
    steps: [
      "Open the **CSS** tab.",
      "Find `.tiles { display: flex; flex-wrap: wrap; }`.",
      "Change it to `display: grid;` with `grid-template-columns: repeat(2, 110px);`.",
      "Cross the tiles to the goal.",
    ],
    reference: {
      title: "Flex vs Grid",
      syntax: "one dimension (flex) vs two (grid)",
      entries: [
        { value: "flex", meaning: "one row or column — the default choice for components" },
        { value: "grid", meaning: "rows AND columns together — reach for it when both matter at once" },
        { value: "margin: auto (on an item)", meaning: "eats all leftover space on that side, pushing the item away" },
      ],
    },
    hints: [
      "The tiles are meant to form a neat 2×2 block, but with the frame this narrow, they've stacked into a single tall column instead of two rows of two.",
      "The container is `display: flex; flex-wrap: wrap;`. Flex wrapping is still fundamentally one row after another — can it guarantee an exact 2-column, 2-row block?",
      "With each tile the same width as the frame, only one fits per line, so every tile wraps onto its own row — a column, not a grid.",
      "This is exactly the case Grid is for: two dimensions at once. `display: grid; grid-template-columns: repeat(2, 110px);` lays the four tiles into two real columns and two real rows.",
      "Change `.tiles` to `display: grid; grid-template-columns: repeat(2, 110px);` (you can remove `flex-wrap`, though leaving it does no harm).",
    ],
    debrief: {
      rule: "Flexbox arranges one dimension at a time. When you need real rows and columns together, reach for Grid — and it's completely normal to use both in the same layout.",
      seenIn: "Most real sites use Grid for the page's overall skeleton (header, sidebar, main, footer) and flex inside each of those pieces (a nav row, a button group, a card's contents).",
      fableLine: "In flexbox you don't place the children. You tell the container how to arrange them.",
    },
    quiz: {
      question: "You need four cards to line up in a true 2×2 block, staying aligned in both rows and columns. What's the better tool?",
      options: ["flexbox with flex-wrap: wrap", "CSS Grid", "Neither can do this", "JavaScript"],
      answer: 1,
      explain: "Flexbox only reliably controls one axis at a time. Grid is built for aligning items across rows and columns simultaneously.",
    },
    html: `<div class="ledge start">start</div>
<div class="tiles">
  <div class="tile"></div>
  <div class="tile"></div>
  <div class="tile"></div>
  <div class="tile"></div>
</div>
<div class="ledge goal">goal</div>
`,
    css: `.tiles {
  display: flex;
  flex-wrap: wrap;
  width: 110px;
  gap: 10px;
  position: absolute;
  left: 220px;
  bottom: 140px;
}

.tile {
  width: 110px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; }
.goal { left: 620px; }
${DECORATION}`,
    rubric: (ctx) => {
      const tiles = rule(ctx.css, ".tiles");
      if (tiles["display"] === "grid" && /repeat\(\s*2/.test(tiles["grid-template-columns"] ?? "")) return { gold: true };
      return { gold: false, note: "Solved — the intended fix was switching to display: grid with two real columns." };
    },
  },
];

/* =========================================================================
 * Chapter 4 — JavaScript
 * ========================================================================= */

const JS_LEVELS: Level[] = [...BASICS, ...FUNCTIONS, ...DATA, ...DOM, ...ASYNC];

export const LEVELS: Level[] = [...HTML_LEVELS, ...CSS_LEVELS, ...FLEX_LEVELS, ...JS_LEVELS];

export function chapterOf(level: Level) {
  return CHAPTERS.find((c) => c.number === level.chapter)!;
}

export function levelsIn(chapter: number) {
  return LEVELS.filter((l) => l.chapter === chapter);
}
