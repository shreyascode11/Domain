import type { Level } from "../levels";
import { DECOR, LOOKS, bridgeWorld, gateWorld, has, liftWorld } from "./kit";

/* Chapter 4, part 4: the DOM and events. */

const bridge31 = bridgeWorld(LOOKS.crystal);
const gate32 = gateWorld(LOOKS.amethyst, "gate", "", `/* A locked gate stays shut, even when "open". */
.gate.locked.open {
  height: 260px;
}`);
const bridge33 = bridgeWorld(LOOKS.brass);
const bridge35 = bridgeWorld(LOOKS.moss);

const LEVER_CSS = `.lever {
  position: absolute;
  left: 220px;
  bottom: 130px;
  width: 44px;
  height: 44px;
  background: #e0b85f;
  border: 4px solid #6b4e1a;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
}`;

export const DOM: Level[] = [
  {
    id: "js-31-text-innerhtml",
    chapter: 4,
    number: 31,
    title: "The Visitor Who Wrote Code",
    concept: "textContent, innerHTML, and XSS",
    edit: "js",
    learn: "Put text on the page with textContent — and understand why innerHTML with user input is dangerous.",
    objective: "A visitor's name is shown with innerHTML — and the “name” is really code that destroys the bridge. Show it safely.",
    lesson: [
      "**`element.textContent`** reads or sets an element's **text**. Whatever you give it is shown as plain characters — `<b>` appears literally as `<b>`.",
      "**`element.innerHTML`** reads or sets its **HTML**. The string is parsed as markup, so tags become real elements — including images, links and event handlers like `onerror=\"…\"`.",
      "That's the danger. If the string came from a user (a name, a comment, a search box), they can type HTML that runs code on *your* page, for *every* visitor who sees it. This attack is **cross-site scripting (XSS)**: stealing sessions, faking forms, defacing pages.",
      "The rule: **use `textContent` for anything that came from a person or a server**. Use `innerHTML` only with markup you wrote yourself — and when you need structure, build it with `createElement` instead.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "el.textContent = \"<b>hi</b>\";", note: "shows the characters <b>hi</b>" },
        { code: "el.innerHTML = \"<b>hi</b>\";", note: "shows bold hi" },
        { code: "el.innerHTML = userComment;", note: "XSS risk — never with user input" },
        { code: "el.textContent = userComment;", note: "safe" },
      ],
    },
    steps: [
      "Press **Run** and watch the bridge vanish — the “name” ran code.",
      "Find `label.innerHTML = \"Welcome, \" + visitorName;`.",
      "Change `innerHTML` to `textContent`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Text vs HTML",
      syntax: "el.textContent = text;",
      entries: [
        { value: "textContent", meaning: "plain text — safe for any input" },
        { value: "innerHTML", meaning: "parsed as HTML — only for your own markup" },
        { value: "XSS", meaning: "user-typed HTML that runs code on your page" },
      ],
    },
    hints: [
      "The bridge appears for an instant, then disappears. Something removes it.",
      "Look at `visitorName`. Is it really a name?",
      "It's an `<img>` tag whose `onerror` handler removes the bridge — and `innerHTML` turns it into a real element.",
      "`innerHTML` parses its string as HTML, so tags and handlers become live. `textContent` shows the same string as harmless text.",
      "Change the line to `label.textContent = \"Welcome, \" + visitorName;` and press Run.",
    ],
    debrief: {
      rule: "Never put user or server data into innerHTML. textContent shows it as text, and nothing in it can run.",
      seenIn: "XSS is one of the most common real security bugs — comment sections and profile names are the classic entry points.",
      fableLine: "Read the visitor's words aloud. Don't obey them.",
    },
    quiz: {
      question: "Which is safe for showing a username someone typed?",
      options: ["el.innerHTML = name", "el.textContent = name", "document.write(name)", "el.outerHTML = name"],
      answer: 1,
      explain: "textContent never parses HTML, so nothing in the name can become an element or run code.",
    },
    html: `${bridge31.html}<div class="label">welcome</div>
`,
    css: `${bridge31.css}
/* A welcome sign, high above the path. */
.label {
  position: absolute;
  left: 280px;
  bottom: 430px;
  padding: 6px 12px;
  font: 14px system-ui, sans-serif;
  background: #fff8e6;
  border: 3px solid #6b4e1a;
  white-space: nowrap;
}
.label img { width: 16px; height: 16px; }
`,
    js: `const bridge = document.querySelector(".bridge");
const label = document.querySelector(".label");
bridge.style.width = "600px";

// A visitor's name, exactly as they typed it into a form.
const visitorName = '<img src="missing.png" onerror="document.querySelector(\\'.bridge\\').remove()">';

label.innerHTML = "Welcome, " + visitorName;
`,
    rubric: (ctx) => {
      if (has(ctx.js, /label\.textContent\s*=/) && !has(ctx.js, /innerHTML/)) return { gold: true };
      return { gold: false, note: "Solved — the safe fix was textContent." };
    },
  },

  {
    id: "js-32-classlist",
    chapter: 4,
    number: 32,
    title: "The Locked Gate",
    concept: "classList: add, remove, toggle, contains",
    edit: "js",
    learn: "Switch CSS classes on and off with classList.add, remove, toggle and contains.",
    objective: "The gate is opened and immediately closed again by a double toggle, and the lock check misspells the class. Fix both.",
    lesson: [
      "**`classList`** is the best way to change how an element looks from JavaScript: the CSS says what each class looks like, and your code says which classes apply.",
      "`add(\"open\")` adds a class, `remove(\"open\")` takes it away, `toggle(\"open\")` adds it if it's missing and removes it if it's there, and `contains(\"open\")` returns `true` or `false`.",
      "Two things trip people up. **Toggling twice** puts things back where they started. And class names are **case-sensitive**: `\"Locked\"` and `\"locked\"` are different classes.",
      "Here the CSS keeps a gate shut while it has `locked`, even if it's `open`. So the gate needs `open` added *and* `locked` removed.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "menu.classList.add(\"visible\");", note: "add" },
        { code: "menu.classList.remove(\"visible\");", note: "remove" },
        { code: "menu.classList.toggle(\"visible\");", note: "flip it" },
        { code: "if (menu.classList.contains(\"visible\")) …", note: "check" },
      ],
    },
    steps: [
      "Log `gate.className` after the toggles.",
      "Delete the second `toggle` line (or use `add(\"open\")` once).",
      "Fix the check: `contains(\"locked\")`, lower-case.",
      "Press **Run** and walk through.",
    ],
    reference: {
      title: "classList",
      syntax: "el.classList.add(\"name\")",
      entries: [
        { value: "add / remove", meaning: "turn a class on / off" },
        { value: "toggle", meaning: "flip it; twice = no change" },
        { value: "contains", meaning: "true if the class is there (case-sensitive)" },
      ],
    },
    hints: [
      "The gate doesn't move. Log `gate.className` at the end.",
      "Is `open` in the class list? Is `locked` still there?",
      "Two toggles cancel out, and `contains(\"Locked\")` never matches `locked`, so it's never removed.",
      "toggle flips a class each time it's called. contains and remove use the exact, case-sensitive class name.",
      "Remove one `toggle` line and change `\"Locked\"` to `\"locked\"`. Press Run.",
    ],
    debrief: {
      rule: "classList.add/remove/toggle/contains switch CSS on and off. Toggle twice cancels out; names are case-sensitive.",
      seenIn: "Dark mode is often `document.body.classList.toggle(\"dark\")`.",
      fableLine: "Unlock it, then open it — once.",
    },
    quiz: {
      question: "An element has class \"a\". After `toggle(\"a\"); toggle(\"b\"); toggle(\"a\");` its classes are…",
      options: ["\"a\"", "\"b\"", "\"a b\"", "none"],
      answer: 2,
      explain: "a is removed then added back; b is added. So: \"a b\".",
    },
    html: gate32.html.replace('<div class="gate"></div>', '<div class="gate locked"></div>'),
    css: gate32.css,
    js: `const gate = document.querySelector(".gate");

// Open the gate.
gate.classList.toggle("open");
gate.classList.toggle("open");

// A locked gate won't budge — unlock it.
if (gate.classList.contains("Locked")) {
  gate.classList.remove("locked");
}

console.log("gate classes:", gate.className);
`,
    rubric: (ctx) => {
      if (has(ctx.js, /contains\s*\(\s*["']locked["']\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson kept the contains check, with the right class name." };
    },
  },

  {
    id: "js-33-style-attributes",
    chapter: 4,
    number: 33,
    title: "Units and Attributes",
    concept: "setting style and attributes",
    edit: "js",
    learn: "Set inline styles from JavaScript with units, and read and write attributes.",
    objective: "The code reads the plank count from the wrong attribute and sets a width without a unit. Fix both.",
    lesson: [
      "**`element.style.property = value`** sets an inline CSS style. Property names are **camelCase**: `background-color` becomes `style.backgroundColor`.",
      "Values are CSS strings, **units included**: `style.width = \"600px\"`. A bare number like `style.width = 600` is invalid CSS and silently ignored.",
      "**Attributes** are the `name=\"value\"` pairs in HTML. `getAttribute(\"data-planks\")` reads one (as a **string**, or `null` if it doesn't exist), `setAttribute(name, value)` writes one, `removeAttribute(name)` deletes it.",
      "For `data-*` attributes there's a shortcut: `element.dataset.planks` reads `data-planks`. Dashes become camelCase: `data-plank-width` → `dataset.plankWidth`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "box.style.backgroundColor = \"teal\";", note: "camelCase property" },
        { code: "box.style.width = 200 + \"px\";", note: "always include the unit" },
        { code: "link.setAttribute(\"href\", \"/help\");", note: "write an attribute" },
        { code: "card.dataset.id  // reads data-id", note: "dataset shortcut" },
      ],
    },
    steps: [
      "Log `planks` — it's `null`.",
      "Fix the attribute name to `\"data-planks\"` (it has an s).",
      "Add the unit: `planks * 50 + \"px\"`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Styles and attributes",
      syntax: "el.style.width = \"10px\";  el.getAttribute(\"name\")",
      entries: [
        { value: "style.camelCase", meaning: "inline CSS; needs units" },
        { value: "get/setAttribute", meaning: "read/write any attribute (strings)" },
        { value: "dataset.name", meaning: "read/write data-name" },
      ],
    },
    hints: [
      "The bridge has no width. Log `planks` and the width value.",
      "`planks` is null. Which attribute does the HTML actually have?",
      "The HTML says `data-planks`, and the width is set to a plain number with no `px`.",
      "getAttribute needs the exact attribute name, and style values need CSS units — a number alone is ignored.",
      "Use `bridge.getAttribute(\"data-planks\")` and `bridge.style.width = planks * 50 + \"px\";`. Press Run.",
    ],
    debrief: {
      rule: "Inline styles need CSS units and camelCase names. Attributes are strings — getAttribute returns null for a name that isn't there.",
      seenIn: "A progress bar: `bar.style.width = percent + \"%\"` and `bar.setAttribute(\"aria-valuenow\", percent)`.",
      fableLine: "Six hundred what? Say the unit.",
    },
    quiz: {
      question: "Which line actually changes the width?",
      options: ["el.style.width = 300", "el.style.width = \"300\"", "el.style.width = \"300px\"", "el.width = \"300px\""],
      answer: 2,
      explain: "CSS lengths need a unit. 300 and \"300\" are ignored for width.",
    },
    html: bridge33.html.replace('<div class="bridge"></div>', '<div class="bridge" data-planks="12"></div>'),
    css: bridge33.css,
    js: `const bridge = document.querySelector(".bridge");

// How many planks? It's written on the bridge's data attribute.
const planks = bridge.getAttribute("data-plank");
console.log("planks:", planks);

// Each plank is 50px wide.
bridge.style.width = planks * 50;
bridge.setAttribute("aria-label", planks + " planks");
`,
    rubric: (ctx) => {
      if (has(ctx.js, /getAttribute\s*\(\s*["']data-planks["']\s*\)|dataset\.planks/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson read the data-planks attribute." };
    },
  },

  {
    id: "js-34-create-traverse",
    chapter: 4,
    number: 34,
    title: "Out of the Box",
    concept: "createElement, append, remove, traversal",
    edit: "js",
    learn: "Create elements, put them in the right place, remove them — and move around with parentElement, children and closest.",
    objective: "New stones are built from the kit, but they're appended inside the hidden kit, where nobody can see them. Put them on the page.",
    lesson: [
      "**`document.createElement(\"div\")`** makes a new element that isn't on the page yet. **`parent.append(child)`** puts it inside `parent`, at the end. **`element.remove()`** takes an element off the page.",
      "*Where* you append matters: an element inherits its parent's situation. Append into something with `display: none`, and your new element is invisible too.",
      "**Traversal** means moving from one element to its relatives: `el.parentElement` is its parent, `el.children` its child elements, and `el.closest(\".kit\")` the nearest ancestor (or itself) matching a selector.",
      "`children` is a live list you can loop with `for...of`. `closest` is the go-to for “which card was this button in?”.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const li = document.createElement(\"li\");", note: "make it" },
        { code: "li.textContent = \"New item\";", note: "fill it" },
        { code: "list.append(li);", note: "put it on the page" },
        { code: "button.closest(\".card\").remove();", note: "find its card, remove it" },
      ],
    },
    steps: [
      "Log `kit.children.length` and check where each stone is appended.",
      "Change `part.append(stone)` to `document.body.append(stone)`.",
      "Tidy up: `kit.remove()` removes just the kit.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Building and moving",
      syntax: "parent.append(document.createElement(\"div\"))",
      entries: [
        { value: "createElement / append / remove", meaning: "make / attach / detach" },
        { value: "parentElement, children", meaning: "up one level / one level down" },
        { value: "closest(selector)", meaning: "nearest matching ancestor" },
      ],
    },
    hints: [
      "Nothing appears — but no errors either. The stones exist somewhere.",
      "Which element are the stones appended to? Is that element visible?",
      "They go inside each `.part`, and the parts (in the kit) are `display: none`.",
      "A child inside a hidden element is hidden too. Append the stones somewhere visible, like `document.body`.",
      "Use `document.body.append(stone);` inside the loop and `kit.remove();` after it. Press Run.",
    ],
    debrief: {
      rule: "createElement makes, append places, remove deletes. parentElement, children and closest move around the tree.",
      seenIn: "Deleting a row from a table: `event.target.closest(\"tr\").remove()`.",
      fableLine: "Take the stones out of the box before you lay the road.",
    },
    quiz: {
      question: "Which finds the nearest `.card` above a button (or the button itself)?",
      options: ["button.parentElement", "button.closest(\".card\")", "button.children", "document.querySelector(\".card\")"],
      answer: 1,
      explain: "closest walks up the ancestors and returns the first that matches.",
    },
    html: `<div class="ledge start">start</div>
<div class="workshop">
  <ul class="kit">
    <li class="part" data-x="240">part</li>
    <li class="part" data-x="420">part</li>
    <li class="part" data-x="600">part</li>
  </ul>
</div>
<div class="ledge goal">goal</div>
`,
    css: `/* The kit is packed away: nothing inside it is shown. */
.kit {
  display: none;
}

.stone {
  position: absolute;
  bottom: 140px;
  width: 100px;
  height: 30px;
  background: ${LOOKS.lime.fill};
  border: 4px solid ${LOOKS.lime.edge};
  border-radius: 8px;
  box-sizing: border-box;
}

.ledge {
  position: absolute;
  bottom: 140px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; width: 120px; }
.goal { left: 780px; width: 100px; }
${DECOR}`,
    js: `const kit = document.querySelector(".kit");
console.log("parts in the kit:", kit.children.length);

// Build a stone for every part in the kit.
for (const part of kit.children) {
  const stone = document.createElement("div");
  stone.className = "stone";
  stone.style.left = part.dataset.x + "px";
  part.append(stone);
}

// Tidy up: remove the empty kit's box.
kit.parentElement.remove();
`,
    rubric: (ctx) => {
      if (has(ctx.js, /body\.append\s*\(\s*stone\s*\)/) && has(ctx.js, /kit\.remove\s*\(\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson appended stones to the page and removed just the kit." };
    },
  },

  {
    id: "js-35-form-values",
    chapter: 4,
    number: 35,
    title: "Read the Form",
    concept: "form values and reading input",
    edit: "js",
    learn: "Read what's in a form: .value for fields and selects, .checked for checkboxes.",
    objective: "The form says 600 and rails are ticked, but the code reads the wrong properties. Read the form correctly.",
    lesson: [
      "Form fields keep what the user entered in **properties**, not in their text:",
      "**`input.value`** is what's typed in a text or number field (always a **string** — convert with `Number(…)` for maths). **`select.value`** is the chosen option's value.",
      "**`checkbox.checked`** is `true` or `false`. A checkbox's `.value` is just its label value (usually `\"on\"`), whether ticked or not — a classic bug.",
      "**`textContent`** of an `<input>` is always empty; inputs have no text inside them.",
      "In a real form you'd read these inside a `submit` or `input` event handler. Here the values are already filled in, so you can read them straight away.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "const age = Number(ageInput.value);", note: "typed text → number" },
        { code: "const size = sizeSelect.value;", note: "chosen option" },
        { code: "if (terms.checked) { … }", note: "ticked or not" },
        { code: "terms.value // \"on\" either way", note: "not what you want" },
      ],
    },
    steps: [
      "Log `spanInput.textContent` and `rails.value`.",
      "Read the width with `Number(spanInput.value)`.",
      "Check the checkbox with `rails.checked`.",
      "Press **Run** and cross.",
    ],
    reference: {
      title: "Reading forms",
      syntax: "input.value   checkbox.checked   select.value",
      entries: [
        { value: ".value", meaning: "text/number/select contents (a string)" },
        { value: ".checked", meaning: "checkbox/radio: true or false" },
        { value: "Number(str)", meaning: "convert typed text for maths" },
      ],
    },
    hints: [
      "The bridge never gets a width. Log both values being read.",
      "`spanInput.textContent` is `\"\"`, and `rails.value` is `\"on\"` — not `true`.",
      "An input's contents are in `.value`, and a checkbox's state is in `.checked`.",
      "Inputs have no text content; their current contents live in `.value`. Checkboxes report ticked-ness through `.checked`.",
      "Use `Number(spanInput.value)` and `if (rails.checked)`. Press Run.",
    ],
    debrief: {
      rule: "Read fields with `.value` (a string) and checkboxes with `.checked`. Convert numbers with Number().",
      seenIn: "A mortgage calculator reads `Number(amount.value)` from each field and redraws on every `input` event.",
      fableLine: "The form was filled in — you only had to read it.",
    },
    quiz: {
      question: "A checkbox is not ticked. What is `box.checked`?",
      options: ["\"off\"", "false", "\"\"", "null"],
      answer: 1,
      explain: "checked is a boolean: false when unticked.",
    },
    html: `${bridge35.html}<form class="settings">
  <label>Width <input id="span" type="number" value="600"></label>
  <label><input id="rails" type="checkbox" checked> Rails</label>
</form>
`,
    css: `${bridge35.css}
/* The settings form, up in the corner. */
.settings {
  position: absolute;
  left: 300px;
  bottom: 400px;
  display: flex;
  gap: 14px;
  padding: 10px 14px;
  font: 14px system-ui, sans-serif;
  background: #f4fbef;
  border: 3px solid #2f6b3a;
  border-radius: 8px;
}
.settings input[type="number"] { width: 70px; }
`,
    js: `const bridge = document.querySelector(".bridge");
const spanInput = document.querySelector("#span");
const rails = document.querySelector("#rails");

// Read the form.
const width = spanInput.textContent;
console.log("width:", width, "rails:", rails.value);

// Only build the bridge when rails are ticked.
if (rails.value === true) {
  bridge.style.width = width + "px";
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /spanInput\.value/) && has(ctx.js, /rails\.checked/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson read `.value` and `.checked`." };
    },
  },

  {
    id: "js-36-event-object",
    chapter: 4,
    number: 36,
    title: "Which Lever Was It?",
    concept: "addEventListener, the event object, common events",
    edit: "js",
    learn: "Listen for click, input, change and more — and use the event object to see what happened.",
    objective: "The lever's listener is registered for a misspelt event, and the handler reads the target from the wrong place. Fix both, then click the lever.",
    lesson: [
      "**`element.addEventListener(type, handler)`** runs `handler` every time the event happens. Common types: `\"click\"`, `\"input\"` (a field's text changes, on every keystroke), `\"change\"` (a select, checkbox, or field is committed), `\"submit\"` (a form is sent), `\"keydown\"` (a key is pressed).",
      "Event names are exact, lower-case strings. A typo like `\"clik\"` is **not an error** — the listener simply waits for an event that never happens.",
      "The handler receives an **event object**. `event.target` is the element the event happened on; `event.currentTarget` is the element the listener was added to. Keyboard events have `event.key`, and mouse events have coordinates.",
      "Data lives on the element, not the event: `event.target.dataset.gate`, not `event.dataset.gate`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "button.addEventListener(\"click\", (event) => {", note: "" },
        { code: "  console.log(event.target.id);", note: "what was clicked" },
        { code: "});", note: "" },
        { code: "field.addEventListener(\"input\", (e) => show(e.target.value));", note: "every keystroke" },
      ],
    },
    steps: [
      "Fix the event name: `\"click\"`.",
      "Inside `handle`, read `event.target.dataset.gate`.",
      "Press **Run**, then click the gold lever in the world.",
      "Walk through the open gate.",
    ],
    reference: {
      title: "Events",
      syntax: "el.addEventListener(\"click\", (event) => { … })",
      entries: [
        { value: "click / input / change", meaning: "pressed / typing / committed" },
        { value: "submit / keydown", meaning: "form sent / key pressed" },
        { value: "event.target", meaning: "the element it happened on" },
      ],
    },
    hints: [
      "Clicking the lever does nothing, and there's no error.",
      "Which event type is the listener waiting for? Is that a real event?",
      "It's `\"clik\"`. Once that's fixed, the handler errors: `event.dataset` doesn't exist.",
      "Event types must be spelled exactly. The event object points at the element through `event.target`, and the data attribute lives on the element.",
      "Use `addEventListener(\"click\", handle)` and `event.target.dataset.gate`. Press Run, then click the lever.",
    ],
    debrief: {
      rule: "Listen with exact event names. The handler gets an event object; `event.target` is the element involved.",
      seenIn: "A search box that filters results as you type listens for `input` and reads `event.target.value`.",
      fableLine: "Pull the lever — and know which lever you pulled.",
    },
    quiz: {
      question: "Which event fires on every keystroke in a text field?",
      options: ["change", "input", "submit", "click"],
      answer: 1,
      explain: "input fires for each change to the value; change waits until the field is committed.",
    },
    ...(() => {
      const w = gateWorld(LOOKS.ember, "gate", `<div class="lever" data-gate=".gate"></div>`, LEVER_CSS);
      return w;
    })(),
    js: `const lever = document.querySelector(".lever");

function handle(event) {
  // Which gate does this lever open? It's in the lever's data-gate.
  const which = event.dataset.gate;
  document.querySelector(which).classList.add("open");
}

lever.addEventListener("clik", handle);
`,
    rubric: (ctx) => {
      if (has(ctx.js, /["']click["']/) && has(ctx.js, /event\.(target|currentTarget)\.dataset/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson used the event object's target." };
    },
  },

  {
    id: "js-37-prevent-stop",
    chapter: 4,
    number: 37,
    title: "Don't Follow the Link",
    concept: "preventDefault and stopPropagation",
    edit: "js",
    learn: "Stop the browser's default action with preventDefault, and stop an event travelling further with stopPropagation.",
    objective: "Clicking the lever follows its link, which re-locks the gate — and the click also reaches the panel, which closes it. Stop both.",
    lesson: [
      "Many events come with a **default action** the browser performs afterwards: clicking a link navigates, submitting a form reloads the page, pressing Space scrolls, ticking a checkbox ticks it.",
      "**`event.preventDefault()`** cancels that default. It's essential for `submit` handlers: without it, the form sends and the page reloads before your code's result can be seen.",
      "Events also **travel**: a click on the lever is also a click on its parent panel, and the panel's page, and so on (this is *bubbling* — the next lesson). **`event.stopPropagation()`** stops the event reaching those ancestors.",
      "They're independent: one stops the browser's behaviour, the other stops other listeners. Here you need both.",
      "`keydown` works the same way: `if (event.key === \"Enter\") event.preventDefault();`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "form.addEventListener(\"submit\", (e) => {", note: "" },
        { code: "  e.preventDefault();", note: "don't reload the page" },
        { code: "  save();", note: "" },
        { code: "});", note: "" },
        { code: "button.addEventListener(\"click\", (e) => e.stopPropagation());", note: "parent won't hear it" },
      ],
    },
    steps: [
      "In the lever's handler, add `event.preventDefault();` so the link isn't followed.",
      "Add `event.stopPropagation();` so the panel doesn't hear the click.",
      "Press **Run**, then click the lever.",
      "Walk through.",
    ],
    reference: {
      title: "Controlling events",
      syntax: "event.preventDefault();  event.stopPropagation();",
      entries: [
        { value: "preventDefault", meaning: "cancel the browser's default action" },
        { value: "stopPropagation", meaning: "don't pass the event to ancestors" },
        { value: "submit", meaning: "almost always needs preventDefault" },
      ],
    },
    hints: [
      "The lever runs its code — but the gate stays shut.",
      "What else happens when you click a link? And who else is listening for clicks?",
      "The link jumps to `#gate`, and the CSS keeps a targeted gate tall. The panel's listener also closes the gate.",
      "preventDefault stops the browser following the link. stopPropagation stops the click bubbling up to the panel.",
      "Add `event.preventDefault();` and `event.stopPropagation();` inside the lever's handler. Press Run, then click the lever.",
    ],
    debrief: {
      rule: "preventDefault cancels the browser's own action; stopPropagation stops the event reaching ancestors' listeners.",
      seenIn: "Every single-page app's form handler starts with `event.preventDefault()`.",
      fableLine: "Answer the knock yourself, and don't wake the house.",
    },
    quiz: {
      question: "A form reloads the page when submitted. Which fixes it?",
      options: ["event.stopPropagation()", "event.preventDefault()", "return true", "removeEventListener"],
      answer: 1,
      explain: "Reloading is the submit event's default action, which preventDefault cancels.",
    },
    ...(() => {
      const w = gateWorld(
        LOOKS.rose,
        "gate",
        `<div class="panel"><a class="lever" href="#gate">lever</a></div>`,
        `.panel {
  position: absolute;
  left: 200px;
  bottom: 130px;
  width: 90px;
  height: 60px;
}
${LEVER_CSS.replace(".lever {", ".lever {\n  display: block;\n  font-size: 0;").replace("left: 220px;\n  bottom: 130px;", "left: 20px;\n  bottom: 0;")}

/* A gate that the page has jumped to (#gate) stays shut. */
#gate:target {
  height: 260px;
}`,
      );
      return { ...w, html: w.html.replace('<div class="gate"></div>', '<div class="gate" id="gate"></div>') };
    })(),
    js: `const gate = document.querySelector(".gate");
const lever = document.querySelector(".lever");
const panel = document.querySelector(".panel");

// Clicking anywhere on the panel resets the gate.
panel.addEventListener("click", () => {
  gate.classList.remove("open");
});

// The lever opens it.
lever.addEventListener("click", (event) => {
  gate.classList.add("open");
});
`,
    rubric: (ctx) => {
      if (has(ctx.js, /preventDefault\s*\(\s*\)/) && has(ctx.js, /stopPropagation\s*\(\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson used both preventDefault and stopPropagation." };
    },
  },

  {
    id: "js-38-delegation",
    chapter: 4,
    number: 38,
    title: "One Listener for Many",
    concept: "bubbling and event delegation",
    edit: "js",
    learn: "Use event bubbling to handle clicks on many elements — even ones created later — with one listener on their parent.",
    objective: "Listeners are attached to switches before the switches exist, so clicking them does nothing. Listen on the board instead, then flip all three.",
    lesson: [
      "When you click an element, the event fires on it and then **bubbles** up through every ancestor: the switch, the board, the body, the document. Each can listen.",
      "That enables **event delegation**: put **one** listener on a parent, and inside it work out which child was clicked with `event.target.closest(\".switch\")`.",
      "Delegation has two big advantages. One listener instead of hundreds. And it works for children **added later** — a listener attached with `querySelectorAll(...).forEach` only reaches the elements that existed at that moment.",
      "Always check the result of `closest`: a click on the board's empty space gives `null`.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "list.addEventListener(\"click\", (e) => {", note: "one listener on the parent" },
        { code: "  const item = e.target.closest(\"li\");", note: "which child?" },
        { code: "  if (!item) return;", note: "clicked empty space" },
        { code: "  item.classList.toggle(\"done\");", note: "" },
        { code: "});", note: "" },
      ],
    },
    steps: [
      "Delete the `querySelectorAll(\".switch\").forEach(…)` line.",
      "Add one listener on `board` that finds `event.target.closest(\".switch\")` and calls `flip` with it.",
      "Press **Run**, then click all three switches.",
      "Walk through.",
    ],
    reference: {
      title: "Delegation",
      syntax: "parent.addEventListener(\"click\", e => e.target.closest(sel))",
      entries: [
        { value: "bubbling", meaning: "events travel up to every ancestor" },
        { value: "delegation", meaning: "one listener on a parent handles its children" },
        { value: "closest + null check", meaning: "find the clicked child safely" },
      ],
    },
    hints: [
      "Clicking the switches does nothing at all.",
      "When the `forEach` line runs, how many `.switch` elements are on the page?",
      "None — the switches are created further down, after the listeners were attached.",
      "Listeners only attach to elements that exist at that moment. A listener on the board hears clicks from any switch inside it, whenever it was created.",
      "Write `board.addEventListener(\"click\", (event) => { const s = event.target.closest(\".switch\"); if (s) flip(s); });`. Press Run and click all three.",
    ],
    debrief: {
      rule: "Events bubble to ancestors. Listen on a parent and use `event.target.closest()` to handle any child, including new ones.",
      seenIn: "A to-do list where new items work immediately uses one delegated listener on the list.",
      fableLine: "Stand at the crossroads, and every traveller passes you.",
    },
    quiz: {
      question: "Why does delegation work for elements created later?",
      options: ["Listeners copy themselves", "The listener is on a parent that already exists", "querySelectorAll updates itself", "It doesn't"],
      answer: 1,
      explain: "Clicks on new children still bubble to the parent, which had the listener all along.",
    },
    ...(() => {
      const w = gateWorld(
        LOOKS.teal,
        "gate",
        `<div class="board"></div>`,
        `.board {
  position: absolute;
  left: 150px;
  bottom: 130px;
  display: flex;
  gap: 16px;
}
.switch {
  width: 40px;
  height: 40px;
  background: #cfd8dc;
  border: 4px solid #455a64;
  border-radius: 50%;
  box-sizing: border-box;
  cursor: pointer;
}
.switch.on {
  background: #6fd6c4;
  border-color: #1f6e62;
}`,
      );
      return w;
    })(),
    js: `const board = document.querySelector(".board");
const gate = document.querySelector(".gate");

function flip(sw) {
  sw.classList.add("on");
  // The gate opens once all three switches are on.
  if (board.querySelectorAll(".switch.on").length === 3) {
    gate.classList.add("open");
  }
}

// Listen for clicks on each switch...
document.querySelectorAll(".switch").forEach((sw) => {
  sw.addEventListener("click", () => flip(sw));
});

// ...then build the three switches.
for (let i = 0; i < 3; i++) {
  const sw = document.createElement("div");
  sw.className = "switch";
  board.append(sw);
}
`,
    rubric: (ctx) => {
      if (has(ctx.js, /board\.addEventListener\s*\(/) && has(ctx.js, /closest\s*\(/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson delegated the clicks to the board with closest()." };
    },
  },

  {
    id: "js-39-remove-listeners",
    chapter: 4,
    number: 39,
    title: "The Alarm That Won't Stop",
    concept: "removing event listeners",
    edit: "js",
    learn: "Remove a listener with removeEventListener — using the exact same function — or use { once: true }.",
    objective: "An alarm listener closes the gate on every click. The code tries to remove it, but passes a different function. Remove the real one, then click the lever.",
    lesson: [
      "**`element.removeEventListener(type, handler)`** stops a listener — but only if you pass the **very same function** you added.",
      "`removeEventListener(\"click\", () => alarm())` creates a *brand-new* arrow function that was never added, so nothing is removed. No error, nothing happens.",
      "That's why listeners you'll want to remove should be **named** functions (or stored in a variable): `removeEventListener(\"click\", alarm)`.",
      "For a listener that should only ever run once, pass an option instead: `addEventListener(\"click\", handler, { once: true })` removes itself after the first event.",
      "Removing listeners you no longer need matters in long-lived pages: forgotten listeners keep running and keep objects in memory.",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "function onScroll() { … }", note: "a named function" },
        { code: "window.addEventListener(\"scroll\", onScroll);", note: "" },
        { code: "window.removeEventListener(\"scroll\", onScroll);", note: "same function: removed" },
        { code: "btn.addEventListener(\"click\", go, { once: true });", note: "runs once" },
      ],
    },
    steps: [
      "Find `lever.removeEventListener(\"click\", () => alarm());`.",
      "Pass the real function: `lever.removeEventListener(\"click\", alarm);`.",
      "Press **Run**, then click the lever.",
      "Walk through.",
    ],
    reference: {
      title: "Removing listeners",
      syntax: "el.removeEventListener(type, sameFunction)",
      entries: [
        { value: "same function", meaning: "required — a new arrow won't match" },
        { value: "named handlers", meaning: "make removal possible" },
        { value: "{ once: true }", meaning: "auto-remove after the first event" },
      ],
    },
    hints: [
      "Clicking the lever does nothing visible — but the open code *does* run.",
      "How many listeners respond to a click on the lever? What does the second one do?",
      "`alarm` runs after the opener and closes the gate. The removal line is supposed to stop it, but doesn't.",
      "removeEventListener compares functions by identity. `() => alarm()` is a new function, so it matches nothing. Pass `alarm` itself.",
      "Write `lever.removeEventListener(\"click\", alarm);`, press Run, then click the lever.",
    ],
    debrief: {
      rule: "removeEventListener needs the identical function that was added. Name your handlers, or use `{ once: true }`.",
      seenIn: "Closing a modal should remove its `keydown` listener for Escape — otherwise it keeps firing on every page.",
      fableLine: "To silence the bell, cut the rope that's tied to it.",
    },
    quiz: {
      question: "Why does `el.removeEventListener(\"click\", () => go())` not remove `go`?",
      options: ["Arrows can't be removed", "It's a different function from the one added", "It needs { once: true }", "click can't be removed"],
      answer: 1,
      explain: "A new arrow function is a new object; removal matches the exact function reference.",
    },
    ...gateWorld(LOOKS.copper, "gate", `<div class="lever"></div>`, LEVER_CSS),
    js: `const lever = document.querySelector(".lever");
const gate = document.querySelector(".gate");

// The lever opens the gate.
lever.addEventListener("click", () => {
  gate.classList.add("open");
});

// An old alarm that closes the gate on every click.
function alarm() {
  gate.classList.remove("open");
}
lever.addEventListener("click", alarm);

// Switch the alarm off:
lever.removeEventListener("click", () => alarm());
`,
    rubric: (ctx) => {
      if (has(ctx.js, /removeEventListener\s*\(\s*["']click["']\s*,\s*alarm\s*\)/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson removed the listener by passing `alarm` itself." };
    },
  },

  {
    id: "js-40-event-loop-timers",
    chapter: 4,
    number: 40,
    title: "Later Means Later",
    concept: "the event loop, setTimeout and setInterval",
    edit: "js",
    learn: "Understand that timer callbacks run later, after the current code finishes — and use setInterval with clearInterval.",
    objective: "The interval raises the lift's height number step by step, but the style is set once, before the first tick. Set it inside the interval.",
    lesson: [
      "JavaScript runs one thing at a time. Your code runs **top to bottom, all the way to the end**. Only then does the browser handle anything that was scheduled for later. This scheduling system is the **event loop**.",
      "**`setTimeout(fn, ms)`** runs `fn` once, at least `ms` milliseconds later. **`setInterval(fn, ms)`** runs it repeatedly until you call **`clearInterval(id)`** with the id it returned.",
      "Even `setTimeout(fn, 0)` waits until the current code has finished. So a line *after* a timer runs *before* the timer's callback — using the values from before any tick.",
      "Rule of thumb: anything that depends on the timer's work must happen **inside** the callback (or be called from it).",
    ],
    example: {
      lang: "js",
      lines: [
        { code: "console.log(\"A\");", note: "1st" },
        { code: "setTimeout(() => console.log(\"B\"), 0);", note: "3rd — after the code ends" },
        { code: "console.log(\"C\");", note: "2nd" },
        { code: "const id = setInterval(tick, 500); clearInterval(id);", note: "start / stop repeating" },
      ],
    },
    steps: [
      "Log `bottom` right before the last line — it's still 40.",
      "Move `lift.style.bottom = bottom + \"px\";` inside the interval's callback, after `bottom` changes.",
      "Press **Run** and stay on the lift as it rises.",
      "Step across to the goal.",
    ],
    reference: {
      title: "Timers",
      syntax: "const id = setInterval(fn, ms);  clearInterval(id);",
      entries: [
        { value: "setTimeout(fn, ms)", meaning: "run once, later" },
        { value: "setInterval(fn, ms)", meaning: "run repeatedly until cleared" },
        { value: "event loop", meaning: "callbacks run after the current code finishes" },
      ],
    },
    hints: [
      "The lift never moves, even though the interval is running.",
      "Log inside the interval, and on the last line. Which log comes first?",
      "The last line runs immediately, while `bottom` is still 40. The interval only changes the variable afterwards — nothing ever uses the new value.",
      "Timer callbacks run after all your top-level code has finished. Work that depends on the tick has to happen inside the callback.",
      "Cut the `lift.style.bottom` line and paste it inside the interval callback, just after `bottom = bottom + 40;`. Press Run.",
    ],
    debrief: {
      rule: "Timer callbacks run later, after the current code finishes. Do the dependent work inside the callback; stop intervals with clearInterval.",
      seenIn: "A countdown timer updates the page inside a setInterval callback, and clears it at zero.",
      fableLine: "The bell rang after you had already left the room.",
    },
    quiz: {
      question: "In what order do these log? `setTimeout(() => log(1), 0); log(2);`",
      options: ["1 then 2", "2 then 1", "only 2", "at the same time"],
      answer: 1,
      explain: "The timeout callback waits until the current code finishes, so 2 logs first.",
    },
    ...liftWorld(LOOKS.sky, "lift"),
    js: `const lift = document.querySelector(".lift");
let bottom = 40;

// Raise the lift 40px every 200ms, until it reaches 200px.
const timer = setInterval(() => {
  bottom = bottom + 40;
  if (bottom >= 200) {
    clearInterval(timer);
  }
}, 200);

lift.style.bottom = bottom + "px";
`,
    rubric: (ctx) => {
      if (has(ctx.js, /setInterval/) && has(ctx.js, /clearInterval/)) return { gold: true };
      return { gold: false, note: "Solved — the lesson kept the interval and set the style inside it." };
    },
  },
];
