import type { ProjectId } from '../../data/projects.ts';

const line = 'var(--il-line)';
const top = 'var(--il-top)';
const left = 'var(--il-left)';
const right = 'var(--il-right)';
const dark = 'var(--il-dark)';
const accent = 'var(--acc)';

function attributes(values: Record<string, string | number | undefined>) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        ` ${key}="${String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')}"`,
    )
    .join('');
}

function element(
  name: string,
  values: Record<string, string | number | undefined>,
  content = '',
) {
  return `<${name}${attributes(values)}>${content}</${name}>`;
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = 'none',
  strokeWidth = 0,
  extra = '',
) {
  return element('rect', {
    x,
    y,
    width,
    height,
    style: `fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};${extra}`,
  });
}

function circle(
  cx: number,
  cy: number,
  r: number,
  fill: string,
  stroke = 'none',
  strokeWidth = 0,
  className = '',
) {
  return element('circle', {
    cx,
    cy,
    r,
    class: className || undefined,
    style: `fill:${fill};stroke:${stroke};stroke-width:${strokeWidth}`,
  });
}

function path(
  d: string,
  fill = 'none',
  stroke = 'none',
  strokeWidth = 0,
  className = '',
  extra = '',
) {
  return element('path', {
    d,
    class: className || undefined,
    style: `fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};stroke-linejoin:round;stroke-linecap:round;${extra}`,
  });
}

function lineSvg(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke = line,
  strokeWidth = 1,
  dash = '',
) {
  return element('line', {
    x1,
    y1,
    x2,
    y2,
    style: `stroke:${stroke};stroke-width:${strokeWidth};${dash ? `stroke-dasharray:${dash}` : ''}`,
  });
}

function polygon(
  points: number[][],
  fill: string,
  stroke = line,
  strokeWidth = 1,
) {
  return element('polygon', {
    points: points
      .map((point) => point.map((n) => n.toFixed(1)).join(','))
      .join(' '),
    style: `fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};stroke-linejoin:round`,
  });
}

type Point = [number, number];

function iso(scale: number, originX: number, originY: number) {
  const project = (u: number, v: number, z = 0): Point => [
    originX + (u - v) * 0.866 * scale,
    originY + ((u + v) * 0.5 - z) * scale,
  ];
  const face = (u: number, v: number, z: number, content: string) => {
    const [x, y] = project(u, v, z);
    return element(
      'g',
      {
        transform: `matrix(${(0.866 * scale).toFixed(3)} ${(0.5 * scale).toFixed(3)} 0 ${scale} ${x.toFixed(2)} ${y.toFixed(2)})`,
      },
      content,
    );
  };
  const faceRight = (u: number, v: number, z: number, content: string) => {
    const [x, y] = project(u, v, z);
    return element(
      'g',
      {
        transform: `matrix(${(0.866 * scale).toFixed(3)} ${(-0.5 * scale).toFixed(3)} 0 ${scale} ${x.toFixed(2)} ${y.toFixed(2)})`,
      },
      content,
    );
  };
  const box = (
    u: number,
    v: number,
    width: number,
    depth: number,
    z: number,
    height: number,
    fills: { top: string; left?: string; right?: string } = {
      top,
      left,
      right,
    },
  ) => {
    const topZ = z + height;
    return (
      polygon(
        [
          project(u, v + depth, z),
          project(u + width, v + depth, z),
          project(u + width, v + depth, topZ),
          project(u, v + depth, topZ),
        ],
        fills.left ?? left,
      ) +
      polygon(
        [
          project(u + width, v, z),
          project(u + width, v + depth, z),
          project(u + width, v + depth, topZ),
          project(u + width, v, topZ),
        ],
        fills.right ?? right,
      ) +
      polygon(
        [
          project(u, v, topZ),
          project(u + width, v, topZ),
          project(u + width, v + depth, topZ),
          project(u, v + depth, topZ),
        ],
        fills.top,
      )
    );
  };
  const cylinder = (
    u: number,
    v: number,
    z: number,
    radius: number,
    height: number,
    side: string,
    cap: string,
  ) => {
    const [cx, baseY] = project(u, v, z);
    const cy = baseY - height * scale;
    const rx = radius * 1.2247 * scale;
    const ry = radius * 0.7071 * scale;
    return {
      cx,
      cy,
      rx,
      ry,
      art:
        path(
          `M${cx - rx},${cy}V${baseY}A${rx},${ry} 0 0 0 ${cx + rx},${baseY}V${cy}Z`,
          side,
          line,
          1.1,
        ) +
        element('ellipse', {
          cx,
          cy,
          rx,
          ry,
          style: `fill:${cap};stroke:${line};stroke-width:1.1`,
        }),
    };
  };
  return { project, face, faceRight, box, cylinder };
}

