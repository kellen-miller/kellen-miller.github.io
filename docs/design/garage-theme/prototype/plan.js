// Orthographic drawing kit: plan, front elevation and side elevation of the garage.
// World units match garage.js (u = left→right, v = back→front, z = up). Every project
// is drawn into a <g data-obj> so the page can highlight it in every view at once.
(function () {
  const { el } = KM;
  const ST = {
    line: "var(--il-line)", fillA: "var(--il-top)", fillB: "var(--il-left)", fillC: "var(--il-right)", acc: "var(--acc)", faint: "var(--faint)"
  };
  const sty = (fill, stroke, w, extra) => `fill:${fill};stroke:${stroke || "none"};stroke-width:${w || 0};${extra || ""}`;
  const R = (g, x, y, w, h, fill, stroke, sw, dash) => el("rect", { x, y, width: w, height: h, style: sty(fill, stroke, sw, dash ? `stroke-dasharray:${dash}` : "") }, g);
  const L = (g, x1, y1, x2, y2, c, w, dash) => el("line", { x1, y1, x2, y2, style: `stroke:${c};stroke-width:${w || 1};${dash ? `stroke-dasharray:${dash}` : ""}` }, g);
  const C = (g, cx, cy, r, fill, stroke, sw) => el("circle", { cx, cy, r, style: sty(fill, stroke, sw) }, g);
  const Pth = (g, d, fill, stroke, sw) => el("path", { d, style: sty(fill, stroke, sw, "stroke-linejoin:round;stroke-linecap:round") }, g);
  const T = (g, x, y, t, style, anchor) => { const n = el("text", { x, y, "text-anchor": anchor || "start", style }, g); n.textContent = t; return n; };
  const SMALL = "fill:var(--faint);font:400 10px var(--mono);letter-spacing:1px";
  const LABEL = "fill:var(--ink);font:600 11px var(--mono);letter-spacing:1px";

  function defs(svg) {
    if (svg.querySelector("#wallhatch")) return;
    const d = el("defs", {}, svg), p = el("pattern", { id: "wallhatch", width: 4, height: 4, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, d);
    el("line", { x1: 0, y1: 0, x2: 0, y2: 4, style: "stroke:var(--il-line);stroke-width:.8" }, p);
  }
  const groups = parent => { const m = {}; ["skills", "venae", "deburr", "sup", "chief", "celerity"].forEach(id => m[id] = el("g", { "data-obj": id }, parent)); return m; };
  const troch = (cx, cy, R, e, sx) => { let d = ""; for (let i = 0; i <= 72; i++) { const t = i / 72 * Math.PI * 2, x = cx + (R * Math.cos(t) + e * Math.cos(3 * t)) * sx, y = cy + R * .78 * Math.sin(t) * sx + e * Math.sin(3 * t) * sx; d += (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); } return d + "Z"; };

  // ───────── Plan (top-down). Returns screen centers per project. ─────────
  function plan(parent, X, Y, s, o) {
    o = o || {};
    defs(parent.ownerSVGElement || parent);
    const g = el("g", { transform: `matrix(${s} 0 0 ${s} ${X} ${Y})` }, parent), at = (u, v) => [X + u * s, Y + v * s], B = el("g", {}, g);
    R(B, 0, 0, 380, 240, ST.fillA, "none", 0);
    for (let u = 40; u < 380; u += 40) L(B, u, 0, u, 240, ST.fillB, 1);
    for (let v = 40; v < 240; v += 40) L(B, 0, v, 380, v, ST.fillB, 1);
    R(B, -8, -8, 138, 8, "url(#wallhatch)", ST.line, 1.2); R(B, 242, -8, 146, 8, "url(#wallhatch)", ST.line, 1.2);
    R(B, -8, 0, 8, 248, "url(#wallhatch)", ST.line, 1.2);
    L(B, 130, -4, 242, -4, ST.line, 1, "6 3");
    T(B, 186, 14, "ROLLER DOOR", SMALL, "middle");
    const pb = o.pitbox || [132, 150, 160, 82];
    if (pb) R(B, pb[0], pb[1], pb[2], pb[3], "none", ST.acc, 1.6, "4 3");
    const G = groups(g);
    // skills pegboard
    R(G.skills, 18, 0, 92, 7, ST.fillB, ST.line, 1.2); for (let x = 24; x < 108; x += 8) C(G.skills, x, 3.5, .8, ST.line);
    // venae harness board
    R(G.venae, 0, 46, 7, 112, ST.fillB, ST.line, 1.2); Pth(G.venae, "M3.5,52 C6,80 1,100 3.5,152", "none", ST.acc, 1.2);
    // tires
    C(B, 198, 40, 22, ST.fillB, ST.line, 1.2); C(B, 198, 40, 17.6, "none", ST.acc, 1.2); C(B, 198, 40, 12, ST.fillA, ST.line, 1);
    // bench + grinder
    R(B, 250, 8, 112, 50, ST.fillB, ST.line, 1.2); C(B, 350, 30, 5, ST.fillA, ST.line, 1);
    R(G.deburr, 288, 26, 30, 20, ST.fillA, ST.line, 1.2); R(G.deburr, 282, 24, 4, 24, ST.fillC, ST.line, 1); R(G.deburr, 320, 24, 4, 24, ST.fillC, ST.line, 1);
    ["M324,36 l12,-6", "M324,36 l14,0", "M324,36 l12,6"].forEach((d, i) => Pth(G.deburr, d, "none", ST.acc, 1.1).setAttribute("class", "spark s" + i));
    // sup chest + chief radio
    R(G.sup, 256, 104, 52, 40, ST.fillB, ST.line, 1.2); for (let i = 1; i < 5; i++) L(G.sup, 256, 104 + i * 8, 308, 104 + i * 8, ST.fillC, 1);
    if (o.detail) for (let i = 0; i < 5; i++) L(G.sup, 300, 108 + i * 8, 306, 108 + i * 8, ST.line, 1.4);
    R(G.chief, 268, 112, 24, 18, ST.fillA, ST.line, 1.2, "3 2"); C(G.chief, 288, 114, 2.2, ST.acc).setAttribute("class", "led");
    // celerity engine on stand + controller
    const E = G.celerity;
    R(E, 178, 190, 54, 6, ST.fillC, ST.line, 1); R(E, 202, 168, 6, 50, ST.fillC, ST.line, 1);
    R(E, 178, 178, 34, 33, ST.fillB, ST.line, 1.2); for (let i = 1; i < 5; i++) L(E, 178, 178 + i * 6.6, 212, 178 + i * 6.6, ST.fillC, 1);
    R(E, 196, 186, 16, 14, ST.acc, ST.line, 1);
    R(E, 132, 188, 20, 16, ST.fillA, ST.line, 1.2); Pth(E, "M152,196 C166,196 170,202 178,202", "none", ST.line, 1.2);
    // optional rearrangement: o.move = { id: [du, dv] } shifts a project's drawing on the plan
    const base = { skills: [64, 4], venae: [4, 102], deburr: [303, 36], sup: [296, 140], chief: [280, 121], celerity: [196, 194] }, centers = {};
    Object.keys(base).forEach(id => {
      const [du, dv] = (o.move && o.move[id]) || [0, 0];
      if (du || dv) G[id].setAttribute("transform", `translate(${du} ${dv})`);
      centers[id] = at(base[id][0] + du, base[id][1] + dv);
    });
    return { g, at, G, centers };
  }

  // ───────── Front elevation (looking at the back wall): x = u, y = up ─────────
  function front(parent, X, ground, s) {
    defs(parent.ownerSVGElement || parent);
    const g = el("g", { transform: `matrix(${s} 0 0 ${-s} ${X} ${ground})` }, parent), B = el("g", {}, g), G = groups(g);
    // wall + floor
    Pth(B, "M0,0 V150 H270 V72 H380 V0 Z", ST.fillA, ST.line, 1);
    R(B, -8, 0, 8, 150, "url(#wallhatch)", ST.line, 1.2);
    L(B, -20, 0, 400, 0, ST.line, 1.6);
    // shutter
    R(B, 130, 0, 112, 112, "var(--il-dark)", ST.line, 1); R(B, 130, 52, 112, 60, ST.fillB, ST.line, 1);
    for (let z = 58; z < 112; z += 6) L(B, 130, z, 242, z, ST.fillC, 1);
    // skills pegboard
    R(G.skills, 18, 74, 92, 66, ST.fillB, ST.line, 1.1);
    Pth(G.skills, "M28,130 v-34 M40,130 v-30 M40,130 a5,5 0 1 0 0.1,0", "none", ST.line, 1.4); Pth(G.skills, "M54,128 h40", "none", ST.line, 1);
    [56, 64, 72, 80, 88].forEach((x, i) => C(G.skills, x, 122, 2.4 + i * .4, ST.fillA, ST.line, .8)); Pth(G.skills, "M52,88 a8,8 0 1 0 0.1,0", "none", ST.acc, 1.2);
    // venae edge-on on the left wall
    R(G.venae, 0, 68, 7, 70, ST.fillB, ST.line, 1);
    // tires
    for (let i = 0; i < 3; i++) R(B, 176, i * 13, 44, 13, ST.fillC, ST.line, 1).setAttribute("rx", 4);
    L(B, 180, 32, 216, 32, ST.acc, 1.2);
    // bench + grinder
    R(B, 250, 40, 112, 6, ST.fillB, ST.line, 1); R(B, 254, 0, 6, 40, ST.fillC, ST.line, 1); R(B, 352, 0, 6, 40, ST.fillC, ST.line, 1);
    R(B, 262, 14, 88, 26, ST.fillA, ST.line, 1); L(B, 306, 14, 306, 40, ST.line, 1);
    R(G.deburr, 288, 46, 30, 16, ST.fillA, ST.line, 1.1); R(G.deburr, 282, 47, 4, 22, ST.fillC, ST.line, 1); R(G.deburr, 320, 47, 4, 22, ST.fillC, ST.line, 1);
    ["M324,58 l12,6", "M324,58 l14,0", "M324,58 l11,-6"].forEach((d, i) => Pth(G.deburr, d, "none", ST.acc, 1.1).setAttribute("class", "spark s" + i));
    C(B, 350, 51, 5, ST.fillA, ST.line, 1);
    // sup chest (in front of the bench) + chief radio
    R(G.sup, 256, 0, 52, 62, ST.fillB, ST.line, 1.1); for (let i = 1; i < 6; i++) L(G.sup, 260, i * 11, 304, i * 11, ST.line, .8);
    R(G.chief, 268, 62, 24, 14, ST.fillA, ST.line, 1.1); L(G.chief, 288, 76, 288, 110, ST.line, 1); C(G.chief, 288, 110, 2.2, ST.acc).setAttribute("class", "led");
    // celerity: you see the rotor housing face from the front
    const E = G.celerity;
    R(E, 178, 0, 54, 4, ST.fillC, ST.line, 1); R(E, 202, 4, 6, 36, ST.fillC, ST.line, 1);
    Pth(E, troch(204, 60, 22, 3.2, 1), ST.fillB, ST.line, 1.2);
    { const r = Pth(E, "M204,46 Q214,60 218,68 Q204,72 190,68 Q194,60 204,46 Z", "none", ST.acc, 1.4); r.setAttribute("class", "rotor"); r.dataset.c = "204 60.7"; }
    R(E, 196, 78, 16, 8, ST.acc, ST.line, 1);
    R(E, 132, 0, 20, 10, ST.fillA, ST.line, 1);
    return g;
  }

  // ───────── Side elevation (looking at the left wall): x = v, y = up ─────────
  function side(parent, X, ground, s) {
    defs(parent.ownerSVGElement || parent);
    const g = el("g", { transform: `matrix(${s} 0 0 ${-s} ${X} ${ground})` }, parent), B = el("g", {}, g), G = groups(g);
    Pth(B, "M0,0 V150 H170 V72 H240 V0 Z", ST.fillA, ST.line, 1);
    R(B, -8, 0, 8, 150, "url(#wallhatch)", ST.line, 1.2);
    L(B, -20, 0, 260, 0, ST.line, 1.6);
    // venae harness board, face-on
    R(G.venae, 46, 68, 112, 70, ST.fillB, ST.line, 1.1);
    Pth(G.venae, "M54,104 C76,104 86,110 102,110 S136,116 150,124", "none", ST.line, 2.2);
    Pth(G.venae, "M80,107 C80,94 72,86 62,82", "none", ST.acc, 1.3); Pth(G.venae, "M124,113 C126,124 132,130 142,132", "none", ST.acc, 1.3);
    // skills pegboard, edge-on
    R(G.skills, 0, 74, 7, 66, ST.fillB, ST.line, 1);
    // tires, bench, grinder (wheel seen face-on)
    for (let i = 0; i < 3; i++) R(B, 18, i * 13, 44, 13, ST.fillC, ST.line, 1).setAttribute("rx", 4);
    R(B, 8, 40, 50, 6, ST.fillB, ST.line, 1); R(B, 12, 0, 6, 40, ST.fillC, ST.line, 1); R(B, 48, 0, 6, 40, ST.fillC, ST.line, 1);
    C(G.deburr, 36, 58, 11, ST.fillA, ST.line, 1.1); C(G.deburr, 36, 58, 3, "var(--il-dark)", ST.line, .8);
    // sup + chief
    R(G.sup, 104, 0, 40, 62, ST.fillB, ST.line, 1.1); for (let i = 1; i < 6; i++) L(G.sup, 104, i * 11, 144, i * 11, ST.fillC, .8);
    R(G.chief, 112, 62, 18, 14, ST.fillA, ST.line, 1.1); L(G.chief, 114, 76, 114, 110, ST.line, 1); C(G.chief, 114, 110, 2.2, ST.acc).setAttribute("class", "led");
    // celerity: the plate sandwich in profile
    const E = G.celerity;
    R(E, 168, 0, 50, 4, ST.fillC, ST.line, 1); R(E, 190, 4, 6, 36, ST.fillC, ST.line, 1);
    [[178, 4], [182, 9], [191, 3], [194, 9], [203, 4]].forEach(([v, t], i) => R(E, v, 40 + (i % 2 ? 0 : 3), t, i % 2 ? 44 : 38, i % 2 ? ST.fillA : ST.fillB, ST.line, 1));
    R(E, 186, 84, 14, 8, ST.acc, ST.line, 1);
    R(E, 188, 0, 16, 10, ST.fillA, ST.line, 1);
    return g;
  }

  function dim(g, x1, y1, x2, y2, label, vertical) {
    L(g, x1, y1, x2, y2, ST.line, .8);
    [[x1, y1], [x2, y2]].forEach(([x, y]) => L(g, x - 4, y + 4, x + 4, y - 4, ST.line, 1));
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const t = T(g, vertical ? mx - 8 : mx, vertical ? my : my - 6, label, "fill:var(--mute);font:500 11px var(--mono);letter-spacing:1px", "middle");
    if (vertical) t.setAttribute("transform", `rotate(-90 ${mx - 8} ${my})`);
  }
  function bubble(g, x, y, t, r) { C(g, x, y, r || 10, "var(--bg)", ST.line, 1); T(g, x, y + 4, t, "fill:var(--ink);font:600 11px var(--mono)", "middle"); }
  function viewLabel(g, x, y, n, title, scale) {
    bubble(g, x + 12, y - 4, n, 12);
    T(g, x + 32, y - 4, title, LABEL); T(g, x + 32, y + 10, scale, SMALL);
    L(g, x + 30, y + 0, x + 30 + Math.max(110, title.length * 8), y + 0, ST.line, .8);
  }
  function titleBlock(g, x, y, w, rows) {
    const tb = el("g", { transform: `translate(${x},${y})` }, g);
    R(tb, 0, 0, w, 104, "var(--bg)", ST.line, 1); L(tb, 0, 30, w, 30, ST.line, 1); L(tb, 0, 66, w, 66, ST.line, 1); L(tb, w / 2, 66, w / 2, 104, ST.line, 1);
    T(tb, 10, 20, rows[0], "fill:var(--ink);font:600 12px var(--mono);letter-spacing:1px");
    T(tb, 10, 45, rows[1], SMALL); T(tb, 10, 58, rows[2], SMALL);
    T(tb, 10, 82, "SCALE", SMALL); T(tb, 10, 96, rows[3], "fill:var(--ink);font:500 11px var(--mono)");
    T(tb, w / 2 + 10, 82, "SHEET", SMALL); T(tb, w / 2 + 10, 96, rows[4], "fill:var(--ink);font:500 11px var(--mono)");
  }
  function north(g, x, y) { Pth(g, `M${x},${y} l8,22 l-8,-6 l-8,6 z`, "var(--ink)"); T(g, x, y - 8, "N", "fill:var(--ink);font:600 11px var(--mono)", "middle"); }
  // small number plate with a short leader, used when plates sit right on the drawing
  function tag(g, id, n, hot, x1, y1, x2, y2) {
    const c = el("g", { class: "call", "data-call": id }, g), w = 34, h = 22;
    C(c, x1, y1, 2.4, "var(--ink)"); L(c, x1, y1, x2, y2, "var(--faint)", 1);
    R(c, x2 - w / 2, y2 - h / 2, w, h, hot ? "var(--acc)" : "var(--ink)").setAttribute("rx", 5);
    T(c, x2, y2 + 4.5, n, `fill:${hot ? "var(--on-acc)" : "var(--bg)"};font:800 13px var(--mono)`, "middle");
    return c;
  }

  window.KMPlan = { plan, front, side, dim, bubble, viewLabel, titleBlock, north, tag, R, L, C, T, Pth, SMALL, LABEL };
})();
