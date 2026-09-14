/**
 * Shared world pieces for the JavaScript chapter.
 *
 * Every JS level is the same kind of puzzle: the HTML and CSS are fixed, and
 * the JavaScript decides the geometry. These builders keep the geometry
 * proven (see lib/physics REACH: ~200px across, ~100px up) while each level
 * picks its own materials, so no two levels look alike.
 *
 *   start ledge  20–140 · stones at 240 / 420 / 600 · goal 780–880   (all at bottom: 140px)
 *   bridge from 160, goal from 740: a bridge of 480px+ reaches, 300px or less doesn't.
 */

export const DECOR = `
/* — colours only: nothing below moves anything — */
.start { background: #2f9e7a; border-color: #0f4d3c; }
.goal  { background: #e9a23b; border-color: #7a4a0c; }
`;

export type Look = { fill: string; edge: string; radius?: string };

export const LOOKS = {
  crystal: { fill: "#8fd3ff", edge: "#2b6a9c", radius: "6px" },
  amethyst: { fill: "#b79cf0", edge: "#4e3591" },
  moss: { fill: "#8cc98a", edge: "#2f6b3a", radius: "10px" },
  ember: { fill: "#f0a071", edge: "#8a3d22" },
  ice: { fill: "#d6f3ff", edge: "#5a93b0", radius: "4px" },
  rose: { fill: "#f4a6c8", edge: "#8a2f5c", radius: "14px" },
  brass: { fill: "#e0b85f", edge: "#6b4e1a" },
  slate: { fill: "#9aa3ad", edge: "#454d57" },
  lime: { fill: "#c7e66b", edge: "#56731a", radius: "8px" },
  coral: { fill: "#ff9a8b", edge: "#9c3a2e", radius: "12px" },
  teal: { fill: "#6fd6c4", edge: "#1f6e62" },
  sand: { fill: "#e8cf9a", edge: "#8a6a2e", radius: "3px" },
  plum: { fill: "#c58fd6", edge: "#5d2a6e", radius: "10px" },
  sky: { fill: "#9ec5ff", edge: "#2f5aa8" },
  mint: { fill: "#a8ecc8", edge: "#2d7a55", radius: "16px" },
  copper: { fill: "#d9895b", edge: "#6e3614" },
} satisfies Record<string, Look>;

const block = (sel: string, look: Look, extra = "") => `${sel} {
  height: 30px;
  background: ${look.fill};
  border: 4px solid ${look.edge};
  border-radius: ${look.radius ?? "0"};
  box-sizing: border-box;${extra}
}`;

const ledges = (start = "left: 20px; width: 120px;", goal = "left: 780px; width: 100px;", bottom = 140) => `.ledge {
  position: absolute;
  bottom: ${bottom}px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { ${start} }
.goal { ${goal} }`;

/** A bridge whose width JavaScript sets. */
export function bridgeWorld(look: Look, name = "bridge") {
  return {
    html: `<div class="ledge start">start</div>
<div class="${name}"></div>
<div class="ledge goal">goal</div>
`,
    css: `/* No width here — JavaScript decides it. */
${block(`.${name}`, look, `
  position: absolute;
  left: 140px;
  bottom: 140px;`)}

${ledges("left: 20px; width: 120px;", "left: 740px; width: 140px;")}
${DECOR}`,
  };
}

/** Stepping stones that JavaScript creates, each placed by its left position. */
export function stonesWorld(look: Look, name = "stone") {
  return {
    html: `<div class="ledge start">start</div>
<div class="ledge goal">goal</div>
`,
    css: `/* JavaScript creates each .${name} and sets its left. */
${block(`.${name}`, look, `
  position: absolute;
  bottom: 140px;
  width: 100px;`)}

${ledges()}
${DECOR}`,
  };
}

/** Three stones already on the page, each hidden until JavaScript shows it. */
export function hiddenStonesWorld(look: Look, name = "stone", ids = ["one", "two", "three"]) {
  return {
    html: `<div class="ledge start">start</div>
<div class="${name}" id="${ids[0]}"></div>
<div class="${name}" id="${ids[1]}"></div>
<div class="${name}" id="${ids[2]}"></div>
<div class="ledge goal">goal</div>
`,
    css: `${block(`.${name}`, look, `
  position: absolute;
  bottom: 140px;
  width: 100px;
  display: none;`)}
#${ids[0]} { left: 240px; }
#${ids[1]} { left: 420px; }
#${ids[2]} { left: 600px; }

/* A stone with the class "shown" appears. */
.${name}.shown { display: block; }

${ledges()}
${DECOR}`,
  };
}

/** A walkway blocked by a tall gate, which drops when it gets the class "open". */
export function gateWorld(look: Look, name = "gate", extraHtml = "", extraCss = "") {
  return {
    html: `<div class="floor start">start</div>
<div class="${name}"></div>
<div class="floor goal">goal</div>
${extraHtml}`,
    css: `.floor {
  position: absolute;
  bottom: 100px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
.start { left: 20px; width: 420px; }
.goal { left: 480px; width: 400px; }

/* A tall gate — until it has the class "open". */
${block(`.${name}`, look, `
  position: absolute;
  left: 440px;
  bottom: 100px;
  width: 40px;
  height: 260px;
  transition: height 0.5s ease-in;`).replace("height: 30px;\n", "")}
.${name}.open {
  height: 30px;
}
${extraCss}
${DECOR}`,
  };
}

/** A lift you stand on, raised by the class "raised", beside a high goal. */
export function liftWorld(look: Look, name = "lift") {
  return {
    html: `<div class="${name} start">${name}</div>
<div class="ledge goal">goal</div>
`,
    css: `${block(`.${name}`, look, `
  position: absolute;
  left: 300px;
  bottom: 40px;
  width: 200px;
  transition: bottom 0.9s ease-in-out;`)}

/* A ${name} that also has the class "raised". */
.${name}.raised {
  bottom: 200px;
}

.ledge {
  position: absolute;
  left: 560px;
  bottom: 260px;
  width: 160px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECOR}`,
  };
}

/** Steps that JavaScript builds into a staircase, up to a high summit. */
export function stairsWorld(look: Look, name = "step") {
  return {
    html: `<div class="ground start">start</div>
<div class="stairs"></div>
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
  display: flex;
  align-items: flex-end;
  position: absolute;
  left: 180px;
  bottom: 40px;
}

${block(`.${name}`, look, `
  width: 80px;`).replace("height: 30px;\n", "")}

.summit {
  position: absolute;
  left: 660px;
  bottom: 280px;
  width: 160px;
  height: 30px;
  border: 4px solid;
  box-sizing: border-box;
}
${DECOR}`,
  };
}

/** Does the code contain this (whitespace-insensitive) regex? */
export const has = (js: string, re: RegExp) => re.test(js);