function sparkleWheel(
  scale: number,
  originX: number,
  originY: number,
  u: number,
  animated: boolean,
) {
  const I = iso(scale, originX, originY);
  const spokes = [
    'M22,20 l14,6',
    'M23,22 l10,10',
    'M21,23 l6,12',
    'M24,18 l16,1',
  ]
    .map((d, i) => path(d, 'none', accent, 1.1, animated ? `spark s${i}` : ''))
    .join('');
  return I.faceRight(
    u,
    46,
    70,
    circle(12, 12, 11, top, line, 1.1) +
      circle(12, 12, 3, dark, line, 0.8) +
      spokes,
  );
}

function rotaryPath(
  cx: number,
  cy: number,
  radius: number,
  eccentricity: number,
  sx = 1,
) {
  let d = '';
  for (let i = 0; i <= 72; i += 1) {
    const t = (i / 72) * Math.PI * 2;
    const x = cx + (radius * Math.cos(t) + eccentricity * Math.cos(3 * t)) * sx;
    const y =
      cy +
      radius * 0.78 * Math.sin(t) * sx +
      eccentricity * Math.sin(3 * t) * sx;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

function toolsOnBoard() {
  const holes = Array.from({ length: 10 }, (_, i) =>
    Array.from({ length: 8 }, (_, j) =>
      circle(6 + i * 8, 6 + j * 8, 0.7, top),
    ).join(''),
  ).join('');
  return (
    rect(0, 0, 92, 66, left, line, 1.1) +
    holes +
    path('M8,8 h6 v14 h-1.5 v26 h-3 v-26 h-1.5 z', top, line, 1.1) +
    path(
      'M20,10 a6,6 0 1 1 10,0 l-3,3 v34 h-4 v-34 z M23,6 v5 h4 v-5',
      'none',
      accent,
      1.1,
    ) +
    lineSvg(36, 12, 76, 12) +
    [3, 3.6, 4.2, 4.8, 5.4]
      .map((r, i) => circle(39 + i * 8.6, 18, r, top, line, 1))
      .join('') +
    circle(50, 40, 9, 'none', line, 2.4) +
    circle(50, 40, 5, 'none', line, 1.2) +
    path('M64,30 h12 v4 h-12 z M66,34 v14 h8 v-14', top, line, 1.1) +
    rect(80, 8, 6, 42, 'none', 'var(--faint)', 1)
  );
}

function harnessBoard() {
  return (
    rect(0, 0, 112, 70, left, line, 1.1) +
    path('M8,36 C30,36 40,30 56,30 S90,24 104,16', 'none', line, 2.6) +
    path('M56,30 C64,40 70,52 92,56', 'none', line, 1.6) +
    path('M34,33 C34,46 26,54 16,58', 'none', accent, 1.4) +
    path('M78,27 C80,16 86,10 96,8', 'none', accent, 1.4) +
    [
      [4, 33],
      [100, 13],
      [88, 53],
      [12, 55],
      [93, 5],
    ]
      .map(([x, y]) => rect(x, y, 7, 6, dark, line, 0.9))
      .join('') +
    [
      [20, 35],
      [46, 31],
      [70, 28],
    ]
      .map(([x, y]) => circle(x, y, 1.6, 'var(--faint)'))
      .join('')
  );
}

function engine(
  scale: number,
  originX: number,
  originY: number,
  suffix: string,
) {
  const I = iso(scale, originX, originY);
  const cable = element(
    'g',
    {
      transform: `matrix(${(0.866 * scale).toFixed(3)} ${(0.5 * scale).toFixed(3)} ${(-0.866 * scale).toFixed(3)} ${(0.5 * scale).toFixed(3)} ${I.project(0, 0, 0).join(' ')})`,
    },
    path('M150,198 C166,198 170,206 186,206', 'none', line, 1.4),
  );
  const controller =
    I.box(132, 188, 20, 16, 0, 10) +
    I.face(
      132,
      204,
      10,
      circle(5, 5, 1.4, accent) + lineSvg(9, 5, 17, 5, 'var(--faint)'),
    );
  const stand =
    I.box(178, 190, 54, 6, 0, 4) +
    I.box(202, 168, 6, 50, 0, 4) +
    I.box(202, 190, 6, 6, 4, 40);
  const plateStack: [number, number, string][] = [
    [178, 4, left],
    [182, 9, top],
    [191, 3, left],
    [194, 9, top],
    [203, 4, left],
  ];
  const plates = plateStack
    .map(([v, thickness, fill]) =>
      [v, v + thickness]
        .map((at) =>
          I.face(
            178,
            at,
            84,
            path(rotaryPath(26, 26, 22, 3.2), at === v ? right : fill, line, 1),
          ),
        )
        .join(''),
    )
    .join('');
  const rotor = element(
    'g',
    { class: 'rotor-wrap' },
    path(
      'M26,12 Q36,30 40,37 Q26,41 12,37 Q16,30 26,12 Z',
      'none',
      accent,
      1.5,
      'rotor',
    ) +
      circle(26, 30, 4, dark, line, 1) +
      circle(26, 30, 1.2, accent) +
      element('animateTransform', {
        attributeName: 'transform',
        type: 'rotate',
        from: `0 26 30`,
        to: `120 26 30`,
        dur: '1.6s',
        begin: 'indefinite',
        repeatCount: 'indefinite',
        class: `rotor-animation ${suffix}`,
      }),
  );
  const chamber = I.face(178, 207, 84, rotor);
  return (
    cable +
    controller +
    stand +
    plates +
    chamber +
    I.box(196, 186, 16, 14, 72, 8, { top: accent, left, right })
  );
}

export function projectDrawing(id: ProjectId, uniqueId: string) {
  const scales: Record<ProjectId, number> = {
    celerity: 1.4,
    'venae-machinae': 1.15,
    deburr: 1.75,
    chief: 2.1,
    sup: 1.8,
    skills: 1.2,
  };
  const centers: Record<ProjectId, [number, number, number]> = {
    celerity: [190, 196, 40],
    'venae-machinae': [0, 102, 103],
    deburr: [304, 36, 58],
    chief: [282, 124, 76],
    sup: [282, 124, 31],
    skills: [64, 0, 107],
  };
  const k = scales[id];
  const [u, v, z] = centers[id];
  const ox = 200 - (u - v) * 0.866 * k;
  const oy = 260 * 0.44 - ((u + v) * 0.5 - z) * k;
  const I = iso(k, ox, oy);
  let art: string;
  if (id === 'celerity') {
    art =
      I.box(122, 160, 130, 72, -6, 6, {
        top: 'var(--il-floor, var(--il-left))',
        left: right,
        right: dark,
      }) + engine(k, ox, oy, uniqueId);
  } else if (id === 'venae-machinae') {
    art =
      polygon(
        [
          I.project(0, 40, 0),
          I.project(0, 170, 0),
          I.project(0, 170, 150),
          I.project(0, 40, 150),
        ],
        dark,
      ) + I.faceRight(0, 158, 138, harnessBoard());
  } else if (id === 'skills') {
    art =
      polygon(
        [
          I.project(8, 0, 0),
          I.project(120, 0, 0),
          I.project(120, 0, 150),
          I.project(8, 0, 150),
        ],
        dark,
      ) + I.face(18, 0, 140, toolsOnBoard());
  } else if (id === 'sup') {
    const drawers = ['brew', 'rustup', 'skills', 'uv', 'mas']
      .map(
        (job, i) =>
          rect(4, 4 + i * 11, 44, 9, 'none', line, 0.8) +
          element(
            'text',
            {
              x: 7,
              y: 10.6 + i * 11,
              style: `fill:${i === 1 ? accent : 'var(--mute)'};font:500 4.6px var(--mono)`,
            },
            job,
          ) +
          lineSvg(34, 8.5 + i * 11, 44, 8.5 + i * 11, line, 1.2),
      )
      .join('');
    art =
      I.box(244, 92, 76, 64, -6, 6, {
        top: 'var(--il-floor, var(--il-left))',
        left: right,
        right: dark,
      }) +
      I.box(256, 104, 52, 40, 0, 62) +
      I.face(256, 144, 62, drawers);
  } else if (id === 'chief') {
    const bars = [1, 3, 5, 2, 6, 4, 2, 5, 1]
      .map((h, i) =>
        lineSvg(3 + i * 2, 7 - h, 3 + i * 2, 7 + h, i === 4 ? accent : line),
      )
      .join('');
    const point = I.project(288, 114, 76);
    const headset = I.project(300, 136, 62);
    art =
      I.box(258, 104, 46, 40, 40, 22) +
      I.box(268, 112, 24, 18, 62, 14) +
      I.face(268, 130, 76, bars + circle(20, 7, 2.6, 'none', line, 1)) +
      element('line', {
        x1: point[0],
        y1: point[1],
        x2: point[0],
        y2: point[1] - (34 * k) / 1.15,
        style: `stroke:${line};stroke-width:1.2`,
      }) +
      circle(
        point[0],
        point[1] - (34 * k) / 1.15,
        2.2,
        accent,
        'none',
        0,
        'led',
      ) +
      path(
        `M${headset[0] - (8 * k) / 1.15},${headset[1]}a${(8 * k) / 1.15},${(8 * k) / 1.15} 0 0 1 ${(16 * k) / 1.15},0`,
        'none',
        line,
        1.6,
      ) +
      [-8, 8]
        .map((dx) =>
          element('ellipse', {
            cx: headset[0] + (dx * k) / 1.15,
            cy: headset[1] + 1,
            rx: (3 * k) / 1.15,
            ry: (4 * k) / 1.15,
            style: `fill:${top};stroke:${line};stroke-width:1`,
          }),
        )
        .join('');
  } else {
    art =
      I.box(268, 14, 76, 44, 0, 46) +
      sparkleWheel(k, ox, oy, 282, false) +
      I.box(288, 26, 30, 20, 46, 16) +
      I.box(296, 30, 14, 12, 46, 4, { top: left }) +
      sparkleWheel(k, ox, oy, 324, true);
  }
  return element(
    'svg',
    { viewBox: '0 0 400 260', 'aria-hidden': 'true', focusable: 'false' },
    element('g', { class: 'art' }, element('g', { 'data-obj': id }, art)),
  );
}

type PlanProject = {
  id: ProjectId;
  number: string;
  repo: string;
  object: string;
  spec: string;
  lang: string;
  commits: number;
};

export function garagePlan(
  projects: readonly PlanProject[],
  hotId: ProjectId | null,
) {
  const X = 112;
  const Y = 104;
  const s = 1.22;
  const sx = (u: number) => X + u * s;
  const sy = (v: number) => Y + v * s;
  let drawing = element(
    'defs',
    {},
    element(
      'pattern',
      {
        id: 'garage-wallhatch',
        width: 4,
        height: 4,
        patternUnits: 'userSpaceOnUse',
        patternTransform: 'rotate(45)',
      },
      lineSvg(0, 0, 0, 4, line, 0.8),
    ),
  );
  drawing += rect(X, Y, 380 * s, 240 * s, top, 'none', 0);
  for (let u = 40; u < 380; u += 40)
    drawing += lineSvg(sx(u), Y, sx(u), sy(240), left, 1);
  for (let v = 40; v < 240; v += 40)
    drawing += lineSvg(X, sy(v), sx(380), sy(v), left, 1);
  const hatch = 'url(#garage-wallhatch)';
  drawing +=
    rect(sx(-8), sy(-8), 138 * s, 8 * s, hatch, line, 1.2) +
    rect(sx(242), sy(-8), 146 * s, 8 * s, hatch, line, 1.2) +
    rect(sx(-8), Y, 8 * s, 248 * s, hatch, line, 1.2);
  drawing +=
    lineSvg(sx(130), sy(-4), sx(242), sy(-4), line, 1, '6 3') +
    element(
      'text',
      {
        x: sx(186),
        y: sy(14),
        'text-anchor': 'middle',
        style: 'fill:var(--mute);font:400 10px var(--mono);letter-spacing:1px',
      },
      'ROLLER DOOR',
    ) +
    rect(
      sx(132),
      sy(150),
      160 * s,
      82 * s,
      'none',
      accent,
      1.6,
      'stroke-dasharray:4 3',
    );
  const tagCoordinates: Record<ProjectId, [number, number]> = {
    skills: [0, -20],
    'venae-machinae': [-26, 0],
    deburr: [0, -30],
    sup: [30, 16],
    chief: [-36, -12],
    celerity: [-34, 26],
  };
  const objects: Record<ProjectId, string> = {
    skills: rect(sx(18), Y, 92 * s, 7 * s, left, line, 1.2),
    'venae-machinae':
      rect(X, sy(46), 7 * s, 112 * s, left, line, 1.2) +
      path(
        `M${sx(3.5)},${sy(52)} C${sx(6)},${sy(80)} ${sx(1)},${sy(100)} ${sx(3.5)},${sy(152)}`,
        'none',
        accent,
        1.2,
      ),
    deburr: '',
    sup: '',
    chief: '',
    celerity: '',
  };
  for (let x = 24; x < 108; x += 8)
    objects.skills += circle(sx(x), sy(3.5), 0.8 * s, line);
  drawing +=
    circle(sx(198), sy(40), 22 * s, left, line, 1.2) +
    circle(sx(198), sy(40), 17.6 * s, 'none', accent, 1.2) +
    circle(sx(198), sy(40), 12 * s, top, line, 1);
  drawing +=
    rect(sx(250), sy(8), 112 * s, 50 * s, left, line, 1.2) +
    circle(sx(350), sy(30), 5 * s, top, line, 1);
  objects.deburr +=
    rect(sx(288), sy(26), 30 * s, 20 * s, top, line, 1.2) +
    rect(sx(282), sy(24), 4 * s, 24 * s, right, line, 1) +
    rect(sx(320), sy(24), 4 * s, 24 * s, right, line, 1);
  objects.deburr += element(
    'g',
    { transform: `matrix(${s} 0 0 ${s} ${X} ${Y})` },
    ['M324,36 l12,-6', 'M324,36 l14,0', 'M324,36 l12,6']
      .map((d, index) => path(d, 'none', accent, 1.1, `spark s${index}`))
      .join(''),
  );
  objects.sup = rect(sx(256), sy(104), 52 * s, 40 * s, left, line, 1.2);
  for (let i = 1; i < 5; i += 1)
    objects.sup += lineSvg(
      sx(256),
      sy(104 + i * 8),
      sx(308),
      sy(104 + i * 8),
      right,
      1,
    );
  objects.chief =
    rect(
      sx(268),
      sy(112),
      24 * s,
      18 * s,
      top,
      line,
      1.2,
      'stroke-dasharray:3 2',
    ) + circle(sx(288), sy(114), 2.2 * s, accent, 'none', 0, 'led');
  objects.celerity =
    rect(sx(178), sy(190), 54 * s, 6 * s, right, line, 1) +
    rect(sx(202), sy(168), 6 * s, 50 * s, right, line, 1) +
    rect(sx(178), sy(178), 34 * s, 33 * s, left, line, 1.2);
  for (let i = 1; i < 5; i += 1)
    objects.celerity += lineSvg(
      sx(178),
      sy(178 + i * 6.6),
      sx(212),
      sy(178 + i * 6.6),
      right,
      1,
    );
  objects.celerity +=
    rect(sx(196), sy(186), 16 * s, 14 * s, accent, line, 1) +
    rect(sx(132), sy(188), 20 * s, 16 * s, top, line, 1.2) +
    path(
      `M${sx(152)},${sy(196)} C${sx(166)},${sy(196)} ${sx(170)},${sy(202)} ${sx(178)},${sy(202)}`,
      'none',
      line,
      1.2,
    );
  drawing += Object.entries(objects)
    .map(([id, object]) => element('g', { 'data-obj': id }, object))
    .join('');
  const centers: Record<ProjectId, [number, number]> = {
    skills: [64, 4],
    'venae-machinae': [4, 102],
    deburr: [303, 36],
    sup: [296, 140],
    chief: [280, 121],
    celerity: [196, 194],
  };
  for (const project of projects) {
    const [u, v] = centers[project.id];
    const [dx, dy] = tagCoordinates[project.id];
    const [ax, ay] = [sx(u), sy(v)];
    const [tx, ty] = [ax + dx, ay + dy];
    const hot = hotId === project.id;
    drawing += element(
      'a',
      {
        href: `#project-${project.id}`,
        class: 'callout',
        'data-call': project.id,
        'data-project-focus': '',
        'data-project-id': project.id,
        'data-project-number': project.number,
        'data-project-name': project.repo,
        'data-project-object': project.object,
        'data-project-spec': project.spec,
        'data-project-lang': project.lang,
        'data-project-commits': project.commits,
        'aria-label': `Project ${project.number}: ${project.object}. Go to ${project.repo} card.`,
        tabindex: 0,
      },
      circle(ax, ay, 2.4, 'var(--ink)') +
        lineSvg(ax, ay, tx, ty, 'var(--faint)') +
        rect(
          tx - 17,
          ty - 11,
          34,
          22,
          hot ? accent : 'var(--ink)',
          'none',
          0,
          'rx:5',
        ) +
        element(
          'text',
          {
            x: tx,
            y: ty + 4.5,
            'text-anchor': 'middle',
            style: `fill:${hot ? 'var(--on-acc)' : 'var(--bg)'};font:800 13px var(--mono)`,
          },
          project.number,
        ),
    );
  }
  drawing +=
    lineSvg(X, Y - 34, sx(380), Y - 34, line, 0.8) +
    lineSvg(X - 4, Y - 30, X + 4, Y - 38, line, 1) +
    lineSvg(sx(380) - 4, Y - 30, sx(380) + 4, Y - 38, line, 1) +
    element(
      'text',
      {
        x: (X + sx(380)) / 2,
        y: Y - 40,
        'text-anchor': 'middle',
        style: 'fill:var(--mute);font:500 11px var(--mono);letter-spacing:1px',
      },
      '7.60 M',
    );
  drawing +=
    lineSvg(X - 34, Y, X - 34, sy(240), line, 0.8) +
    lineSvg(X - 38, Y + 4, X - 30, Y - 4, line, 1) +
    lineSvg(X - 38, sy(240) + 4, X - 30, sy(240) - 4, line, 1) +
    element(
      'text',
      {
        x: X - 48,
        y: (Y + sy(240)) / 2,
        transform: `rotate(-90 ${X - 48} ${(Y + sy(240)) / 2})`,
        'text-anchor': 'middle',
        style: 'fill:var(--mute);font:500 11px var(--mono);letter-spacing:1px',
      },
      '4.80 M',
    );
  for (const [label, u] of [
    ['A', 0],
    ['B', 190],
    ['C', 380],
  ] as const) {
    const x = sx(u);
    drawing +=
      lineSvg(x, Y - 46, x, Y - 58, 'var(--faint)') +
      circle(x, Y - 68, 10, 'var(--bg)', line, 1) +
      element(
        'text',
        {
          x,
          y: Y - 64,
          'text-anchor': 'middle',
          style: 'fill:var(--ink);font:600 11px var(--mono)',
        },
        label,
      );
  }
  for (const [label, v] of [
    ['1', 0],
    ['2', 120],
    ['3', 240],
  ] as const) {
    const y = sy(v);
    drawing +=
      circle(X - 66, y, 10, 'var(--bg)', line, 1) +
      element(
        'text',
        {
          x: X - 66,
          y: y + 4,
          'text-anchor': 'middle',
          style: 'fill:var(--ink);font:600 11px var(--mono)',
        },
        label,
      );
  }
  const nx = sx(380) - 12;
  const ny = sy(240) + 40;
  drawing +=
    path(`M${nx},${ny} l8,22 l-8,-6 l-8,6 z`, 'var(--ink)') +
    element(
      'text',
      {
        x: nx,
        y: ny - 8,
        'text-anchor': 'middle',
        style: 'fill:var(--ink);font:600 11px var(--mono)',
      },
      'N',
    );
  const described =
    'Top-down garage plan with a roller door, floor grid, work pit, and six numbered project objects.';
  return element(
    'svg',
    {
      class: 'scene',
      viewBox: '28 18 604 460',
      role: 'group',
      'aria-labelledby': 'plan-title plan-description',
    },
    element('title', { id: 'plan-title' }, 'Garage floor plan') +
      element('desc', { id: 'plan-description' }, described) +
      element('g', { class: 'art' }, drawing),
  );
}
