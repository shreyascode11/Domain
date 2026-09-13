import { declarationMap, parseCss, pxValue } from "./cssParse";

export type ReferenceEntry = { value: string; meaning: string };

export type Rubric = {
  /** Gold seal: solved the way the lesson intends. */
  gold: boolean;
  /** Shown when the level was solved but not idiomatically. */
  note?: string;
};

export type Level = {
  id: string;
  chapter: number;
  number: number; // position within the chapter, 1-based
  title: string;
  concept: string; // the property this level teaches, e.g. "gap"
  objective: string;
  /** The idea, explained before you play. Plain language, one short paragraph each. */
  lesson: string[];
  reference: { property: string; syntax: string; entries: ReferenceEntry[] };
  /** Hint ladder (blueprint §7.6): Notice, Question, Narrow, Re-teach, Reveal. */
  hints: [string, string, string, string, string];
  debrief: { rule: string; seenIn: string; fableLine: string };
  html: string;
  css: string;
  rubric: (appliedCss: string) => Rubric;
};

export type Chapter = {
  number: number;
  title: string;
  teaches: string;
  fable: string[];
  moral: string;
};

export const HINT_RUNGS = ["Notice", "Question", "Narrow", "Re-teach", "Reveal"] as const;

export const CHAPTER_5: Chapter = {
  number: 5,
  title: "The Conveyor of Ants",
  teaches: "Flexbox",
  fable: [
    "In the old hall, the ants would not move for the queen. She shouted at each one — “You, step left! You, stand taller!” — and still they tangled into a heap.",
    "An old ant said: “Stop talking to us one at a time. Talk to the line.”",
    "So the queen spoke to the line itself. “Line, leave room between you,” she said, and the spaces opened like breath. “Line, spread yourselves along the whole floor,” and they did. “Line, stand with your feet on the ground,” and tall and short lined up by their feet. “Line, rise,” and the line stood up into a tower.",
    "She never touched a single ant again.",
  ],
  moral:
    "In flexbox you don't place the children. You tell the container how to arrange them.",
};

const DECORATION = `
/* — decoration: colours only, nothing here moves anything — */

.start { background: #2f9e7a; border-color: #0f4d3c; }
.goal  { background: #e9a23b; border-color: #7a4a0c; }
`;

function rule(appliedCss: string, selector: string) {
  return declarationMap(parseCss(appliedCss).rules)[selector] ?? {};
}

