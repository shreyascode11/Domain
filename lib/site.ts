/**
 * The website you build across the course: the Anthill Bakery.
 *
 * Every lesson adds one piece. HTML lessons add content (and the page looks
 * like a raw, unstyled document), CSS lessons style it, flexbox lessons lay
 * it out, and JavaScript lessons make it respond. `buildSite` composes the
 * page from whichever lessons are finished, so the site grows as you play.
 */

import { JS_SITE_STEPS } from "./siteJs";

export type SiteStep = {
  /** What this lesson added, shown as "+ label". */
  label: string;
  /** One line on what changed on the site. */
  detail: string;
  /** The element to spotlight when this step is new. */
  spot: string;
  css?: string;
  js?: string;
};

export const SITE_NAME = "Anthill Bakery";
export const SITE_URL = "anthill.bakery";

/* ——— Artwork (inline SVG, so the page works offline and in a sandbox) ——— */

const svg = (body: string, viewBox: string) =>
  "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${body}</svg>`);

const BUN_GRAD = `<radialGradient id='g' cx='.38' cy='.32'><stop offset='0' stop-color='#ffe0a3'/><stop offset='.6' stop-color='#e6a04a'/><stop offset='1' stop-color='#9c5a1f'/></radialGradient>`;

const HERO_ART = svg(
  `<defs>${BUN_GRAD}
<linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffd9a8'/><stop offset='1' stop-color='#f4a77c'/></linearGradient>
<linearGradient id='wall' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f7e3c8'/><stop offset='1' stop-color='#efd2ad'/></linearGradient></defs>
<rect width='560' height='520' fill='url(#wall)'/>
<path d='M150 60 h260 a0 0 0 0 1 0 0 v200 h-260 z' fill='url(#sky)'/>
<path d='M150 170 a130 110 0 0 1 260 0' fill='url(#sky)'/>
<path d='M150 60 a130 110 0 0 1 260 0 v200 h-260 z' fill='none' stroke='#8a5a2e' stroke-width='14'/>
<line x1='280' y1='-50' x2='280' y2='260' stroke='#8a5a2e' stroke-width='8'/>
<line x1='150' y1='160' x2='410' y2='160' stroke='#8a5a2e' stroke-width='8'/>
<circle cx='350' cy='110' r='26' fill='#fff3d6'/>
<path d='M190 230 q40 -40 90 -10 q50 -40 100 0 v30 h-190 z' fill='#9fbf8f' opacity='.8'/>
<rect x='40' y='300' width='480' height='26' rx='6' fill='#8a5a2e'/>
<rect x='60' y='326' width='440' height='194' fill='#b97a44'/>
<rect x='60' y='326' width='440' height='194' fill='#000' opacity='.08'/>
<g stroke='#fff6e3' stroke-width='5' stroke-linecap='round' fill='none' opacity='.85'>
<path d='M170 200 q-12 -18 0 -34 q12 -16 0 -32'/><path d='M280 186 q-12 -18 0 -34 q12 -16 0 -32'/><path d='M390 200 q-12 -18 0 -34 q12 -16 0 -32'/></g>
<ellipse cx='280' cy='300' rx='200' ry='22' fill='#6b4221' opacity='.35'/>
<circle cx='170' cy='262' r='44' fill='url(#g)'/><circle cx='280' cy='250' r='56' fill='url(#g)'/><circle cx='390' cy='262' r='44' fill='url(#g)'/>
<g stroke='#fff0c8' stroke-width='6' stroke-linecap='round' fill='none'><path d='M140 252 q30 -18 60 0'/><path d='M244 236 q36 -22 72 0'/><path d='M360 252 q30 -18 60 0'/></g>
<g fill='#2b1d14'><ellipse cx='455' cy='292' rx='9' ry='7'/><ellipse cx='470' cy='286' rx='10' ry='8'/><circle cx='486' cy='278' r='8'/>
<path d='M486 271 l6 -12 M490 273 l10 -8' stroke='#2b1d14' stroke-width='2.5' stroke-linecap='round'/>
<path d='M452 298 l-6 8 M466 294 l-4 10 M474 292 l4 10' stroke='#2b1d14' stroke-width='2.5' stroke-linecap='round'/></g>
<circle cx='500' cy='262' r='8' fill='#ffd98a'/>
<g fill='#8a5a2e' opacity='.25'><circle cx='120' cy='400' r='5'/><circle cx='220' cy='440' r='4'/><circle cx='340' cy='410' r='5'/><circle cx='440' cy='450' r='4'/></g>`,
  "0 0 560 520",
);

