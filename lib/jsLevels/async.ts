import type { Level } from "../levels";
import { LOOKS, bridgeWorld, gateWorld, has, hiddenStonesWorld, stonesWorld } from "./kit";

/* Chapter 4, part 5: async code, modules, practical tools, and things worth knowing exist. */

const placeFn = (cls: string) => `function place(x) {
  const el = document.createElement("div");
  el.className = "${cls}";
  el.style.left = x + "px";
  document.body.append(el);
}`;

const gate45 = gateWorld(
  LOOKS.slate,
  "gate",
  `<p class="message">Checking the gate…</p>`,
  `/* While loading, the gate stays shut no matter what. */
.gate.loading {
  height: 260px !important;
  background: repeating-linear-gradient(45deg, #9aa3ad 0 10px, #c9d0d6 10px 20px);
}
.message {
  position: absolute;
  left: 520px;
  bottom: 420px;
  margin: 0;
  padding: 6px 12px;
  font: 14px system-ui, sans-serif;
  background: #fff;
  border: 3px solid #454d57;
  border-radius: 6px;
}
.message.error {
  background: #fde4df;
  border-color: #b42318;
  color: #7a1a10;
}`,
);

export const ASYNC: Level[] = [
  {
    id: "js-41-promises",
    chapter: 4,
    number: 41,
    title: "A Promise of a Bridge",
    concept: "Promises: then, catch, finally",
    edit: "js",
    learn: "Work with Promises: wait for a result with then, handle failure with catch, and clean up with finally.",
    objective: "measureSpan returns a Promise, but the code uses it as if it were the number. Wait for it with then.",
    lesson: [
      "Some work takes time: loading data, waiting for a timer, reading a file. Instead of freezing, such functions return a **Promise** — an object standing for *a value that will arrive later* (or an error, if it fails).",
      "A promise starts **pending**, then becomes **fulfilled** with a value or **rejected** with an error. You can't read the value directly; `measureSpan() + \"px\"` gives `\"[object Promise]px\"`.",
      "**`.then(value => …)`** runs when it's fulfilled. **`.catch(error => …)`** runs if it (or anything before it in the chain) rejects. **`.finally(() => …)`** runs either way — good for hiding a spinner.",
      "`.then` returns a new promise, so you can chain steps: `load().then(parse).then(show).catch(report)`.",
      "You'll rarely write `new Promise` yourself; `fetch` and many libraries hand you one. But it's how they work inside.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "loadUser()", note: "returns a Promise" },
        { code: "  .then((user) => show(user))", note: "when it arrives" },
        { code: "  .catch((err) => warn(err.message))", note: "if it fails" },
        { code: "  .finally(() => spinner.remove());", note: "either way" },
      ],
    },
    steps: [
      "Log `result` — it's a Promise, not a number.",
      "Replace the last two lines with `measureSpan().then((width) => { bridge.style.width = width + \"px\"; })`.",
      "Add `.catch(…)` and `.finally(…)` for good measure. Press **Run**, wait a moment, and cross.",
    ],
    reference: {
      title: "Promises",
      syntax: "promise.then(onValue).catch(onError).finally(always)",
      entries: [
        { value: "pending → fulfilled / rejected", meaning: "a promise's lifecycle" },
        { value: ".then(fn)", meaning: "run fn with the value" },
        { value: ".catch(fn) / .finally(fn)", meaning: "handle errors / run regardless" },
      ],
    },
    hints: [
      "The bridge never appears. Log `result`.",
      "It prints a Promise object. Can you add `\"px\"` to a promise?",
      "The width arrives later. The code has to wait for it instead of using the promise straight away.",
      "A promise's value is delivered to the function you pass to `.then`. Set the width inside that function.",
      "Write `measureSpan().then((width) => { bridge.style.width = width + \"px\"; });` and press Run.",
    ],
    debrief: {
      rule: "A Promise is a value that arrives later. Use .then for the value, .catch for errors, .finally for cleanup.",
      seenIn: "`fetch(url).then(r => r.json()).then(render).catch(showError)` is the classic promise chain.",
      fableLine: "The bridge was promised. Wait for it to be delivered.",
    },
    quiz: {
      question: "When does `.finally` run?",
      options: ["Only on success", "Only on failure", "After either success or failure", "Before then"],
      answer: 2,
      explain: "finally runs once the promise settles, whether it was fulfilled or rejected.",
    },
    ...bridgeWorld(LOOKS.crystal),
    js: `const bridge = document.querySelector(".bridge");

// Surveying the gap takes a moment, so this returns a Promise.
function measureSpan() {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(600), 400);
  });
}

const result = measureSpan();
console.log("result:", result);
bridge.style.width = result + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /measureSpan\s*\(\s*\)\s*\.then\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson waited for the promise with .then." };
    },
  },

  {
    id: "js-42-async-await",
    chapter: 4,
    number: 42,
    title: "Await Your Turn",
    concept: "async/await and try/catch",
    edit: "js",
    learn: "Write async code that reads top to bottom with async/await, and handle failures with try/catch.",
    objective: "build forgets to await the span, and an optional rails request fails and aborts everything. Await the span and catch the rails failure.",
    lesson: [
      "**`async`** in front of a function makes it return a promise and lets you use **`await`** inside it. `await promise` pauses *that function* until the promise settles, then gives you its value — so async code reads top to bottom like normal code.",
      "Forget `await` and you get the promise itself: `const span = getSpan();` is a Promise, not 600.",
      "If an awaited promise **rejects**, `await` **throws** — just like a normal error. Everything after it in the function is skipped, and the async function's own promise rejects. Unhandled, it shows up as *Uncaught (in promise)*.",
      "Handle it with **`try { … } catch (error) { … }`** around the risky awaits. Put optional work in its own try/catch so one failure doesn't take everything down. `finally` works here too.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "async function load() {", note: "" },
        { code: "  try {", note: "" },
        { code: "    const user = await getUser();", note: "wait for the value" },
        { code: "  } catch (err) {", note: "a rejection lands here" },
        { code: "    console.warn(err.message);", note: "" },
        { code: "  }", note: "" },
        { code: "}", note: "" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "Add `await` before `getSpan()`.",
      "Wrap the rails line in `try { … } catch (error) { console.warn(error.message); }`, declaring `let rails;` above it.",
      "Press **Run**, wait a moment, and cross.",
    ],
    reference: {
      title: "async / await",
      syntax: "async function f() { try { await p; } catch (e) {} }",
      entries: [
        { value: "async function", meaning: "returns a promise; allows await" },
        { value: "await p", meaning: "pause here until p settles; get its value" },
        { value: "try / catch", meaning: "handle a rejected await like any error" },
      ],
    },
    hints: [
      "A moment after Run: “Uncaught (in promise): No rails today”.",
      "When `await getRails()` rejects, what happens to the lines after it? And what is `span`?",
      "The rejection throws out of `build`, so the width line never runs — and `span` is a Promise because it wasn't awaited.",
      "Awaiting a rejected promise throws; catch it with try/catch so the rest continues. And `await` is what turns a promise into its value.",
      "Use `const span = await getSpan();`, then `let rails; try { rails = await getRails(); } catch (error) { console.warn(error.message); }`. Press Run.",
    ],
    debrief: {
      rule: "await pauses an async function until a promise settles. A rejected await throws — catch it with try/catch.",
      seenIn: "A dashboard loads each widget in its own try/catch, so one failed chart doesn't blank the whole page.",
      fableLine: "Wait for the span. Don't let missing rails stop the bridge.",
    },
    quiz: {
      question: "Inside an async function, `const x = fetchData();` (no await) makes x…",
      options: ["the data", "a Promise", "undefined", "an error"],
      answer: 1,
      explain: "Without await you get the promise object itself.",
    },
    ...bridgeWorld(LOOKS.amethyst),
    js: `const bridge = document.querySelector(".bridge");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getSpan() {
  await wait(300);
  return 600;
}

async function getRails() {
  await wait(200);
  throw new Error("No rails today");
}

async function build() {
  const span = getSpan();

  // Rails are optional — the bridge works without them.
  const rails = await getRails();
  console.log("rails:", rails);

  bridge.style.width = span + "px";
}

build();
`,
    rubric: (ctx) => {
      if (has(ctx.js, /await\s+getSpan\s*\(/) && has(ctx.js, /\btry\s*\{/) && has(ctx.js, /\bcatch\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson awaited getSpan and caught the rails failure with try/catch." };
    },
  },

  {
    id: "js-43-promise-all",
    chapter: 4,
    number: 43,
    title: "All or Settled",
    concept: "Promise.all and friends",
    edit: "js",
    learn: "Run promises together with Promise.all, allSettled, race and any — and know which one to reach for.",
    objective: "Three stone requests succeed, but an optional flag request fails — and Promise.all throws everything away. Keep the successes.",
    lesson: [
      "Awaiting promises one after another is slow when they don't depend on each other. Start them all, then wait for them together:",
      "**`Promise.all([...])`** fulfils with an array of every value — but **rejects as soon as any one rejects**, and you lose all the results. Use it when you need *everything*.",
      "**`Promise.allSettled([...])`** always waits for all of them and gives you a report for each: `{ status: \"fulfilled\", value }` or `{ status: \"rejected\", reason }`. Use it when some can fail.",
      "**`Promise.race`** settles with whichever finishes first (success *or* failure) — handy for timeouts. **`Promise.any`** fulfils with the first *success*, ignoring failures unless all fail.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const [user, posts] = await Promise.all([getUser(), getPosts()]);", note: "need both" },
        { code: "const results = await Promise.allSettled(requests);", note: "some may fail" },
        { code: "results.filter(r => r.status === \"fulfilled\")", note: "keep the successes" },
        { code: "await Promise.race([load(), timeout(5000)]);", note: "first to finish" },
      ],
    },
    steps: [
      "Change `Promise.all` to `Promise.allSettled`.",
      "In `.then`, keep only results with `status === \"fulfilled\"` and place each `result.value`.",
      "Press **Run**, wait a moment, and cross.",
    ],
    reference: {
      title: "Combining promises",
      syntax: "Promise.allSettled([p1, p2, p3])",
      entries: [
        { value: "all", meaning: "every value — fails if any fails" },
        { value: "allSettled", meaning: "a status report for each, never rejects" },
        { value: "race / any", meaning: "first to settle / first to succeed" },
      ],
    },
    hints: [
      "No stones, and a warning: “Nothing built: flag not found”.",
      "Three of the four requests succeeded. Why weren't their stones placed?",
      "`Promise.all` rejects the moment the flag request fails, so `.then` never runs.",
      "Promise.allSettled waits for all of them and reports each one's status, so the successes aren't thrown away.",
      "Use `Promise.allSettled([...]).then((results) => results.filter((r) => r.status === \"fulfilled\").forEach((r) => place(r.value)))`. Press Run.",
    ],
    debrief: {
      rule: "Promise.all fails fast. allSettled reports every outcome. race takes the first to settle; any takes the first success.",
      seenIn: "Loading ten product images with allSettled, so one broken image doesn't stop the other nine.",
      fableLine: "Three stones arrived. Lay them, even though the flag was lost.",
    },
    quiz: {
      question: "Two promises: one fulfils, one rejects. What does Promise.all do?",
      options: ["Fulfils with one value", "Rejects", "Waits forever", "Fulfils with [value, undefined]"],
      answer: 1,
      explain: "Promise.all rejects as soon as any input rejects.",
    },
    ...stonesWorld(LOOKS.moss, "stone"),
    js: `${placeFn("stone")}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestStone(x, ms) {
  await wait(ms);
  return x;
}

async function requestFlag() {
  await wait(250);
  throw new Error("flag not found");
}

Promise.all([requestStone(240, 300), requestStone(420, 450), requestStone(600, 200), requestFlag()])
  .then((positions) => positions.forEach(place))
  .catch((error) => console.warn("Nothing built:", error.message));
`,
    rubric: (ctx) => {
      if (has(ctx.js, /Promise\.allSettled\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson used Promise.allSettled." };
    },
  },

  {
    id: "js-44-fetch",
    chapter: 4,
    number: 44,
    title: "Ask the Server",
    concept: "fetch: GET and POST, headers, body, status",
    edit: "js",
    learn: "Request data with fetch — GET and POST, headers and JSON bodies — and check the response status.",
    objective: "The permit request sends an object instead of JSON, so the server refuses it; then the bridge data is never awaited. Fix the request and the response.",
    lesson: [
      "**`fetch(url)`** sends an HTTP request and returns a promise of a **Response**. The default is a **GET** — *give me this*. `await res.json()` reads the body and parses it as JSON (that's a promise too, so it needs `await`).",
      "To **send** data, pass options: `{ method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify(data) }`. The body must be **text** — pass a plain object and it's sent as the useless string `\"[object Object]\"`. The header tells the server what format the body is in.",
      "A response carries a **status code**: `200` OK, `201` Created, `400` Bad Request (your fault), `404` Not Found, `500`/`503` server errors. **`res.ok`** is `true` for 200–299.",
      "Crucially, **fetch only rejects on network failure**. A 404 or 500 still *fulfils* — you must check `res.ok` yourself.",
      "(In this game, fetch talks to a small pretend server built into the level, with realistic delays.)",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const res = await fetch(\"/api/items\", {", note: "" },
        { code: "  method: \"POST\",", note: "send data" },
        { code: "  headers: { \"Content-Type\": \"application/json\" },", note: "say it's JSON" },
        { code: "  body: JSON.stringify({ name: \"Bun\" }),", note: "body must be text" },
        { code: "});", note: "" },
        { code: "if (!res.ok) throw new Error(`HTTP ${res.status}`);", note: "check the status" },
        { code: "const item = await res.json();", note: "parse the reply" },
      ],
    },
    steps: [
      "Press **Run** and read the warning with the status code.",
      "Add `headers: { \"Content-Type\": \"application/json\" }` and change the body to `JSON.stringify({ bridge: \"north\" })`.",
      "Add `await` before `res.json()`.",
      "Press **Run**, wait a moment, and cross.",
    ],
    reference: {
      title: "fetch",
      syntax: "await fetch(url, { method, headers, body })",
      entries: [
        { value: "GET / POST", meaning: "fetch data / send data" },
        { value: "body: JSON.stringify(x)", meaning: "plus a Content-Type: application/json header" },
        { value: "res.ok, res.status", meaning: "fetch doesn't reject on 404/500 — check these" },
      ],
    },
    hints: [
      "“Permit refused: 400”. The server didn't like the request.",
      "What does the POST's body actually contain when it's a plain object? What does the server say it wants?",
      "The body is sent as `\"[object Object]\"` with no JSON header. And later, `res.json()` isn't awaited, so `data.width` is undefined.",
      "Request bodies must be strings: JSON.stringify the data and set the Content-Type header. `res.json()` returns a promise, so await it.",
      "Use `headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify({ bridge: \"north\" })`, and `const data = await res.json();`. Press Run.",
    ],
    debrief: {
      rule: "Send JSON with JSON.stringify and a Content-Type header. Await res.json(). Check res.ok — fetch doesn't reject on HTTP errors.",
      seenIn: "Every “Save” button in a web app is a fetch POST with a JSON body and a status check.",
      fableLine: "Ask clearly, in a language the server speaks — then read its answer.",
    },
    quiz: {
      question: "fetch gets a 404 response. What happens to its promise?",
      options: ["It rejects", "It fulfils, with res.ok === false", "It never settles", "It throws immediately"],
      answer: 1,
      explain: "HTTP errors still fulfil. Only network failures reject, so check res.ok.",
    },
    api: {
      "POST /api/permit": (req) => {
        const json = (req.headers["content-type"] ?? "").includes("application/json");
        const body = req.body as { bridge?: string } | undefined;
        if (json && body && typeof body === "object" && body.bridge === "north") return { status: 201, body: { approved: true } };
        return { status: 400, body: { error: "Send JSON like {\"bridge\": \"north\"} with a Content-Type header." } };
      },
      "GET /api/bridge": { status: 200, body: { bridge: "north", width: 600 } },
    },
    ...bridgeWorld(LOOKS.ember),
    js: `const bridge = document.querySelector(".bridge");

async function build() {
  // 1. Ask for a building permit.
  const permit = await fetch("/api/permit", {
    method: "POST",
    body: { bridge: "north" },
  });
  if (!permit.ok) {
    console.warn("Permit refused:", permit.status, await permit.text());
    return;
  }

  // 2. Get the bridge's measurements.
  const res = await fetch("/api/bridge");
  const data = res.json();
  console.log("bridge data:", data);
  bridge.style.width = data.width + "px";
}

build();
`,
    rubric: (ctx) => {
      if (has(ctx.js, /JSON\.stringify\s*\(/) && has(ctx.js, /Content-Type/i) && has(ctx.js, /await\s+res\.json\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson sent a JSON body with a Content-Type header and awaited res.json()." };
    },
  },

  {
    id: "js-45-loading-error-ui",
    chapter: 4,
    number: 45,
    title: "Stuck on Loading",
    concept: "loading and error UI states",
    edit: "js",
    learn: "Show loading, success and error states properly — so a failed request never leaves the page stuck.",
    objective: "The server is down. The code never checks the status and never clears the loading state, so the gate stays locked. Handle the error and always finish loading.",
    lesson: [
      "Every request has at least three states the user can see: **loading** (show a spinner, disable the button), **success** (show the data), and **error** (say what went wrong, offer a way forward). Tutorials show the success path. Real users hit the other two constantly.",
      "The classic bug: the loading state is cleared at the *end* of the happy path. When anything throws or returns early, the spinner spins forever and the button stays disabled.",
      "The fix is structural. Put the request in **`try`**, check **`res.ok`** and `throw` for bad statuses, handle the problem in **`catch`** (show a message, fall back), and clear loading in **`finally`**, which runs no matter what.",
      "Error messages should help: *“The gate server is down (503). Opened manually.”* beats a silent failure or *“Error”*.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "button.disabled = true;", note: "loading" },
        { code: "try {", note: "" },
        { code: "  const res = await fetch(url);", note: "" },
        { code: "  if (!res.ok) throw new Error(`Server error ${res.status}`);", note: "bad status = error" },
        { code: "  render(await res.json());", note: "success" },
        { code: "} catch (err) { message.textContent = err.message; }", note: "error" },
        { code: "finally { button.disabled = false; }", note: "always stop loading" },
      ],
    },
    steps: [
      "Wrap the request in `try { … } catch (error) { … } finally { … }`.",
      "After the fetch, add `if (!res.ok) throw new Error(\"The gate server is down (\" + res.status + \")\");`.",
      "In `catch`: show the message (add class `error`) and open the gate manually with `gate.classList.add(\"open\")`.",
      "In `finally`: `gate.classList.remove(\"loading\")`. Press **Run**, wait, and walk through.",
    ],
    reference: {
      title: "UI states",
      syntax: "try { … } catch (e) { … } finally { … }",
      entries: [
        { value: "loading", meaning: "set before the request" },
        { value: "catch", meaning: "show a helpful error and a fallback" },
        { value: "finally", meaning: "clear loading whatever happened" },
      ],
    },
    hints: [
      "The gate stays striped — still loading — and the message never changes.",
      "What status does `/api/gate` return? What happens to the rest of `checkGate` after `res.json()` gives an error object?",
      "The server returns 503, `data.open` is undefined, and `loading` is only removed on the success path — which isn't happening.",
      "Check `res.ok` and throw for errors, handle them in `catch`, and clear the loading class in `finally` so it's always removed.",
      "Put the fetch in try; throw when `!res.ok`; in catch set the message text, add `error` to the message and `open` to the gate; in finally remove `loading`. Press Run.",
    ],
    debrief: {
      rule: "Design loading, success and error states. Throw on bad statuses, show errors in catch, and clear loading in finally.",
      seenIn: "A checkout button that stays disabled forever after one failed payment — the finally block that wasn't written.",
      fableLine: "When the gatekeeper doesn't answer, open it yourself — and say why.",
    },
    quiz: {
      question: "Where should a loading spinner be hidden?",
      options: ["At the end of try", "In catch", "In finally", "Before the request"],
      answer: 2,
      explain: "finally runs after success or failure, so the spinner is always hidden.",
    },
    api: {
      "GET /api/gate": { status: 503, body: { error: "Down for maintenance" }, delay: 500 },
    },
    html: gate45.html,
    css: gate45.css,
    js: `const gate = document.querySelector(".gate");
const message = document.querySelector(".message");

async function checkGate() {
  gate.classList.add("loading");
  message.textContent = "Checking the gate…";

  const res = await fetch("/api/gate");
  const data = await res.json();

  if (data.open) {
    gate.classList.add("open");
    message.textContent = "Gate open!";
  }
  gate.classList.remove("loading");
}

checkGate();
`,
    rubric: (ctx) => {
      if (has(ctx.js, /\bfinally\b/) && has(ctx.js, /res\.ok|res\.status/) && has(ctx.js, /\bcatch\b/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson checked res.ok, handled the error in catch and cleared loading in finally." };
    },
  },

  {
    id: "js-46-modules",
    chapter: 4,
    number: 46,
    title: "Named or Default",
    concept: "import/export, script type=\"module\", npm, bundlers",
    edit: "js",
    learn: "Split code into modules with export and import — named vs default — and know what npm and bundlers like Vite do.",
    objective: "bridge.js exports build as its default and measure by name, but the imports are the wrong way round. Fix them.",
    lesson: [
      "Real projects split code into **modules** — files that `export` what they share and `import` what they need. This level has a module, `./bridge.js`:\n\n`export const PLANK = 50;`\n`export function measure(planks) { return planks * PLANK; }`\n`export default function build(el, width) { … }`",
      "**Named exports** (`export function measure`) are imported by their exact name in braces: `import { measure } from \"./bridge.js\"`. A file can have many. A file has at most one **default export**, imported *without* braces, under any name you like: `import build from \"./bridge.js\"`. Both at once: `import build, { measure } from \"./bridge.js\"`.",
      "In a web page, modules load with **`<script type=\"module\" src=\"main.js\">`** — they're deferred, run in strict mode, and have their own scope instead of sharing globals.",
      "**npm** installs packages other people wrote into `node_modules`, and records them in **`package.json`** (with its `dependencies` and `scripts` like `\"dev\": \"vite\"`). A **bundler** such as **Vite** follows your imports, resolves package names like `import confetti from \"canvas-confetti\"`, and serves or builds optimised files for the browser.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "// math.js", note: "" },
        { code: "export const PI = 3.14;", note: "named" },
        { code: "export default function area(r) { … }", note: "default" },
        { code: "// main.js", note: "" },
        { code: "import area, { PI } from \"./math.js\";", note: "default + named" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "`build` is the default export: import it without braces.",
      "`measure` is a named export: import it with braces.",
      "Combine them: `import build, { measure } from \"./bridge.js\";`. Press **Run** and cross.",
    ],
    reference: {
      title: "Modules",
      syntax: "import def, { named } from \"./file.js\";",
      entries: [
        { value: "export default x", meaning: "one per file; import without braces" },
        { value: "export const/function", meaning: "named; import { exactName }" },
        { value: "npm / package.json / Vite", meaning: "install packages / list them / bundle for the browser" },
      ],
    },
    hints: [
      "An error says `build` isn't a function.",
      "How does `bridge.js` export `build`? And how is it being imported?",
      "`build` is the *default* export but is imported with braces (as a named one); `measure` is named but imported as the default.",
      "Braces import named exports by their exact names. No braces imports the default export.",
      "Replace both import lines with `import build, { measure } from \"./bridge.js\";` and press Run.",
    ],
    debrief: {
      rule: "Named exports import in braces by name; the default export imports without braces. Pages load modules with type=\"module\"; npm installs packages; bundlers like Vite put it together.",
      seenIn: "`import React, { useState } from \"react\"` — a default and a named import in one line.",
      fableLine: "Ask for the tool by its name — or take the one the toolbox offers first.",
    },
    quiz: {
      question: "`export default function go() {}` — which import works?",
      options: ["import { go } from \"./x.js\"", "import go from \"./x.js\"", "import default from \"./x.js\"", "require(go)"],
      answer: 1,
      explain: "A default export is imported without braces, under any name.",
    },
    modules: {
      "./bridge.js": `export const PLANK = 50;

export function measure(planks) {
  return planks * PLANK;
}

export default function build(el, width) {
  el.style.width = width + "px";
}
`,
    },
    ...bridgeWorld(LOOKS.plum),
    js: `// bridge.js exports: PLANK and measure (named), and build (default).
import { build } from "./bridge.js";
import measure from "./bridge.js";

const bridge = document.querySelector(".bridge");
build(bridge, measure(12));
`,
    rubric: (ctx) => {
      if (has(ctx.js, /import\s+build\s*,\s*\{\s*measure\s*\}\s*from/) || (has(ctx.js, /import\s+build\s+from/) && has(ctx.js, /import\s*\{\s*measure\s*\}\s*from/))) return { gold: true };
      return { gold: false, note: "Solved — the lesson imported build as the default and measure by name." };
    },
  },

  {
    id: "js-47-storage-console",
    chapter: 4,
    number: 47,
    title: "Remember Me",
    concept: "localStorage, sessionStorage, console methods",
    edit: "js",
    learn: "Save data in the browser with localStorage and sessionStorage, and debug with console methods beyond log.",
    objective: "The saved width is in localStorage but the code reads sessionStorage, and a visit counter is stored without JSON. Fix both.",
    lesson: [
      "The browser can store small bits of text for your site. **`localStorage`** keeps it until it's deleted — across reloads and restarts. **`sessionStorage`** keeps it only for this tab, until it closes. They're separate: something saved in one isn't in the other.",
      "Both use the same methods: `setItem(key, value)`, `getItem(key)` (returns `null` if missing), `removeItem(key)`, `clear()`. **They only store strings**. Save an object directly and you get `\"[object Object]\"`; use `JSON.stringify` to save and `JSON.parse` to read.",
      "Never store passwords or tokens that matter there — any script on the page can read it.",
      "`console` has more than `log`: **`console.table(obj)`** shows data as rows, **`console.count(label)`** counts calls, **`console.group()`/`groupEnd()`** indents related logs, **`console.time(label)`/`timeEnd(label)`** measures how long something takes, and `console.warn`/`console.error` stand out.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "localStorage.setItem(\"theme\", \"dark\");", note: "a string: fine" },
        { code: "localStorage.setItem(\"user\", JSON.stringify(user));", note: "objects: stringify" },
        { code: "const user = JSON.parse(localStorage.getItem(\"user\"));", note: "and parse back" },
        { code: "console.table({ width: 600, rails: true });", note: "data as a table" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "Save the visits as JSON: `JSON.stringify({ count: 1 })`.",
      "Read the width from `localStorage`, where it was saved.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Storage and console",
      syntax: "localStorage.setItem(key, JSON.stringify(value))",
      entries: [
        { value: "localStorage", meaning: "persists across visits" },
        { value: "sessionStorage", meaning: "this tab only" },
        { value: "console.table / count / group / time", meaning: "debug beyond log" },
      ],
    },
    hints: [
      "An error about JSON — something isn't valid JSON.",
      "What string does `setItem(\"visits\", { count: 1 })` actually save?",
      "It saves `\"[object Object]\"`, which JSON.parse can't read. And the width was saved in localStorage, not sessionStorage.",
      "Storage keeps strings only — stringify objects on the way in. local and session storage are separate stores.",
      "Use `localStorage.setItem(\"visits\", JSON.stringify({ count: 1 }));` and `localStorage.getItem(\"bridge-width\")`. Press Run.",
    ],
    debrief: {
      rule: "localStorage persists, sessionStorage lasts one tab — both store strings, so stringify objects. The console can table, count, group and time.",
      seenIn: "A “remember my dark mode” setting is one localStorage.setItem call.",
      fableLine: "Write it in the right notebook, in words the notebook understands.",
    },
    quiz: {
      question: "`localStorage.setItem(\"n\", 5); typeof localStorage.getItem(\"n\")` is…",
      options: ["\"number\"", "\"string\"", "\"object\"", "\"undefined\""],
      answer: 1,
      explain: "Storage converts every value to a string.",
    },
    storage: { local: { "bridge-width": "600" } },
    ...bridgeWorld(LOOKS.teal),
    js: `const bridge = document.querySelector(".bridge");

// Count this visit.
localStorage.setItem("visits", { count: 1 });
const visits = JSON.parse(localStorage.getItem("visits"));
console.table(visits);
console.count("page loads");

// The width was saved on an earlier visit.
const saved = sessionStorage.getItem("bridge-width");
console.log("saved width:", saved);
bridge.style.width = saved + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /localStorage\.getItem\s*\(\s*["']bridge-width["']/) && has(ctx.js, /JSON\.stringify\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson stringified the visits and read the width from localStorage." };
    },
  },

  {
    id: "js-48-debugging",
    chapter: 4,
    number: 48,
    title: "Read the Error",
    concept: "DevTools debugger, stack traces, common errors",
    edit: "js",
    learn: "Read error messages and stack traces, recognise the most common errors, and know how the DevTools debugger helps.",
    objective: "Two classic errors stand between you and the bridge. Read each message, find the line it points to, and fix the cause.",
    lesson: [
      "Errors aren't failures — they're the program telling you exactly what went wrong. Read the **message**, then the **line number**.",
      "**“Cannot read properties of undefined (reading 'planks')”** means you wrote `something.planks` and `something` was `undefined`. The question to ask is *why is it undefined?* — a misspelt key, a missing return, data that didn't arrive.",
      "**“x is not a function”** (the famous *undefined is not a function*) means you called `x()` but `x` isn't a function — usually a typo in a method name, or calling something before it's set.",
      "A **stack trace** lists the chain of calls that led to the error, newest first: `at widthFor (line 9)`, `at build (line 14)`. Read from the top to find where it broke, and down to see how you got there. `console.trace()` prints one on purpose.",
      "In real browser DevTools, the **Sources** panel lets you set a **breakpoint** on a line (or write `debugger;` in code): execution pauses there, you can inspect every variable, **step** line by line, and see the live **call stack**.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "user.profile.name", note: "Cannot read properties of undefined → profile missing" },
        { code: "list.lenght", note: "undefined — typo, no error until you use it" },
        { code: "api.fetchUsr()", note: "api.fetchUsr is not a function → typo" },
        { code: "debugger;", note: "pauses here when DevTools is open" },
      ],
    },
    steps: [
      "Press **Run** and read the first error — which property, on which line?",
      "`planFor(\"North\")` is undefined: the plans key is `north`, lower-case.",
      "Run again and read the next error — then fix the misspelt method name `meassure`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Common errors",
      syntax: "message + line number + stack",
      entries: [
        { value: "Cannot read properties of undefined", meaning: "the thing before the dot is undefined" },
        { value: "x is not a function", meaning: "calling something that isn't a function" },
        { value: "x is not defined", meaning: "the name was never created (or misspelt)" },
      ],
    },
    hints: [
      "Read the error: it's reading `planks` from undefined.",
      "Which function returns the thing that's undefined? What key does it look up?",
      "`planFor(\"North\")` looks up `plans[\"North\"]`, but the key is `north`. After that, `tools.meassure` has an extra s.",
      "“Cannot read properties of undefined” means the object before the dot is missing; “is not a function” means the called name isn't a function. Both are usually typos.",
      "Change `\"North\"` to `\"north\"` and `meassure` to `measure`, then press Run.",
    ],
    debrief: {
      rule: "Read the message and the line. “Cannot read properties of undefined” → the value before the dot is missing. “Not a function” → wrong name. Stack traces show the path.",
      seenIn: "Nearly every bug report from a real app starts with one of these two messages.",
      fableLine: "The error said exactly where it hurt. You only had to listen.",
    },
    quiz: {
      question: "`const user = {}; user.address.city` throws…",
      options: ["user is not defined", "Cannot read properties of undefined (reading 'city')", "city is not a function", "nothing"],
      answer: 1,
      explain: "user.address is undefined, so reading .city from it throws.",
    },
    ...bridgeWorld(LOOKS.copper),
    js: `const bridge = document.querySelector(".bridge");

const tools = {
  measure(planks) {
    return planks * 50;
  },
};

function planFor(name) {
  const plans = { north: { planks: 12 } };
  return plans[name];
}

function widthFor(name) {
  return tools.meassure(planFor(name).planks);
}

bridge.style.width = widthFor("North") + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /tools\.measure\s*\(/) && has(ctx.js, /widthFor\s*\(\s*["']north["']\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson fixed both typos where the errors pointed." };
    },
  },

  {
    id: "js-49-classes-prototypes",
    chapter: 4,
    number: 49,
    title: "Blueprints for Orbs",
    concept: "classes, extends, prototypes",
    edit: "js",
    learn: "Define classes and subclasses with extends and super — and see the prototype chain underneath.",
    objective: "The GlowOrb constructor uses this before calling super, and one orb is made without new. Fix both so all three orbs are placed.",
    lesson: [
      "A **class** is a blueprint for objects: a `constructor` that sets up each new object, and **methods** they all share. `new Orb(240)` builds one.",
      "**`extends`** makes a subclass that inherits everything: `class GlowOrb extends Orb`. A subclass constructor **must call `super(...)` before using `this`** — `super` runs the parent's constructor, which is what creates `this`.",
      "Classes can only be called with **`new`**. `Orb(600)` throws *Class constructor Orb cannot be invoked without 'new'*.",
      "Underneath, classes use **prototypes**. Methods live on `Orb.prototype`, and every orb links to it. When you call `orb.place()`, JavaScript looks on the object, then up its **prototype chain**: `GlowOrb.prototype` → `Orb.prototype` → `Object.prototype`. `Object.getPrototypeOf(x)` shows the next link.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "class Animal { constructor(name) { this.name = name; } }", note: "" },
        { code: "class Dog extends Animal {", note: "inherits" },
        { code: "  constructor(name) { super(name); this.barks = true; }", note: "super before this" },
        { code: "}", note: "" },
        { code: "const d = new Dog(\"Rex\");", note: "always with new" },
      ],
    },
    steps: [
      "Press **Run** and read the error.",
      "In `GlowOrb`, move `super(x);` above `this.glow = true;`.",
      "Add `new` before `Orb(600)`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Classes",
      syntax: "class B extends A { constructor() { super(); } }",
      entries: [
        { value: "new Class()", meaning: "create an instance (required)" },
        { value: "super(...)", meaning: "call the parent constructor — before this" },
        { value: "prototype chain", meaning: "where shared methods are looked up" },
      ],
    },
    hints: [
      "An error mentions accessing `this` or `super` in a derived constructor.",
      "In `GlowOrb`'s constructor, which line runs first?",
      "`this.glow` is set before `super(x)`. Once that's fixed, `Orb(600)` fails because it's missing `new`.",
      "A subclass's `this` doesn't exist until `super()` runs. And classes must always be called with `new`.",
      "Put `super(x);` first in GlowOrb's constructor and write `new Orb(600)`. Press Run.",
    ],
    debrief: {
      rule: "Classes are blueprints used with new. Subclasses extend a parent and must call super() before this. Methods are shared through the prototype chain.",
      seenIn: "`class ApiError extends Error` — custom error types are the most common class you'll write.",
      fableLine: "Every orb from the same blueprint — some with a little extra glow.",
    },
    quiz: {
      question: "Where does `orb.place` live when place is a class method?",
      options: ["On each orb object", "On Orb.prototype", "On window", "In the constructor"],
      answer: 1,
      explain: "Class methods are stored once on the prototype and found through the chain.",
    },
    ...stonesWorld(LOOKS.amethyst, "orb"),
    js: `class Orb {
  constructor(x) {
    this.x = x;
  }
  place() {
    const el = document.createElement("div");
    el.className = "orb";
    el.style.left = this.x + "px";
    document.body.append(el);
  }
}

class GlowOrb extends Orb {
  constructor(x) {
    this.glow = true;
    super(x);
  }
}

const orbs = [new Orb(240), new GlowOrb(420), Orb(600)];
console.log("chain:", Object.getPrototypeOf(GlowOrb.prototype) === Orb.prototype);
orbs.forEach((orb) => orb.place());
`,
    rubric: (ctx) => {
      if (has(ctx.js, /new\s+Orb\s*\(\s*600\s*\)/) && has(ctx.js, /super\s*\(\s*x\s*\)\s*;\s*this\.glow/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson called super first and used new for every orb." };
    },
  },

  {
    id: "js-50-worth-knowing",
    chapter: 4,
    number: 50,
    title: "The Toolbox's Bottom Drawer",
    concept: "Map, Set, regular expressions, dates, strict mode",
    edit: "js",
    learn: "Recognise Map and Set, read a regular expression, handle dates carefully, and know what strict mode does.",
    objective: "The final path uses four tools you'll meet in real code — and each has a classic mistake. Fix all four, top to bottom.",
    lesson: [
      "**Strict mode** (`\"use strict\"`, and automatically in modules and classes — and in this game) turns silent mistakes into errors. The big one: assigning to a variable you never declared, `count = 0`, throws instead of quietly creating a global.",
      "**`Map`** is a key → value collection where keys can be *any* type, and keep their type: `map.get(1)` and `map.get(\"1\")` are different keys. **`Set`** holds unique values; ask with `set.has(x)` (not `includes`) and add with `set.add(x)`.",
      "A **regular expression** describes a text pattern. `/^GATE-\\d{3}$/` reads: start (`^`), the letters `GATE-`, exactly three digits (`\\d{3}`), end (`$`). `pattern.test(text)` returns true or false. You don't need to write complex ones — just be able to read them.",
      "**Dates** are full of traps. `new Date(2025, 11, 1)` is **1 December** — months count from **0**. Time zones, daylight saving and formats make it worse, which is why teams reach for `Intl.DateTimeFormat` or libraries like date-fns.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const ages = new Map([[\"ada\", 36]]); ages.get(\"ada\")", note: "36" },
        { code: "const tags = new Set([\"a\", \"a\", \"b\"]); tags.size", note: "2 — unique" },
        { code: "/^\\d{4}$/.test(\"2025\")", note: "true: exactly 4 digits" },
        { code: "new Date(2025, 0, 1)", note: "1 January — months start at 0" },
      ],
    },
    steps: [
      "Strict mode: declare the counter — `let count = 0;`.",
      "Map: the key is the number `1`, so use `spots.get(1)`.",
      "Set: use `lit.has(\"two\")`.",
      "Regex and date: the code has **three** digits, so `\\d{3}`; December is month `11`. Press **Run** and cross.",
    ],
    reference: {
      title: "Worth knowing",
      syntax: "new Map()  new Set()  /pattern/.test(s)  new Date(y, m, d)",
      entries: [
        { value: "map.get(key)", meaning: "keys keep their type: 1 ≠ \"1\"" },
        { value: "set.has(value)", meaning: "is it in the set?" },
        { value: "new Date(y, m, d)", meaning: "m is 0-based: 11 = December" },
      ],
    },
    hints: [
      "The first error: `count` hasn't been created.",
      "Work down the file: which line fails next after each fix?",
      "`spots.get(\"1\")` uses a string key, Sets use `has`, `\\d{2}` expects two digits, and month 12 rolls over into January.",
      "Strict mode requires declarations; Map keys keep their type; Sets have `has`; `\\d{3}` is three digits; Date months start at 0.",
      "Use `let count = 0;`, `spots.get(1)`, `lit.has(\"two\")`, `/^GATE-\\d{3}$/`, and `new Date(2025, 11, 1)`. Press Run.",
    ],
    debrief: {
      rule: "Strict mode forbids undeclared variables. Map keys keep their type; Sets use has. Read regexes piece by piece. Date months start at 0.",
      seenIn: "Counting unique visitors with a Set, validating a postcode with a regex, and a date bug in every calendar app ever.",
      fableLine: "The bottom drawer is full of odd tools — and one day you'll need each of them.",
    },
    quiz: {
      question: "What does `new Date(2025, 1, 1)` represent?",
      options: ["1 January 2025", "1 February 2025", "1 January 2026", "an invalid date"],
      answer: 1,
      explain: "Months are 0-based, so 1 is February.",
    },
    ...hiddenStonesWorld(LOOKS.sky, "rune"),
    js: `// Strict mode is on: every variable must be declared.
count = 0;

// Map: stone one's selector is stored under the number 1.
const spots = new Map([[1, "#one"], [2, "#two"]]);
document.querySelector(spots.get("1")).classList.add("shown");
count++;

// Set: stone two appears if "two" is lit.
const lit = new Set(["one", "two"]);
if (lit.includes("two")) {
  document.querySelector(spots.get(2)).classList.add("shown");
  count++;
}

// Regex + date: stone three needs a valid code and a December opening.
const code = "GATE-042";
const opening = new Date(2025, 12, 1);
if (/^GATE-\\d{2}$/.test(code) && opening.getMonth() === 11) {
  document.querySelector("#three").classList.add("shown");
  count++;
}

console.log("stones lit:", count);
`,
    rubric: (ctx) => {
      const ok = has(ctx.js, /(let|const)\s+count/) && has(ctx.js, /spots\.get\s*\(\s*1\s*\)/) && has(ctx.js, /lit\.has\s*\(/) && has(ctx.js, /\\d\{3\}/) && has(ctx.js, /new Date\s*\(\s*2025\s*,\s*11/);
      if (ok) return { gold: true };
      return { gold: false, note: "Solved — the lesson fixed the declaration, the Map key, the Set method, the regex and the date month." };
    },
  },
];
