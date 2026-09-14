import type { Level } from "../levels";
import { LOOKS, bridgeWorld, has, hiddenStonesWorld, stairsWorld, stonesWorld } from "./kit";

/* Chapter 4, part 3: more arrays, objects, JSON — and the first step into the DOM. */

const place = (cls: string) => `function place(x) {
  const el = document.createElement("div");
  el.className = "${cls}";
  el.style.left = x + "px";
  document.body.append(el);
}`;

export const DATA: Level[] = [
  {
    id: "js-21-find-some-every",
    chapter: 4,
    number: 21,
    title: "The Right Buoy",
    concept: "find, findIndex, some, every, includes",
    edit: "js",
    learn: "Search arrays with find and findIndex, and ask yes/no questions with some, every and includes.",
    objective: "Three buoys, three searches using the wrong tool. Fix them so each buoy appears.",
    lesson: [
      "**`find(callback)`** returns the **first item** where the callback is true — the item itself, or `undefined` if none match. (`filter` returns an *array*, even for one match.)",
      "**`findIndex(callback)`** returns that item's **position**, or `-1` if there isn't one.",
      "**`some(callback)`** answers *is at least one true?* and **`every(callback)`** answers *are all of them true?* — both give a boolean.",
      "**`includes(value)`** answers *is this exact value in the array?* It compares with `===`, so `\"Three\"` and `\"three\"` are different.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const users = [{ n: \"a\", admin: true }, { n: \"b\" }];", note: "" },
        { code: "users.find(u => u.n === \"b\")   // { n: \"b\" }", note: "the item" },
        { code: "users.findIndex(u => u.admin)  // 0", note: "its index" },
        { code: "users.some(u => u.admin)       // true", note: "any?" },
        { code: "users.every(u => u.admin)      // false", note: "all?" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "Buoy one: `filter` gives an array — use `find` to get the single buoy.",
      "Buoy two: at least one buoy must be ready, not every buoy — use `some`.",
      "Buoy three: `includes` is exact — fix the capital letter. Press **Run** and cross.",
    ],
    reference: {
      title: "Searching arrays",
      syntax: "array.find(item => condition)",
      entries: [
        { value: "find / findIndex", meaning: "first matching item / its index (-1 if none)" },
        { value: "some / every", meaning: "at least one true / all true" },
        { value: "includes(v)", meaning: "is v in the array (=== comparison)" },
      ],
    },
    hints: [
      "No buoys, and an error about `null`. Start with buoy one.",
      "What does `buoys.filter(...)` return? Does an array have an `id`?",
      "`filter` returns an array, `every` needs all three to be ready, and `\"Three\"` isn't in the list of names.",
      "`find` returns the matching item itself. `some` is true if any item passes. `includes` compares exactly, capitals included.",
      "Use `buoys.find(...)`, `buoys.some(b => b.ready)` and `names.includes(\"three\")`. Press Run.",
    ],
    debrief: {
      rule: "find/findIndex locate one item; some/every answer any/all; includes checks for an exact value.",
      seenIn: "`cart.some(i => i.outOfStock)` decides whether to show a warning before checkout.",
      fableLine: "Ask for the one you need, not the whole harbour.",
    },
    quiz: {
      question: "What does `[1, 2, 3].find(n => n > 5)` return?",
      options: ["[]", "-1", "undefined", "false"],
      answer: 2,
      explain: "find returns undefined when nothing matches. (findIndex would return -1.)",
    },
    ...hiddenStonesWorld(LOOKS.coral, "buoy"),
    js: `const buoys = [
  { id: "one", ready: true },
  { id: "two", ready: true },
  { id: "three", ready: false },
];

// Buoy one: get the buoy whose id is "one".
const first = buoys.filter((b) => b.id === "one");
document.querySelector("#" + first.id).classList.add("shown");

// Buoy two: show it if at least one buoy is ready.
if (buoys.every((b) => b.ready)) {
  document.querySelector("#two").classList.add("shown");
}

// Buoy three: show it if "three" is one of the names.
const names = buoys.map((b) => b.id);
if (names.includes("Three")) {
  document.querySelector("#three").classList.add("shown");
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\.find\s*\(/) && has(ctx.js, /\.some\s*\(/) && has(ctx.js, /includes\s*\(\s*["']three["']/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's tools were find, some and includes." };
    },
  },

  {
    id: "js-22-sort",
    chapter: 4,
    number: 22,
    title: "Alphabetical Numbers",
    concept: "sort and its gotchas",
    edit: "js",
    learn: "Sort arrays correctly — numbers need a compare function, and sort changes the original.",
    objective: "The pillars should rise from shortest to tallest, but sort() puts 45 and 90 last. Give sort a compare function.",
    lesson: [
      "`array.sort()` with no argument converts every item to **text** and sorts alphabetically. For words that's fine. For numbers it's a trap: `\"100\"` comes before `\"50\"` because `\"1\"` comes before `\"5\"`. So `[150, 50, 300, 100].sort()` gives `[100, 150, 300, 50]`.",
      "To sort numbers, pass a **compare function**: `sort((a, b) => a - b)`. A negative result puts `a` first, positive puts `b` first. `(a, b) => b - a` sorts descending.",
      "Second gotcha: **`sort` changes the array in place** (and returns the same array). If you need to keep the original order, sort a copy — `[...heights].sort(…)` — or use the newer `toSorted()`, which returns a new array.",
      "For text with accents or mixed case, `a.localeCompare(b)` is the reliable compare function.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "[10, 9, 1].sort()             // [1, 10, 9]", note: "text order!" },
        { code: "[10, 9, 1].sort((a, b) => a - b) // [1, 9, 10]", note: "numeric" },
        { code: "names.sort((a, b) => a.localeCompare(b))", note: "text, properly" },
        { code: "const sorted = [...list].sort(fn);", note: "keep the original" },
      ],
    },
    steps: [
      "Open the **JS** tab and log `heights` after sorting.",
      "Change `.sort()` to `.sort((a, b) => a - b)`.",
      "Press **Run** and climb.",
    ],
    reference: {
      title: "Sorting",
      syntax: "array.sort((a, b) => a - b)",
      entries: [
        { value: "sort()", meaning: "sorts as text — wrong for numbers" },
        { value: "(a, b) => a - b", meaning: "ascending numbers" },
        { value: "toSorted / [...a].sort", meaning: "a sorted copy; original untouched" },
      ],
    },
    hints: [
      "The very first pillar is far too tall to climb onto, and the short ones ended up at the end.",
      "Log `heights` after the sort. Is it really in order?",
      "It's `[135, 180, 225, 270, 45, 90]` — 45 and 90 went last.",
      "sort() compares text, so \"45\" sorts after \"270\". A compare function `(a, b) => a - b` compares them as numbers.",
      "Change the line to `heights.sort((a, b) => a - b);` and press Run.",
    ],
    debrief: {
      rule: "Plain sort() sorts as text. For numbers use `(a, b) => a - b`. sort changes the array — copy first if you need the original.",
      seenIn: "A “sort by price” button that puts $100 before $9 is the missing compare function.",
      fableLine: "Fifty is smaller than three hundred — unless you only read the first digit.",
    },
    quiz: {
      question: "What does `[2, 10, 1].sort()` return?",
      options: ["[1, 2, 10]", "[1, 10, 2]", "[10, 2, 1]", "[2, 10, 1]"],
      answer: 1,
      explain: "As text, \"1\" < \"10\" < \"2\", so the result is [1, 10, 2].",
    },
    ...stairsWorld(LOOKS.ice, "pillar"),
    js: `const stairs = document.querySelector(".stairs");

// Pillar heights, in no particular order.
const heights = [135, 45, 270, 90, 225, 180];

// Shortest first, so they rise like stairs.
heights.sort();
console.log("sorted:", heights);

for (const h of heights) {
  const pillar = document.createElement("div");
  pillar.className = "pillar";
  pillar.style.height = h + "px";
  stairs.append(pillar);
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /sort\s*\(\s*\(\s*a\s*,\s*b\s*\)\s*=>\s*a\s*-\s*b\s*\)/) || has(ctx.js, /toSorted\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fix was `sort((a, b) => a - b)`." };
    },
  },

  {
    id: "js-23-spread-immutability",
    chapter: 4,
    number: 23,
    title: "Copy, Don't Carve",
    concept: "spread, array destructuring, immutability",
    edit: "js",
    learn: "Unpack arrays with destructuring, copy them with spread, and avoid mutating data you don't own.",
    objective: "withoutLast makes a preview — but it pops the last stone off the real path. Make it work on a copy.",
    lesson: [
      "**Array destructuring** unpacks items into variables by position: `const [a, b, c] = path;` gives `a = path[0]`, `b = path[1]`, `c = path[2]`. You can skip with commas (`const [, second] = path`) and set defaults (`const [x = 0] = empty`).",
      "The **spread** syntax `...` expands an array into its items: `[...path]` is a new array with the same items; `[...a, ...b]` joins two arrays; `Math.max(...nums)` passes each number as an argument.",
      "**Immutability** means not changing data in place. Methods like `push`, `pop`, `splice` and `sort` **mutate** — and because arrays are shared by reference, a function that mutates its argument changes the caller's array too.",
      "The safe habit: inside a function, copy before changing (`const copy = [...list]`) or use non-mutating methods (`slice`, `map`, `filter`, `concat`, `toSorted`) that return new arrays.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const [first, ...others] = [1, 2, 3];", note: "first = 1, others = [2, 3]" },
        { code: "const copy = [...original];", note: "a new array" },
        { code: "const more = [...original, 4];", note: "add without mutating" },
        { code: "original.push(4);", note: "mutates: everyone sharing it sees 4" },
      ],
    },
    steps: [
      "Log `path` after the preview is made — one stone has gone.",
      "Inside `withoutLast`, make a copy first: `const copy = [...list];`.",
      "Pop from `copy` and return `copy` instead of `list`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Spread and destructuring",
      syntax: "const [a, b] = arr;   const copy = [...arr];",
      entries: [
        { value: "[a, b] = arr", meaning: "unpack by position" },
        { value: "[...arr]", meaning: "shallow copy" },
        { value: "push/pop/splice/sort", meaning: "mutate — copy first" },
      ],
    },
    hints: [
      "Two stones appear; the one at 600 is missing.",
      "Log `path` before and after `withoutLast(path)`. Did it change?",
      "`withoutLast` calls `list.pop()`, and `list` *is* `path` — the same array.",
      "Mutating methods change the array you pass in. Make a copy with spread, change the copy, and return it.",
      "Write `function withoutLast(list) { const copy = [...list]; copy.pop(); return copy; }` and press Run.",
    ],
    debrief: {
      rule: "Destructure to unpack, spread to copy or combine. Don't mutate arrays you were handed — change a copy.",
      seenIn: "React and most state libraries require immutable updates: `setItems([...items, newItem])`.",
      fableLine: "Draw the preview on a fresh page.",
    },
    quiz: {
      question: "`const [a, , c] = [1, 2, 3];` — what is c?",
      options: ["2", "3", "undefined", "[3]"],
      answer: 1,
      explain: "The empty slot skips index 1, so c takes index 2, which is 3.",
    },
    ...stonesWorld(LOOKS.mint, "stone"),
    js: `${place("stone")}