const ITEM_ART: Record<string, string> = {
  bun: svg(`<defs>${BUN_GRAD}</defs><rect width='200' height='140' fill='#fde8c8'/><ellipse cx='100' cy='112' rx='70' ry='12' fill='#c98a4b' opacity='.35'/><circle cx='100' cy='76' r='44' fill='url(#g)'/><path d='M70 70 q30 -20 60 0' stroke='#fff0c8' stroke-width='7' fill='none' stroke-linecap='round'/>`, "0 0 200 140"),
  croissant: svg(`<rect width='200' height='140' fill='#fbe3cf'/><ellipse cx='100' cy='112' rx='74' ry='11' fill='#c98a4b' opacity='.3'/><path d='M34 96 q66 -90 132 0 q-20 10 -30 4 q-36 -44 -72 0 q-10 6 -30 -4z' fill='#e39b47'/><path d='M66 92 q34 -54 68 0' stroke='#b86a28' stroke-width='5' fill='none'/><path d='M84 90 q16 -26 32 0' stroke='#b86a28' stroke-width='5' fill='none'/>`, "0 0 200 140"),
  cake: svg(`<rect width='200' height='140' fill='#f5e6d6'/><ellipse cx='100' cy='116' rx='70' ry='10' fill='#b08060' opacity='.3'/><rect x='48' y='62' width='104' height='50' rx='6' fill='#f3d9a4'/><rect x='48' y='62' width='104' height='14' rx='6' fill='#c98a4b'/><g fill='#8a5a2e'><circle cx='62' cy='58' r='7'/><circle cx='80' cy='54' r='8'/><circle cx='100' cy='57' r='7'/><circle cx='120' cy='53' r='8'/><circle cx='138' cy='58' r='7'/></g>`, "0 0 200 140"),
  loaf: svg(`<rect width='200' height='140' fill='#efe3cf'/><ellipse cx='100' cy='114' rx='78' ry='11' fill='#8a6a44' opacity='.3'/><path d='M30 104 q0 -62 70 -62 q70 0 70 62z' fill='#b9773a'/><g stroke='#f3d7a6' stroke-width='5' stroke-linecap='round'><path d='M62 70 l18 -14'/><path d='M92 64 l18 -14'/><path d='M122 70 l18 -14'/></g><g fill='#f7ead2'><circle cx='60' cy='92' r='2.5'/><circle cx='90' cy='84' r='2.5'/><circle cx='124' cy='90' r='2.5'/><circle cx='146' cy='96' r='2.5'/></g>`, "0 0 200 140"),
  cookie: svg(`<rect width='200' height='140' fill='#f6e9da'/><ellipse cx='100' cy='114' rx='60' ry='10' fill='#a0764c' opacity='.3'/><circle cx='100' cy='74' r='42' fill='#d99a55'/><g fill='#6b3f1d'><circle cx='84' cy='62' r='6'/><circle cx='112' cy='58' r='5'/><circle cx='118' cy='86' r='6'/><circle cx='88' cy='90' r='5'/></g><g fill='#fff2c2'><circle cx='100' cy='74' r='3'/><circle cx='70' cy='80' r='2.5'/></g>`, "0 0 200 140"),
  tea: svg(`<rect width='200' height='140' fill='#e4ecdf'/><ellipse cx='96' cy='116' rx='58' ry='9' fill='#6d8a6a' opacity='.3'/><path d='M58 58 h76 v34 a38 26 0 0 1 -76 0z' fill='#f9f4ea'/><path d='M134 66 q24 0 20 18 q-4 14 -22 12' stroke='#f9f4ea' stroke-width='7' fill='none'/><ellipse cx='96' cy='60' rx='38' ry='7' fill='#a97a3e'/><path d='M150 40 q18 -10 26 6 q-14 12 -26 -6z' fill='#7d9a7a'/><g stroke='#b6c6b0' stroke-width='4' stroke-linecap='round' fill='none'><path d='M84 44 q-8 -10 0 -20'/><path d='M104 44 q-8 -10 0 -20'/></g>`, "0 0 200 140"),
};

const MARK = `<svg class="mark" width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#e8a33d"/><path d="M11 21 q9 -9 18 0" stroke="#fff4d9" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="15" cy="27" r="2.2" fill="#2b1d14"/><circle cx="20" cy="29" r="2.6" fill="#2b1d14"/><circle cx="25.5" cy="27" r="2.2" fill="#2b1d14"/></svg>`;

const ICONS = {
  honey: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 C12 3 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 3 12 3Z" fill="#e8a33d"/></svg>`,
  oven: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 c3 4 -2 5 1 9 c1.5 -1 2 -2.5 2 -4 c2.5 2 4 4.6 4 7 a7 7 0 0 1 -14 0 c0 -4 4 -6 7 -12Z" fill="#c8553d"/></svg>`,
  leaf: `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4 C9 4 4 9 4 16 c0 2 1 4 1 4 C8 12 13 9 17 8 C12 11 8 15 7 20 c9 0 13 -7 13 -16Z" fill="#7d9a7a"/></svg>`,
};

type Menu = { name: string; desc: string; price: string; art: keyof typeof ITEM_ART; type: string; stock: number; weight: number; special?: boolean; soldOut?: boolean };
const MENU: Menu[] = [
  { name: "Honey Bun", type: "sweet", stock: 2, weight: 90, desc: "Soft and sticky, glazed with wildflower honey.", price: "$3.50", art: "bun", special: true },
  { name: "Butter Croissant", type: "pastry", stock: 8, weight: 70, desc: "Forty-eight flaky layers, laminated by hand.", price: "$4.00", art: "croissant" },
  { name: "Crumb Cake", type: "sweet", stock: 3, weight: 120, desc: "A mountain of buttery crumbs on vanilla sponge.", price: "$4.50", art: "cake" },
  { name: "Seven-Seed Loaf of Extraordinarily Crunchy Bread", type: "bread", stock: 5, weight: 650, desc: "Stone-baked sourdough, sliced to order.", price: "$7.00", art: "loaf" },
  { name: "Oat & Pollen Cookie", type: "sweet", stock: 12, weight: 45, desc: "Chewy middle, crisp edges, a pinch of sea salt.", price: "$2.50", art: "cookie" },
  { name: "Garden Leaf Tea", type: "drinks", stock: 0, weight: 250, desc: "Brewed from mint grown right outside.", price: "$3.00", art: "tea", soldOut: true },
];

