import type { Level } from "../levels";
import { LOOKS, bridgeWorld, has, hiddenStonesWorld, liftWorld, stonesWorld } from "./kit";

/* Chapter 4, part 1: the language itself — values, operators, control flow. */

const bridgeL1 = bridgeWorld(LOOKS.crystal);
const stonesL2 = hiddenStonesWorld(LOOKS.amethyst, "crystal");
const bridgeL3 = bridgeWorld(LOOKS.brass);
const stonesL4 = hiddenStonesWorld(LOOKS.moss, "pad");
const bridgeL5 = bridgeWorld(LOOKS.ember, "beam");
const stonesL6 = hiddenStonesWorld(LOOKS.ice, "floe");
const liftL7 = liftWorld(LOOKS.copper, "lift");
const stonesL8 = stonesWorld(LOOKS.lime, "lily");
const stonesL9 = stonesWorld(LOOKS.coral, "crate");
const bridgeL10 = bridgeWorld(LOOKS.teal, "span");

export const BASICS: Level[] = [
  {
    id: "js-1-let-const",
    chapter: 4,
    number: 1,
    title: "A Name That Can't Change",
    concept: "let, const, and why not var",
    edit: "js",
    learn: "Store values in variables with let and const — and know why modern code avoids var.",
    objective: "The builders try to make the bridge longer, but its width was stored in a const. Fix the variable so the bridge can grow.",
    lesson: [
      "**JavaScript** is a list of instructions the browser follows from top to bottom when you press **Run**. A **variable** is a name for a value, so you can use it later: `let width = 120;`.",
      "There are two ways to make one. `const` means *this name will always point at this value* — try to assign it again and JavaScript stops with an error. `let` means *this value may change later*.",
      "Use `const` by default and switch to `let` only when you really reassign. That way, anyone reading your code knows which values move.",
      "You'll also see `var` in older code. It's the original keyword, and it ignores `{ }` blocks: a `var` made inside an `if` or a loop leaks out and can be overwritten by accident. `let` and `const` stay inside their block, which is why modern JavaScript avoids `var` entirely.",
      "When an error stops the code, **nothing after it runs** — check the console under the editor.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const name = \"Dom\";", note: "never reassigned: const" },
        { code: "let steps = 0;", note: "will change: let" },
        { code: "steps = steps + 1;", note: "fine — it's a let" },
        { code: "name = \"Ant\";", note: "TypeError: Assignment to constant variable" },
      ],
    },
    steps: [
      "Open the **JS** tab and press **Run** — read the error in the console.",
      "Find `const width = 120;`.",
      "Change `const` to `let`, because `width` is reassigned two lines later.",
      "Press **Run** and cross the bridge.",
    ],
    reference: {
      title: "Declaring variables",
      syntax: "let name = value;   const name = value;",
      entries: [
        { value: "const", meaning: "can't be reassigned — the default choice" },
        { value: "let", meaning: "can be reassigned; lives only inside its { } block" },
        { value: "var", meaning: "old; ignores blocks and leaks out — avoid it" },
      ],
    },
    hints: [
      "The bridge isn't there at all — and the console shows a red error. Something stopped the code before it set the width.",
      "Which line does the error point at? What is that line trying to do to `width`?",
      "`width` is given a new value on the line `width = width + 480;`. How was `width` created?",
      "A `const` can never be given a new value. When you plan to change a variable, create it with `let` instead.",
      "Change `const width = 120;` to `let width = 120;` and press Run.",
    ],
    debrief: {
      rule: "`const` for values that never get reassigned, `let` for values that do. Skip `var` — it ignores blocks.",
      seenIn: "A shopping cart keeps `let total` that changes as you add items, but `const TAX_RATE` that never does.",
      fableLine: "“Find the gate,” she read.",
    },
    quiz: {
      question: "Which line causes an error?",
      options: ["let a = 1; a = 2;", "const b = 1; b = 2;", "const c = [1]; c.push(2);", "let d; d = 5;"],
      answer: 1,
      explain: "Only reassigning a `const` is an error. Pushing into a const array is allowed — the name still points at the same array.",
    },
    ...bridgeL1,
    js: `// Find the bridge on the page.
const bridge = document.querySelector(".bridge");

// How wide the bridge is. It starts short...
const width = 120;

// ...then the builders add 480px more.
width = width + 480;

// Set the bridge's width in pixels.
bridge.style.width = width + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\bvar\b/)) return { gold: false, note: "It works, but `var` is the old keyword that ignores blocks. `let` was the fix." };
      if (has(ctx.js, /\blet\s+width\b/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's change was `const width` → `let width`." };
    },
  },

  {
    id: "js-2-primitive-types",
    chapter: 4,
    number: 2,
    title: "What Kind of Thing Is It?",
    concept: "string, number, boolean, null, undefined, symbol, bigint",
    edit: "js",
    learn: "Recognise JavaScript's seven primitive types and check them with typeof.",
    objective: "Each crystal only appears when its value is the right type. The values were written with the wrong types — fix them.",
    lesson: [
      "Every value in JavaScript has a **type**. The simple, built-in ones are called **primitives**, and there are seven:",
      "`string` is text in quotes: `\"240\"`. `number` is any number, whole or decimal: `240`, `3.5`. `boolean` is exactly `true` or `false`. `undefined` means *no value was ever given*. `null` means *deliberately empty*. `symbol` is a unique label (`Symbol(\"id\")`) used for special object keys. `bigint` is a whole number too large for `number`, written with an `n`: `9007199254740993n`.",
      "`typeof value` tells you the type as a string: `typeof 240` is `\"number\"`, but `typeof \"240\"` is `\"string\"` — the quotes change everything, even though they look alike.",
      "One famous oddity: `typeof null` is `\"object\"`, a bug from 1995 that can never be fixed. To check for null, compare directly: `value === null`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "typeof \"hi\"      // \"string\"", note: "text" },
        { code: "typeof 42        // \"number\"", note: "numbers" },
        { code: "typeof true      // \"boolean\"", note: "yes / no" },
        { code: "typeof undefined // \"undefined\"", note: "never set" },
        { code: "typeof null      // \"object\" (!)", note: "check null with === null" },
        { code: "typeof 10n       // \"bigint\"", note: "huge whole numbers" },
      ],
    },
    steps: [
      "Open the **JS** tab. Read the three values and the checks below them.",
      "Make `span` a real number (no quotes).",
      "Make `isOpen` a real boolean (no quotes).",
      "Make `nothing` the real empty value `null` (no quotes). Press **Run** and cross.",
    ],
    reference: {
      title: "Primitive types",
      syntax: "typeof value",
      entries: [
        { value: "\"240\" vs 240", meaning: "a string of digits is not a number" },
        { value: "\"true\" vs true", meaning: "a string is not a boolean" },
        { value: "null vs undefined", meaning: "empty on purpose vs never set" },
      ],
    },
    hints: [
      "None of the crystals appear, even though every check looks sensible. Look closely at how each value is written.",
      "What does `typeof \"240\"` give? Is that `\"number\"`?",
      "All three values are wrapped in quotes, which makes all three of them strings.",
      "Quotes make a string, whatever is inside them. A number, a boolean and `null` are written bare: `240`, `true`, `null`.",
      "Change the three lines to `const span = 240;`, `const isOpen = true;` and `const nothing = null;`, then press Run.",
    ],
    debrief: {
      rule: "There are seven primitives: string, number, boolean, null, undefined, symbol and bigint. Quotes make a string, whatever is inside.",
      seenIn: "Every value typed into a form arrives as a string — `\"42\"` — so real sites convert it before doing maths.",
      fableLine: "Stone, water, light and silence: every thing has a kind.",
    },
    quiz: {
      question: "What does `typeof null` return?",
      options: ["\"null\"", "\"undefined\"", "\"object\"", "\"empty\""],
      answer: 2,
      explain: "A historical bug: `typeof null` is \"object\". Check for null with `value === null`.",
    },
    ...stonesL2,
    js: `const one = document.querySelector("#one");
const two = document.querySelector("#two");
const three = document.querySelector("#three");

// Three values... but are they the types the checks expect?
const span = "240";
const isOpen = "true";
const nothing = "null";

// Each crystal appears only when its value has the right type.
if (typeof span === "number") one.classList.add("shown");
if (typeof isOpen === "boolean") two.classList.add("shown");
if (nothing === null) three.classList.add("shown");
`,
    rubric: (ctx) => {
      const intact = has(ctx.js, /typeof\s+span\s*===\s*["']number["']/) && has(ctx.js, /typeof\s+isOpen\s*===\s*["']boolean["']/) && has(ctx.js, /nothing\s*===\s*null/);
      if (intact) return { gold: true };
      return { gold: false, note: "You changed the checks instead of the values. The lesson was fixing the values' types." };
    },
  },

  {
    id: "js-3-reference-types",
    chapter: 4,
    number: 3,
    title: "Two Names, One Object",
    concept: "objects and arrays are references",
    edit: "js",
    learn: "Understand that objects and arrays are shared by reference, not copied.",
    objective: "The builders make a small sketch from the bridge plan — and accidentally shrink the real plan. Make the sketch a separate object.",
    lesson: [
      "Primitives (numbers, strings…) are copied when you assign them: after `let a = 5; let b = a; b = 9;`, `a` is still 5.",
      "**Objects** (`{ width: 600 }`) and **arrays** (`[1, 2, 3]`) work differently. The variable doesn't hold the object itself — it holds a **reference** to it, like an address.",
      "So `const sketch = plan;` does *not* make a copy. Now two names point at the **same** object, and changing `sketch.width` changes `plan.width` too.",
      "To get a separate object, create a new one: `const sketch = { width: plan.width };`. (Later you'll meet shorter ways, like `{ ...plan }`.)",
      "The same goes for comparing: `{ a: 1 } === { a: 1 }` is `false` — they're two different objects that merely look alike.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const a = { size: 1 };", note: "one object" },
        { code: "const b = a;", note: "b points at the SAME object" },
        { code: "b.size = 99;", note: "" },
        { code: "a.size // 99", note: "a changed too!" },
        { code: "const c = { size: a.size };", note: "a new object: a real copy" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Find `const sketch = plan;` — this shares the plan instead of copying it.",
      "Make `sketch` a brand-new object: `{ width: plan.width }`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Reference types",
      syntax: "const copy = { key: original.key };",
      entries: [
        { value: "b = a (numbers, strings)", meaning: "copies the value" },
        { value: "b = a (objects, arrays)", meaning: "shares the same object" },
        { value: "{ ...a } or { key: a.key }", meaning: "makes a new object" },
      ],
    },
    hints: [
      "The plan says 600px, but the bridge came out tiny. Where does the bridge get its width from?",
      "The bridge uses `plan.width`. Which line changes a width to 100 — and which object does it really change?",
      "`const sketch = plan;` doesn't copy anything. `sketch` and `plan` are two names for one object.",
      "Objects are shared by reference. To keep the plan safe, the sketch must be a brand-new object with its own `width`.",
      "Change the line to `const sketch = { width: plan.width };` and press Run.",
    ],
    debrief: {
      rule: "Assigning an object or array shares a reference. Change it through either name and both see the change. Create a new object to copy.",
      seenIn: "A classic bug: editing a “draft” of a user's profile that secretly edits the saved profile, because the draft was never copied.",
      fableLine: "Two maps of one road: scribble on either, and the road itself moves.",
    },
    quiz: {
      question: "After `const x = [1, 2]; const y = x; y.push(3);` — what is `x`?",
      options: ["[1, 2]", "[1, 2, 3]", "[3]", "an error"],
      answer: 1,
      explain: "`y` and `x` are the same array, so pushing through `y` changes what `x` sees.",
    },
    html: `${bridgeL3.html}<div class="model"></div>
`,
    css: `${bridgeL3.css}
/* A little model of the bridge, high above — it shows sketch.width. */
.model {
  position: absolute;
  left: 400px;
  bottom: 440px;
  height: 14px;
  background: #fff3cf;
  border: 3px dashed #8a6a2e;
  box-sizing: border-box;
}
`,
    js: `const bridge = document.querySelector(".bridge");
const model = document.querySelector(".model");

// The real plan for the bridge.
const plan = { width: 600 };

// A small sketch of it for the model...
const sketch = plan;
sketch.width = 100;

model.style.width = sketch.width + "px";
bridge.style.width = plan.width + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /sketch\s*=\s*(\{|structuredClone|Object\.assign)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fix was making `sketch` a new object instead of sharing `plan`." };
    },
  },

  {
    id: "js-4-equality-truthiness",
    chapter: 4,
    number: 4,
    title: "Loosely Equal, Strictly Wrong",
    concept: "== vs ===, coercion, truthy and falsy",
    edit: "js",
    learn: "Compare with === instead of ==, and know which values count as true or false in an if.",
    objective: "Each lily pad hides behind a comparison that JavaScript quietly bends. Fix all three so the pads appear.",
    lesson: [
      "`==` (loose equality) **converts** values before comparing, so different types can look equal: `\"0\" == 0` is `true`, `\"\" == 0` is `true`, even `\"0\" == false` is `true`. This hidden conversion is called **type coercion**.",
      "`===` (strict equality) never converts: different types are simply not equal. `\"0\" === false` is `false`. Use `===` (and `!==`) always — then comparisons mean what they say.",
      "An `if` doesn't need a comparison at all: it converts its condition to true or false. Values that become false are **falsy** — there are only a few: `false`, `0`, `\"\"` (empty text), `null`, `undefined`, `NaN`. **Everything else is truthy**, including `\"0\"`, `\"false\"`, `[]` and `{}`.",
      "That catches people out: a score of `0` is a real score, but `if (score)` treats it as missing.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "\"0\" == false   // true  (coerced!)", note: "loose: avoid" },
        { code: "\"0\" === false  // false", note: "strict: what you meant" },
        { code: "if (0) …        // skipped: 0 is falsy", note: "" },
        { code: "if (\"0\") …      // runs: non-empty text is truthy", note: "" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Pad one: change the loose `==` to strict `===`.",
      "Pad two: a score of 0 is real — check `score !== undefined` instead of just `score`.",
      "Pad three: the lantern's text is empty, so it's falsy. Give it some text. Press **Run** and cross.",
    ],
    reference: {
      title: "Equality and truthiness",
      syntax: "a === b    a !== b",
      entries: [
        { value: "===", meaning: "equal value AND type — use this" },
        { value: "==", meaning: "converts types first — avoid" },
        { value: "falsy", meaning: "false, 0, \"\", null, undefined, NaN" },
      ],
    },
    hints: [
      "No pads at all. Each one sits behind an `if`. Try reading each condition out loud with its real values.",
      "Is `\"0\" == false` true or false? What about `if (0)`? And `if (\"\")`?",
      "Pad one is fooled by `==`, pad two by 0 being falsy, pad three by empty text being falsy.",
      "`===` never converts types, so `\"0\" === false` is false. `0` and `\"\"` are falsy, so an `if` skips them — compare explicitly, or use a non-empty value.",
      "Use `code === false`, `if (score !== undefined)`, and `const lantern = \"lit\";`, then press Run.",
    ],
    debrief: {
      rule: "Always compare with `===` and `!==`. Falsy values are false, 0, \"\", null, undefined and NaN — everything else is truthy.",
      seenIn: "A shop that hides items with a price of 0 (free!) because it checked `if (price)` instead of `price !== undefined`.",
      fableLine: "Almost equal is how bridges fall.",
    },
    quiz: {
      question: "Which of these is truthy?",
      options: ["0", "\"\"", "\"0\"", "null"],
      answer: 2,
      explain: "\"0\" is non-empty text, so it's truthy. 0, \"\" and null are all falsy.",
    },
    ...stonesL4,
    js: `const one = document.querySelector("#one");
const two = document.querySelector("#two");
const three = document.querySelector("#three");

// Pad one: the code arrived as text from a form.
const code = "0";
if (code == false) {
  console.log("No code entered.");
} else {
  one.classList.add("shown");
}

// Pad two: a score of 0 is still a real score.
const score = 0;
if (score) {
  two.classList.add("shown");
}

// Pad three: the lantern shows the way only when it has text.
const lantern = "";
if (lantern) {
  three.classList.add("shown");
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /[^=!]==[^=]/)) return { gold: false, note: "Solved, but a loose `==` is still in there. Strict `===` was the lesson." };
      return { gold: true };
    },
  },

  {
    id: "js-5-template-literals",
    chapter: 4,
    number: 5,
    title: "Words With Holes in Them",
    concept: "template literals",
    edit: "js",
    learn: "Build strings with template literals: backticks and ${} placeholders.",
    objective: "The beam's width is written as a template — but with the wrong quotes, so nothing gets filled in. Fix the quotes.",
    lesson: [
      "Joining text with `+` gets messy fast: `\"Planks: \" + planks + \" (\" + width + \"px)\"`.",
      "A **template literal** is a string written with **backticks** (the ` key, top-left on most keyboards) instead of quotes. Inside one, `${ }` is a hole: JavaScript runs the expression inside and puts the result into the text.",
      "So `` `${planks * plankWidth}px` `` becomes `\"600px\"`. Any expression works in the hole — maths, variables, function calls.",
      "Template literals can also span several lines, which ordinary quotes can't.",
      "The trap: inside ordinary `\"quotes\"`, `${…}` is just characters. No error — you simply get the text `${planks * plankWidth}px`, which isn't a valid CSS width, so it's ignored.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const name = \"Dom\";", note: "" },
        { code: "`Hello, ${name}!`", note: "\"Hello, Dom!\"" },
        { code: "`${2 + 3} steps`", note: "\"5 steps\" — any expression" },
        { code: "\"Hello, ${name}!\"", note: "quotes: no hole, just text" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Find the line that sets `beam.style.width`.",
      "Replace the double quotes around the value with backticks: `` ` ``.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Template literals",
      syntax: "`text ${expression} text`",
      entries: [
        { value: "`…`", meaning: "backticks make a template literal" },
        { value: "${expression}", meaning: "the result is inserted into the text" },
        { value: "\"${x}\"", meaning: "in normal quotes it's plain text" },
      ],
    },
    hints: [
      "The console shows the label with `${planks}` printed literally, and the beam is missing. The placeholders aren't being filled in.",
      "What kind of quotes are around those strings? Do they create template literals?",
      "`${ }` only works inside backticks. The two strings with `${` in them use double quotes.",
      "Template literals start and end with a backtick. Only then does JavaScript run the `${ }` holes and insert the results.",
      "Change both strings to backticks: `` beam.style.width = `${planks * plankWidth}px`; `` and the same for the label. Press Run.",
    ],
    debrief: {
      rule: "Backtick strings are template literals: `${expression}` inserts a value. Ordinary quotes never do.",
      seenIn: "“Hi Sam, you have 3 new messages” is a template literal filled with your name and a count.",
      fableLine: "Leave a hole in the sentence, and the number fills it.",
    },
    quiz: {
      question: "What does `` `${1 + 1} ants` `` produce?",
      options: ["\"${1 + 1} ants\"", "\"2 ants\"", "\"11 ants\"", "an error"],
      answer: 1,
      explain: "Inside backticks the expression runs: 1 + 1 is 2, inserted into the text.",
    },
    ...bridgeL5,
    js: `const beam = document.querySelector(".beam");

const planks = 12;
const plankWidth = 50;

// Should say "Planks: 12" and set a width of "600px"...
console.log("Planks: \${planks}");
beam.style.width = "\${planks * plankWidth}px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /style\.width\s*=\s*`[^`]*\$\{/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fix was writing the width as a template literal with backticks." };
    },
  },

  {
    id: "js-6-operators",
    chapter: 4,
    number: 6,
    title: "The Operator's Toolkit",
    concept: "arithmetic, comparison, logical, ??, ?., ternary",
    edit: "js",
    learn: "Use JavaScript's operators — including ?? for defaults, ?. for safe access, and the ternary.",
    objective: "Three ice floes, three operator mistakes. Fix them in order — the second one crashes the code and stops the third.",
    lesson: [
      "**Arithmetic:** `+ - * /`, `%` (remainder: `7 % 2` is 1) and `**` (power). Beware: `+` with a string *joins* text, so `10 + \"5\"` is `\"105\"`. **Comparison:** `< > <= >= === !==` give a boolean.",
      "**Logical:** `&&` (and), `||` (or), `!` (not). `a || b` gives `b` whenever `a` is *falsy* — so `0 || 5` is 5, even if 0 was a perfectly good value.",
      "**`??`** (nullish coalescing) is the safer default: `a ?? b` gives `b` only when `a` is `null` or `undefined`. So `0 ?? 5` is 0.",
      "**`?.`** (optional chaining) reads a property only if the thing exists: `weather?.speed` gives `undefined` instead of crashing when `weather` is undefined.",
      "The **ternary** `condition ? yes : no` picks one of two values in a single expression.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "0 || 5         // 5 (0 is falsy)", note: "" },
        { code: "0 ?? 5         // 0 (0 isn't null)", note: "use ?? for defaults" },
        { code: "user?.name     // undefined, no crash", note: "" },
        { code: "age >= 18 ? \"adult\" : \"child\"", note: "ternary" },
      ],
    },
    steps: [
      "Open the **JS** tab and press **Run** — note the error.",
      "Floe one: change `||` to `??` so a depth of 0 is kept.",
      "Floe two: change `weather.speed` to `weather?.speed`.",
      "Floe three: make `total` a real 15 — add two numbers, not a number and a string. Press **Run** and cross.",
    ],
    reference: {
      title: "Operators",
      syntax: "a ?? b    a?.b    cond ? x : y",
      entries: [
        { value: "a || b", meaning: "b if a is falsy (0 and \"\" too)" },
        { value: "a ?? b", meaning: "b only if a is null or undefined" },
        { value: "a?.b", meaning: "undefined instead of a crash when a is missing" },
      ],
    },
    hints: [
      "No floes, and a red error about reading `speed`. Start from the top: why doesn't floe one appear either?",
      "What is `0 || 5`? What happens when you read `.speed` from `undefined`? What is `10 + \"5\"`?",
      "Floe one is broken by `||`, floe two by `.` on a missing value, floe three by adding a string.",
      "`??` only replaces null/undefined. `?.` stops safely at a missing value. `+` joins text whenever either side is a string.",
      "Use `settings.depth ?? 5`, `weather?.speed`, and `const total = 10 + 5;`, then press Run.",
    ],
    debrief: {
      rule: "`??` for defaults (keeps 0 and \"\"), `?.` for things that might not exist, ternary for a choice between two values.",
      seenIn: "`user?.address?.city ?? \"Unknown\"` — showing a profile safely even when half the data is missing.",
      fableLine: "Ask only if it's there. Replace only what's truly missing.",
    },
    quiz: {
      question: "What is `\"\" ?? \"default\"`?",
      options: ["\"default\"", "\"\"", "undefined", "an error"],
      answer: 1,
      explain: "`??` only replaces null and undefined. An empty string is kept.",
    },
    ...stonesL6,
    js: `const one = document.querySelector("#one");
const two = document.querySelector("#two");
const three = document.querySelector("#three");

// Floe one: a depth of 0 is a real setting — keep it.
const settings = { depth: 0 };
const depth = settings.depth || 5;
if (depth === 0) one.classList.add("shown");

// Floe two: there's no weather report today.
const weather = undefined;
const wind = weather.speed;
if (wind === undefined) two.classList.add("shown");

// Floe three: two loads of 10 and 5.
const total = 10 + "5";
three.classList.add(total === 15 ? "shown" : "still-hidden");
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\?\?/) && has(ctx.js, /\?\./)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's operators were `??` and `?.`." };
    },
  },

  {
    id: "js-7-if-switch",
    chapter: 4,
    number: 7,
    title: "The Gearbox",
    concept: "if / else and switch",
    edit: "js",
    learn: "Choose what code runs with if/else and switch — and remember switch's break.",
    objective: "The lift picks its height from a gear. Fix the if that chooses the gear, and the switch that falls through.",
    lesson: [
      "`if (condition) { … } else { … }` runs one block or the other. Chain more with `else if`. The first condition that's true wins, and the rest are skipped.",
      "Watch the edges: `power > 50` is **false** when power is exactly 50. If 50 should count, write `>=`.",
      "`switch (value)` compares one value against many `case`s using `===`, and jumps to the match.",
      "The famous trap: a `case` without `break` **falls through** into the next case and keeps running. That's almost never what you want, so every case normally ends with `break;`. `default:` runs when nothing matched.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "switch (day) {", note: "compare day with each case" },
        { code: "  case \"sat\": open = false; break;", note: "break: stop here" },
        { code: "  case \"mon\": open = true; break;", note: "" },
        { code: "  default: open = true;", note: "nothing matched" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "The `if` should pick `\"high\"` when power is 50 or more — change `>` to `>=`.",
      "In the `switch`, the `\"high\"` case has no `break`, so it falls into `default`. Add `break;`.",
      "Press **Run**, ride the lift up and cross.",
    ],
    reference: {
      title: "Choosing",
      syntax: "if (…) {…} else {…}    switch (x) { case …: …; break; }",
      entries: [
        { value: "> vs >=", meaning: "does the boundary value count?" },
        { value: "break;", meaning: "leave the switch after this case" },
        { value: "default:", meaning: "runs when no case matched" },
      ],
    },
    hints: [
      "The lift doesn't move. Log `gear` to the console — which gear was chosen?",
      "Power is exactly 50. Is `50 > 50` true? And once the right case runs, what happens straight after it?",
      "Two problems: the `if` boundary, and a missing `break` in `case \"high\"`.",
      "`>` excludes the boundary; `>=` includes it. Without `break`, a case keeps running into the next one — here, `default` puts the lift back down.",
      "Write `if (power >= 50)` and add `break;` after the high case's line. Press Run.",
    ],
    debrief: {
      rule: "if/else runs the first true branch. switch jumps to a matching case — end each case with break, or it falls through.",
      seenIn: "A game's settings menu: `switch (difficulty)` sets enemy speed for \"easy\", \"normal\" and \"hard\".",
      fableLine: "Pull the right lever — and let go of it.",
    },
    quiz: {
      question: "Without `break`, what happens after a matching case runs?",
      options: ["The switch ends", "It continues into the next case", "It restarts the switch", "An error is thrown"],
      answer: 1,
      explain: "Execution falls through into the following case(s) until a break or the end of the switch.",
    },
    ...liftL7,
    js: `const lift = document.querySelector(".lift");
const power = 50;

// 50 or more should choose the high gear.
let gear;
if (power > 50) {
  gear = "high";
} else {
  gear = "low";
}
console.log("gear:", gear);

// Each gear sets the lift's height.
switch (gear) {
  case "low":
    lift.style.bottom = "40px";
    break;
  case "high":
    lift.style.bottom = "200px";
  default:
    lift.style.bottom = "40px";
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /switch\s*\(/) && (ctx.js.match(/\bbreak\b/g) ?? []).length >= 2) return { gold: true };
      return { gold: false, note: "Solved — the lesson wanted the switch kept, with a `break` ending the high case." };
    },
  },

  {
    id: "js-8-loops",
    chapter: 4,
    number: 8,
    title: "In, Of, and Around Again",
    concept: "for, for...of, for...in, while",
    edit: "js",
    learn: "Repeat work with for, for...of, for...in and while — and pick the right one.",
    objective: "The loop should place a lily pad at each position, but it's using for...in and gets the wrong values. Fix the loop.",
    lesson: [
      "A **loop** repeats a block. The classic `for (let i = 0; i < 3; i++)` counts: start, keep going while true, step.",
      "**`for...of`** walks the **values** of an array (or string): `for (const x of [240, 420])` gives 240, then 420. It's the one you'll use most.",
      "**`for...in`** walks the **keys** of an object: `for (const key in { a: 1 })` gives `\"a\"`. On an array it gives the *indexes* as strings — `\"0\"`, `\"1\"` — which is rarely what you want.",
      "**`while (condition)`** repeats as long as the condition stays true — handy when you don't know how many turns you need. Make sure something inside changes the condition, or it never stops.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "for (const n of [5, 6]) …", note: "n = 5, then 6 (values)" },
        { code: "for (const i in [5, 6]) …", note: "i = \"0\", then \"1\" (keys!)" },
        { code: "for (const k in { x: 1 }) …", note: "k = \"x\" — for...in is for objects" },
        { code: "while (fuel > 0) { fuel--; }", note: "until the condition is false" },
      ],
    },
    steps: [
      "Open the **JS** tab and look at the `for` loop.",
      "Log `x` inside the loop to see what it really is.",
      "Change `for (const x in positions)` to `for (const x of positions)`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Loops",
      syntax: "for (const value of array) { … }",
      entries: [
        { value: "for (let i = 0; i < n; i++)", meaning: "count" },
        { value: "for (const v of array)", meaning: "each value" },
        { value: "for (const k in object)", meaning: "each key (not for arrays)" },
      ],
    },
    hints: [
      "Pads were made — but they're all piled up at the far left, under the start.",
      "What values does `x` take inside the loop? Log it.",
      "`x` is `\"0\"`, `\"1\"`, `\"2\"` — the indexes — so each pad goes to left 0px, 1px, 2px.",
      "`for...in` gives keys; on an array those are indexes. `for...of` gives the values themselves: 240, 420, 600.",
      "Change `in` to `of` in the loop line and press Run.",
    ],
    debrief: {
      rule: "for...of for array values, for...in for object keys, a counting for when you need the index, while when you don't know how many turns.",
      seenIn: "`for (const product of cart)` adds up a basket; `for (const key in settings)` lists every setting.",
      fableLine: "Walk the stones, not the numbers painted on them.",
    },
    quiz: {
      question: "What does `for (const c of \"hi\")` give c?",
      options: ["0, 1", "\"h\", \"i\"", "\"hi\" once", "nothing"],
      answer: 1,
      explain: "for...of walks the values of a string: each character in turn.",
    },
    ...stonesL8,
    js: `// Where each lily pad should go.
const positions = [240, 420, 600];

for (const x in positions) {
  const lily = document.createElement("div");
  lily.className = "lily";
  lily.style.left = x + "px";
  document.body.append(lily);
}

// A while loop, just to see it count:
let countdown = 3;
while (countdown > 0) {
  console.log("pads left to check:", countdown);
  countdown--;
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /for\s*\(\s*const\s+\w+\s+of\s+positions/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fix was `for...of`." };
    },
  },

  {
    id: "js-9-break-continue",
    chapter: 4,
    number: 9,
    title: "Skip It, Don't Stop",
    concept: "break and continue",
    edit: "js",
    learn: "Leave a loop early with break, or skip just one turn with continue.",
    objective: "The plan has gaps marked in it. The loop gives up at the first gap instead of skipping it — fix it so all the crates get placed.",
    lesson: [
      "Inside a loop, **`break`** leaves the loop immediately. Nothing more in it runs — not this turn, not any later turn.",
      "**`continue`** skips the rest of *this turn only*, then carries on with the next one.",
      "Use `break` when you've found what you were looking for (no need to keep searching). Use `continue` to skip items you don't care about.",
      "Mixing them up is a classic bug: a `break` meant as a `continue` silently throws away everything after the first skipped item.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "for (const n of [1, 2, 3, 4]) {", note: "" },
        { code: "  if (n === 2) continue;", note: "skip 2, keep going" },
        { code: "  if (n === 4) break;", note: "stop entirely at 4" },
        { code: "  console.log(n);", note: "logs 1, 3" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Find `if (x === \"gap\") break;`.",
      "Change `break` to `continue`, so a gap is skipped rather than ending the loop.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Leaving loops",
      syntax: "break;   continue;",
      entries: [
        { value: "break", meaning: "stop the whole loop now" },
        { value: "continue", meaning: "skip to the next turn" },
        { value: "return", meaning: "(inside a function) leave the function" },
      ],
    },
    hints: [
      "Only the first crate is placed. The loop stops early.",
      "What does the loop do when it meets the first `\"gap\"`?",
      "`break` ends the loop, so everything after the first gap is never placed.",
      "`continue` skips just the current turn; `break` abandons the loop. You want to skip gaps, not stop at them.",
      "Change `break;` to `continue;` and press Run.",
    ],
    debrief: {
      rule: "`break` ends the loop. `continue` skips to the next turn.",
      seenIn: "Searching a list: `break` once you find the match. Rendering a feed: `continue` past hidden posts.",
      fableLine: "Step over the hole. Don't sit down beside it.",
    },
    quiz: {
      question: "`for (const n of [1, 2, 3]) { if (n === 2) break; console.log(n); }` logs…",
      options: ["1", "1, 3", "1, 2, 3", "nothing"],
      answer: 0,
      explain: "At 2 the loop breaks, so only 1 was logged.",
    },
    ...stonesL9,
    js: `// The plan: numbers are crate positions, "gap" means skip a spot.
const plan = [240, "gap", 420, "gap", 600];

for (const x of plan) {
  if (x === "gap") break;

  const crate = document.createElement("div");
  crate.className = "crate";
  crate.style.left = x + "px";
  document.body.append(crate);
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\bcontinue\b/) && !has(ctx.js, /\bbreak\b/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fix was `continue`." };
    },
  },

  {
    id: "js-10-declarations-hoisting",
    chapter: 4,
    number: 10,
    title: "Called Too Soon",
    concept: "function declarations vs expressions, hoisting",
    edit: "js",
    learn: "Tell function declarations from function expressions, and understand hoisting.",
    objective: "The code calls measure before it's defined, and measure is a function expression. Make it work.",
    lesson: [
      "A **function** is a reusable set of instructions. You can write one two ways.",
      "A **declaration**: `function measure(planks) { return planks * 50; }`. An **expression**: `const measure = function (planks) { … };` — a function value stored in a variable.",
      "The big difference is **hoisting**. Before running, JavaScript sets up every function *declaration* in the whole scope, so you can call it on a line *above* where it's written.",
      "`let` and `const` names are hoisted too, but left uninitialised until their line runs (the *temporal dead zone*). Use one earlier and you get `Cannot access 'measure' before initialization`. (Old `var` is hoisted as `undefined`, which gives the even more confusing `measure is not a function`.)",
      "Either fix is fine: turn it into a declaration, or move the call below the definition.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "greet();", note: "works: declarations are hoisted" },
        { code: "function greet() { … }", note: "declaration" },
        { code: "wave();", note: "ReferenceError: before initialization" },
        { code: "const wave = function () { … };", note: "expression" },
      ],
    },
    steps: [
      "Open the **JS** tab and press **Run** — read the error.",
      "Turn `const measure = function (planks) { … };` into a declaration: `function measure(planks) { … }`.",
      "(Or move the line that calls `measure` below the function.)",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Declarations vs expressions",
      syntax: "function name() {}   const name = function () {};",
      entries: [
        { value: "function f() {}", meaning: "declaration — hoisted, callable anywhere" },
        { value: "const f = function () {}", meaning: "expression — use only after its line" },
        { value: "hoisting", meaning: "declarations are set up before code runs" },
      ],
    },
    hints: [
      "No span, and an error mentioning `measure` and “initialization”.",
      "Where is `measure` called, and where is it created? Which comes first?",
      "It's called on the line that sets the width — above `const measure = function …`.",
      "Function declarations are hoisted so they work anywhere; a `const` holding a function doesn't exist until its line runs.",
      "Replace `const measure = function (planks) {` with `function measure(planks) {` and delete the `;` after its closing `}`. Press Run.",
    ],
    debrief: {
      rule: "Function declarations are hoisted and can be called before their line. Functions stored in const/let can't be used until they're defined.",
      seenIn: "Many files put small helper declarations at the bottom and the main code on top — hoisting is what makes that work.",
      fableLine: "Call a name before it's spoken, and only some answer.",
    },
    quiz: {
      question: "Which can be called on a line above where it's written?",
      options: ["const f = () => {}", "let f = function () {}", "function f() {}", "none of them"],
      answer: 2,
      explain: "Only function declarations are hoisted with their body.",
    },
    ...bridgeL10,
    js: `const span = document.querySelector(".span");

// Measure 12 planks and set the width.
span.style.width = measure(12) + "px";

// Each plank is 50px wide.
const measure = function (planks) {
  return planks * 50;
};
`,
    rubric: (ctx) => {
      if (has(ctx.js, /function\s+measure\s*\(/) || ctx.js.indexOf("measure(12)") > ctx.js.indexOf("const measure")) return { gold: true };
      return { gold: false };
    },
  },
];