const path = [240, 420, 600];

// Make a preview of the path without its last stone.
function withoutLast(list) {
  list.pop();
  return list;
}
const preview = withoutLast(path);
console.log("preview:", preview);

// Unpack the real path into three positions.
const [a, b, c] = path;
[a, b, c].forEach(place);
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\[\s*\.\.\.\s*list\s*\]|list\.slice\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson made withoutLast work on a copy." };
    },
  },

  {
    id: "js-24-properties-methods",
    chapter: 4,
    number: 24,
    title: "Dot or Bracket",
    concept: "properties, dot vs bracket, methods",
    edit: "js",
    learn: "Read and write object properties with dot and bracket notation, and give objects methods.",
    objective: "The plan stores the name of the property to use in a variable — but the code reads it with a dot. Use brackets.",
    lesson: [
      "An **object** groups named values called **properties**: `const plan = { plankWidth: 50 }`.",
      "**Dot notation** `plan.plankWidth` uses the name exactly as written. **Bracket notation** `plan[\"plankWidth\"]` takes a *string* — which means it can take a **variable**: `plan[field]` reads whatever property `field` names. Brackets are also required for names with spaces or dashes: `plan[\"plank count\"]`.",
      "The trap: `plan.field` looks for a property literally called `field`, not the one the variable holds — and gives `undefined`.",
      "A **method** is a function stored as a property. The shorthand `total() { … }` is the same as `total: function () { … }`. Inside, `this` is the object, so `this.plankWidth` works.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const user = { name: \"Ada\", \"fav color\": \"teal\" };", note: "" },
        { code: "user.name              // \"Ada\"", note: "dot" },
        { code: "user[\"fav color\"]      // \"teal\"", note: "brackets for odd names" },
        { code: "const key = \"name\"; user[key] // \"Ada\"", note: "brackets for variables" },
        { code: "const o = { hi() { return \"hi\"; } };", note: "method shorthand" },
      ],
    },
    steps: [
      "Open the **JS** tab and log `plan.field`.",
      "Change `this.field` inside the method to `this[field]`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Properties",
      syntax: "obj.name   obj[\"name\"]   obj[variable]",
      entries: [
        { value: "obj.name", meaning: "a fixed property name" },
        { value: "obj[expr]", meaning: "the property named by a string or variable" },
        { value: "method() {}", meaning: "shorthand for method: function () {}" },
      ],
    },
    hints: [
      "The plank is missing. Log `plan.total()` — it's `NaN`.",
      "Inside `total`, what does `this.field` look up?",
      "It looks for a property literally named \"field\", which doesn't exist, so it's undefined.",
      "Dot notation uses the written name. Bracket notation evaluates what's inside — so `this[field]` reads the property named by the variable.",
      "Change `this.field` to `this[field]` and press Run.",
    ],
    debrief: {
      rule: "Dot for fixed names, brackets for variables and unusual names. Methods are functions on objects; `this` is the object.",
      seenIn: "Sorting a table by whichever column was clicked: `rows.sort((a, b) => a[column] - b[column])`.",
      fableLine: "Name the drawer — or hand over the note that names it.",
    },
    quiz: {
      question: "`const k = \"age\"; const p = { age: 30 };` — which gives 30?",
      options: ["p.k", "p[k]", "p.\"age\"", "p[age]"],
      answer: 1,
      explain: "p[k] evaluates k to \"age\" and reads that property.",
    },
    ...bridgeWorld(LOOKS.sand, "plank"),
    js: `const plank = document.querySelector(".plank");

// Which property holds the width of one plank.
const field = "plankWidth";

const plan = {
  "plank count": 12,
  plankWidth: 50,
  total() {
    return this["plank count"] * this.field;
  },
};

console.log("total:", plan.total());
plank.style.width = plan.total() + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /this\s*\[\s*field\s*\]/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fix was bracket notation, `this[field]`." };
    },
  },

  {
    id: "js-25-object-destructuring",
    chapter: 4,
    number: 25,
    title: "Unpack With New Names",
    concept: "object destructuring, renaming, defaults",
    edit: "js",
    learn: "Pull properties out of objects with destructuring — renaming them and giving defaults.",
    objective: "The config uses different names than the code expects, and one value is missing. Rename two and give the third a default.",
    lesson: [
      "**Object destructuring** unpacks properties into variables **by name**: `const { start } = config;` is `const start = config.start;`.",
      "A name that isn't in the object gives `undefined`. So `const { first } = config` is undefined when the property is really called `start`.",
      "**Rename** with a colon: `const { start: first } = config;` reads `config.start` into a variable called `first`. It works for awkward names too: `const { \"middle-id\": middle } = config;`.",
      "**Default** with `=`: `const { last = \"#three\" } = config;` uses `\"#three\"` when `config.last` is undefined. You can combine both: `const { end: last = \"#three\" } = config;`.",
      "It's everywhere in function parameters: `function draw({ width, height = 10 }) { … }`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const user = { name: \"Ada\", \"user-id\": 7 };", note: "" },
        { code: "const { name } = user;", note: "name = \"Ada\"" },
        { code: "const { \"user-id\": id } = user;", note: "rename: id = 7" },
        { code: "const { role = \"guest\" } = user;", note: "default: \"guest\"" },
      ],
    },
    steps: [
      "Press **Run** — `first` is undefined.",
      "Rename: `start: first` and `\"middle-id\": middle`.",
      "Default: `last = \"#three\"`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Destructuring objects",
      syntax: "const { prop: newName = fallback } = obj;",
      entries: [
        { value: "{ a }", meaning: "variable a from obj.a" },
        { value: "{ a: b }", meaning: "variable b from obj.a" },
        { value: "{ a = 1 }", meaning: "1 if obj.a is undefined" },
      ],
    },
    hints: [
      "No leaves, and an error about `null`. Log `first`, `middle` and `last`.",
      "All three are undefined. What are the property names in `config`?",
      "`config` has `start` and `\"middle-id\"`, and no last at all.",
      "Destructuring matches by property name. Use `name: newName` to rename, and `name = value` for a default.",
      "Write `const { start: first, \"middle-id\": middle, last = \"#three\" } = config;` and press Run.",
    ],
    debrief: {
      rule: "`const { a: b = d } = obj` reads obj.a into b, using d if it's missing.",
      seenIn: "`const { data, error = null } = await response.json();` — unpacking API results in one line.",
      fableLine: "Call it by its name — or give it a new one.",
    },
    quiz: {
      question: "`const { size: s = 5 } = { size: 0 };` — what is s?",
      options: ["5", "0", "undefined", "an error"],
      answer: 1,
      explain: "Defaults only apply to undefined. size is 0, so s is 0.",
    },
    ...hiddenStonesWorld(LOOKS.lime, "leaf"),
    js: `// The settings, as another file wrote them.
const config = {
  start: "#one",
  "middle-id": "#two",
};

// Unpack them into the names this code uses.
const { first, middle, last } = config;

document.querySelector(first).classList.add("shown");
document.querySelector(middle).classList.add("shown");
document.querySelector(last).classList.add("shown");
`,
    rubric: (ctx) => {
      if (has(ctx.js, /start\s*:\s*first/) && has(ctx.js, /["']middle-id["']\s*:\s*middle/) && has(ctx.js, /last\s*=\s*["']#three["']/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson renamed start and middle-id, and gave last a default, all in one destructuring." };
    },
  },

  {
    id: "js-26-copying-objects",
    chapter: 4,
    number: 26,
    title: "The Shallow Copy",
    concept: "spread, Object.assign, shallow vs deep copy",
    edit: "js",
    learn: "Copy objects with spread and Object.assign — and know that both are shallow.",
    objective: "The draft is a spread copy of the blueprint, but editing the draft's size still shrinks the real girder. Make a deep copy.",
    lesson: [
      "Spread copies an object: `const draft = { ...blueprint };`. So does `Object.assign({}, blueprint)`. Both also merge: `{ ...defaults, ...overrides }` takes the later value for any repeated key.",
      "But both are **shallow**: they copy the top-level properties. If a property holds *another object* (`size: { width: 600 }`), the copy gets a reference to **the same inner object**.",
      "So `draft.size.width = 100` reaches straight into the blueprint's `size`. The outer objects are different; the inner one is shared.",
      "A **deep copy** copies every level. Modern browsers have **`structuredClone(obj)`**. You can also spread each level you'll change: `{ ...blueprint, size: { ...blueprint.size } }`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const a = { x: 1, inner: { y: 2 } };", note: "" },
        { code: "const b = { ...a };", note: "shallow" },
        { code: "b.x = 9;       // a.x still 1", note: "top level: separate" },
        { code: "b.inner.y = 9; // a.inner.y is 9 too!", note: "nested: shared" },
        { code: "const c = structuredClone(a);", note: "deep: nothing shared" },
      ],
    },
    steps: [
      "Log `blueprint.size.width` after the draft is edited.",
      "Replace `{ ...blueprint }` with `structuredClone(blueprint)`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Copying objects",
      syntax: "{ ...obj }   Object.assign({}, obj)   structuredClone(obj)",
      entries: [
        { value: "{ ...a, ...b }", meaning: "shallow copy + merge (b wins)" },
        { value: "Object.assign(target, a)", meaning: "copies a's properties onto target" },
        { value: "structuredClone(a)", meaning: "deep copy" },
      ],
    },
    hints: [
      "The girder came out 100px, though the blueprint says 600.",
      "The draft is a copy — so how can changing `draft.size.width` change the blueprint?",
      "`{ ...blueprint }` copies the top level only; `size` is still the same object in both.",
      "Spread and Object.assign are shallow. Nested objects stay shared unless you copy them too — or use `structuredClone`.",
      "Change the draft line to `const draft = structuredClone(blueprint);` and press Run.",
    ],
    debrief: {
      rule: "Spread and Object.assign copy one level. Nested objects are shared until you copy them — structuredClone copies everything.",
      seenIn: "Settings screens copy the saved settings into a draft; a shallow copy makes “Cancel” not actually cancel nested changes.",
      fableLine: "Copy the drawer, and the drawers inside it.",
    },
    quiz: {
      question: "`const b = { ...a };` — which change to b also changes a?",
      options: ["b.name = \"x\"", "b.tags.push(\"x\")", "b.count = 2", "delete b.name"],
      answer: 1,
      explain: "tags is a nested array shared by both objects, so pushing into it affects a too.",
    },
    ...bridgeWorld(LOOKS.slate, "girder"),
    js: `const girder = document.querySelector(".girder");

const blueprint = {
  name: "main girder",
  size: { width: 600 },
};

// A draft to experiment on.
const draft = { ...blueprint };
draft.name = "small test";
draft.size.width = 100;

girder.style.width = blueprint.size.width + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /structuredClone\s*\(|size\s*:\s*\{\s*\.\.\.\s*blueprint\.size/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson made a deep copy with structuredClone (or by copying size too)." };
    },
  },

  {
    id: "js-27-keys-values-entries",
    chapter: 4,
    number: 27,
    title: "The Gem Ledger",
    concept: "Object.keys, values, entries",
    edit: "js",
    learn: "Loop over an object with Object.keys, Object.values and Object.entries.",
    objective: "The loop places a gem for every item in the ledger — but it's reading the names instead of the positions. Use the values.",
    lesson: [
      "Objects aren't arrays, so you can't `for...of` them directly. Three helpers turn an object into an array you can loop over:",
      "**`Object.keys(obj)`** — the property **names**: `[\"ruby\", \"jade\", \"opal\"]`.",
      "**`Object.values(obj)`** — the **values**: `[240, 420, 600]`.",
      "**`Object.entries(obj)`** — **[name, value] pairs**: `[[\"ruby\", 240], …]`. Perfect with destructuring: `for (const [name, x] of Object.entries(gems))`.",
      "All three return real arrays, so `map`, `filter` and `reduce` work on them too.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const stock = { apples: 3, pears: 0 };", note: "" },
        { code: "Object.keys(stock)    // [\"apples\", \"pears\"]", note: "names" },
        { code: "Object.values(stock)  // [3, 0]", note: "values" },
        { code: "for (const [fruit, n] of Object.entries(stock)) …", note: "both" },
      ],
    },
    steps: [
      "Log `Object.keys(gems)` to see what the loop is getting.",
      "Change `Object.keys` to `Object.values`.",
      "(Or use `Object.entries` and destructure `[name, x]`.) Press **Run** and cross.",
    ],
    reference: {
      title: "Looping objects",
      syntax: "Object.keys(o)  Object.values(o)  Object.entries(o)",
      entries: [
        { value: "keys", meaning: "array of property names" },
        { value: "values", meaning: "array of values" },
        { value: "entries", meaning: "array of [name, value] pairs" },
      ],
    },
    hints: [
      "Three gems are made, but they're stacked up at the far left.",
      "Log `x` inside the loop. Is it a position?",
      "It's `\"ruby\"`, `\"jade\"`, `\"opal\"` — the names, which aren't valid positions.",
      "`Object.keys` gives names; `Object.values` gives the values; `Object.entries` gives both.",
      "Change `Object.keys(gems)` to `Object.values(gems)` and press Run.",
    ],
    debrief: {
      rule: "Object.keys → names, Object.values → values, Object.entries → [name, value] pairs. All are arrays.",
      seenIn: "Rendering a settings form from an object: `Object.entries(settings).map(([key, value]) => …)`.",
      fableLine: "Read the numbers in the ledger, not the labels.",
    },
    quiz: {
      question: "`Object.entries({ a: 1 })` returns…",
      options: ["[\"a\", 1]", "[[\"a\", 1]]", "{ a: 1 }", "[\"a\"]"],
      answer: 1,
      explain: "An array of pairs, each pair itself an array: [[\"a\", 1]].",
    },
    ...stonesWorld(LOOKS.plum, "gem"),
    js: `${place("gem")}

// Each gem's name, and where it goes.
const gems = { ruby: 240, jade: 420, opal: 600 };

for (const x of Object.keys(gems)) {
  place(x);
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /Object\.(values|entries)\s*\(\s*gems/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson used Object.values or Object.entries." };
    },
  },

  {
    id: "js-28-optional-chaining",
    chapter: 4,
    number: 28,
    title: "Missing Pieces",
    concept: "optional chaining on nested data",
    edit: "js",
    learn: "Read deeply nested data safely with ?. and fall back with ??.",
    objective: "The trip data has holes — no weather report, and only two stops. Read it safely so the missing parts don't crash the code.",
    lesson: [
      "Real data — especially from a server — is often **incomplete**. Reading `trip.weather.wind.speed` when `weather` is `null` throws *Cannot read properties of null* and stops everything after it.",
      "**Optional chaining** `?.` checks each step: `trip.weather?.wind?.speed` stops and gives `undefined` as soon as something is null or undefined.",
      "It works with array indexes and calls too: `stops[2]?.id`, `user.greet?.()`.",
      "Pair it with **`??`** for a fallback value: `trip.weather?.wind?.speed ?? 0`.",
      "Don't sprinkle `?.` everywhere, though. Use it where data may legitimately be missing; if something *must* exist, a loud error is more useful than a silent `undefined`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const user = { profile: null };", note: "" },
        { code: "user.profile.name          // TypeError", note: "crash" },
        { code: "user.profile?.name         // undefined", note: "safe" },
        { code: "user.profile?.name ?? \"Anon\" // \"Anon\"", note: "safe + fallback" },
        { code: "list[5]?.title             // undefined", note: "missing index" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "Make the wind read safe: `trip.weather?.wind?.speed`.",
      "Make the third stop read safe: `trip.route.stops[2]?.id`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Optional chaining",
      syntax: "a?.b   a?.[key]   a?.()",
      entries: [
        { value: "a?.b", meaning: "undefined if a is null/undefined" },
        { value: "arr[i]?.x", meaning: "safe when the index doesn't exist" },
        { value: "?. with ??", meaning: "read safely, then provide a fallback" },
      ],
    },
    hints: [
      "Only the first sign appears, then an error about reading `wind` of null.",
      "`trip.weather` is null. What happens when you ask null for `.wind`?",
      "Two reads crash: `trip.weather.wind.speed`, and `trip.route.stops[2].id` (there are only two stops).",
      "`?.` stops at null/undefined and gives undefined instead of throwing. The existing `??` fallbacks then do the rest.",
      "Use `trip.weather?.wind?.speed` and `trip.route.stops[2]?.id`. Press Run.",
    ],
    debrief: {
      rule: "`?.` reads nested data safely, giving undefined at the first missing link. Add `??` for a fallback.",
      seenIn: "`order.shipping?.tracking?.url` — only some orders have tracking yet.",
      fableLine: "Step carefully where the map has holes.",
    },
    quiz: {
      question: "`const a = {}; a.b?.c.d` gives…",
      options: ["an error", "undefined", "null", "{}"],
      answer: 1,
      explain: "a.b is undefined, so ?. short-circuits the whole rest of the chain to undefined.",
    },
    ...hiddenStonesWorld(LOOKS.sand, "sign"),
    js: `// The trip data, as it arrived from a server.