const REVIEWS = [
  { rating: 5, quote: "The honey bun is the reason I get out of bed. Worth every crumb.", name: "Mira K.", role: "Regular since 2019" },
  { rating: 5, quote: "Best croissant in the city, and the ants remember your name.", name: "Theo L.", role: "Local food writer" },
  { rating: 4.5, quote: "We ordered the crumb cake for a birthday. It vanished in minutes.", name: "Priya S.", role: "Party of twelve" },
];

const MARKUP_AND_STYLE_STEPS: Record<string, SiteStep> = {
  // ——— HTML: the content ————————————————————————————————
  "html-1-elements": { label: "Your brand name", detail: "Your site exists: one element holding the bakery's name.", spot: ".brand" },
  "html-2-attributes": { label: "The eyebrow line", detail: "A named paragraph above the headline: 'Baked before sunrise'.", spot: ".eyebrow" },
  "html-3-nesting": { label: "The site header", detail: "The brand and its friends now live together inside a header box.", spot: ".top" },
  "html-4-div-span": { label: "An 'Open now' badge", detail: "A small inline span that sits beside the brand.", spot: ".badge" },
  "html-5-semantic": { label: "Landmarks and a footer", detail: "Real header, main and footer elements — with a footer full of details.", spot: ".foot" },
  "html-6-id-class": { label: "The #menu section", detail: "A section with an id, so any link can jump straight to it.", spot: "#menu" },
  "html-7-data-attrs": { label: "Today's special tag", detail: "The honey bun is marked with data-special and a badge.", spot: "[data-special]" },
  "html-8-headings": { label: "The big headline", detail: "An h1 for the hero, and an h2 for every section.", spot: ".hero-title" },
  "html-9-paragraphs": { label: "The hero intro and our story", detail: "Paragraphs that tell visitors who you are.", spot: ".lead" },
  "html-10-emphasis": { label: "Stats and features", detail: "Strong numbers and three things you're proud of.", spot: ".features" },
  "html-11-lists": { label: "The menu", detail: "Six bakes, each one a list item.", spot: ".menu" },
  "html-12-links": { label: "Navigation and buttons", detail: "Nav links and two call-to-action links in the hero.", spot: ".nav" },
  "html-13-link-target": { label: "A directions link", detail: "Opens a map in a new tab, safely.", spot: ".nav .ext" },
  "html-14-images": { label: "Photos", detail: "The hero illustration and a picture for every bake.", spot: ".hero-art" },
  "html-15-forms": { label: "The order form", detail: "Name, pickup time, a checkbox and a button — plus an 'Order ahead' link.", spot: ".order" },
  "html-16-validation": { label: "Required fields", detail: "The form refuses an order without your name and email.", spot: ".order .req" },
  "html-17-tables": { label: "Opening hours", detail: "A table of days and times, with the address.", spot: ".hours" },
  "html-18-head": { label: "The page title", detail: "The browser tab now shows your bakery's name.", spot: ".brand" },
  "html-19-alt-text": { label: "Alt text and captions", detail: "Every picture is described for people who can't see it.", spot: ".hero-art figcaption" },
  "html-20-capstone": { label: "Reviews and a launch banner", detail: "Customer reviews, and an announcement across the top.", spot: ".reviews" },

  // ——— CSS: the look ————————————————————————————————————
  "css-1-rules": { label: "A content column", detail: "Your first rule gives the page a width.", spot: ".site", css: `.site { width: 92%; }` },
  "css-2-margin": {
    label: "Breathing room",
    detail: "Margins centre the page and put space between sections.",
    spot: ".site",
    css: `body { margin: 0; } .site { margin: 0 auto; } section { margin: 64px 0; } h1, h2, h3, p { margin-top: 0; }`,
  },
  "css-3-selector-types": {
    label: "Warm ink colours",
    detail: "Type, class and id selectors colour the text.",
    spot: ".lead",
    css: `body { color: #2b1d14; } .lead, .section-head p, .feature p { color: #6b5444; } .eyebrow { color: #c8553d; } #menu { scroll-margin-top: 90px; }`,
  },
  "css-4-descendant-child": {
    label: "Tidy navigation",
    detail: "Only links directly inside the nav get padding and lose underlines.",
    spot: ".nav",
    css: `.nav > a { padding: 8px 12px; text-decoration: none; color: inherit; font-weight: 500; }`,
  },
  "css-5-grouping": {
    label: "Accent words",
    detail: "One grouped rule colours the highlighted words in every heading.",
    spot: ".hero-title",
    css: `.hero-title span, .section-head em { color: #c8553d; font-style: italic; }`,
  },
  "css-6-first-last-child": {
    label: "Stat dividers",
    detail: "Lines between the stats — none before the first or after the last.",
    spot: ".stats",
    css: `.stats > div { padding: 0 22px; border-right: 1px solid #e3cfb4; } .stats > div:first-child { padding-left: 0; } .stats > div:last-child { border-right: none; }`,
  },
  "css-7-nth-child": {
    label: "Striped opening hours",
    detail: "Every other row of the hours table is shaded.",
    spot: ".hours",
    css: `.hours tr:nth-child(even) td { background: #fbf1e3; } .hours td, .hours th { padding: 10px 12px; text-align: left; }`,
  },
  "css-8-not": {
    label: "The current page link",
    detail: "Every nav link except the current one is softened.",
    spot: ".nav",
    css: `.nav a:not(.current) { opacity: 0.72; } .nav a.current { font-weight: 700; }`,
  },
  "css-9-checked": {
    label: "The 'extra honey' toggle",
    detail: "Ticking the box lights up its label.",
    spot: ".extra",
    css: `.extra:has(input:checked) { color: #c8553d; font-weight: 700; } .extra input { accent-color: #e8a33d; }`,
  },
  "css-10-focus": {
    label: "Focus rings",
    detail: "Whatever you're typing in or tabbing to glows.",
    spot: ".order input",
    css: `.order input:focus, .order select:focus, .btn:focus-visible { outline: 3px solid #f2c26b; outline-offset: 2px; }`,
  },
  "css-11-pseudo-elements": {
    label: "Decorative flourishes",
    detail: "A line before the eyebrow and a big quote mark on reviews, from CSS alone.",
    spot: ".eyebrow",
    css: `.eyebrow::before { content: ""; display: inline-block; width: 28px; height: 2px; background: currentColor; vertical-align: middle; margin-right: 10px; } .reviews blockquote::before { content: "\\201C"; display: block; font-size: 3.2rem; line-height: 0.6; color: #e8a33d; font-family: Georgia, serif; }`,
  },
  "css-12-specificity": {
    label: "The special stands out",
    detail: "A more specific rule wins for today's special.",
    spot: "[data-special]",
    css: `.menu .card[data-special] .name { color: #c8553d; }`,
  },
  "css-13-inheritance": { label: "Footer links match", detail: "Footer links inherit the footer's colour.", spot: ".foot", css: `.foot a, .brand { color: inherit; text-decoration: none; }` },
  "css-14-important": { label: "A 'sold out' warning", detail: "The sold-out label forces its red colour.", spot: ".sold", css: `.sold { color: #b42318 !important; background: #fde4df !important; }` },
  "css-15-box-sizing": {
    label: "Fields that fit",
    detail: "Form fields include their padding in their width.",
    spot: ".order",
    css: `*, *::before, *::after { box-sizing: border-box; } .order label { display: block; margin-bottom: 14px; font-weight: 600; font-size: 0.95rem; } .order input:not([type="checkbox"]), .order select { width: 100%; padding: 11px 12px; margin-top: 6px; border: 1px solid #e0cbb0; border-radius: 10px; font: inherit; background: #fffdf9; }`,
  },
  "css-16-width-height": {
    label: "Readable line lengths",
    detail: "The page stops growing on wide screens, and paragraphs stay a comfortable width.",
    spot: ".lead",
    css: `.site { max-width: 1120px; } .lead { max-width: 46ch; } .section-head p { max-width: 52ch; }`,
  },
  "css-17-margin-collapsing": { label: "Steady section spacing", detail: "Padding keeps the gaps between sections from collapsing.", spot: "#menu", css: `section { padding: 8px 0; }` },
  "css-18-display": {
    label: "Pill badges",
    detail: "Badges and tags become inline-blocks with room to breathe.",
    spot: ".badge",
    css: `.badge, .tag, .sold { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.02em; background: #f4e3c9; color: #6b4221; }`,
  },
  "css-19-units-relative": {
    label: "A type scale in rem",
    detail: "Every size is relative, so the whole page scales with the reader's settings.",
    spot: ".section-head h2",
    css: `html { font-size: 16px; } h2 { font-size: 2.4rem; line-height: 1.15; margin-bottom: 0.4em; } h3 { font-size: 1.15rem; } .lead { font-size: 1.15rem; } .eyebrow { font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; }`,
  },
  "css-20-units-viewport": { label: "A screen-tall hero", detail: "The hero is sized to the screen with vh.", spot: ".hero", css: `.hero { min-height: 72vh; padding: 24px 0; }` },
  "css-21-calc": {
    label: "A framed illustration",
    detail: "The hero picture fills its space minus a border, using calc().",
    spot: ".hero-art img",
    css: `.hero-art { margin: 0; } .hero-art img { width: calc(100% - 20px); margin: 10px; display: block; height: auto; }`,
  },
  "css-22-clamp": {
    label: "A headline that scales",
    detail: "The headline grows and shrinks between sensible limits.",
    spot: ".hero-title",
    css: `.hero-title { font-size: clamp(2.8rem, 6.4vw, 4.8rem); line-height: 1.02; letter-spacing: -0.02em; margin: 14px 0 18px; }`,
  },
  "css-23-colors": {
    label: "The bakery palette",
    detail: "Cream paper, espresso ink, honey and terracotta.",
    spot: "body",
    css: `body { background: #fbf5ec; } .foot { background: #2b1d14; color: #eadbc6; }`,
  },
  "css-24-position-relative": { label: "A nudged badge", detail: "The badge lifts a touch without moving anything else.", spot: ".badge", css: `.badge { position: relative; top: -1px; }` },
  "css-25-position-absolute": {
    label: "Stickers on the photo",
    detail: "A 'FRESH' sticker and a price card pinned to the picture's corners.",
    spot: ".sticker",
    css: `.hero-art { position: relative; } .sticker { position: absolute; top: 26px; right: 26px; background: #c8553d; color: #fff; font-weight: 800; padding: 8px 14px; border-radius: 999px; transform: rotate(8deg); letter-spacing: 0.08em; } .float-card { position: absolute; left: -18px; bottom: 36px; background: #fff; padding: 12px 16px; border-radius: 14px; box-shadow: 0 14px 30px rgba(43, 29, 20, 0.18); font-size: 0.9rem; } .float-card b { display: block; }`,
  },
  "css-26-position-fixed-sticky": {
    label: "A sticky header",
    detail: "The header stays pinned to the top as you scroll.",
    spot: ".top",
    css: `.top { position: sticky; top: 0; z-index: 20; background: rgba(251, 245, 236, 0.9); backdrop-filter: blur(8px); padding: 14px 0; border-bottom: 1px solid #efdfca; }`,
  },
  "css-27-zindex": { label: "Stickers on top", detail: "z-index keeps the stickers above the picture.", spot: ".float-card", css: `.hero-art img { position: relative; z-index: 1; } .sticker, .float-card { z-index: 2; }` },
  "css-28-overflow": {
    label: "Clean rounded frames",
    detail: "overflow keeps pictures inside their rounded corners and lets the table scroll.",
    spot: ".menu",
    css: `.card .thumb, .hours-wrap { overflow: hidden; } .hours-wrap { overflow-x: auto; }`,
  },
  "css-29-grid": {
    label: "A two-column visit section",
    detail: "Grid puts the hours card and the order form side by side.",
    spot: "#visit",
    css: `.visit-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 28px; align-items: start; } .hours { width: 100%; border-collapse: collapse; }`,
  },
  "css-30-opacity-visibility": { label: "A faded sold-out item", detail: "The sold-out bake is see-through but still listed.", spot: ".card.out", css: `.card.out .thumb, .card.out .name, .card.out .desc { opacity: 0.5; }` },
  "css-31-background": {
    label: "Textured backgrounds",
    detail: "A dotted banner and soft honey glows behind the hero.",
    spot: ".hero",
    css: `.banner { background-color: #2b1d14; background-image: radial-gradient(rgba(232, 163, 61, 0.35) 1.5px, transparent 1.5px); background-size: 14px 14px; color: #fbe7c4; padding: 10px 16px; font-size: 0.9rem; } .banner a { color: #f2c26b; } .hero { background-image: radial-gradient(420px 320px at 85% 40%, rgba(232, 163, 61, 0.22), transparent 70%); }`,
  },
  "css-32-border-radius-shadow": {
    label: "Soft cards",
    detail: "Rounded corners and gentle shadows on every card.",
    spot: ".menu",
    css: `.card, .order, .hours-card, .reviews figure, .feature { background: #fff; border-radius: 18px; box-shadow: 0 1px 0 #efdfca, 0 14px 34px -18px rgba(43, 29, 20, 0.28); } .card { padding: 12px 12px 16px; } .order, .hours-card { padding: 26px; } .reviews figure { padding: 24px; margin: 0; } .feature { padding: 22px; } .card .thumb, .hero-art img { border-radius: 14px; } .card .thumb img { display: block; width: 100%; height: auto; }`,
  },
  "css-33-gradients": {
    label: "Honey gradients",
    detail: "Gradients warm up the buttons and the hero picture's frame.",
    spot: ".actions",
    css: `.btn { background: linear-gradient(180deg, #d9663f, #b8472f); } .hero-art { background: linear-gradient(160deg, #f6d7a8, #eab27d); border-radius: 26px; }`,
  },
  "css-34-typography-family": {
    label: "Bakery typography",
    detail: "An elegant serif for headings, a clean sans for everything else.",
    spot: "body",
    css: `body { font-family: "Avenir Next", "Segoe UI", system-ui, -apple-system, sans-serif; line-height: 1.6; -webkit-font-smoothing: antialiased; } h1, h2, h3, .hero-title, .brand-name, .reviews blockquote { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; font-weight: 700; }`,
  },
  "css-35-text-align-truncate": {
    label: "Centred headings, tidy names",
    detail: "Section headings are centred and long bake names end in …",
    spot: ".menu .name",
    css: `.section-head { text-align: center; } .section-head p { margin-left: auto; margin-right: auto; } .card .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .banner, .legal { text-align: center; } .story { text-align: center; } .story-text { max-width: 62ch; margin: 0 auto; font-size: 1.12rem; }`,
  },
  "css-36-custom-properties": {
    label: "Brand colour variables",
    detail: "--brand and --honey drive the buttons, links and accents.",
    spot: ".actions",
    css: `:root { --brand: #c8553d; --honey: #e8a33d; --ink: #2b1d14; } .btn { color: #fff; text-decoration: none; font-weight: 700; padding: 12px 22px; border-radius: 999px; border: 0; cursor: pointer; display: inline-block; font-size: 0.95rem; } .btn-ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); } .btn-small { padding: 9px 16px; font-size: 0.85rem; } .nav a.current { color: var(--brand); } .price { color: var(--brand); }`,
  },
  "css-37-transition-transform": {
    label: "Things that lift",
    detail: "Cards and buttons rise smoothly when you hover them.",
    spot: ".menu",
    css: `.btn, .card, .reviews figure { transition: transform 220ms ease, box-shadow 220ms ease; } .btn:hover { transform: translateY(-2px); } .card:hover, .reviews figure:hover { transform: translateY(-4px); box-shadow: 0 22px 40px -18px rgba(43, 29, 20, 0.35); }`,
  },
  "css-38-capstone": {
    label: "The finishing polish",
    detail: "A rich footer, styled reviews and a last coat of paint.",
    spot: ".foot",
    css: `.foot { padding: 56px 40px 28px; margin-top: 80px; border-radius: 28px 28px 0 0; } .foot h4 { color: #fff; margin: 0 0 10px; font-size: 0.95rem; } .foot p, .foot li { margin: 0 0 6px; font-size: 0.92rem; color: #cdb99f; } .foot ul { list-style: none; padding: 0; margin: 0; } .legal { border-top: 1px solid #4a3627; margin-top: 36px; padding-top: 18px; font-size: 0.82rem; color: #a38e76; } .reviews blockquote { margin: 0 0 18px; font-size: 1.12rem; line-height: 1.5; } .reviews figcaption b { display: block; } .reviews figcaption span { color: #8a735f; font-size: 0.88rem; } .greeting { font-style: italic; color: #8a5a2e; margin: 0 0 4px; } .stats strong { display: block; font-size: 1.6rem; font-family: Georgia, serif; } .stats span { font-size: 0.85rem; color: #8a735f; } .feature strong { display: block; font-size: 1.05rem; margin: 8px 0 4px; }`,
  },

  // ——— Flexbox: the layout ——————————————————————————————
  "flex-1-container-item": {
    label: "The brand lockup",
    detail: "The logo mark and name line up inside a flex container.",
    spot: ".brand",
    css: `.header-start { display: flex; align-items: center; gap: 14px; } .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; } .brand-name { font-size: 1.35rem; } .brand small { display: block; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: #8a735f; font-family: system-ui, sans-serif; }`,
  },
  "flex-2-display": { label: "A navigation row", detail: "The nav links sit side by side.", spot: ".nav", css: `.nav { display: flex; }` },
  "flex-3-direction": {
    label: "Card columns",
    detail: "Each card stacks its picture, text and price in a column.",
    spot: ".menu",
    css: `.card { display: flex; flex-direction: column; } .foot-cols > div { display: flex; flex-direction: column; }`,
  },
  "flex-4-wrap": { label: "A menu grid that wraps", detail: "Menu cards flow into rows and wrap.", spot: ".menu", css: `.menu { display: flex; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; } .foot-cols, .features, .reviews-row { display: flex; flex-wrap: wrap; }` },
  "flex-5-justify-content": {
    label: "Brand left, links right",
    detail: "The header spreads its pieces to both edges.",
    spot: ".top",
    css: `.top { display: flex; justify-content: space-between; flex-wrap: wrap; } .foot-cols { justify-content: space-between; }`,
  },
  "flex-6-align-items": { label: "A centred header", detail: "Every header item sits on the same middle line.", spot: ".top", css: `.top { align-items: center; } .hero { align-items: center; }` },
  "flex-7-align-content": { label: "Even card rows", detail: "The rows of cards spread evenly.", spot: ".menu", css: `.menu { align-content: flex-start; }` },
  "flex-8-gap": {
    label: "Gaps everywhere",
    detail: "Even spacing between cards, links, buttons and stats.",
    spot: ".menu",
    css: `.menu, .features, .reviews-row { gap: 22px; } .nav { gap: 4px; } .actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 26px 0 30px; } .stats { display: flex; } .foot-cols { gap: 32px; } .header-end { display: flex; align-items: center; gap: 14px; }`,
  },
  "flex-9-grow-shrink-basis": {
    label: "The split hero",
    detail: "Text and picture share the hero, and cards share each row fairly.",
    spot: ".hero",
    css: `.hero { display: flex; flex-wrap: wrap; gap: 48px; } .hero-copy { flex: 1 1 400px; } .hero-art { flex: 1 1 380px; } .card { flex: 1 1 280px; } .feature, .reviews figure { flex: 1 1 240px; } .foot-cols > div { flex: 1 1 160px; } .foot-cols > div:first-child { flex-basis: 260px; }`,
  },
  "flex-10-align-self-order": { label: "The special goes first", detail: "order moves today's special to the front of the menu.", spot: "[data-special]", css: `.menu .card[data-special] { order: -1; }` },
  "flex-11-gotchas": { label: "Names that truly shrink", detail: "min-width: 0 lets long names shorten inside their cards.", spot: ".menu", css: `.card, .card .row > div { min-width: 0; }` },
  "flex-12-patterns-and-grid": {
    label: "Price and button pinned",
    detail: "margin-top: auto keeps every price row at the foot of its card.",
    spot: ".menu .row",
    css: `.card .body { display: flex; flex-direction: column; flex: 1; padding: 14px 6px 0; } .card .row { margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 12px; } .price { font-weight: 800; font-size: 1.1rem; } .card .top-line { display: flex; align-items: center; gap: 8px; }`,
  },
};