export const LEVELS: Level[] = [
  {
    id: "ch5-1-gap",
    chapter: 5,
    number: 1,
    title: "The Unbridgeable Void",
    concept: "gap",
    objective: "The stones are too far apart to jump. Close the distance and hop to the gold stone.",
    lesson: [
      "`.walkway` is a flex container: `display: flex` makes it line its children up in a row.",
      "`gap` is the empty space the container puts between each pair of children. It only goes between them — never before the first one or after the last.",
      "Your jump carries you across roughly 100px. Right now each gap is much wider than that.",
    ],
    reference: {
      property: "gap",
      syntax: "gap: <length>;",
      entries: [
        { value: "gap: 0", meaning: "children touch" },
        { value: "gap: 40px", meaning: "40px of empty space between each pair" },
        { value: "gap: 260px", meaning: "a void you can't jump" },
      ],
    },
    hints: [
      "Walk to the edge of the green stone and look at the empty space ahead. The stones didn't make that space — something else is adding it.",
      "Which element owns the space between the stones: each `.stone`, or the `.walkway` they all sit inside?",
      "Look at the `.walkway` rule. One of its lines sets the distance between every pair of stones at once.",
      "Think of `gap` as a spacer the container slides between its children. `gap: 260px` puts 260px of nothing between neighbours. Your jump covers about 100px, so the spacer has to be smaller than that.",
      "In `.walkway`, change `gap: 260px;` to `gap: 60px;`",
    ],
    debrief: {
      rule: "`gap` belongs to the container. Change it once and every space between the children changes together — you never have to add margins to each item.",
      seenIn: "Rows of buttons and navigation links: a nav bar is usually a flex row with a `gap` between the links.",
      fableLine: "“Line, leave room between you,” she said, and the spaces opened like breath.",
    },
    html: `<div class="walkway">
  <div class="stone start">start</div>
  <div class="stone">stone</div>
  <div class="stone goal">goal</div>
</div>`,
    css: `.walkway {
  display: flex;
  gap: 260px;
  position: absolute;
  left: 40px;
  bottom: 110px;
}

.stone {
  width: 100px;
  height: 30px;
  background: #7c8aa3;
  border: 4px solid #3a4459;
  box-sizing: border-box;
}
${DECORATION}`,
    rubric: (css) => {
      const walkway = rule(css, ".walkway");
      const stone = rule(css, ".stone");
      const gap = pxValue(walkway["gap"]);
      if (stone["margin"] || stone["margin-left"] || stone["margin-right"]) {
        return { gold: false, note: "You made it using margins on the stones. It works, but `gap` does the same job from one place." };
      }
      if (stone["width"] && stone["width"] !== "100px") {
        return { gold: false, note: "You made it by resizing the stones. That works too — but the lesson's tool is `gap`, which leaves the stones alone." };
      }
      if (gap == null) return { gold: false, note: "Solved — though the intended fix was to change `gap`." };
      return { gold: true };
    },
  },

  {
    id: "ch5-2-justify-content",
    chapter: 5,
    number: 2,
    title: "The Huddle",
    concept: "justify-content",
    objective: "The ants are huddled at one end of the conveyor. Spread them out so you can reach the golden nest.",
    lesson: [
      "The `.conveyor` is 660px wide, but its four ants only take up 440px. The other 220px is leftover space.",
      "`justify-content` decides where that leftover space goes along the row: all at the end, all at the start, or shared out between the ants.",
      "It doesn't resize the ants. It only moves them.",
    ],
    reference: {
      property: "justify-content",
      syntax: "justify-content: <keyword>;",
      entries: [
        { value: "flex-start", meaning: "pack at the start, spare space at the end" },
        { value: "center", meaning: "pack in the middle" },
        { value: "flex-end", meaning: "pack at the end" },
        { value: "space-between", meaning: "first and last at the edges, spare space shared between" },
        { value: "space-around", meaning: "equal space around each item" },
        { value: "space-evenly", meaning: "exactly equal space everywhere" },
      ],
    },
    hints: [
      "The conveyor is much wider than the ants standing on it. Where has all that extra room gone right now?",
      "Is the conveyor's leftover space being shared between the ants, or dumped at one end?",
      "The `.conveyor` rule has a line that decides where leftover space goes along the row.",
      "`justify-content: flex-start` packs items at the start and leaves every spare pixel at the end. `space-between` shares the spare pixels out between the items instead, so the last one ends up at the far edge — right next to the nest.",
      "In `.conveyor`, change `justify-content: flex-start;` to `justify-content: space-between;`",
    ],
    debrief: {
      rule: "`justify-content` works on the main axis — along the row — and distributes spare space. It moves items; it never resizes them.",
      seenIn: "Almost every site header: logo on the left, menu on the right is `justify-content: space-between`.",
      fableLine: "“Line, spread yourselves along the whole floor,” and they did.",
    },
    html: `<div class="conveyor">
  <div class="ant start">start</div>
  <div class="ant">ant</div>
  <div class="ant">ant</div>
  <div class="ant">ant</div>
</div>
<div class="nest goal">nest</div>`,
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
    rubric: (css) => {
      const conveyor = rule(css, ".conveyor");
      const value = conveyor["justify-content"];
      if (["space-between", "space-around", "space-evenly"].includes(value ?? "")) return { gold: true };
      if (value === "flex-end") {
        return { gold: false, note: "`flex-end` works here only because the nest happens to sit at the end. To spread items along a row, reach for `space-between`." };
      }
      return { gold: false, note: "Solved — though the intended tool was `justify-content`." };
    },
  },

  {
    id: "ch5-3-align-items",
    chapter: 5,
    number: 3,
    title: "The Hanging Stairs",
    concept: "align-items",
    objective: "The steps hang from the top of their container, out of reach. Stand them on the floor so they make a staircase to the summit.",
    lesson: [
      "In a row, the main axis runs left to right. The other axis — up and down — is the cross axis.",
      "`align-items` lines the children up on the cross axis: by their tops, their middles, or their bottoms.",
      "These steps are different heights. Which edge you line them up by decides whether they form stairs.",
    ],
    reference: {
      property: "align-items",
      syntax: "align-items: <keyword>;",
      entries: [
        { value: "flex-start", meaning: "line up the tops" },
        { value: "center", meaning: "line up the middles" },
        { value: "flex-end", meaning: "line up the bottoms" },
        { value: "stretch", meaning: "stretch to fill (only if no height is set)" },
      ],
    },
    hints: [
      "Look underneath the steps. Their tops all sit at the same height — but their bottoms don't. Nothing is holding them up from below.",
      "`justify-content` moves things along the row. Which property moves them up and down?",
      "The `.stairs` rule has a line that decides how its children line up vertically.",
      "`align-items: flex-start` pins each child's top edge to the top of the container, so short steps dangle in mid-air. `flex-end` pins their bottom edges to the floor instead — and steps of different heights become a staircase.",
      "In `.stairs`, change `align-items: flex-start;` to `align-items: flex-end;`",
    ],
    debrief: {
      rule: "`justify-content` is the main axis, `align-items` is the cross axis. In a row, the cross axis is vertical.",
      seenIn: "A chat box: the message field grows taller as you type, while the send button stays lined up with its bottom edge.",
      fableLine: "“Line, stand with your feet on the ground,” and tall and short lined up by their feet.",
    },
    html: `<div class="ledge start">start</div>
<div class="stairs">
  <div class="step s1"></div>
  <div class="step s2"></div>
  <div class="step s3"></div>
  <div class="step s4"></div>
</div>
<div class="summit goal">summit</div>`,
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
    rubric: (css) => {
      const stairs = rule(css, ".stairs");
      if (stairs["align-items"] === "flex-end") return { gold: true };
      return { gold: false, note: "Solved — the idiomatic line is `align-items: flex-end` on the container." };
    },
  },

  {
    id: "ch5-4-flex-direction",
    chapter: 5,
    number: 4,
    title: "The Tower",
    concept: "flex-direction",
    objective: "The tower's floors are lying flat along the ground. Stack them into a column and climb to the flag.",
    lesson: [
      "Every flex container has a main axis. `flex-direction` chooses it.",
      "`row` runs the children left to right. `column` runs them top to bottom — the first child on top.",
      "When the axis turns, everything else turns with it: `gap` becomes space between floors, and `align-items` now lines children up left and right.",
    ],
    reference: {
      property: "flex-direction",
      syntax: "flex-direction: <keyword>;",
      entries: [
        { value: "row", meaning: "left → right (the default)" },
        { value: "row-reverse", meaning: "right → left" },
        { value: "column", meaning: "top → bottom" },
        { value: "column-reverse", meaning: "bottom → top" },
      ],
    },
    hints: [
      "The blocks are wide and thin, like floors of a building — but every one of them is lying on the ground.",
      "What would happen to these blocks if the container arranged them top-to-bottom instead of left-to-right?",
      "`.tower` has a line that decides which direction its children flow.",
      "`flex-direction: row` lays children along a horizontal line. `column` turns the main axis vertical, so the children stack in order: the first in the HTML on top, the last on the bottom. Here that gives you narrow floors on top of wide ones — a climbable tower. (`column-reverse` would flip it upside down.)",
      "In `.tower`, change `flex-direction: row;` to `flex-direction: column;`",
    ],
    debrief: {
      rule: "`flex-direction` picks the main axis. Turn it, and `justify-content`, `align-items` and `gap` all turn with it.",
      seenIn: "Responsive layouts: a row of cards on a laptop often becomes `flex-direction: column` on a phone.",
      fableLine: "“Line, rise,” and the line stood up into a tower.",
    },
    html: `<div class="tower">
  <div class="floor f4"></div>
  <div class="floor f3"></div>
  <div class="floor f2"></div>
  <div class="floor f1"></div>
</div>
<div class="ground start">start</div>
<div class="flag goal">flag</div>`,
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
    rubric: (css) => {
      const tower = rule(css, ".tower");
      if (tower["flex-direction"] === "column") return { gold: true };
      return { gold: false, note: "Solved — the lesson's line is `flex-direction: column` on the container." };
    },
  },
];

export const CHAPTERS = [CHAPTER_5];

export function levelIndexById(id: string) {
  return LEVELS.findIndex((l) => l.id === id);
}