const trip = {
  route: { stops: [{ id: "#one" }, { id: "#two" }] },
  weather: null,
};

// Sign one: the first stop.
document.querySelector(trip.route.stops[0].id).classList.add("shown");

// Sign two: shown when the wind is calm (no report counts as calm).
const wind = trip.weather.wind.speed ?? 0;
if (wind < 10) {
  document.querySelector(trip.route.stops[1].id).classList.add("shown");
}

// Sign three: the third stop, or "#three" if there isn't one.
const third = trip.route.stops[2].id ?? "#three";
document.querySelector(third).classList.add("shown");
`,
    rubric: (ctx) => {
      if (has(ctx.js, /weather\?\.\s*wind\?\./) && has(ctx.js, /stops\[\s*2\s*\]\?\./)) return { gold: true };
      return { gold: false, note: "Solved — the lesson used ?. on both missing pieces." };
    },
  },

  {
    id: "js-29-json",
    chapter: 4,
    number: 29,
    title: "Written Down, Read Back",
    concept: "JSON.parse and JSON.stringify",
    edit: "js",
    learn: "Turn data into JSON text with JSON.stringify, and back into objects with JSON.parse.",
    objective: "The saved plan is JSON text — but it's written with the wrong quotes, and the code never parses it. Fix both.",
    lesson: [
      "**JSON** (JavaScript Object Notation) is a text format for data. Servers send it, storage saves it, config files use it. It looks like a JavaScript object, but it's just a **string**.",
      "**`JSON.stringify(value)`** turns an object or array into JSON text. **`JSON.parse(text)`** turns JSON text back into a real object you can read properties from.",
      "A string isn't an object: `'{\"width\": 600}'.width` is `undefined`. You must parse first.",
      "JSON is stricter than JavaScript: property names and strings need **double quotes**, and there are no trailing commas, comments, functions or `undefined`. `{'width': 600}` with single quotes is *not* valid JSON, and `JSON.parse` throws a SyntaxError.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const text = JSON.stringify({ a: 1 });", note: "'{\"a\":1}'" },
        { code: "const obj = JSON.parse(text);", note: "{ a: 1 }" },
        { code: "obj.a  // 1", note: "now it's an object" },
        { code: "JSON.parse(\"{'a': 1}\")", note: "SyntaxError: single quotes" },
      ],
    },
    steps: [
      "Change the saved text to use double quotes inside: `'{\"width\": 600}'`.",
      "Parse it: `const plan = JSON.parse(saved);`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "JSON",
      syntax: "JSON.stringify(value)   JSON.parse(text)",
      entries: [
        { value: "stringify", meaning: "object → JSON text" },
        { value: "parse", meaning: "JSON text → object" },
        { value: "rules", meaning: "double quotes, no trailing commas, no functions" },
      ],
    },
    hints: [
      "The cable is missing. Log `plan.width`.",
      "It's undefined. What type is `plan`? Log `typeof plan`.",
      "`plan` is just the text. And the text uses single quotes, which JSON doesn't allow.",
      "JSON is text: parse it with `JSON.parse` to get an object. Inside JSON, names and strings use double quotes.",
      "Write `const saved = '{\"width\": 600}';` and `const plan = JSON.parse(saved);`, then press Run.",
    ],
    debrief: {
      rule: "JSON is text. stringify to save or send, parse to read. JSON needs double quotes and allows no trailing commas.",
      seenIn: "Every `fetch` to an API returns JSON text that `response.json()` parses for you.",
      fableLine: "Write it down plainly, and it can be read back.",
    },
    quiz: {
      question: "Which is valid JSON?",
      options: ["{name: \"Ada\"}", "{'name': 'Ada'}", "{\"name\": \"Ada\"}", "{\"name\": \"Ada\",}"],
      answer: 2,
      explain: "JSON needs double-quoted names and strings, and no trailing comma.",
    },
    ...bridgeWorld(LOOKS.coral, "cable"),
    js: `const cable = document.querySelector(".cable");