export const SITE_STEPS: Record<string, SiteStep> = { ...MARKUP_AND_STYLE_STEPS, ...JS_SITE_STEPS };

/** Compose the bakery page from the finished lessons. `spotlight` outlines one lesson's piece. */
export function buildSite(done: (id: string) => boolean, spotlight?: string): { title: string; srcdoc: string } {
  const has = done;
  const any = Object.keys(SITE_STEPS).some(has);
  const title = has("html-18-head") ? `${SITE_NAME} — tiny bakes, big crumbs` : "Untitled document";
  const h2 = (text: string, sub?: string) => (has("html-8-headings") ? `<div class="section-head">${`<h2>${text}</h2>`}${sub && has("html-9-paragraphs") ? `<p>${sub}</p>` : ""}</div>` : "");
  const img = has("html-14-images");
  const alt = (text: string) => (has("html-19-alt-text") ? text : "");

  // Header
  const brand = has("html-1-elements") ? `<a class="brand" href="#top">${MARK}<span><span class="brand-name">Anthill</span><small>Bakery &amp; Café</small></span></a>` : "";
  const badge = has("html-4-div-span") ? `<span class="badge">Open now</span>` : "";
  const nav = has("html-12-links")
    ? `<nav class="nav"><a class="current" href="#top">Home</a><a href="#menu">Menu</a><a href="#story">Our story</a><a href="#visit">Visit</a>${
        has("html-13-link-target") ? `<a class="ext" href="https://www.openstreetmap.org" target="_blank" rel="noopener">Directions ↗</a>` : ""
      }</nav>`
    : "";
  const orderLink = has("html-15-forms") ? `<a class="btn btn-small" href="#order">Order ahead</a>` : "";
  const headerInner = `<div class="header-start">${brand}${badge}</div><div class="header-end">${nav}${orderLink}</div>`;
  const header = has("html-3-nesting") ? (has("html-5-semantic") ? `<header class="top" id="top">${headerInner}</header>` : `<div class="top" id="top">${headerInner}</div>`) : headerInner;

  const banner = has("html-20-capstone") ? `<div class="banner">Grand opening this Saturday — your first honey bun is on us. <a href="#order">Claim yours</a></div>` : "";

  // Hero
  const eyebrow = has("html-2-attributes") ? `<p class="eyebrow">Baked before sunrise · Since 2019</p>` : "";
  const headline = has("html-8-headings") ? `<h1 class="hero-title">Tiny bakes.<br><span>Big crumbs.</span></h1>` : "";
  const lead = has("html-9-paragraphs")
    ? `<p class="lead">A little neighbourhood bakery run by a very busy colony. Everything is shaped by hand, baked before the sun is up, and sweetened with honey from three streets away.</p>`
    : "";
  const actions = has("html-12-links") ? `<div class="actions"><a class="btn" href="#menu">See the menu</a><a class="btn btn-ghost" href="#visit">Find us</a></div>` : "";
  const stats = has("html-10-emphasis")
    ? `<div class="stats"><div><strong>4.9★</strong> <span>1,200 reviews</span></div><div><strong>38k</strong> <span>buns a year</span></div><div><strong>6am</strong> <span>ovens on</span></div></div>`
    : "";
  const heroArt = img
    ? `<figure class="hero-art"><img src="${HERO_ART}" width="420" height="390" alt="${alt("Three golden honey buns on a wooden counter below an arched bakery window, with an ant carrying a crumb")}">${
        has("css-25-position-absolute") ? `<span class="sticker">FRESH</span><div class="float-card"><b>Honey bun of the day</b>Warm until 10am · $3.50</div>` : ""
      }${has("html-19-alt-text") ? `<figcaption>Out of the oven at 7am, every single day.</figcaption>` : ""}</figure>`
    : "";
  const heroCopy = eyebrow + headline + lead + actions + stats;
  const hero = heroCopy || heroArt ? `<section class="hero"><div class="hero-copy">${heroCopy}</div>${heroArt}</section>` : "";

  // Features
  const features = has("html-10-emphasis")
    ? `<section class="features-wrap"><div class="features">
<div class="feature">${ICONS.honey}<strong>Local honey</strong><p>From hives three streets away, never shipped in.</p></div>
<div class="feature">${ICONS.oven}<strong>Stone-baked</strong><p>A 400° stone oven, fired up at 4am every morning.</p></div>
<div class="feature">${ICONS.leaf}<strong>Leaf-wrapped</strong><p>No plastic. Everything leaves in paper or leaves.</p></div>
</div></section>`
    : "";

  // Menu
  const items = MENU.map((m) => {
    const special = m.special && has("html-7-data-attrs");
    const price = m.price.replace("$", "");
    return `<li class="card${m.soldOut ? " out" : ""}" data-name="${m.name}" data-price="${price}" data-type="${m.type}" data-stock="${m.stock}" data-weight="${m.weight}"${special ? ` data-special="true"` : ""}>${
      img ? `<div class="thumb"><img src="${ITEM_ART[m.art]}" alt="${alt(m.name)}" width="200" height="140"></div>` : ""
    }<div class="body"><div class="top-line">${special ? `<span class="tag">★ Today's special</span>` : ""}${m.soldOut ? `<span class="sold">Sold out</span>` : ""}</div><h3 class="name">${m.name}</h3><p class="desc">${m.desc}</p><div class="row"><div><span class="price">${m.price}</span></div></div></div></li>`;
  }).join("");
  const menuBody = has("html-11-lists") ? `<ul class="menu">${items}</ul>` : `<p>The menu is coming soon…</p>`;
  const menu = has("html-6-id-class")
    ? `<section id="menu">${h2("Fresh from <em>the oven</em>", "Six bakes we make every day. Get here early — the honey buns rarely see noon.")}${menuBody}</section>`
    : has("html-11-lists")
      ? menuBody
      : "";


  const story = has("html-9-paragraphs")
    ? `<section id="story" class="story">${h2("Our <em>story</em>")}<p class="story-text">It started with one ant, one oven, and a honey bun recipe borrowed from a grandmother. ${
        has("html-10-emphasis") ? `Today we're a colony of twenty, and <strong>we still bake every single thing by hand</strong> — <em>no shortcuts, no shipped-in dough</em>.` : `Today we're a colony of twenty, and we still bake every single thing by hand.`
      }</p></section>`
    : "";

  const reviews = has("html-20-capstone")
    ? `<section class="reviews">${h2("Loved by <em>the neighbourhood</em>")}<div class="reviews-row">${REVIEWS.map(
        (r) => `<figure data-rating="${r.rating}"><blockquote>${r.quote}</blockquote><figcaption><b>${r.name}</b><span>${r.role}</span></figcaption></figure>`,
      ).join("")}</div></section>`
    : "";

  // Visit
  const req = has("html-16-validation");
  const form = has("html-15-forms")
    ? `<form class="order" id="order">${has("html-8-headings") ? "<h3>Order ahead</h3>" : ""}<label>Your name${req ? " *" : ""}<input name="name" placeholder="Ada the ant"${req ? " required" : ""}></label><label>Email${req ? " *" : ""}<input type="email" name="email" placeholder="ada@anthill.bakery"${req ? " required" : ""}></label><label>Pick up<select><option>7:00 am</option><option>8:30 am</option><option>Noon</option></select></label><label class="extra"><input type="checkbox"> Add extra honey</label><button class="btn" type="submit">Place order</button>${
        req ? `<p class="req"><small>* We need these to let you know it's ready.</small></p>` : ""
      }</form>`
    : "";
  const hours = has("html-17-tables")
    ? `<div class="hours-card">${has("html-8-headings") ? "<h3>Opening hours</h3>" : ""}<div class="hours-wrap"><table class="hours"><tr><th>Day</th><th>Hours</th></tr><tr><td>Monday – Friday</td><td>7am – 4pm</td></tr><tr><td>Saturday</td><td>8am – 3pm</td></tr><tr><td>Sunday</td><td>Closed for crumbs</td></tr></table></div><p class="address">12 Honeycomb Lane, Old Town</p></div>`
    : "";
  const visit = hours || form ? `<section id="visit">${h2("Come <em>visit</em>", "Sit in by the window, or order ahead and skip the queue.")}<div class="visit-grid">${hours}${form}</div></section>` : "";


  const mainInner = hero + features + menu + story + reviews + visit;
  const main = has("html-5-semantic") ? `<main>${mainInner}</main>` : mainInner;
  const footer = has("html-5-semantic")
    ? `<footer class="foot"><div class="foot-cols"><div><b class="brand-name">Anthill Bakery</b><p>Tiny bakes, big crumbs. Baked by hand, before sunrise.</p></div><div><h4>Visit</h4><p>12 Honeycomb Lane</p><p>Old Town</p></div><div><h4>Hours</h4><p>Mon–Fri 7am–4pm</p><p>Sat 8am–3pm</p></div><div><h4>Explore</h4>${
        has("html-12-links") ? `<ul><li><a href="#menu">Menu</a></li><li><a href="#story">Our story</a></li><li><a href="#top">Back to top</a></li></ul>` : ""
      }</div></div><p class="legal">© ${SITE_NAME} · Built with HTML, CSS and JavaScript</p></footer>`
    : "";

  const body = any
    ? `${banner}<div class="site">${header}${main}${footer}</div>`
    : `<div class="empty">A blank page.<br>Finish your first lesson to put something on it.</div>`;

  const ids = Object.keys(SITE_STEPS).filter(has);
  const css = ids.map((id) => SITE_STEPS[id].css ?? "").join("\n");
  const js = ids
    .map((id) => SITE_STEPS[id].js)
    .filter(Boolean)
    .map((code) => `try { (() => {\n${code}\n})(); } catch (e) { console.error(e); }`)
    .join("\n");
  const prelude = `const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const make = (tag, className = "", text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
const site = {};`;

  const spot = spotlight ? SITE_STEPS[spotlight]?.spot : undefined;
  const spotCss = spot
    ? `${spot} { outline: 3px dashed #ff8a3d !important; outline-offset: 4px; animation: spot 1.2s ease-in-out 3; }
@keyframes spot { 50% { outline-color: #ffd98a; outline-offset: 8px; } }`
    : "";
  const spotJs = spot ? `document.querySelector(${JSON.stringify(spot)})?.scrollIntoView({ block: "center" });` : "";

  const srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>.empty{font-family:system-ui,sans-serif;color:#8a8a8a;text-align:center;padding:120px 20px;line-height:1.8}</style>
<style>${css}</style><style>${spotCss}</style></head><body>${body}
<script>${prelude}\n${js}\n${spotJs}</script></body></html>`;

  return { title, srcdoc };
}
