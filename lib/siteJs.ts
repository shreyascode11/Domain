import type { SiteStep } from "./site";

/**
 * What each JavaScript lesson adds to the Anthill Bakery site. Every snippet
 * runs inside its own function (so it can `return` early when the part of
 * the page it needs hasn't been built yet), after the HTML and CSS exist.
 * Shared helpers from the page prelude: $, $$, make(tag, className, text), site.
 */
export const JS_SITE_STEPS: Record<string, SiteStep> = {
  "js-1-let-const": {
    label: "A live greeting",
    detail: "A greeting that changes with the time of day.",
    spot: ".greeting",
    css: `.greeting { font-style: italic; color: #8a5a2e; margin: 0 0 4px; }`,
    js: `const copy = $(".hero-copy");
if (!copy) return;
const hour = new Date().getHours();
let greeting = "Good evening";
if (hour < 12) greeting = "Good morning";
else if (hour < 18) greeting = "Good afternoon";
const p = make("p", "greeting", greeting + " — the ovens are warm.");
const eyebrow = $(".eyebrow");
if (eyebrow) eyebrow.after(p);
else copy.prepend(p);`,
  },
  "js-2-primitive-types": {
    label: "An honest open/closed badge",
    detail: "The badge checks the real hour and says whether you're open.",
    spot: ".badge",
    css: `.badge.live { background: #dcf5e3 !important; color: #17803d !important; } .badge.live::before { content: "● "; } .badge.shut { background: #f3e0dc !important; color: #9a3412 !important; }`,
    js: `const badge = $(".badge");
if (!badge) return;
const hour = new Date().getHours();
const open = typeof hour === "number" && hour >= 7 && hour < 16;
badge.classList.add(open ? "live" : "shut");
badge.textContent = open ? "Open now" : "Opens 7am";`,
  },
  "js-3-reference-types": {
    label: "A happy-hour price",
    detail: "A copy of the special's price data, discounted — the original stays safe.",
    spot: ".card[data-special] .price",
    css: `.price s { color: #a38e76; font-weight: 500; margin-right: 4px; font-size: 0.9em; }`,
    js: `const special = $(".card[data-special]");
if (!special) return;
const base = { name: special.dataset.name, price: Number(special.dataset.price) };
const deal = { ...base, price: Math.round(base.price * 90) / 100 };
const price = $(".price", special);
price.textContent = "";
price.append(make("s", "", "$" + base.price.toFixed(2)), "$" + deal.price.toFixed(2));`,
  },
  "js-4-equality-truthiness": {
    label: "Low-stock tags",
    detail: "Bakes with only a few left get a tag — sold-out ones (0) don't.",
    spot: ".low",
    css: `.low { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: #fff1d6; color: #9a5b00; }`,
    js: `for (const card of $$(".card")) {
  const stock = Number(card.dataset.stock);
  if (stock && stock <= 3) {
    $(".top-line", card)?.append(make("span", "low", "Only " + stock + " left"));
  }
}`,
  },
  "js-5-template-literals": {
    label: "A live footer line",
    detail: "The copyright year and bake count, filled in with a template literal.",
    spot: ".legal",
    js: `const legal = $(".legal");
if (!legal) return;
const year = new Date().getFullYear();
const bakes = $$(".card").length;
legal.textContent = \`© \${year} Anthill Bakery · \${bakes} bakes on today's menu · Built with HTML, CSS and JavaScript\`;`,
  },
  "js-6-operators": {
    label: "A free-delivery note",
    detail: "A ternary works out how much more you need for free delivery.",
    spot: ".delivery",
    css: `.delivery { margin: 18px 0 0; font-size: 0.9rem; color: #6b5444; } .delivery b { color: #c8553d; }`,
    js: `const copy = $(".hero-copy");
if (!copy) return;
const threshold = 20;
const basketTotal = site.total ?? 0;
const left = threshold - basketTotal;
const p = make("p", "delivery");
p.innerHTML = left > 0 ? "Free delivery on orders over <b>$" + threshold + "</b>" : "<b>Free delivery unlocked</b>";
copy.append(p);`,
  },
  "js-7-if-switch": {
    label: "Today's hours highlighted",
    detail: "A switch on the day of the week lights up today's row.",
    spot: ".hours tr.today",
    css: `.hours tr.today td { background: #fde7c2 !important; font-weight: 700; } .today-tag { margin-left: 8px; font-size: 0.72rem; color: #c8553d; text-transform: uppercase; letter-spacing: 0.1em; }`,
    js: `const rows = $$(".hours tr");
if (rows.length < 4) return;
let row;
switch (new Date().getDay()) {
  case 0:
    row = rows[3];
    break;
  case 6:
    row = rows[2];
    break;
  default:
    row = rows[1];
}
row.classList.add("today");
row.cells[0].append(make("span", "today-tag", "Today"));`,
  },
  "js-8-loops": {
    label: "This week's specials",
    detail: "A loop builds the week's specials from an array.",
    spot: ".week",
    css: `.chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; list-style: none; padding: 0; } .chips li { background: #fff; border: 1px solid #ecd9bf; padding: 10px 16px; border-radius: 999px; font-weight: 600; } .chips li b { color: #c8553d; margin-right: 6px; } .week { text-align: center; }`,
    js: `const anchor = $("#menu") ?? $(".hero");
if (!anchor) return;
const section = make("section", "week");
section.innerHTML = "<div class='section-head'><h2>This week's <em>specials</em></h2></div><ul id='week' class='chips'></ul>";
anchor.after(section);
const specials = [["Mon", "Maple twist"], ["Wed", "Pollen scone"], ["Fri", "Double honey bun"], ["Sat", "Brown-butter babka"]];
for (const [day, bake] of specials) {
  const li = make("li");
  li.append(make("b", "", day), bake);
  $("#week").append(li);
}`,
  },
  "js-9-break-continue": {
    label: "An availability count",
    detail: "A loop skips sold-out bakes with continue to count what's available.",
    spot: ".menu-count",
    css: `.menu-count { font-weight: 700; color: #17803d !important; margin-top: 6px; }`,
    js: `const head = $("#menu .section-head");
if (!head) return;
const cards = $$(".card");
let available = 0;
for (const card of cards) {
  if (card.classList.contains("out")) continue;
  available++;
}
head.append(make("p", "menu-count", available + " of " + cards.length + " bakes available right now"));`,
  },
  "js-10-declarations-hoisting": {
    label: "A back-to-top button",
    detail: "A hoisted function builds a button that scrolls back up.",
    spot: ".to-top",
    css: `.to-top { position: fixed; left: 24px; bottom: 24px; z-index: 30; width: 44px; height: 44px; border-radius: 50%; border: 0; background: #fff; color: #2b1d14; font-size: 1.2rem; box-shadow: 0 10px 24px rgba(43, 29, 20, 0.25); cursor: pointer; }`,
    js: `document.body.append(makeTopButton());
function makeTopButton() {
  const button = make("button", "to-top", "↑");
  button.type = "button";
  button.setAttribute("aria-label", "Back to top");
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  return button;
}`,
  },
  "js-11-arrow-functions": {
    label: "Weight tags",
    detail: "Arrow functions turn each bake's weight into a tag.",
    spot: ".weight",
    css: `.weight { font-size: 0.72rem; color: #8a735f; border: 1px solid #ecd9bf; padding: 2px 8px; border-radius: 999px; }`,
    js: `const toLabel = (grams) => grams + " g";
$$(".card").forEach((card) => $(".top-line", card)?.append(make("span", "weight", toLabel(card.dataset.weight))));`,
  },
  "js-12-parameters-return": {
    label: "A breakfast bundle",
    detail: "A function with a default discount and rest prices returns the bundle total.",
    spot: ".bundle",
    css: `.bundle { margin: 22px auto 0; max-width: 560px; text-align: center; padding: 14px 18px; border: 2px dashed #e8a33d; border-radius: 16px; background: #fffaf0; } .bundle b { color: #c8553d; }`,
    js: `const menu = $("#menu");
if (!menu) return;
function bundle(discount = 0.1, ...prices) {
  const total = prices.reduce((sum, p) => sum + p, 0);
  return Math.round(total * (1 - discount) * 100) / 100;
}
const price = bundle(undefined, 3.5, 4, 3);
const box = make("p", "bundle");
box.innerHTML = "Breakfast bundle — bun, croissant and tea for <b>$" + price.toFixed(2) + "</b> (save 10%)";
menu.append(box);`,
  },
  "js-13-scope": {
    label: "An order reference",
    detail: "Block-scoped variables build a reference number for your order.",
    spot: ".ref",
    css: `.ref { font-family: ui-monospace, monospace; font-size: 0.85rem; color: #6b5444; background: #fbf1e3; padding: 6px 10px; border-radius: 8px; display: inline-block; margin: 0 0 12px; }`,
    js: `const form = $(".order");
if (!form) return;
let reference;
{
  const day = new Date().getDate();
  const serial = 1000 + day * 37;
  reference = "ANT-" + serial;
}
const heading = $("h3", form);
const tag = make("p", "ref", "Order ref " + reference);
if (heading) heading.after(tag);
else form.prepend(tag);`,
  },
  "js-14-closures": {
    label: "Like buttons",
    detail: "Each review keeps its own like count in a closure.",
    spot: ".like",
    css: `.like { margin-top: 12px; border: 1px solid #ecd9bf; background: #fff; border-radius: 999px; padding: 5px 12px; font-weight: 700; color: #c8553d; cursor: pointer; }`,
    js: `function makeCounter(start) {
  let count = start;
  return () => ++count;
}
$$(".reviews figure").forEach((figure, i) => {
  const next = makeCounter(12 + i * 7);
  const button = make("button", "like", "♥ " + (12 + i * 7));
  button.type = "button";
  button.addEventListener("click", () => (button.textContent = "♥ " + next()));
  figure.append(button);
});`,
  },
  "js-15-this": {
    label: "Review carousel dots",
    detail: "An object's methods use this to highlight the chosen review.",
    spot: ".dots",
    css: `.dots { display: flex; justify-content: center; gap: 8px; margin-top: 18px; } .dots button { width: 10px; height: 10px; border-radius: 50%; border: 0; background: #e3cfb4; cursor: pointer; padding: 0; } .dots button.on { background: #c8553d; width: 26px; border-radius: 999px; } .reviews figure.active { outline: 2px solid #e8a33d; }`,
    js: `const figures = $$(".reviews figure");
if (!figures.length) return;
const carousel = {
  index: 0,
  dots: make("div", "dots"),
  show(i) {
    this.index = i;
    figures.forEach((f, n) => f.classList.toggle("active", n === this.index));
    [...this.dots.children].forEach((d, n) => d.classList.toggle("on", n === this.index));
  },
};
figures.forEach((_, i) => {
  const dot = make("button");
  dot.type = "button";
  dot.addEventListener("click", () => carousel.show(i));
  carousel.dots.append(dot);
});
$(".reviews").append(carousel.dots);
carousel.show(0);`,
  },
  "js-16-callbacks-hof": {
    label: "A working basket",
    detail: "Every Add button hands a callback to a helper — and the basket counts.",
    spot: ".basket",
    css: `.basket { position: fixed; right: 24px; bottom: 24px; z-index: 30; background: #2b1d14; color: #fff; padding: 12px 20px; border-radius: 999px; font-weight: 700; box-shadow: 0 14px 30px rgba(43, 29, 20, 0.35); display: flex; gap: 10px; align-items: center; } .basket.bump { animation: bump 300ms ease; } @keyframes bump { 50% { transform: scale(1.12); } } .add { background: #2b1d14; color: #fff; border: 0; border-radius: 999px; padding: 8px 16px; font-weight: 700; cursor: pointer; }`,
    js: `const cards = $$(".card");
if (!cards.length) return;
site.basket = [];
const basket = make("div", "basket");
basket.innerHTML = "Basket · <span id='count'>0</span>";
document.body.append(basket);
function onEachAvailableCard(callback) {
  cards.filter((card) => !card.classList.contains("out")).forEach(callback);
}
onEachAvailableCard((card) => {
  const button = make("button", "add", "Add");
  button.type = "button";
  button.addEventListener("click", () => {
    site.basket.push({ name: card.dataset.name, price: Number(card.dataset.price) });
    $("#count").textContent = site.basket.length;
    button.textContent = "Added ✓";
    basket.classList.remove("bump");
    void basket.offsetWidth;
    basket.classList.add("bump");
    document.dispatchEvent(new CustomEvent("basket"));
  });
  $(".row", card)?.append(button);
});`,
  },
  "js-17-array-basics": {
    label: "Popular right now",
    detail: "An array of today's favourites, built with push and read by index.",
    spot: ".popular",
    css: `.popular { font-size: 0.9rem; color: #6b5444; margin: 14px 0 0; } .popular b { color: #2b1d14; }`,
    js: `const copy = $(".hero-copy");
const names = $$(".card").map((c) => c.dataset.name);
if (!copy || names.length < 3) return;
const popular = [];
popular.push(names[0], names[1]);
popular.unshift(names[2]);
const p = make("p", "popular");
p.innerHTML = "Popular right now: <b>" + popular.join(", ") + "</b>";
copy.append(p);`,
  },
  "js-18-splice-slice": {
    label: "A 'show all reviews' button",
    detail: "slice picks the first two reviews to show; the rest wait behind a button.",
    spot: ".more-reviews",
    css: `.reviews figure.hidden-review { display: none; } .more-reviews { display: block; margin: 16px auto 0; border: 2px solid #2b1d14; background: transparent; border-radius: 999px; padding: 8px 18px; font-weight: 700; cursor: pointer; }`,
    js: `const figures = $$(".reviews figure");
if (figures.length < 3) return;
const hidden = figures.slice(2);
hidden.forEach((f) => f.classList.add("hidden-review"));
const button = make("button", "more-reviews", "Show all " + figures.length + " reviews");
button.type = "button";
button.addEventListener("click", () => {
  hidden.splice(0).forEach((f) => f.classList.remove("hidden-review"));
  button.remove();
});
$(".reviews").append(button);`,
  },
  "js-19-map-filter-foreach": {
    label: "Menu filters",
    detail: "Filter chips use map, filter and forEach to show one kind of bake.",
    spot: ".filters",
    css: `.filters { display: flex; justify-content: center; gap: 8px; margin: 0 0 22px; flex-wrap: wrap; } .filters button { border: 1px solid #ecd9bf; background: #fff; padding: 7px 16px; border-radius: 999px; font-weight: 600; cursor: pointer; } .filters button.on { background: #2b1d14; color: #fff; border-color: #2b1d14; } .card.filtered { display: none !important; }`,
    js: `const menu = $(".menu");
if (!menu) return;
const cards = $$(".card");
const types = ["all", ...new Set(cards.map((c) => c.dataset.type))];
const bar = make("div", "filters");
types.forEach((type) => {
  const button = make("button", type === "all" ? "on" : "", type[0].toUpperCase() + type.slice(1));
  button.type = "button";
  button.addEventListener("click", () => {
    [...bar.children].forEach((b) => b.classList.toggle("on", b === button));
    cards.forEach((c) => c.classList.toggle("filtered", type !== "all" && c.dataset.type !== type));
  });
  bar.append(button);
});
menu.before(bar);`,
  },
  "js-20-reduce": {
    label: "A basket total",
    detail: "reduce adds up every item in the basket.",
    spot: ".basket-total",
    css: `.basket-total { color: #f2c26b; }`,
    js: `const basket = $(".basket");
if (!basket || !site.basket) return;
const total = make("span", "basket-total", "$0.00");
basket.append(total);
document.addEventListener("basket", () => {
  site.total = site.basket.reduce((sum, item) => sum + item.price, 0);
  total.textContent = "$" + site.total.toFixed(2);
});`,
  },
  "js-21-find-some-every": {
    label: "A sold-out notice",
    detail: "some and find spot anything sold out, and name it.",
    spot: ".notice",
    css: `.notice { display: inline-block; margin-top: 8px; padding: 6px 14px; border-radius: 999px; background: #fde4df; color: #9a3412 !important; font-size: 0.88rem; font-weight: 600; }`,
    js: `const head = $("#menu .section-head");
const cards = $$(".card");
if (!head || !cards.length) return;
if (cards.some((c) => c.classList.contains("out"))) {
  const out = cards.find((c) => c.classList.contains("out"));
  head.append(make("p", "notice", "Heads up: " + out.dataset.name + " is sold out today"));
} else if (cards.every((c) => Number(c.dataset.stock) > 0)) {
  head.append(make("p", "notice", "Everything is in stock!"));
}`,
  },
  "js-22-sort": {
    label: "Sort by price",
    detail: "A select re-orders the menu with a numeric compare function.",
    spot: ".sort",
    css: `.sort { display: block; margin: 0 auto 18px; padding: 8px 12px; border-radius: 10px; border: 1px solid #e0cbb0; background: #fff; font: inherit; }`,
    js: `const menu = $(".menu");
if (!menu) return;
const select = make("select", "sort");
select.innerHTML = "<option value='featured'>Sort: featured</option><option value='low'>Price: low to high</option><option value='high'>Price: high to low</option>";
const original = $$(".card");
select.addEventListener("change", () => {
  const sorted = [...original];
  if (select.value === "low") sorted.sort((a, b) => a.dataset.price - b.dataset.price);
  if (select.value === "high") sorted.sort((a, b) => b.dataset.price - a.dataset.price);
  sorted.forEach((card) => menu.append(card));
});
menu.before(select);`,
  },
  "js-23-spread-immutability": {
    label: "Clear and undo",
    detail: "Clearing the basket keeps an immutable copy, so you can undo.",
    spot: ".basket-clear",
    css: `.basket-clear { border: 0; background: rgba(255, 255, 255, 0.15); color: #fff; border-radius: 999px; padding: 3px 10px; cursor: pointer; font-weight: 700; }`,
    js: `const basket = $(".basket");
if (!basket || !site.basket) return;
let previous = [];
const button = make("button", "basket-clear", "Clear");
button.type = "button";
button.addEventListener("click", () => {
  if (site.basket.length) {
    previous = [...site.basket];
    site.basket.length = 0;
    button.textContent = "Undo";
  } else {
    site.basket.push(...previous);
    button.textContent = "Clear";
  }
  $("#count").textContent = site.basket.length;
  document.dispatchEvent(new CustomEvent("basket"));
});
basket.append(button);`,
  },
  "js-24-properties-methods": {
    label: "A basket summary",
    detail: "An object with a describe() method lists what's in your basket.",
    spot: ".basket-list",
    css: `.basket-list { position: fixed; right: 24px; bottom: 80px; z-index: 30; background: #fff; border-radius: 14px; padding: 10px 14px; font-size: 0.85rem; box-shadow: 0 12px 28px rgba(43, 29, 20, 0.2); max-width: 240px; }`,
    js: `if (!site.basket) return;
const list = make("div", "basket-list", "Your basket is empty");
document.body.append(list);
const summary = {
  items: site.basket,
  describe() {
    if (!this.items.length) return "Your basket is empty";
    const counts = {};
    for (const item of this.items) counts[item.name] = (counts[item.name] ?? 0) + 1;
    return Object.keys(counts).map((name) => counts[name] + "× " + name).join(", ");
  },
};
document.addEventListener("basket", () => (list.textContent = summary.describe()));`,
  },
  "js-25-object-destructuring": {
    label: "Reviewer avatars",
    detail: "Destructuring pulls each reviewer's name apart into initials.",
    spot: ".avatar",
    css: `.avatar { float: left; width: 38px; height: 38px; margin-right: 10px; border-radius: 50%; background: linear-gradient(160deg, #f6d7a8, #e8a33d); color: #2b1d14; display: grid; place-items: center; font-weight: 800; font-size: 0.85rem; }`,
    js: `$$(".reviews figcaption").forEach((caption) => {
  const person = { name: $("b", caption)?.textContent ?? "", role: $("span", caption)?.textContent ?? "" };
  const { name: fullName = "Guest" } = person;
  const [first = "", last = ""] = fullName.replace(".", "").split(" ");
  caption.prepend(make("span", "avatar", (first[0] ?? "") + (last[0] ?? "")));
});`,
  },
  "js-26-copying-objects": {
    label: "A reset button",
    detail: "The form restores a copy of its default settings.",
    spot: ".reset",
    css: `.reset { margin-left: 10px; border: 0; background: transparent; color: #8a735f; text-decoration: underline; cursor: pointer; }`,
    js: `const form = $(".order");
const submit = form && $("button[type=submit]", form);
if (!submit) return;
const defaults = { name: "", email: "", pickup: "7:00 am", extra: false };
const reset = make("button", "reset", "Reset");
reset.type = "button";
reset.addEventListener("click", () => {
  const draft = { ...defaults };
  $("input[name=name]", form).value = draft.name;
  $("input[name=email]", form) && ($("input[name=email]", form).value = draft.email);
  $("select", form).value = draft.pickup;
  $(".extra input", form) && ($(".extra input", form).checked = draft.extra);
});
submit.after(reset);`,
  },
  "js-27-keys-values-entries": {
    label: "An allergen legend",
    detail: "Object.entries turns an allergen table into chips.",
    spot: ".allergens",
    css: `.allergens { text-align: center; margin-top: 18px; font-size: 0.85rem; color: #6b5444; } .allergens span { display: inline-block; margin: 3px; padding: 3px 10px; border-radius: 999px; background: #f3e6d3; }`,
    js: `const menu = $("#menu");
if (!menu) return;
const allergens = { gluten: "Buns, loaf, croissant", dairy: "Croissant, crumb cake", nuts: "None — we're nut-free" };
const p = make("p", "allergens", "Allergens: ");
for (const [name, items] of Object.entries(allergens)) {
  p.append(make("span", "", name + " — " + items));
}
menu.append(p);`,
  },
  "js-28-optional-chaining": {
    label: "Next pickup slot",
    detail: "Optional chaining reads a schedule that may be missing today.",
    spot: ".slot",
    css: `.slot { font-size: 0.9rem; margin: 0 0 14px; color: #17803d; font-weight: 600; }`,
    js: `const form = $(".order");
if (!form) return;
const schedule = { today: null, tomorrow: { slots: ["7:00 am", "8:30 am"] } };
const next = schedule.today?.slots?.[0] ?? schedule.tomorrow?.slots?.[0] + " tomorrow";
const label = $("label", form);
const p = make("p", "slot", "Next pickup slot: " + next);
if (label) label.before(p);
else form.prepend(p);`,
  },
  "js-29-json": {
    label: "An order receipt",
    detail: "The order is shown as JSON, the way it would be sent.",
    spot: ".receipt",
    css: `.receipt { margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; background: #2b1d14; color: #f7e7cc; font-size: 0.78rem; white-space: pre-wrap; }`,
    js: `const form = $(".order");
if (!form) return;
const pre = make("pre", "receipt");
const update = () => {
  const order = { name: $("input[name=name]", form)?.value || "Ada the ant", pickup: $("select", form)?.value, extraHoney: $(".extra input", form)?.checked ?? false };
  pre.textContent = JSON.stringify(order, null, 2);
};
form.addEventListener("input", update);
form.addEventListener("change", update);
update();
form.append(pre);`,
  },
  "js-30-query-selectors": {
    label: "Numbered cards",
    detail: "querySelectorAll numbers every card on the menu.",
    spot: ".num",
    css: `.card { position: relative; } .num { position: absolute; top: 20px; left: 20px; z-index: 1; background: rgba(255, 255, 255, 0.9); border-radius: 999px; padding: 2px 9px; font-size: 0.75rem; font-weight: 800; color: #2b1d14; }`,
    js: `document.querySelectorAll(".card").forEach((card, i) => {
  card.prepend(make("span", "num", String(i + 1).padStart(2, "0")));
});`,
  },
  "js-31-text-innerhtml": {
    label: "A safe thank-you",
    detail: "Your typed name is echoed back with textContent — never innerHTML.",
    spot: ".thanks",
    css: `.thanks { margin: 0 0 14px; font-weight: 600; color: #8a5a2e; }`,
    js: `const form = $(".order");
const input = form && $("input[name=name]", form);
if (!input) return;
const thanks = make("p", "thanks", "Thanks for ordering ahead!");
input.closest("label").before(thanks);
input.addEventListener("input", () => {
  thanks.textContent = input.value ? "Thanks, " + input.value + "!" : "Thanks for ordering ahead!";
});`,
  },
  "js-32-classlist": {
    label: "A dark-mode toggle",
    detail: "classList.toggle switches the whole site to a night theme.",
    spot: ".theme",
    css: `.theme { border: 1px solid #e0cbb0; background: #fff; border-radius: 999px; padding: 7px 12px; cursor: pointer; font-weight: 700; } body.dark { background: #1d1510 !important; color: #f3e6d3 !important; } body.dark .top { background: rgba(29, 21, 16, 0.9) !important; } body.dark .card, body.dark .order, body.dark .hours-card, body.dark .reviews figure, body.dark .feature { background: #2b211a !important; } body.dark h1, body.dark h2, body.dark h3 { color: #fbe7c4 !important; }`,
    js: `const end = $(".header-end");
if (!end) return;
const button = make("button", "theme", "☾ Dark");
button.type = "button";
button.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  button.textContent = document.body.classList.contains("dark") ? "☀ Light" : "☾ Dark";
});
end.append(button);`,
  },
  "js-33-style-attributes": {
    label: "Star ratings",
    detail: "style.width fills each rating, and aria-label reads it aloud.",
    spot: ".stars",
    css: `.stars { position: relative; display: block; width: 88px; height: 16px; margin-bottom: 10px; background: linear-gradient(90deg, #e3cfb4 0 100%); -webkit-mask: repeating-linear-gradient(90deg, #000 0 14px, transparent 14px 18px); mask: repeating-linear-gradient(90deg, #000 0 14px, transparent 14px 18px); } .stars .fill { position: absolute; inset: 0; background: #e8a33d; }`,
    js: `$$(".reviews figure").forEach((figure) => {
  const rating = Number(figure.dataset.rating);
  const stars = make("span", "stars");
  const fill = make("span", "fill");
  fill.style.width = (rating / 5) * 100 + "%";
  stars.setAttribute("role", "img");
  stars.setAttribute("aria-label", rating + " out of 5 stars");
  stars.append(fill);
  figure.prepend(stars);
});`,
  },
  "js-34-create-traverse": {
    label: "An FAQ section",
    detail: "Questions and answers are created and appended from data.",
    spot: ".faq",
    css: `.faq { max-width: 720px; margin-left: auto !important; margin-right: auto !important; } .faq .q { width: 100%; text-align: left; border: 0; background: #fff; padding: 14px 18px; border-radius: 14px; font: inherit; font-weight: 700; margin-top: 10px; cursor: pointer; box-shadow: 0 1px 0 #efdfca; } .faq .a { display: none; padding: 8px 18px 4px; color: #6b5444; } .faq .item.open .a { display: block; }`,
    js: `const visit = $("#visit");
if (!visit) return;
const faq = make("section", "faq");
faq.innerHTML = "<div class='section-head'><h2>Good <em>questions</em></h2></div>";
const questions = [
  ["Do you bake gluten-free?", "Every Friday, until they're gone."],
  ["Can I order for a party?", "Yes — give us two days and we'll bake anything on the menu."],
  ["Are you really run by ants?", "We prefer “a very busy colony”."],
];
for (const [question, answer] of questions) {
  const item = make("div", "item");
  const q = make("button", "q", question);
  q.type = "button";
  item.append(q, make("p", "a", answer));
  faq.append(item);
}
faq.querySelector(".item").classList.add("open");
visit.before(faq);`,
  },
  "js-35-form-values": {
    label: "A live price estimate",
    detail: "The form's values are read to estimate your order.",
    spot: ".estimate",
    css: `.estimate { margin: 6px 0 14px; font-weight: 700; } .estimate b { color: #c8553d; }`,
    js: `const form = $(".order");
const extra = form && $(".extra", form);
if (!extra) return;
const estimate = make("p", "estimate");
const update = () => {
  const honey = $("input", extra).checked ? 0.5 : 0;
  estimate.innerHTML = "Estimated: <b>$" + (3.5 + honey).toFixed(2) + "</b>";
};
form.addEventListener("change", update);
update();
extra.after(estimate);`,
  },
  "js-36-event-object": {
    label: "A note for the baker",
    detail: "An input listener reads event.target to count characters.",
    spot: ".note",
    css: `.note textarea { width: 100%; min-height: 64px; margin-top: 6px; padding: 10px 12px; border: 1px solid #e0cbb0; border-radius: 10px; font: inherit; } .note small { display: block; text-align: right; color: #8a735f; }`,
    js: `const form = $(".order");
const extra = form && $(".extra", form);
if (!extra) return;
const label = make("label", "note", "Note for the baker");
const box = make("textarea");
box.maxLength = 120;
box.placeholder = "Extra crunchy, please";
const counter = make("small", "", "0 / 120");
box.addEventListener("input", (event) => (counter.textContent = event.target.value.length + " / 120"));
label.append(box, counter);
extra.before(label);`,
  },
  "js-37-prevent-stop": {
    label: "Ordering without a reload",
    detail: "The submit handler calls preventDefault and confirms the order in place.",
    spot: ".order button[type=submit]",
    css: `.order.placed button[type=submit] { background: #17803d !important; }`,
    js: `const form = $(".order");
if (!form) return;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  form.classList.add("placed");
  $("button[type=submit]", form).textContent = "Order placed ✓";
});`,
  },
  "js-38-delegation": {
    label: "An FAQ you can open",
    detail: "One delegated listener opens whichever question you click.",
    spot: ".faq",
    js: `const faq = $(".faq");
if (!faq) return;
faq.addEventListener("click", (event) => {
  const question = event.target.closest(".q");
  if (!question) return;
  question.parentElement.classList.toggle("open");
});`,
  },
  "js-39-remove-listeners": {
    label: "A dismissible banner",
    detail: "The banner's close button listens once, then removes itself.",
    spot: ".banner-close",
    css: `.banner { position: relative; } .banner-close { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #fbe7c4; font-size: 1.1rem; cursor: pointer; }`,
    js: `const banner = $(".banner");
if (!banner) return;
const close = make("button", "banner-close", "✕");
close.type = "button";
close.setAttribute("aria-label", "Dismiss");
close.addEventListener("click", () => banner.remove(), { once: true });
banner.append(close);`,
  },
  "js-40-event-loop-timers": {
    label: "A live clock",
    detail: "setInterval updates the local time every second.",
    spot: ".clock",
    css: `.clock { font-family: ui-monospace, monospace; color: #f2c26b; }`,
    js: `const cols = $(".foot-cols > div");
if (!cols) return;
const clock = make("p", "clock");
const tick = () => (clock.textContent = "Old Town time " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
tick();
setInterval(tick, 1000);
cols.append(clock);`,
  },
  "js-41-promises": {
    label: "Oven status",
    detail: "A promise resolves when the fresh batch is ready.",
    spot: ".oven",
    css: `.hero-art { position: relative; } .oven { position: absolute; top: 22px; left: 22px; z-index: 3; display: inline-flex; align-items: center; gap: 8px; margin: 0; padding: 5px 12px; border-radius: 999px; background: #fff1d6; color: #9a5b00; font-size: 0.85rem; font-weight: 700; } .oven.ready { background: #dcf5e3; color: #17803d; }`,
    js: `const art = $(".hero-art");
if (!art) return;
const oven = make("p", "oven", "Oven: baking…");
art.append(oven);
new Promise((resolve) => setTimeout(() => resolve("fresh batch ready"), 1200))
  .then((status) => {
    oven.textContent = "Oven: " + status;
    oven.classList.add("ready");
  })
  .finally(() => oven.setAttribute("aria-live", "polite"));`,
  },
  "js-42-async-await": {
    label: "A rating summary",
    detail: "An async function awaits the ratings, then shows the average.",
    spot: ".rating",
    css: `.rating { font-weight: 700; color: #8a5a2e !important; }`,
    js: `const head = $(".reviews .section-head");
if (!head) return;
const rating = make("p", "rating", "Loading ratings…");
head.append(rating);
async function loadRatings() {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return [5, 5, 4.7];
}
(async () => {
  try {
    const ratings = await loadRatings();
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    rating.textContent = "★ " + average.toFixed(1) + " average from 1,200 reviews";
  } catch {
    rating.textContent = "Ratings unavailable right now";
  }
})();`,
  },
  "js-43-promise-all": {
    label: "Live stock levels",
    detail: "Every bake's stock is loaded at once with Promise.all.",
    spot: ".stock",
    css: `.stock { font-size: 0.8rem; color: #17803d; font-weight: 700; }`,
    js: `const cards = $$(".card");
if (!cards.length) return;
const loadStock = (card, i) => new Promise((resolve) => setTimeout(() => resolve(Number(card.dataset.stock)), 300 + i * 120));
Promise.all(cards.map(loadStock)).then((levels) => {
  levels.forEach((stock, i) => {
    if (stock > 0) $(".row > div", cards[i])?.append(make("div", "stock", stock + " in stock"));
  });
});`,
  },
  "js-44-fetch": {
    label: "A newsletter signup",
    detail: "The form sends your email in a POST request and shows the reply.",
    spot: ".newsletter",
    css: `.newsletter { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; } .newsletter input { flex: 1 1 140px; padding: 9px 12px; border-radius: 999px; border: 0; font: inherit; } .newsletter button { border: 0; border-radius: 999px; padding: 9px 16px; background: #e8a33d; color: #2b1d14; font-weight: 800; cursor: pointer; } .newsletter-msg { color: #f2c26b; font-size: 0.85rem; margin: 6px 0 0; }`,
    js: `const first = $(".foot-cols > div");
if (!first) return;
const form = make("form", "newsletter");
form.innerHTML = "<input type='email' placeholder='you@example.com' aria-label='Email'><button type='submit'>Subscribe</button>";
const msg = make("p", "newsletter-msg");
async function subscribe(email) {
  // A pretend server: it takes a moment, then accepts any email with an @.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return email.includes("@") ? { ok: true, status: 201 } : { ok: false, status: 400 };
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  msg.textContent = "Subscribing…";
  const res = await subscribe($("input", form).value);
  msg.textContent = res.ok ? "You're on the list ✓" : "That email doesn't look right (" + res.status + ")";
});
first.append(form, msg);`,
  },
  "js-45-loading-error-ui": {
    label: "A delivery map with an error state",
    detail: "The map shows loading, then a helpful error with a fallback link.",
    spot: ".map-card",
    css: `.map-card { margin-top: 18px; padding: 16px; border-radius: 14px; background: repeating-linear-gradient(45deg, #f3e6d3 0 12px, #efdcc3 12px 24px); text-align: center; font-weight: 600; } .map-card.error { background: #fde4df; color: #7a1a10; } .map-card a { color: #c8553d; }`,
    js: `const hours = $(".hours-card");
if (!hours) return;
const card = make("div", "map-card", "Loading delivery map…");
hours.append(card);
(async () => {
  try {
    await new Promise((_, reject) => setTimeout(() => reject(new Error("Map service is unavailable (503)")), 1000));
  } catch (error) {
    card.classList.add("error");
    card.textContent = error.message + ". ";
    const link = make("a", "", "Open directions instead ↗");
    link.href = "https://www.openstreetmap.org";
    link.target = "_blank";
    link.rel = "noopener";
    card.append(link);
  } finally {
    card.setAttribute("aria-busy", "false");
  }
})();`,
  },
  "js-46-modules": {
    label: "A currency switcher",
    detail: "A formatter “module” re-prices the whole menu in another currency.",
    spot: ".currency",
    css: `.currency { margin-left: 4px; border: 1px solid #e0cbb0; border-radius: 999px; padding: 6px 10px; background: #fff; font: inherit; font-weight: 700; }`,
    js: `const end = $(".header-end");
if (!end || !$(".card")) return;
const money = (() => {
  const rates = { USD: 1, EUR: 0.92, GBP: 0.79 };
  const symbols = { USD: "$", EUR: "€", GBP: "£" };
  return { format: (usd, code) => symbols[code] + (usd * rates[code]).toFixed(2) };
})();
const select = make("select", "currency");
select.innerHTML = "<option>USD</option><option>EUR</option><option>GBP</option>";
select.setAttribute("aria-label", "Currency");
select.addEventListener("change", () => {
  $$(".card").forEach((card) => ($(".price", card).textContent = money.format(Number(card.dataset.price), select.value)));
});
end.append(select);`,
  },
  "js-47-storage-console": {
    label: "Welcome back",
    detail: "Your visits are counted in storage and greeted on return.",
    spot: ".visits",
    css: `.visits { font-size: 0.85rem; color: #8a735f; margin: 10px 0 0; }`,
    js: `const copy = $(".hero-copy");
if (!copy) return;
let visits = 1;
try {
  visits = Number(localStorage.getItem("anthill-visits") ?? 0) + 1;
  localStorage.setItem("anthill-visits", String(visits));
} catch {
  // Storage can be unavailable (private mode, sandboxes) — the site still works.
}
console.count("visit");
copy.append(make("p", "visits", visits > 1 ? "Welcome back — this is visit #" + visits : "Welcome! We'll remember you next time."));`,
  },
  "js-48-debugging": {
    label: "A site health check",
    detail: "Errors are caught and reported, so problems never go unnoticed.",
    spot: ".health",
    css: `.health { font-size: 0.82rem; color: #9bd1a8; margin: 8px 0 0; }`,
    js: `const legal = $(".legal");
if (!legal) return;
const health = make("p", "health", "Site health: all systems good ✓");
window.addEventListener("error", (event) => {
  health.textContent = "Site health: we hit a problem (" + event.message + ") and logged it";
  console.error(event.error);
});
legal.after(health);`,
  },
  "js-49-classes-prototypes": {
    label: "A loyalty card",
    detail: "A LoyaltyCard class tracks stamps toward a free bun.",
    spot: ".loyalty",
    css: `.loyalty { max-width: 460px; margin: 40px auto 0; padding: 18px 22px; border-radius: 18px; background: linear-gradient(160deg, #2b1d14, #4a3627); color: #fbe7c4; text-align: center; } .loyalty .stamps { display: flex; justify-content: center; gap: 6px; margin: 10px 0; flex-wrap: wrap; } .loyalty .stamp { width: 26px; height: 26px; border-radius: 50%; border: 2px dashed #a38e76; } .loyalty .stamp.on { background: #e8a33d; border: 2px solid #e8a33d; }`,
    js: `const visit = $("#visit");
if (!visit) return;
class StampCard {
  constructor(total) {
    this.total = total;
    this.stamps = 0;
  }
  stamp() {
    this.stamps = Math.min(this.total, this.stamps + 1);
    return this;
  }
}
class LoyaltyCard extends StampCard {
  constructor(name) {
    super(8);
    this.name = name;
  }
  render() {
    const box = make("div", "loyalty");
    box.append(make("b", "", this.name + "'s loyalty card"));
    const row = make("div", "stamps");
    for (let i = 0; i < this.total; i++) row.append(make("span", i < this.stamps ? "stamp on" : "stamp"));
    box.append(row, make("small", "", this.total - this.stamps + " more for a free honey bun"));
    return box;
  }
}
const card = new LoyaltyCard("Ada").stamp().stamp().stamp();
visit.append(card.render());`,
  },
  "js-50-worth-knowing": {
    label: "Promo codes and an opening countdown",
    detail: "A regex checks promo codes, a Set tracks used ones, and a Date counts down.",
    spot: ".promo",
    css: `.promo input { width: 100%; padding: 11px 12px; margin-top: 6px; border: 1px solid #e0cbb0; border-radius: 10px; font: inherit; text-transform: uppercase; } .promo small { display: block; margin-top: 4px; color: #8a735f; } .promo.valid small { color: #17803d; font-weight: 700; } .countdown { font-weight: 700; color: #c8553d; margin: 0 0 12px; }`,
    js: `const form = $(".order");
const extra = form && $(".extra", form);
if (!extra) return;
const label = make("label", "promo", "Promo code");
const input = make("input");
input.placeholder = "BUN-123";
const hint = make("small", "", "Codes look like BUN-123");
const used = new Set(["BUN-000"]);
const discounts = new Map([["BUN", "10% off"], ["CAKE", "free coffee"]]);
input.addEventListener("input", () => {
  const code = input.value.trim().toUpperCase();
  const valid = /^(BUN|CAKE)-\\d{3}$/.test(code) && !used.has(code);
  label.classList.toggle("valid", valid);
  hint.textContent = valid ? "Applied: " + discounts.get(code.split("-")[0]) : "Codes look like BUN-123";
});
label.append(input, hint);
extra.after(label);
const opening = new Date(new Date().getFullYear(), 11, 6);
const days = Math.ceil((opening - new Date()) / 86400000);
form.prepend(make("p", "countdown", days > 0 ? "Winter menu launches in " + days + " days" : "The winter menu is here!"));`,
  },
};
