import type { Level } from "../levels";
import { LOOKS, bridgeWorld, has, hiddenStonesWorld, liftWorld, stairsWorld, stonesWorld } from "./kit";

/* Chapter 4, part 2: functions, then arrays. */

export const FUNCTIONS: Level[] = [
  {
    id: "js-11-arrow-functions",
    chapter: 4,
    number: 11,
    title: "The Arrow That Forgot to Return",
    concept: "arrow functions and how they differ",
    edit: "js",
    learn: "Write arrow functions, and know when they return a value automatically.",
    objective: "toPixels should turn slot numbers into positions, but its braces stop it returning anything. Fix the arrow function.",
    lesson: [
      "An **arrow function** is a short way to write a function: `(slot) => 60 + slot * 180`.",
      "With **no braces**, the arrow returns the expression automatically — an *implicit return*. With **braces**, `(slot) => { 60 + slot * 180 }` is a normal function body, and without the word `return` it returns `undefined`.",
      "Arrows differ from `function` in a few other ways: they have **no `this` of their own** (they use the `this` of the code around them), no `arguments` object, and they can't be used with `new`. That makes them ideal for short callbacks.",
      "With one parameter the brackets are optional (`slot => …`); with zero or several they're required (`() => …`, `(a, b) => …`).",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const double = (n) => n * 2;", note: "implicit return" },
        { code: "const triple = (n) => { return n * 3; };", note: "braces need return" },
        { code: "const broken = (n) => { n * 4 };", note: "returns undefined!" },
        { code: "const hello = () => \"hi\";", note: "no parameters" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Find `const toPixels = (slot) => { 60 + slot * 180 };`.",
      "Remove the braces so it returns the result: `(slot) => 60 + slot * 180`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Arrow functions",
      syntax: "(params) => expression",
      entries: [
        { value: "x => x + 1", meaning: "returns x + 1" },
        { value: "x => { return x + 1; }", meaning: "braces: needs return" },
        { value: "no own this", meaning: "uses the surrounding code's this" },
      ],
    },
    hints: [
      "The clouds exist but they're all piled at the far left. Their positions came out wrong.",
      "Log `toPixels(1)`. What does it give?",
      "It gives `undefined`, so every left becomes `\"undefinedpx\"` — not a valid position.",
      "An arrow with braces is a full function body and needs `return`. Without braces, the single expression is returned automatically.",
      "Change it to `const toPixels = (slot) => 60 + slot * 180;` and press Run.",
    ],
    debrief: {
      rule: "`x => expr` returns expr. `x => { … }` only returns what you `return`. Arrows have no this of their own.",
      seenIn: "`prices.map(p => p * 1.2)` — tiny arrow callbacks are everywhere in real code.",
      fableLine: "A short arrow still has to land.",
    },
    quiz: {
      question: "What does `(() => { 5 })()` return?",
      options: ["5", "undefined", "an error", "a function"],
      answer: 1,
      explain: "The braces make a body with no return statement, so the result is undefined.",
    },
    ...stonesWorld(LOOKS.sky, "cloud"),
    js: `// Slot numbers along the path: 1, 2 and 3.
const slots = [1, 2, 3];

// Turn a slot number into a left position in pixels.
const toPixels = (slot) => { 60 + slot * 180 };

const place = (x) => {
  const cloud = document.createElement("div");
  cloud.className = "cloud";
  cloud.style.left = x + "px";
  document.body.append(cloud);
};

for (const slot of slots) {
  place(toPixels(slot));
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /toPixels\s*=\s*\(?\s*slot\s*\)?\s*=>/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson kept toPixels as an arrow function." };
    },
  },

  {
    id: "js-12-parameters-return",
    chapter: 4,
    number: 12,
    title: "Measure Twice",
    concept: "parameters, defaults, rest, return",
    edit: "js",
    learn: "Pass values into functions with parameters, defaults and rest — and get values back with return.",
    objective: "One function adds up the ribbon's pieces but never returns the total, and the other forgets a default margin. Fix both.",
    lesson: [
      "**Parameters** are the names a function gives to the values you pass in: in `function add(a, b)`, calling `add(2, 3)` makes `a` 2 and `b` 3. Leave one out and it's `undefined`.",
      "A **default** fills in a missing argument: `function withMargin(length, margin = 50)`. Now `withMargin(500)` uses 50.",
      "A **rest parameter** gathers any number of extra arguments into an array: `function total(first, ...rest)`. It must be last.",
      "**`return`** sends a value back to the caller and ends the function. A function that never returns gives `undefined` — and `undefined + 50` is `NaN` (*Not a Number*), which quietly spreads through every calculation after it.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "function sum(...nums) {", note: "any number of arguments" },
        { code: "  return nums.reduce((a, b) => a + b, 0);", note: "send the result back" },
        { code: "}", note: "" },
        { code: "function greet(name = \"friend\") { … }", note: "default value" },
      ],
    },
    steps: [
      "Open the **JS** tab and log the result of `totalLength(200, 150, 150)`.",
      "Add `return sum;` at the end of `totalLength`.",
      "Give `margin` a default: `margin = 50`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Functions in and out",
      syntax: "function name(a, b = 1, ...rest) { return value; }",
      entries: [
        { value: "b = 1", meaning: "default when b isn't passed" },
        { value: "...rest", meaning: "the remaining arguments, as an array" },
        { value: "return value", meaning: "hand a value back and stop" },
      ],
    },
    hints: [
      "The ribbon is missing. Log the width value — what is it?",
      "It's `NaN`. Which calculation produced something that isn't a number?",
      "`totalLength` never returns, so it gives `undefined`; and `withMargin` is called with only one argument.",
      "A function without `return` gives `undefined`. A parameter that isn't passed is `undefined` unless it has a default.",
      "Add `return sum;` before the end of `totalLength`, and change the parameter to `margin = 50`. Press Run.",
    ],
    debrief: {
      rule: "Parameters receive arguments; defaults fill gaps; `...rest` gathers extras; `return` hands back the result.",
      seenIn: "`formatPrice(amount, currency = \"USD\")` — defaults keep function calls short for the common case.",
      fableLine: "Measure every piece — then say the number out loud.",
    },
    quiz: {
      question: "`function f(a, b = 2) { return a + b; }` — what is `f(1)`?",
      options: ["NaN", "1", "3", "undefined"],
      answer: 2,
      explain: "b isn't passed, so its default of 2 is used: 1 + 2 = 3.",
    },
    ...bridgeWorld(LOOKS.rose, "ribbon"),
    js: `const ribbon = document.querySelector(".ribbon");

// Add up any number of pieces.
function totalLength(first, ...rest) {
  let sum = first;
  for (const piece of rest) {
    sum = sum + piece;
  }
}

// Add a margin at the end — usually 50px.
function withMargin(length, margin) {
  return length + margin;
}

const width = withMargin(totalLength(200, 150, 150));
console.log("width:", width);
ribbon.style.width = width + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /return\s+sum/) && has(ctx.js, /margin\s*=\s*\d/) && has(ctx.js, /\.\.\.rest/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's fixes were `return sum;` and a default `margin = 50`." };
    },
  },

  {
    id: "js-13-scope",
    chapter: 4,
    number: 13,
    title: "Out of Reach",
    concept: "global, function and block scope",
    edit: "js",
    learn: "Know where a variable can be seen: global, function and block scope — and how shadowing hides one.",
    objective: "Three tiles, three scope mistakes: a variable trapped in a function, one trapped in a block, and one that hides the real one. Fix them in order.",
    lesson: [
      "**Scope** is where a name can be used. A variable made at the top level of your code is **global**: everything can see it.",
      "A variable made inside a function has **function scope**: it exists only while that function runs, and code outside can't see it. To get a value out, `return` it.",
      "`let` and `const` also have **block scope**: made inside `{ }` — an `if`, a loop — they vanish at the closing brace. Declare the variable *before* the block if you need it afterwards.",
      "**Shadowing:** writing `let lit = 1` inside a function creates a *new* local `lit` that hides the outer one. The outer one never changes. To change the outer variable, assign it without `let`: `lit = 1`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "let total = 0;", note: "global" },
        { code: "function add() { total = total + 1; }", note: "changes the global" },
        { code: "function oops() { let total = 99; }", note: "a NEW local total (shadow)" },
        { code: "if (true) { const inside = 1; }", note: "inside is gone after }" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "Tile one: make `pickFirst` **return** `\"#one\"`, and store it: `const first = pickFirst();`.",
      "Tile two: declare `let second;` above the `if`, and assign `second = \"#two\";` inside it.",
      "Tile three: remove `let` inside `lightThird` so it changes the outer `lit`. Press **Run** and cross.",
    ],
    reference: {
      title: "Scope",
      syntax: "{ let x; }  // x only exists inside the braces",
      entries: [
        { value: "global", meaning: "made at the top level — visible everywhere" },
        { value: "function scope", meaning: "made inside a function — return it to share" },
        { value: "block scope", meaning: "let/const inside { } — gone after }" },
      ],
    },
    hints: [
      "Nothing appears, and the console says `first` hasn't been created — but it *is* written in the code.",
      "Where is `first` created? Can the line at the bottom see inside that function?",
      "`first` lives inside `pickFirst`, `second` lives inside the `if` block, and `lightThird` makes its own separate `lit`.",
      "Variables stay inside the function or block that made them. Return values out of functions, declare outside blocks, and don't re-declare a name you mean to change.",
      "Use `function pickFirst() { return \"#one\"; }` with `const first = pickFirst();`, `let second;` before the `if` with `second = \"#two\";` inside, and `lit = 1;` without `let`. Press Run.",
    ],
    debrief: {
      rule: "Functions and `{ }` blocks keep their variables private. Return values out, declare before blocks, and don't shadow a name you mean to update.",
      seenIn: "Scope is why two libraries on one page can both have a variable called `count` without breaking each other.",
      fableLine: "What's said inside a room stays inside the room.",
    },
    quiz: {
      question: "`let x = 1; function f() { let x = 2; } f();` — what is x afterwards?",
      options: ["1", "2", "undefined", "an error"],
      answer: 0,
      explain: "The `let x` inside f is a separate local variable. The outer x is untouched.",
    },
    ...hiddenStonesWorld(LOOKS.slate, "tile"),
    js: `// Tile one: the selector is chosen inside a function.
function pickFirst() {
  const first = "#one";
}
pickFirst();
document.querySelector(first).classList.add("shown");

// Tile two: the selector is chosen inside an if block.
const ready = true;
if (ready) {
  const second = "#two";
}
document.querySelector(second).classList.add("shown");

// Tile three: a global counter the function should update.
let lit = 0;
function lightThird() {
  let lit = 1;
}
lightThird();
if (lit === 1) document.querySelector("#three").classList.add("shown");
`,
    rubric: (ctx) => {
      if (has(ctx.js, /return\s+["']#one/) && !has(ctx.js, /let\s+lit\s*=\s*1/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson returned the selector from pickFirst and updated the outer `lit`." };
    },
  },

  {
    id: "js-14-closures",
    chapter: 4,
    number: 14,
    title: "The Counter That Remembers",
    concept: "closures",
    edit: "js",
    learn: "Use a closure: a function that remembers the variables around it after its outer function has finished.",
    objective: "Each step should be taller than the last, but a brand-new counter is made every turn, so they're all the same height. Make one counter.",
    lesson: [
      "When a function is created inside another function, it keeps access to the outer function's variables — even after the outer one has finished running. That remembered bundle is a **closure**.",
      "`makeCounter` creates a `count` variable and returns a little function that adds 1 to it. Every time you call *that returned function*, it sees the **same** `count`, so the numbers go 1, 2, 3…",
      "But each call to `makeCounter()` creates a **fresh** `count` starting at 0. Make a new counter every turn, and every counter only ever says 1.",
      "Closures let you keep private state that nothing else can touch — a common pattern for counters, caches and settings.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "function makeCounter() {", note: "" },
        { code: "  let count = 0;", note: "private to this counter" },
        { code: "  return () => ++count;", note: "remembers count: a closure" },
        { code: "}", note: "" },
        { code: "const c = makeCounter(); c(); c(); // 2", note: "same count each call" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Find `const next = makeCounter();` inside the loop.",
      "Move it above the loop, so all six steps share one counter.",
      "Press **Run** and climb.",
    ],
    reference: {
      title: "Closures",
      syntax: "function outer() { let x; return () => x; }",
      entries: [
        { value: "closure", meaning: "an inner function + the outer variables it remembers" },
        { value: "one call to makeCounter()", meaning: "one private count" },
        { value: "new call each time", meaning: "a new count starting over" },
      ],
    },
    hints: [
      "Six steps, all exactly the same height — no staircase at all.",
      "Log `next()` inside the loop. Does the number grow?",
      "It's always 1, because the loop makes a new counter on every turn.",
      "Each `makeCounter()` call creates its own `count` from 0. Create the counter once, outside the loop, and every `next()` call continues the same count.",
      "Cut `const next = makeCounter();` from inside the loop and paste it above the `for` line. Press Run.",
    ],
    debrief: {
      rule: "A function remembers the variables where it was created. Each call to the outer function makes a fresh, private set.",
      seenIn: "A “once” helper that only lets a payment button fire a single time keeps a closed-over `used` flag.",
      fableLine: "The counter remembers — as long as you keep the same one.",
    },
    quiz: {
      question: "`const a = makeCounter(); const b = makeCounter(); a(); a(); b();` — what does the b() call return?",
      options: ["1", "2", "3", "0"],
      answer: 0,
      explain: "b has its own count, separate from a's, so its first call returns 1.",
    },
    ...stairsWorld(LOOKS.mint, "step"),
    js: `function makeCounter() {
  let count = 0;
  return function () {
    count = count + 1;
    return count;
  };
}

const stairs = document.querySelector(".stairs");

for (let i = 0; i < 6; i++) {
  const next = makeCounter();
  const step = document.createElement("div");
  step.className = "step";
  step.style.height = next() * 50 + "px";
  stairs.append(step);
}
`,
    rubric: (ctx) => {
      if ((ctx.js.match(/(?<!function\s+)makeCounter\s*\(\s*\)/g) ?? []).length === 1) return { gold: true };
      return { gold: false, note: "Solved — the lesson made a single counter with one `makeCounter()` call." };
    },
  },

  {
    id: "js-15-this",
    chapter: 4,
    number: 15,
    title: "Who Is This?",
    concept: "this and the call-site",
    edit: "js",
    learn: "Understand that this is decided by how a function is called, not where it's written.",
    objective: "The lift's raise method works when called as lift.raise() — but it's handed to setTimeout on its own and loses its this. Fix the call.",
    lesson: [
      "Inside a method, **`this`** means *the object the method was called on*. With `lift.raise()`, `this` is `lift`.",
      "Crucially, `this` is decided by the **call-site** — how the function is called — not where it was written. Pass `lift.raise` somewhere on its own (`setTimeout(lift.raise, 300)`) and it's later called as a plain function, with no object before the dot. In strict mode, `this` is then `undefined`.",
      "Three fixes: wrap it in an arrow so the call-site keeps the dot — `setTimeout(() => lift.raise(), 300)`; or **bind** it — `lift.raise.bind(lift)`; or call it immediately with an explicit this — `lift.raise.call(lift)`.",
      "Arrow functions don't have their own `this` at all; they use the `this` of the surrounding code. That's why arrow wrappers are the everyday fix.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const dog = { name: \"Rex\", bark() { return this.name; } };", note: "" },
        { code: "dog.bark();              // \"Rex\"", note: "called on dog" },
        { code: "const f = dog.bark; f(); // error: this is undefined", note: "no object at the call" },
        { code: "setTimeout(() => dog.bark(), 100);", note: "arrow keeps the call-site" },
      ],
    },
    steps: [
      "Press **Run**, wait, and read the error in the console.",
      "Find `setTimeout(lift.raise, 300);`.",
      "Change it to `setTimeout(() => lift.raise(), 300);`.",
      "Press **Run**, ride up and cross.",
    ],
    reference: {
      title: "this",
      syntax: "object.method()  →  this === object",
      entries: [
        { value: "obj.fn()", meaning: "this is obj" },
        { value: "const f = obj.fn; f()", meaning: "this is undefined (strict)" },
        { value: "fn.bind(obj) / fn.call(obj)", meaning: "choose this explicitly" },
      ],
    },
    hints: [
      "A moment after Run, an error appears about reading `el` of undefined.",
      "Inside `raise`, what is `this` when setTimeout calls it?",
      "`setTimeout(lift.raise, 300)` passes the bare function. When it runs, nothing is before the dot, so `this` is undefined.",
      "`this` comes from the call-site. Keep the call as `lift.raise()` inside an arrow function, or use `bind(lift)`.",
      "Write `setTimeout(() => lift.raise(), 300);` and press Run.",
    ],
    debrief: {
      rule: "`this` is set by how a function is called: `obj.fn()` gives obj. Passing `obj.fn` alone loses it — wrap in an arrow or bind.",
      seenIn: "Passing `this.handleClick` to an event listener in a class, and wondering why `this` is broken inside it.",
      fableLine: "Ask “who pulled the lever?”, not “who built it?”",
    },
    quiz: {
      question: "Which keeps `this` as `timer` when the callback runs?",
      options: ["setTimeout(timer.tick, 10)", "setTimeout(() => timer.tick(), 10)", "setTimeout(tick, 10)", "setTimeout(timer.tick(), 10)"],
      answer: 1,
      explain: "The arrow calls `timer.tick()` with timer before the dot, so this is timer.",
    },
    ...liftWorld(LOOKS.plum, "lift"),
    js: `const lift = {
  el: document.querySelector(".lift"),
  raise() {
    this.el.classList.add("raised");
  },
};

// Raise the lift a moment after Run.
setTimeout(lift.raise, 300);
`,
    rubric: (ctx) => {
      if (has(ctx.js, /(lift\.raise\s*\(\s*\)|bind\s*\(\s*lift\s*\)|call\s*\(\s*lift\s*\))/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson kept the method and fixed its call-site." };
    },
  },

  {
    id: "js-16-callbacks-hof",
    chapter: 4,
    number: 16,
    title: "Hand Over the Instructions",
    concept: "callbacks and higher-order functions",
    edit: "js",
    learn: "Pass a function to another function as a callback — the idea behind higher-order functions.",
    objective: "repeat should call placeSlab once per slab — but placeSlab is being called straight away instead of handed over. Fix the call.",
    lesson: [
      "Functions are values: you can store them, and **pass them into other functions**. A function passed in to be called later is a **callback**.",
      "A function that takes a function (or returns one) is a **higher-order function**. `repeat(3, placeSlab)` is one: it decides *when* and *how often* to call `placeSlab`, and passes it a number each time.",
      "The difference between `placeSlab` and `placeSlab()` is everything. Without brackets you hand over the function itself. With brackets you **call it right now** and hand over whatever it returned — here, `undefined`.",
      "Array methods like `map`, `filter` and `forEach`, `setTimeout`, and `addEventListener` are all higher-order functions taking callbacks.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "function twice(fn) { fn(); fn(); }", note: "higher-order: takes a function" },
        { code: "twice(sayHi);", note: "hand it over: runs twice" },
        { code: "twice(sayHi());", note: "calls sayHi now, passes undefined" },
        { code: "const add = (a) => (b) => a + b;", note: "returns a function: also higher-order" },
      ],
    },
    steps: [
      "Press **Run** — read the error.",
      "Find `repeat(3, placeSlab());`.",
      "Remove the brackets after `placeSlab`, so the function itself is passed.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Callbacks",
      syntax: "higherOrder(callback)",
      entries: [
        { value: "fn", meaning: "the function itself (a value)" },
        { value: "fn()", meaning: "call it now; its result" },
        { value: "callback", meaning: "a function passed in, to be called later" },
      ],
    },
    hints: [
      "An error says `action` isn't a function.",
      "What is `action` inside `repeat`? What was passed in as the second argument?",
      "`placeSlab()` runs immediately and returns undefined — so `repeat` receives undefined.",
      "Pass a function without brackets to hand it over. `repeat` will call it three times, passing 1, 2 and 3.",
      "Change `repeat(3, placeSlab());` to `repeat(3, placeSlab);` and press Run.",
    ],
    debrief: {
      rule: "A callback is a function handed to another function. Pass `fn`, not `fn()`. Functions that take or return functions are higher-order.",
      seenIn: "`button.addEventListener(\"click\", save)` and `items.map(format)` both hand over a callback.",
      fableLine: "Give the builder your instructions, not your finished work.",
    },
    quiz: {
      question: "Which is a higher-order function?",
      options: ["function add(a, b) { return a + b; }", "function apply(fn) { return fn(); }", "const n = 5;", "Math.max(1, 2)"],
      answer: 1,
      explain: "`apply` takes a function as an argument, which makes it higher-order.",
    },
    ...stonesWorld(LOOKS.copper, "slab"),
    js: `// Call an action a number of times, passing 1, 2, 3...
function repeat(times, action) {
  for (let i = 1; i <= times; i++) {
    action(i);
  }
}

// Place slab number n.
function placeSlab(n) {
  const slab = document.createElement("div");
  slab.className = "slab";
  slab.style.left = 60 + n * 180 + "px";
  document.body.append(slab);
}

repeat(3, placeSlab());
`,
    rubric: (ctx) => {
      if (has(ctx.js, /repeat\s*\(\s*3\s*,\s*placeSlab\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson passed `placeSlab` itself as the callback." };
    },
  },

  {
    id: "js-17-array-basics",
    chapter: 4,
    number: 17,
    title: "The Brick Pile",
    concept: "arrays: indexing, push, pop, shift, unshift",
    edit: "js",
    learn: "Create arrays, read items by index, and add or remove items at either end.",
    objective: "Bricks are taken from the pile and placed — but only two of the three are taken. Take the last one too.",
    lesson: [
      "An **array** is an ordered list: `const pile = [600, 420, 240];`. Items are numbered from **0**: `pile[0]` is 600, `pile[2]` is 240, and `pile.length` is 3. The last item is always `pile[pile.length - 1]`.",
      "Four methods add or remove at the ends, and they **change the array itself**:",
      "`push(x)` adds to the **end**. `pop()` removes from the **end** and returns the removed item. `unshift(x)` adds to the **start**. `shift()` removes from the **start** and returns it.",
      "A handy way to remember: *shift* and *unshift* work at the front, the shorter *push* and *pop* at the back.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const a = [\"b\", \"c\"];", note: "" },
        { code: "a.unshift(\"a\");  // [\"a\",\"b\",\"c\"]", note: "add at start" },
        { code: "a.push(\"d\");     // [\"a\",\"b\",\"c\",\"d\"]", note: "add at end" },
        { code: "a.shift();       // returns \"a\"", note: "remove from start" },
        { code: "a[0]             // \"b\"", note: "index from 0" },
      ],
    },
    steps: [
      "Open the **JS** tab and log `pile` after the two lines that take bricks.",
      "One brick is still in the pile. Add another line: `placed.push(pile.pop());`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Array ends",
      syntax: "array.push(x)  array.pop()  array.unshift(x)  array.shift()",
      entries: [
        { value: "push / pop", meaning: "add / remove at the end" },
        { value: "unshift / shift", meaning: "add / remove at the start" },
        { value: "a[i], a.length", meaning: "read by index (from 0), count items" },
      ],
    },
    hints: [
      "Two bricks placed, one missing in the middle.",
      "Which bricks were taken from the pile? What's still in `pile` afterwards?",
      "`shift()` took 600 from the front, `pop()` took 240 from the end. 420 is still sitting in the pile.",
      "`pop()` and `shift()` remove an item and give it back. One more of either takes the last brick.",
      "Add `placed.push(pile.pop());` after the other two lines and press Run.",
    ],
    debrief: {
      rule: "Arrays are indexed from 0. push/pop work at the end, unshift/shift at the start — and all four change the array.",
      seenIn: "A chat keeps messages in an array and `push`es each new one; an undo feature `pop`s the last action.",
      fableLine: "Take from the top, take from the bottom — just don't leave one behind.",
    },
    quiz: {
      question: "`const a = [1, 2, 3]; a.shift();` — what is `a` now?",
      options: ["[1, 2]", "[2, 3]", "[1, 2, 3]", "[3]"],
      answer: 1,
      explain: "shift removes the first item, leaving [2, 3].",
    },
    ...stonesWorld(LOOKS.sand, "brick"),
    js: `// The pile of bricks (each number is where one goes).
const pile = [600, 420, 240];
const placed = [];

placed.push(pile.shift()); // take from the front
placed.push(pile.pop());   // take from the end

console.log("first placed:", placed[0], "— bricks left:", pile.length);

for (const x of placed) {
  const brick = document.createElement("div");
  brick.className = "brick";
  brick.style.left = x + "px";
  document.body.append(brick);
}
`,
    rubric: (ctx) => {
      if (ctx.count(".brick") === 3 && has(ctx.js, /\.(pop|shift)\s*\(\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson took the last brick from the pile with pop or shift." };
    },
  },

  {
    id: "js-18-splice-slice",
    chapter: 4,
    number: 18,
    title: "Cut, Don't Tear",
    concept: "splice vs slice",
    edit: "js",
    learn: "Copy part of an array with slice, and edit an array in place with splice.",
    objective: "A preview accidentally cuts petals out of the plan, and a replacement forgets what to insert. Fix both array calls.",
    lesson: [
      "Their names are one letter apart, but they do opposite things.",
      "**`slice(start, end)`** returns a **copy** of part of the array, from `start` up to (not including) `end`. The original is untouched — safe for previews.",
      "**`splice(start, deleteCount, ...items)`** **changes the array in place**: starting at `start`, it removes `deleteCount` items and inserts any `items` you pass. It returns the removed items.",
      "So `plan.splice(1, 1, 420)` replaces the item at index 1 with 420. `plan.splice(1, 1)` just removes it, and `plan.splice(1, 0, 420)` inserts without removing.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const a = [\"x\", \"y\", \"z\"];", note: "" },
        { code: "a.slice(0, 2)        // [\"x\",\"y\"], a unchanged", note: "copy" },
        { code: "a.splice(1, 1, \"Y\")  // a is [\"x\",\"Y\",\"z\"]", note: "replace in place" },
        { code: "a.splice(0, 1)       // removes \"x\"", note: "" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "The preview should copy, not cut: change `plan.splice(0, 2)` to `plan.slice(0, 2)`.",
      "The replacement should insert 420: change `plan.splice(1, 1)` to `plan.splice(1, 1, 420)`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "slice and splice",
      syntax: "slice(start, end)   splice(start, deleteCount, ...items)",
      entries: [
        { value: "slice", meaning: "returns a copy of a part; original untouched" },
        { value: "splice(i, n)", meaning: "removes n items at i (changes the array)" },
        { value: "splice(i, n, x)", meaning: "replaces them with x" },
      ],
    },
    hints: [
      "Only one petal appears. Log `plan` just before the loop.",
      "The plan started with three positions. Which line made it shorter?",
      "`splice` in the preview removed the first two positions, and the replacement line removes one without inserting anything.",
      "`slice` copies without changing the array. `splice(start, count, item)` removes `count` items and puts `item` in their place.",
      "Use `const preview = plan.slice(0, 2);` and `plan.splice(1, 1, 420);`, then press Run.",
    ],
    debrief: {
      rule: "`slice` copies a part and leaves the array alone. `splice` removes and inserts in place.",
      seenIn: "Pagination shows `items.slice(0, 10)`; deleting a to-do edits the list with `splice(index, 1)`.",
      fableLine: "Trace the pattern before you cut the cloth.",
    },
    quiz: {
      question: "After `const a = [1, 2, 3]; const b = a.slice(1);` — what is `a`?",
      options: ["[1]", "[2, 3]", "[1, 2, 3]", "[]"],
      answer: 2,
      explain: "slice never changes the original array.",
    },
    ...stonesWorld(LOOKS.rose, "petal"),
    js: `// Where each petal goes. The 999 is a typo that should be 420.
const plan = [240, 999, 600];

// Show the first two positions, without changing the plan.
const preview = plan.splice(0, 2);
console.log("preview:", preview);

// Replace the wrong item at index 1 with 420.
plan.splice(1, 1);

for (const x of plan) {
  const petal = document.createElement("div");
  petal.className = "petal";
  petal.style.left = x + "px";
  document.body.append(petal);
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\.slice\s*\(/) && has(ctx.js, /splice\s*\(\s*1\s*,\s*1\s*,\s*420/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson used slice for the preview and splice(1, 1, 420) for the fix." };
    },
  },

  {
    id: "js-19-map-filter-foreach",
    chapter: 4,
    number: 19,
    title: "Choose, Change, Place",
    concept: "map, filter, forEach",
    edit: "js",
    learn: "Transform arrays with map, keep items with filter, and act on each with forEach.",
    objective: "The pipeline should keep the even slots, turn them into pixel positions and place shells. Two of its callbacks are wrong.",
    lesson: [
      "Three array methods cover most everyday list work. Each takes a **callback** that receives one item at a time.",
      "**`filter(callback)`** returns a **new array** of the items where the callback returned something truthy. `[1,2,3,4].filter(n => n % 2 === 0)` is `[2, 4]`.",
      "**`map(callback)`** returns a **new array** where every item is replaced by the callback's result. `[2, 4].map(n => n * 10)` is `[20, 40]`.",
      "**`forEach(callback)`** just runs the callback for each item and returns **`undefined`**. Use it for actions (placing, logging), never to build a new array.",
      "The arrow-function trap applies here too: `filter((n) => { n % 2 === 0 })` has braces and no `return`, so it keeps nothing.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const prices = [5, 12, 30];", note: "" },
        { code: "prices.filter(p => p > 10)   // [12, 30]", note: "keep some" },
        { code: "prices.map(p => p * 2)       // [10, 24, 60]", note: "change each" },
        { code: "prices.forEach(p => console.log(p));", note: "do something, returns undefined" },
      ],
    },
    steps: [
      "Open the **JS** tab.",
      "Fix `filter`: remove the braces so the arrow returns its condition.",
      "Change `.forEach` to `.map` on the line that makes `pixels`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "map, filter, forEach",
      syntax: "array.map(item => newItem)",
      entries: [
        { value: "filter", meaning: "new array of items where the callback is truthy" },
        { value: "map", meaning: "new array of callback results" },
        { value: "forEach", meaning: "runs for each item; returns undefined" },
      ],
    },
    hints: [
      "No shells at all. Log `even` and `pixels` after each line.",
      "`even` is an empty array, and `pixels` is undefined. Look at what each callback returns.",
      "The filter callback has braces with no return; `forEach` never returns an array.",
      "`filter` keeps items whose callback returns true. `map` builds a new array from each callback's result; `forEach` builds nothing.",
      "Use `slots.filter((n) => n % 2 === 0)` and `even.map((n) => 60 + n * 90)`. Press Run.",
    ],
    debrief: {
      rule: "filter keeps, map transforms, forEach acts. filter and map return new arrays; forEach returns undefined.",
      seenIn: "A product page: `products.filter(inStock).map(toCard).forEach(show)`.",
      fableLine: "Pick the right shells, carry them, set them down.",
    },
    quiz: {
      question: "What does `[1, 2, 3].forEach(n => n * 2)` return?",
      options: ["[2, 4, 6]", "6", "undefined", "[1, 2, 3]"],
      answer: 2,
      explain: "forEach always returns undefined. Use map to get a new array.",
    },
    ...stonesWorld(LOOKS.teal, "shell"),
    js: `const slots = [1, 2, 3, 4, 5, 6];

// Keep only the even slots: 2, 4, 6.
const even = slots.filter((n) => { n % 2 === 0 });

// Turn each slot into a left position.
const pixels = even.forEach((n) => 60 + n * 90);
console.log("even:", even, "pixels:", pixels);

// Place a shell at each position.
pixels.forEach((x) => {
  const shell = document.createElement("div");
  shell.className = "shell";
  shell.style.left = x + "px";
  document.body.append(shell);
});
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\.filter\s*\(/) && has(ctx.js, /even\s*\.\s*map\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson's pipeline was filter, then map, then forEach." };
    },
  },

  {
    id: "js-20-reduce",
    chapter: 4,
    number: 20,
    title: "Add It All Up",
    concept: "reduce",
    edit: "js",
    learn: "Combine an array into a single value with reduce — and always give it a starting value.",
    objective: "reduce should add up the logs' widths, but without a starting value it begins with the first object. Give it a start.",
    lesson: [
      "**`reduce(callback, start)`** boils an array down to **one value**. The callback gets the running result so far (the *accumulator*) and the next item, and returns the new running result.",
      "`[1, 2, 3].reduce((sum, n) => sum + n, 0)` goes 0 → 1 → 3 → 6.",
      "The second argument, **the starting value**, matters. Leave it out and reduce uses the *first item* as the start and begins from the second item. With plain numbers that happens to work — but with objects, the first “sum” is a whole object, and `{ w: 120 } + 160` turns into the text `\"[object Object]160\"`.",
      "Rule of thumb: always pass a starting value (`0` for sums, `[]` or `{}` when building collections).",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const cart = [{ price: 3 }, { price: 5 }];", note: "" },
        { code: "cart.reduce((sum, item) => sum + item.price, 0)", note: "8" },
        { code: "cart.reduce((sum, item) => sum + item.price)", note: "\"[object Object]5\"" },
      ],
    },
    steps: [
      "Open the **JS** tab and log `total`.",
      "Add a starting value of `0` as reduce's second argument.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "reduce",
      syntax: "array.reduce((acc, item) => newAcc, start)",
      entries: [
        { value: "acc", meaning: "the result so far" },
        { value: "start", meaning: "the first acc — always pass it" },
        { value: "returns", meaning: "the final acc" },
      ],
    },
    hints: [
      "The log bridge is missing. Log `total` — it isn't a number.",
      "What is `sum` on the very first call of the callback?",
      "Without a start value, the first `sum` is the first log object, `{ w: 120 }`.",
      "reduce's second argument is the starting accumulator. With `0`, the first call is `0 + 120`.",
      "Change the end of the reduce call to `, 0);` — `logs.reduce((sum, log) => sum + log.w, 0)`. Press Run.",
    ],
    debrief: {
      rule: "reduce turns an array into one value. Pass a starting value, or the first item becomes the start.",
      seenIn: "A basket total: `items.reduce((sum, i) => sum + i.price * i.qty, 0)`.",
      fableLine: "Start the tally at zero.",
    },
    quiz: {
      question: "`[2, 3].reduce((a, b) => a * b, 1)` is…",
      options: ["5", "6", "1", "23"],
      answer: 1,
      explain: "1 × 2 × 3 = 6.",
    },
    ...bridgeWorld(LOOKS.lime, "log"),
    js: `const bridge = document.querySelector(".log");

// Four logs laid end to end.
const logs = [{ w: 120 }, { w: 160 }, { w: 200 }, { w: 120 }];

const total = logs.reduce((sum, log) => sum + log.w);
console.log("total:", total);

bridge.style.width = total + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /reduce\s*\([\s\S]*,\s*0\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson gave reduce a starting value of 0." };
    },
  },
];