// The plan, saved earlier as JSON text.
const saved = "{'width': 600}";

// Read the plan back.
const plan = saved;

console.log("saved as:", JSON.stringify({ width: 600 }));
cable.style.width = plan.width + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /JSON\.parse\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson read the text back with JSON.parse." };
    },
  },

  {
    id: "js-30-query-selectors",
    chapter: 4,
    number: 30,
    title: "Find Them All",
    concept: "querySelector and querySelectorAll",
    edit: "js",
    learn: "Find one element with querySelector, and every match with querySelectorAll.",
    objective: "Every rock should appear, but the code only asks for one element, with a selector missing its dot. Find them all.",
    lesson: [
      "The **DOM** (Document Object Model) is the page as JavaScript sees it: every HTML element is an object you can find and change.",
      "**`document.querySelector(selector)`** returns the **first** element matching a CSS selector, or `null` if none do. **`document.querySelectorAll(selector)`** returns **all** matches as a `NodeList`.",
      "The selector is written exactly like in CSS: `\".rock\"` for a class, `\"#one\"` for an id, `\"div.rock\"`, `\".path > .rock\"`. Forget the dot and `\"rock\"` looks for a `<rock>` tag.",
      "A `NodeList` has `forEach`, `length` and indexes (`rocks[0]`), but not `map` or `filter` — convert it with `[...rocks]` or `Array.from(rocks)` when you need those.",
      "You can also search inside an element: `panel.querySelector(\"button\")`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "document.querySelector(\".card\")", note: "the first .card (or null)" },
        { code: "document.querySelectorAll(\".card\")", note: "every .card (a NodeList)" },
        { code: "cards.forEach(c => c.classList.add(\"x\"));", note: "NodeList has forEach" },
        { code: "[...cards].map(c => c.id)", note: "convert for map/filter" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "Add the missing dot: `\".rock\"`.",
      "Change `querySelector` to `querySelectorAll`, so `rocks` holds every rock.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Finding elements",
      syntax: "document.querySelectorAll(\".class\")",
      entries: [
        { value: "querySelector", meaning: "first match, or null" },
        { value: "querySelectorAll", meaning: "all matches, as a NodeList" },
        { value: "\".x\" / \"#x\" / \"x\"", meaning: "class / id / tag name" },
      ],
    },
    hints: [
      "An error says `.forEach` was used on nothing (`null`).",
      "What does `document.querySelector(\"rock\")` find? Is there a `<rock>` element?",
      "Two problems: no dot in the selector, and querySelector returns one element (without forEach), not a list.",
      "Selectors follow CSS rules: classes need a dot. querySelectorAll returns every match, and its NodeList has forEach.",
      "Write `const rocks = document.querySelectorAll(\".rock\");` and press Run.",
    ],
    debrief: {
      rule: "querySelector finds the first match (or null); querySelectorAll finds all. Selectors are written just like CSS.",
      seenIn: "Adding a click handler to every `.faq-question` on a help page starts with querySelectorAll.",
      fableLine: "Call every stone by name, not just the first to answer.",
    },
    quiz: {
      question: "What does `document.querySelector(\".missing\")` return when nothing matches?",
      options: ["undefined", "an empty NodeList", "null", "an error"],
      answer: 2,
      explain: "querySelector returns null for no match. querySelectorAll would return an empty NodeList.",
    },
    ...hiddenStonesWorld(LOOKS.teal, "rock"),
    js: `// Find the rocks...
const rocks = document.querySelector("rock");
console.log("found:", rocks);

// ...and show every one of them.
rocks.forEach((rock) => {
  rock.classList.add("shown");
});
`,
    rubric: (ctx) => {
      if (has(ctx.js, /querySelectorAll\s*\(\s*["']\.rock["']\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's line was `document.querySelectorAll(\".rock\")`." };
    },
  },
];
