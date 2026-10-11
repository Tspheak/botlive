/* Tun Labs Town — isometric live bot studio. No build step. */
(function () {
  'use strict';

  var COLS = 15;
  var ROWS = 13;
  var TW = 56;
  var TH = 28;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPEED = REDUCE ? 80 : 3.15;

  var PROJECTS = {
    citizenprep: {
      name: 'CitizenPrep',
      accent: '#ea580c',
      slots: [
        { x: 4.28, y: 6.4 },
        { x: 4.5, y: 7.35 },
        { x: 3.4, y: 7.55 }
      ]
    },
    paycheck: {
      name: 'PayCheck Easy',
      accent: '#059669',
      slots: [
        { x: 12.35, y: 6.05 },
        { x: 11.05, y: 7.45 },
        { x: 12.55, y: 7.7 }
      ]
    },
    nokorgo: {
      name: 'NokorGo',
      accent: '#d97706',
      slots: [
        { x: 4.3, y: 10.15 },
        { x: 4.55, y: 9.15 },
        { x: 3.35, y: 10.55 }
      ]
    },
    etsy: {
      name: 'Etsy shop',
      accent: '#e11d48',
      slots: [
        { x: 12.25, y: 10.2 },
        { x: 12.5, y: 9.05 },
        { x: 11.15, y: 10.7 }
      ]
    },
    hq: {
      name: 'HQ',
      accent: '#2563eb',
      slots: [
        { x: 8.7, y: 3.45 },
        { x: 9.35, y: 4.15 },
        { x: 7.55, y: 3.85 }
      ]
    }
  };

  var REST_SLOTS = [
    { x: 5.15, y: 6.9 },
    { x: 8.05, y: 5.6 },
    { x: 6.45, y: 6.2 },
    { x: 7.25, y: 7.2 },
    { x: 5.45, y: 5.85 },
    { x: 8.2, y: 6.9 },
    { x: 6.15, y: 7.35 }
  ];

  var TROPHY_SLOTS = {
    citizenprep: [
      { x: 1.4, y: 3.25 },
      { x: 2.75, y: 3.15 },
      { x: 1.45, y: 2.4 },
      { x: 2.85, y: 2.3 }
    ],
    paycheck: [
      { x: 10.15, y: 3.25 },
      { x: 11.5, y: 3.15 },
      { x: 10.2, y: 2.4 },
      { x: 11.55, y: 2.3 }
    ],
    nokorgo: [
      { x: 1.4, y: 7.7 },
      { x: 2.75, y: 7.55 },
      { x: 1.5, y: 6.95 }
    ],
    etsy: [
      { x: 10.15, y: 7.7 },
      { x: 11.5, y: 7.55 },
      { x: 10.25, y: 6.95 }
    ],
    hq: [
      { x: 3.7, y: 1.35 },
      { x: 3.55, y: 2.25 },
      { x: 9.55, y: 1.25 },
      { x: 9.7, y: 2.15 }
    ]
  };

  var BOT_META = [
    { id: 'atlas', name: 'Atlas', role: 'Coordinator', sips: true, delay: 0.15, color: '#0f766e' },
    { id: 'dex', name: 'Dex', role: 'App developer', sips: false, delay: 0.8, color: '#ea580c' },
    { id: 'ledger', name: 'Ledger', role: 'PayCheck Easy dev', sips: true, delay: 1.35, color: '#15803d' },
    { id: 'iris', name: 'Iris', role: 'QA tester', sips: false, delay: 0.45, color: '#7e22ce' },
    { id: 'harbor', name: 'Harbor', role: 'Release manager', sips: true, delay: 1.9, color: '#1d4ed8' },
    { id: 'scout', name: 'Scout', role: 'Researcher', sips: false, delay: 2.3, color: '#4d7c0f' },
    { id: 'vista', name: 'Vista', role: 'Etsy shop manager', sips: true, delay: 1.05, color: '#be123c' }
  ];

  var POSES = ['idle', 'walk1', 'walk2', 'work', 'rest'];
  var WALK_FRAME_MS = 200;

  function spriteSrc(id, pose) {
    return new URL('assets/sprites/' + id + '_' + pose + '.png', document.baseURI).href;
  }

  function preloadSprites() {
    BOT_META.forEach(function (meta) {
      POSES.forEach(function (pose) {
        var img = new Image();
        img.decoding = 'async';
        img.src = spriteSrc(meta.id, pose);
      });
    });
  }

  preloadSprites();

  var road = new Set();
  var blocked = new Set();
  var BOTS = [];
  var live = null;
  var baseline = null;
  var booted = false;
  var userMovedCam = false;
  var fitScale = 1;
  var cam = { x: 0, y: 0, s: 1 };
  var vb = { x: 0, y: 0, w: 800, h: 560 };
  var particles = [];
  var popping = [];
  var pan = null;
  var ptrs = new Map();
  var pinchDist = 0;
  var newsSig = '';
  var demoTimer = 0;
  var svgPoint = null;
  var lastFetch = 0;

  var svg, world, viewport, stage, sceneryEl, botsLayer, confettiLayer, labelsEl, leadersSvg, actorsEl;

  function P(x, y, z) {
    return [(x - y) * TW / 2, (x + y) * TH / 2 - (z || 0)];
  }

  function isoPoly(pts, fill, stroke, sw) {
    var points = pts.map(function (p) {
      return p[0].toFixed(1) + ',' + p[1].toFixed(1);
    }).join(' ');
    var st = stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 1) + '" stroke-linejoin="round"' : '';
    return '<polygon points="' + points + '" fill="' + fill + '"' + st + '/>';
  }

  function box(w, d, h, top, left, right) {
    var T = [P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)];
    var R = [P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)];
    var L = [P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)];
    var edge = 'rgba(31,41,55,.55)';
    return isoPoly(L, left, edge, 1) + isoPoly(R, right, edge, 1) + isoPoly(T, top, edge, 1);
  }

  function boxAt(ox, oy, oz, w, d, h, top, left, right) {
    var p = P(ox, oy, oz);
    return '<g transform="translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')">' +
      box(w, d, h, top, left, right) + '</g>';
  }

  function roofPrism(x, y, w, d, z, rh, cA, cB) {
    var ridgeL = P(x + w * 0.08, y + d / 2, z + rh);
    var ridgeR = P(x + w * 0.92, y + d / 2, z + rh);
    var a = P(x, y, z);
    var b = P(x + w, y, z);
    var c = P(x + w, y + d, z);
    var e = P(x, y + d, z);
    var edge = '#1f2937';
    return isoPoly([a, b, ridgeR, ridgeL], cB, edge, 0.8) +
      isoPoly([a, e, ridgeL], cB, edge, 0.8) +
      isoPoly([b, c, ridgeR], cA, edge, 0.8) +
      isoPoly([e, c, ridgeR, ridgeL], cA, edge, 0.8);
  }

  function pyramid(x, y, w, d, z, h, cA, cB) {
    var apex = P(x + w / 2, y + d / 2, z + h);
    var a = P(x, y, z);
    var b = P(x + w, y, z);
    var c = P(x + w, y + d, z);
    var e = P(x, y + d, z);
    var edge = '#1f2937';
    return isoPoly([a, b, apex], cB, edge, 0.8) +
      isoPoly([a, e, apex], cB, edge, 0.8) +
      isoPoly([b, c, apex], cA, edge, 0.8) +
      isoPoly([e, c, apex], cA, edge, 0.8);
  }

  function shadow(w, d) {
    var c = P(w / 2, d / 2, 0);
    var rx = (w + d) * 9;
    return '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + (c[1] + 6).toFixed(1) +
      '" rx="' + rx.toFixed(1) + '" ry="' + (rx * 0.36).toFixed(1) + '" fill="rgba(30,50,30,.16)"/>';
  }

  function doorAt(x, yFace, width, wallH, color) {
    var x0 = x + width * 0.36;
    var x1 = x + width * 0.66;
    var zh = Math.max(16, wallH * 0.46);
    var poly = isoPoly(
      [P(x0, yFace, 0), P(x1, yFace, 0), P(x1, yFace, zh), P(x0, yFace, zh)],
      color, '#1f2937', 1
    );
    var knob = P(x + width * 0.58, yFace, zh * 0.45);
    return poly + '<circle cx="' + knob[0].toFixed(1) + '" cy="' + knob[1].toFixed(1) + '" r="1.4" fill="#fbbf24" stroke="#1f2937" stroke-width="0.6"/>';
  }

  function windowX(faceX, y, z, wy, wz) {
    return isoPoly(
      [P(faceX, y, z), P(faceX, y + wy, z), P(faceX, y + wy, z + wz), P(faceX, y, z + wz)],
      '#e0f2fe', '#1f2937', 1
    );
  }

  function windowY(x, faceY, z, wx, wz) {
    return isoPoly(
      [P(x, faceY, z), P(x + wx, faceY, z), P(x + wx, faceY, z + wz), P(x, faceY, z + wz)],
      '#e0f2fe', '#1f2937', 1
    );
  }

  function house(w, d, wallH, roofH, colors) {
    var s = shadow(w, d);
    s += box(w, d, wallH, colors.top, colors.left, colors.right);
    s += windowX(w, d * 0.22, wallH * 0.42, Math.min(0.32, d * 0.28), Math.min(16, wallH * 0.32));
    s += windowY(w * 0.18, d, wallH * 0.48, w * 0.22, Math.min(14, wallH * 0.28));
    s += doorAt(0, d, w, wallH, colors.door || '#7c2d12');
    s += roofPrism(-0.1, -0.1, w + 0.2, d + 0.2, wallH, roofH, colors.roof, colors.roofD);
    return s;
  }

  function markRoads() {
    var x;
    var y;
    for (y = 4; y <= 10; y++) {
      road.add('4,' + y);
      road.add('9,' + y);
    }
    for (x = 4; x <= 9; x++) {
      road.add(x + ',4');
      road.add(x + ',8');
    }
    for (x = 5; x <= 9; x++) road.add(x + ',3');
    for (y = 3; y <= 10; y++) road.add('12,' + y);
    for (x = 10; x <= 12; x++) {
      road.add(x + ',3');
      road.add(x + ',10');
    }
    road.add('10,7');
    road.add('11,7');
    road.add('12,7');
    road.add('10,4');
    road.add('11,4');
  }

  function blockFootprints() {
    var rects = [
      [1.35, 4.45, 2.05, 1.55],
      [10.05, 4.5, 1.95, 1.5],
      [1.35, 8.55, 2.05, 1.4],
      [10.05, 8.55, 1.95, 1.4],
      [5.15, 1.2, 3.15, 1.7]
    ];
    rects.forEach(function (r) {
      var x0 = r[0];
      var y0 = r[1];
      var x1 = r[0] + r[2];
      var y1 = r[1] + r[3];
      var i;
      var j;
      for (i = Math.floor(x0); i <= Math.floor(x1); i++) {
        for (j = Math.floor(y0); j <= Math.floor(y1); j++) {
          var cx = i + 0.5;
          var cy = j + 0.5;
          if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) blocked.add(i + ',' + j);
        }
      }
    });
  }

  function tileCost(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return Infinity;
    var k = x + ',' + y;
    if (blocked.has(k)) return Infinity;
    if (road.has(k)) return 1;
    if (x >= 5 && x <= 8 && y >= 5 && y <= 7) return 1;
    return 4.2;
  }

  function nearestOpen(x, y) {
    var ix = Math.round(x);
    var iy = Math.round(y);
    var best = null;
    var bestD = 1e9;
    var r;
    var dx;
    var dy;
    for (r = 0; r <= 6; r++) {
      for (dy = -r; dy <= r; dy++) {
        for (dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (tileCost(ix + dx, iy + dy) === Infinity) continue;
          var d = Math.pow(ix + dx + 0.5 - x, 2) + Math.pow(iy + dy + 0.5 - y, 2);
          if (d < bestD) {
            bestD = d;
            best = { x: ix + dx, y: iy + dy };
          }
        }
      }
      if (best) return best;
    }
    return {
      x: Math.max(0, Math.min(COLS - 1, ix)),
      y: Math.max(0, Math.min(ROWS - 1, iy))
    };
  }

  function astar(start, goal) {
    var sk = start.x + ',' + start.y;
    var gk = goal.x + ',' + goal.y;
    if (sk === gk) return [start];
    var open = [start];
    var gScore = {};
    var fScore = {};
    var prev = {};
    var seen = {};
    gScore[sk] = 0;
    fScore[sk] = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
    while (open.length) {
      open.sort(function (a, b) {
        return (fScore[a.x + ',' + a.y] || 1e9) - (fScore[b.x + ',' + b.y] || 1e9);
      });
      var cur = open.shift();
      var ck = cur.x + ',' + cur.y;
      if (seen[ck]) continue;
      seen[ck] = 1;
      if (ck === gk) {
        var out = [cur];
        var k = ck;
        while (prev[k]) {
          var parts = prev[k].split(',');
          out.push({ x: +parts[0], y: +parts[1] });
          k = prev[k];
        }
        return out.reverse();
      }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dir) {
        var nx = cur.x + dir[0];
        var ny = cur.y + dir[1];
        var cost = tileCost(nx, ny);
        if (cost === Infinity) return;
        var nk = nx + ',' + ny;
        var ng = gScore[ck] + cost;
        if (ng < (gScore[nk] == null ? Infinity : gScore[nk])) {
          gScore[nk] = ng;
          fScore[nk] = ng + Math.abs(nx - goal.x) + Math.abs(ny - goal.y);
          prev[nk] = ck;
          open.push({ x: nx, y: ny });
        }
      });
    }
    return null;
  }

  function simplify(pts) {
    if (pts.length <= 2) return pts;
    var out = [pts[0]];
    var i;
    for (i = 1; i < pts.length - 1; i++) {
      var a = out[out.length - 1];
      var b = pts[i];
      var c = pts[i + 1];
      var cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) > 0.02) out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function findPath(x, y, gx, gy) {
    var start = nearestOpen(x, y);
    var goal = nearestOpen(gx, gy);
    var tiles = astar(start, goal);
    if (!tiles) return [{ x: gx, y: gy }];
    var pts = tiles.map(function (t) { return { x: t.x + 0.5, y: t.y + 0.5 }; });
    pts[0] = { x: x, y: y };
    pts.push({ x: gx, y: gy });
    return simplify(pts);
  }


  function diamond(x, y, z, fill, stroke) {
    return isoPoly([P(x, y, z), P(x + 1, y, z), P(x + 1, y + 1, z), P(x, y + 1, z)], fill, stroke || 'none', 0.6);
  }

  function buildMap() {
    markRoads();
    blockFootprints();
    var corners = [P(0, 0), P(COLS, 0), P(0, ROWS), P(COLS, ROWS)];
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    corners.forEach(function (p) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    });
    vb = {
      x: minX - 70,
      y: minY - 190,
      w: (maxX - minX) + 150,
      h: (maxY - minY) + 190 + 100
    };

    var grassColors = ['#67c454', '#78d264', '#5cba4a', '#86dc72', '#70cc5c'];
    var ground = '';
    var center = P(COLS / 2, ROWS / 2, -8);
    ground += '<ellipse cx="' + center[0].toFixed(1) + '" cy="' + (center[1] + 36).toFixed(1) +
      '" rx="430" ry="120" fill="rgba(20,60,40,.20)" filter="url(#blur)"/>';

    var y;
    var x;
    for (y = 0; y < ROWS; y++) {
      ground += (function (yy) {
        return isoPoly(
          [P(COLS, yy, 0), P(COLS, yy + 1, 0), P(COLS, yy + 1, -26), P(COLS, yy, -26)],
          '#8d6b4a', '#6b4f34', 0.6
        );
      })(y);
    }
    for (x = 0; x < COLS; x++) {
      ground += isoPoly(
        [P(x, ROWS, 0), P(x + 1, ROWS, 0), P(x + 1, ROWS, -26), P(x, ROWS, -26)],
        '#c4a574', '#8d6b4a', 0.6
      );
    }

    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) {
        var n = Math.abs((x * 13 + y * 7) % 5);
        ground += diamond(x, y, 0, grassColors[n], 'rgba(255,255,255,.18)');
      }
    }

    var plots = [
      [5, 1, 4, 2, 'rgba(186, 202, 255, 0.55)'],
      [1, 4, 3, 3, 'rgba(255, 196, 140, 0.5)'],
      [10, 4, 3, 3, 'rgba(140, 230, 180, 0.5)'],
      [5, 5, 4, 3, 'rgba(190, 240, 180, 0.38)'],
      [1, 8, 3, 3, 'rgba(255, 214, 150, 0.48)'],
      [10, 8, 3, 3, 'rgba(255, 176, 196, 0.5)']
    ];
    plots.forEach(function (pl) {
      var px;
      var py;
      for (py = pl[1]; py < pl[1] + pl[3]; py++) {
        for (px = pl[0]; px < pl[0] + pl[2]; px++) {
          if (!road.has(px + ',' + py)) ground += diamond(px, py, 0.4, pl[4]);
        }
      }
    });

    road.forEach(function (key) {
      if (blocked.has(key)) return;
      var parts = key.split(',');
      var rx = +parts[0];
      var ry = +parts[1];
      ground += diamond(rx, ry, 1.2, '#f4ddb6', '#e5c99a');
      ground += isoPoly(
        [P(rx, ry + 1, 1.2), P(rx + 1, ry + 1, 1.2), P(rx + 1, ry + 1, 0), P(rx, ry + 1, 0)],
        '#e7c89a', 'none', 0
      );
    });

    var flowers = [
      [6.2, 5.4, '#fb7185'], [7.4, 5.35, '#fbbf24'], [5.6, 6.4, '#fff'],
      [8.1, 6.15, '#c084fc'], [6.8, 7.05, '#fb7185'], [2.2, 6.6, '#fde68a'],
      [12.2, 5.2, '#fff'], [7.8, 2.6, '#fb7185'], [1.8, 10.4, '#f9a8d4'],
      [11.6, 11.1, '#fde68a'], [0.8, 5.2, '#fff'], [13.4, 8.4, '#fb7185']
    ];
    flowers.forEach(function (f) {
      var fp = P(f[0], f[1], 3);
      ground += '<g transform="translate(' + fp[0].toFixed(1) + ',' + fp[1].toFixed(1) + ')">' +
        '<circle r="2.5" fill="' + f[2] + '" stroke="#1f2937" stroke-width="0.6"/>' +
        '<circle r="1" fill="#fef08a"/></g>';
    });

    var sunX = vb.x + vb.w - 110;
    var sunY = vb.y + 78;
    var sky = '<g transform="translate(' + sunX + ',' + sunY + ')">' +
      '<g class="cloud-bit"><g>' +
      '<circle r="26" fill="#ffe08a"/>' +
      '<g stroke="#f6c453" stroke-width="3" stroke-linecap="round">' +
      '<line x1="0" y1="-36" x2="0" y2="-46"/><line x1="0" y1="36" x2="0" y2="46"/>' +
      '<line x1="-36" y1="0" x2="-46" y2="0"/><line x1="36" y1="0" x2="46" y2="0"/>' +
      '<line x1="-26" y1="-26" x2="-34" y2="-34"/><line x1="26" y1="-26" x2="34" y2="-34"/>' +
      '<line x1="-26" y1="26" x2="-34" y2="34"/><line x1="26" y1="26" x2="34" y2="34"/>' +
      '</g></g></g></g>';
    [[vb.x + 120, vb.y + 70, 1], [vb.x + 280, vb.y + 110, 0.8], [vb.x + vb.w * 0.55, vb.y + 54, 1.1]].forEach(function (c) {
      sky += '<g transform="translate(' + c[0] + ',' + c[1] + ') scale(' + c[2] + ')">' +
        '<g class="cloud-bit">' +
        '<ellipse cx="0" cy="0" rx="26" ry="12" fill="#fff"/>' +
        '<ellipse cx="-16" cy="4" rx="14" ry="9" fill="#fff"/>' +
        '<ellipse cx="14" cy="3" rx="16" ry="10" fill="#fff"/>' +
        '</g></g>';
    });
    var bp = P(3.2, 1.6, 20);
    sky += '<g transform="translate(' + bp[0].toFixed(1) + ',' + bp[1].toFixed(1) + ')">' +
      '<g class="butter">' +
      '<ellipse class="wing" cx="-4" cy="0" rx="4.2" ry="3" fill="#f9a8d4" stroke="#9d174d" stroke-width="0.6"/>' +
      '<ellipse class="wing" cx="4" cy="0" rx="4.2" ry="3" fill="#fbcfe8" stroke="#9d174d" stroke-width="0.6"/>' +
      '<rect x="-0.7" y="-3" width="1.4" height="6" rx="0.6" fill="#1f2937"/>' +
      '</g></g>';

    var items = [];
    function place(wx, wy, sort, inner, attrs) {
      var p = P(wx, wy, 0);
      items.push({
        sort: sort,
        html: '<g data-sort="' + sort.toFixed(2) + '" transform="translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')" ' + (attrs || '') + '>' + inner + '</g>'
      });
    }

    var school = { top: '#fff6e8', left: '#f3e0c4', right: '#e7d0ae', roof: '#f97316', roofD: '#c2410c', door: '#9a3412' };
    var bank = { top: '#ecfdf5', left: '#d1fae5', right: '#a7f3d0', roof: '#047857', roofD: '#065f46', door: '#14532d' };
    var cabin = { top: '#f6d7a8', left: '#e7c08a', right: '#d4a574', roof: '#3f6212', roofD: '#365314', door: '#7c2d12' };
    var stallBase = house(1.15, 0.75, 20, 8, { top: '#fff7ed', left: '#ffedd5', right: '#fed7aa', roof: '#fb7185', roofD: '#e11d48', door: '#9f1239' });

    place(1.35, 4.45, 1.35 + 2.05 + 4.45 + 1.55,
      house(2.05, 1.55, 46, 18, school) + boxAt(0.28, 0.2, 46, 0.28, 0.28, 14, '#fecaca', '#f87171', '#ef4444'),
      '');
    place(10.05, 4.5, 10.05 + 1.95 + 4.5 + 1.5,
      house(1.95, 1.5, 50, 16, bank) +
      boxAt(0.25, 1.15, 0, 0.16, 0.16, 30, '#fff', '#f8fafc', '#e2e8f0') +
      boxAt(1.45, 1.15, 0, 0.16, 0.16, 30, '#fff', '#f8fafc', '#e2e8f0') +
      (function () {
        var c = P(0.95, 0.45, 58);
        return '<g transform="translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ')">' +
          '<circle r="7" fill="#fbbf24" stroke="#1f2937" stroke-width="1"/>' +
          '<text y="2.5" text-anchor="middle" font-size="9" font-weight="800" fill="#92400e">$</text></g>';
      })(),
      '');
    place(1.35, 8.55, 1.35 + 2.05 + 8.55 + 1.4,
      house(2.05, 1.4, 40, 16, cabin) + (function () {
        var c = P(1.5, 0.35, 62);
        return '<g transform="translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ')">' +
          '<circle cy="-8" r="4" fill="#ef4444" stroke="#1f2937" stroke-width="0.8"/>' +
          '<path d="M0,-4 v10" stroke="#1f2937" stroke-width="1.4"/></g>';
      })(),
      '');
    place(10.05, 8.55, 10.05 + 1.95 + 8.55 + 1.4,
      stallBase +
      boxAt(-0.05, -0.08, 20, 1.25, 0.22, 5, '#fb7185', '#e11d48', '#be123c') +
      boxAt(-0.05, 0.14, 20, 1.25, 0.18, 5, '#fff', '#ffe4e6', '#fecdd3'),
      '');

    place(5.15, 1.2, 5.15 + 3.15 + 1.2 + 1.7, castleMarkup(), '');

    [['citizenprep', 3.15, 4.15], ['paycheck', 12.15, 4.2], ['nokorgo', 3.2, 8.2], ['etsy', 12.2, 8.25], ['hq', 8.55, 1.05]].forEach(function (c) {
      var p = P(c[1], c[2], 0);
      items.push({
        sort: c[1] + c[2],
        html: '<g class="crane crane-' + c[0] + '" data-sort="' + (c[1] + c[2]).toFixed(2) + '" transform="translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')">' +
          '<line x1="0" y1="0" x2="0" y2="-58" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>' +
          '<circle cy="-58" r="3" fill="#fbbf24" stroke="#1f2937" stroke-width="1"/>' +
          '<g transform="translate(0,-58)"><g class="jib">' +
          '<line x1="0" y1="0" x2="42" y2="8" stroke="#f59e0b" stroke-width="3.2" stroke-linecap="round"/>' +
          '<line x1="34" y1="6.5" x2="34" y2="24" stroke="#475569" stroke-width="1.3"/>' +
          '<rect x="30" y="24" width="8" height="6" rx="1" fill="#64748b" stroke="#1f2937" stroke-width="0.7"/>' +
          '</g></g></g>'
      });
    });

    place(5.25, 5.15, 5.25 + 1.7 + 5.15 + 0.9, rugAndCouch(), '');
    place(7.15, 5.25, 7.15 + 0.7 + 5.25 + 0.55, tableMarkup(), '');
    place(8.15, 5.2, 8.15 + 5.2 + 0.5, plantMarkup(), '');
    place(5.15, 6.35, 5.15 + 6.35 + 0.4, plantMarkup(), '');

    var treeSpots = [
      [0.7, 0.75, 1], [13.4, 0.9, 0.9], [0.65, 3.3, 0.85], [13.5, 3.5, 1],
      [0.7, 7.15, 0.9], [1.1, 11.5, 0.85], [7.5, 11.55, 1], [13.2, 11.35, 0.9],
      [13.7, 7.4, 0.8], [6.4, 0.45, 0.75], [11.4, 0.55, 0.8], [2.5, 0.7, 0.7]
    ];
    treeSpots.forEach(function (t) {
      var tx = Math.floor(t[0]);
      var ty = Math.floor(t[1]);
      if (road.has(tx + ',' + ty) || blocked.has(tx + ',' + ty)) return;
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
      place(t[0], t[1], t[0] + t[1], treeMarkup(t[2]), '');
    });

    items.sort(function (a, b) { return a.sort - b.sort; });

    svg.innerHTML =
      '<defs><filter id="blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8"/></filter></defs>' +
      '<g id="sky-bits">' + sky + '</g>' +
      '<g id="ground">' + ground + '</g>' +
      '<g id="scenery">' + items.map(function (it) { return it.html; }).join('') + '</g>' +
      '<g id="bots"></g>' +
      '<g id="confetti"></g>';

    sceneryEl = svg.querySelector('#scenery');
    botsLayer = svg.querySelector('#bots');
    confettiLayer = svg.querySelector('#confetti');
  }

  function castleMarkup() {
    var s = shadow(3.15, 1.75);
    s += boxAt(0, 0.15, 0, 0.72, 0.72, 64, '#eef2ff', '#c7d2fe', '#a5b4fc');
    s += pyramid(0, 0.15, 0.72, 0.72, 64, 20, '#3b5bdb', '#1e3a8a');
    s += boxAt(2.35, 0.1, 0, 0.75, 0.75, 74, '#eef2ff', '#c7d2fe', '#a5b4fc');
    s += pyramid(2.35, 0.1, 0.75, 0.75, 74, 22, '#3b5bdb', '#1e3a8a');
    var fp = P(2.7, 0.45, 100);
    s += '<g transform="translate(' + fp[0].toFixed(1) + ',' + fp[1].toFixed(1) + ')">' +
      '<line x1="0" y1="0" x2="0" y2="-16" stroke="#1f2937" stroke-width="1.5"/>' +
      '<path class="flag" d="M0,-16 H12 L9.2,-12 L12,-8 H0 Z" fill="#ef4444" stroke="#1f2937" stroke-width="0.6"/>' +
      '</g>';
    s += boxAt(0.55, 0.5, 0, 1.7, 1.15, 48, '#e0e7ff', '#c7d2fe', '#a5b4fc');
    s += roofPrism(0.42, 0.38, 1.95, 1.35, 48, 16, '#3b5bdb', '#1e40af');
    s += doorAt(0.55, 1.65, 1.7, 48, '#1e3a8a');
    s += windowY(0.78, 1.65, 26, 0.32, 12);
    s += windowX(2.25, 0.7, 24, 0.28, 14);
    return s;
  }

  function rugAndCouch() {
    var s = isoPoly(
      [P(0, 0.15, 2), P(2.15, 0.15, 2), P(2.15, 1.45, 2), P(0, 1.45, 2)],
      '#fecdd3', '#fb7185', 1.2
    );
    s += boxAt(0.15, 0, 0, 1.6, 0.28, 22, '#fda4af', '#fb7185', '#be123c');
    s += boxAt(0.15, 0.22, 0, 1.6, 0.72, 12, '#ffe4e6', '#fda4af', '#fb7185');
    s += boxAt(0.02, 0.18, 0, 0.22, 0.72, 16, '#fda4af', '#fb7185', '#be123c');
    s += boxAt(1.62, 0.18, 0, 0.22, 0.72, 16, '#fda4af', '#fb7185', '#be123c');
    return s;
  }

  function tableMarkup() {
    var s = box(0.72, 0.5, 10, '#e7c9a9', '#d2b48c', '#a07856');
    var c = P(0.36, 0.25, 12);
    s += '<g transform="translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ')">' +
      '<path d="M-8,0 h7 v4 a3.5,3.5 0 0 1 -7,0 z" fill="#fff" stroke="#1f2937" stroke-width="1"/>' +
      '<path class="steam" d="M-5,-2 q2,-3 0,-5" fill="none" stroke="#64748b" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M2,1 h6 v3.2 a3,3 0 0 1 -6,0 z" fill="#fde68a" stroke="#1f2937" stroke-width="1"/>' +
      '</g>';
    return s;
  }

  function plantMarkup() {
    var s = box(0.4, 0.4, 9, '#fcd9b0', '#e7b48a', '#c4895a');
    var c = P(0.2, 0.2, 11);
    s += '<g transform="translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ')">' +
      '<ellipse cy="-1" rx="11" ry="6.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>' +
      '<ellipse cx="-7" cy="2" rx="7" ry="4.5" fill="#4ade80" stroke="#14532d" stroke-width="1"/>' +
      '<ellipse cx="7" cy="1" rx="7" ry="4.5" fill="#16a34a" stroke="#14532d" stroke-width="1"/>' +
      '</g>';
    return s;
  }

  function treeMarkup(scale) {
    return '<g transform="scale(' + scale + ')">' +
      '<ellipse cx="0" cy="4" rx="14" ry="5" fill="rgba(20,50,20,.18)"/>' +
      '<rect x="-3" y="-16" width="6" height="18" rx="2" fill="#8a5a34" stroke="#1f2937" stroke-width="1"/>' +
      '<circle cy="-28" r="13" fill="#22c55e" stroke="#14532d" stroke-width="1.15"/>' +
      '<circle cx="-8" cy="-20" r="8.5" fill="#4ade80" stroke="#14532d" stroke-width="1"/>' +
      '<circle cx="8" cy="-18" r="8" fill="#16a34a" stroke="#14532d" stroke-width="1"/>' +
      '<circle cx="-2" cy="-34" r="2.4" fill="#dcfce7"/>' +
      '</g>';
  }

  function styleFor(label) {
    var k = String(label || '').toLowerCase();
    if (k.indexOf('unity') >= 0 || k.indexOf('ad') >= 0) return 'billboard';
    if (k.indexOf('quiz') >= 0) return 'quiz';
    if (k.indexOf('multi') >= 0) return 'office';
    if (k.indexOf('tip') >= 0) return 'coins';
    if (k.indexOf('shop') >= 0) return 'shop';
    if (k.indexOf('plan') >= 0 || k.indexOf('mock') >= 0) return 'plans';
    if (k.indexOf('pixel') >= 0 || k.indexOf('phone') >= 0) return 'phone';
    if (k.indexOf('place') >= 0 || k.indexOf('list') >= 0) return 'pin';
    if (k.indexOf('bot live') >= 0 || k.indexOf('map') >= 0) return 'tower';
    return 'cottage';
  }

  function trophyArt(style) {
    if (style === 'billboard') {
      return {
        w: 1.15, d: 0.55,
        markup: boxAt(0.08, 0.2, 0, 0.12, 0.12, 34, '#e7e5e4', '#a8a29e', '#78716c') +
          boxAt(0.9, 0.2, 0, 0.12, 0.12, 34, '#e7e5e4', '#a8a29e', '#78716c') +
          boxAt(0, 0.12, 26, 1.1, 0.2, 16, '#fff', '#fecaca', '#f87171') +
          (function () {
            var c = P(0.55, 0.22, 34);
            return '<polygon points="' + (c[0] - 4) + ',' + (c[1] + 4) + ' ' + (c[0] - 4) + ',' + (c[1] - 5) + ' ' + (c[0] + 5) + ',' + c[1] + '" fill="#ef4444"/>';
          })()
      };
    }
    if (style === 'coins') {
      var c = P(0.4, 0.28, 16);
      return {
        w: 0.85, d: 0.6,
        markup: box(0.8, 0.55, 12, '#fde68a', '#fcd34d', '#d97706') +
          '<g transform="translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ')">' +
          '<ellipse cy="6" rx="9" ry="3.4" fill="#f59e0b" stroke="#1f2937" stroke-width="0.8"/>' +
          '<ellipse cy="3" rx="9" ry="3.4" fill="#fbbf24" stroke="#1f2937" stroke-width="0.8"/>' +
          '<ellipse cy="0" rx="9" ry="3.4" fill="#fde68a" stroke="#1f2937" stroke-width="0.8"/>' +
          '</g>'
      };
    }
    if (style === 'shop') {
      return {
        w: 1.05, d: 0.7,
        markup: box(1.05, 0.7, 16, '#fff7ed', '#ffedd5', '#fed7aa') +
          boxAt(-0.04, -0.05, 16, 1.12, 0.2, 5, '#fb7185', '#e11d48', '#be123c') +
          boxAt(-0.04, 0.14, 16, 1.12, 0.16, 5, '#fff', '#ffe4e6', '#fecdd3') +
          doorAt(0, 0.7, 1.05, 16, '#9f1239')
      };
    }
    if (style === 'plans') {
      var pc = P(0.5, 0.32, 14);
      return {
        w: 1.05, d: 0.7,
        markup: box(1.0, 0.65, 10, '#e7c9a9', '#d2b48c', '#a07856') +
          boxAt(0.12, 0.08, 10, 0.76, 0.48, 2, '#bfdbfe', '#93c5fd', '#60a5fa') +
          '<g transform="translate(' + pc[0].toFixed(1) + ',' + pc[1].toFixed(1) + ')" stroke="#1d4ed8" stroke-width="0.8" fill="none">' +
          '<path d="M-8,-2 h16 M-8,1 h11 M-5,-5 h9"/></g>'
      };
    }
    if (style === 'phone') {
      var hc = P(0.28, 0.2, 12);
      return {
        w: 0.6, d: 0.45,
        markup: box(0.55, 0.4, 8, '#e7e5e4', '#d6d3d1', '#a8a29e') +
          '<g transform="translate(' + hc[0].toFixed(1) + ',' + hc[1].toFixed(1) + ')">' +
          '<rect x="-7" y="-20" width="14" height="22" rx="2" fill="#0f172a" stroke="#1f2937" stroke-width="1"/>' +
          '<rect x="-5.5" y="-17.5" width="11" height="16" rx="1" fill="#bae6fd"/>' +
          '</g>'
      };
    }
    if (style === 'pin') {
      var kc = P(0.42, 0.1, 22);
      return {
        w: 0.9, d: 0.2,
        markup: box(0.85, 0.16, 26, '#fef3c7', '#fde68a', '#f59e0b') +
          '<g transform="translate(' + kc[0].toFixed(1) + ',' + kc[1].toFixed(1) + ')">' +
          '<circle cy="-6" r="3.6" fill="#ef4444" stroke="#1f2937" stroke-width="0.7"/>' +
          '<path d="M0,-2.4 v8" stroke="#1f2937" stroke-width="1.2"/></g>'
      };
    }
    if (style === 'tower') {
      return {
        w: 0.85, d: 0.85,
        markup: box(0.8, 0.8, 48, '#e0e7ff', '#c7d2fe', '#a5b4fc') +
          pyramid(0, 0, 0.8, 0.8, 48, 18, '#3b5bdb', '#1e3a8a') +
          (function () {
            var f = P(0.4, 0.4, 70);
            return '<g transform="translate(' + f[0].toFixed(1) + ',' + f[1].toFixed(1) + ')">' +
              '<line x1="0" y1="0" x2="0" y2="-12" stroke="#1f2937" stroke-width="1.2"/>' +
              '<path class="flag" d="M0,-12 H9 L7,-9 L9,-6 H0 Z" fill="#ef4444"/></g>';
          })()
      };
    }
    if (style === 'office') {
      return {
        w: 1.05, d: 0.85,
        markup: house(1.05, 0.85, 48, 14, { top: '#f8fafc', left: '#e2e8f0', right: '#cbd5e1', roof: '#334155', roofD: '#1e293b', door: '#0f172a' }) +
          windowX(1.05, 0.5, 30, 0.22, 10)
      };
    }
    if (style === 'quiz') {
      var q = P(0.55, 0.2, 52);
      return {
        w: 1.05, d: 0.8,
        markup: house(1.0, 0.75, 34, 14, { top: '#fff7ed', left: '#ffedd5', right: '#fed7aa', roof: '#f97316', roofD: '#c2410c', door: '#9a3412' }) +
          '<text x="' + q[0].toFixed(1) + '" y="' + q[1].toFixed(1) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#9a3412" stroke="#fff" stroke-width="3" paint-order="stroke">?</text>'
      };
    }
    return {
      w: 0.95, d: 0.75,
      markup: house(0.95, 0.75, 30, 14, { top: '#fff7ed', left: '#fde68a', right: '#fcd34d', roof: '#65a30d', roofD: '#3f6212', door: '#7c2d12' })
    };
  }

  function normalizeProject(p) {
    if (!p) return null;
    var k = String(p).toLowerCase().replace(/[^a-z]/g, '');
    var map = {
      citizenprep: 'citizenprep',
      paycheck: 'paycheck',
      paycheckeasy: 'paycheck',
      nokorgo: 'nokorgo',
      etsy: 'etsy',
      etsyshop: 'etsy',
      shop: 'etsy',
      hq: 'hq',
      headquarters: 'hq'
    };
    return map[k] || null;
  }

  function normalizeState(s) {
    var k = String(s || '').toLowerCase();
    if (k.indexOf('work') === 0) return 'working';
    if (k.indexOf('wait') === 0) return 'waiting';
    return 'idle';
  }

  function clampProgress(n) {
    var v = Number(n);
    if (!isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
  }

  function nextSlot(project) {
    var used = {};
    sceneryEl.querySelectorAll('[data-trophy][data-project="' + project + '"]').forEach(function (n) {
      used[n.dataset.slot] = 1;
    });
    var i = 0;
    while (used[String(i)]) i++;
    return i;
  }

  function addTrophy(item, slotIndex, delay) {
    var slots = TROPHY_SLOTS[item.project] || TROPHY_SLOTS.hq;
    var slot = slots[slotIndex % slots.length];
    var shift = Math.floor(slotIndex / slots.length);
    var wx = slot.x + shift * 0.35;
    var wy = slot.y + shift * 0.35;
    var art = trophyArt(styleFor(item.label));
    var g = document.createElementNS(SVGNS, 'g');
    g.dataset.trophy = '1';
    g.dataset.key = item.key;
    g.dataset.project = item.project;
    g.dataset.slot = String(slotIndex);
    g.dataset.sort = (wx + wy + art.w + art.d).toFixed(2);
    g._wx = wx;
    g._wy = wy;
    g._w = art.w;
    g._d = art.d;
    g.innerHTML = art.markup;
    var kids = sceneryEl.children;
    var i = 0;
    var key = +g.dataset.sort;
    while (i < kids.length && +kids[i].dataset.sort <= key) i++;
    sceneryEl.insertBefore(g, kids[i] || null);
    applyTrophyXform(g, REDUCE ? 1 : 0.02);

    var label = document.createElement('div');
    label.className = 'trophy-label';
    label.textContent = item.label;
    labelsEl.appendChild(label);
    g._label = label;
    g._lx = wx + art.w * 0.35;
    g._ly = wy + art.d + 0.05;

    if (REDUCE) return;
    setTimeout(function () {
      if (!g.isConnected) return;
      g._t0 = performance.now();
      popping.push(g);
      var spot = P(wx + art.w / 2, wy + art.d / 2, 36);
      burst(spot[0], spot[1]);
    }, delay || 0);
  }

  function applyTrophyXform(g, s) {
    var p = P(g._wx, g._wy, 0);
    var c = P(g._w / 2, g._d / 2, 0);
    g.setAttribute('transform',
      'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ') ' +
      'translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ') ' +
      'scale(' + s.toFixed(3) + ') ' +
      'translate(' + (-c[0]).toFixed(1) + ',' + (-c[1]).toFixed(1) + ')');
  }

  function syncBuilt(items) {
    var list = [];
    (items || []).forEach(function (item) {
      var project = normalizeProject(item && item.project);
      var label = item && item.label ? String(item.label) : '';
      if (!project || !label) return;
      list.push({ project: project, label: label, date: item.date || '', key: project + '|' + label });
    });
    var have = new Map();
    sceneryEl.querySelectorAll('[data-trophy]').forEach(function (n) { have.set(n.dataset.key, n); });
    var keep = new Set();
    var delay = 0;
    list.forEach(function (item) {
      keep.add(item.key);
      if (have.has(item.key)) return;
      addTrophy(item, nextSlot(item.project), delay);
      delay += 160;
    });
    have.forEach(function (node, key) {
      if (keep.has(key)) return;
      if (node._label) node._label.remove();
      node.remove();
    });
  }

  function mountBots() {
    BOT_META.forEach(function (meta, index) {
      var el = document.createElement('div');
      el.className = 'actor' + (meta.sips ? ' sips' : '');
      el.dataset.id = meta.id;
      el.innerHTML =
        '<i class="shadow" aria-hidden="true"></i>' +
        '<i class="ring" aria-hidden="true"></i>' +
        '<div class="flip">' +
          '<div class="motion">' +
            '<img class="sprite" alt="" draggable="false" decoding="async">' +
            '<span class="zzz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span>' +
            '<span class="steam" aria-hidden="true"></span>' +
          '</div>' +
        '</div>';
      actorsEl.appendChild(el);
      el.querySelector('.motion').style.animationDelay = (-meta.delay) + 's';
      var img = el.querySelector('.sprite');
      img.src = spriteSrc(meta.id, 'idle');
      var bot = {
        id: meta.id,
        name: meta.name,
        role: meta.role,
        sips: meta.sips,
        color: meta.color,
        delay: meta.delay,
        el: el,
        img: img,
        flipEl: el.querySelector('.flip'),
        pose: 'idle',
        state: 'idle',
        project: null,
        task: '',
        message: '',
        progress: 0,
        x: 6.4 + (index % 4) * 0.4,
        y: 6.2 + Math.floor(index / 4) * 0.35,
        face: 1,
        path: [],
        pathIndex: 0,
        slotKey: '',
        slot: null,
        slotIndex: 0,
        moving: false,
        sig: ''
      };
      bot.nameEl = makeNamePill(bot);
      bot.bubbleEl = makeBubble();
      bot.chipEl = makeChip();
      bot.btn = makeHit(bot);
      rosterButton(bot);
      BOTS.push(bot);
    });
    districtLabels();
  }

  function makeNamePill(bot) {
    var el = document.createElement('div');
    el.className = 'namepill';
    var dot = document.createElement('i');
    dot.className = 'dot idle';
    var text = document.createElement('span');
    text.textContent = bot.name;
    el.appendChild(dot);
    el.appendChild(text);
    labelsEl.appendChild(el);
    el._dot = dot;
    return el;
  }

  function makeBubble() {
    var el = document.createElement('div');
    el.className = 'bubble';
    el.hidden = true;
    var who = document.createElement('div');
    who.className = 'callout-name';
    var text = document.createElement('div');
    text.className = 'callout-text';
    el.appendChild(who);
    el.appendChild(text);
    labelsEl.appendChild(el);
    el._who = who;
    el._text = text;
    return el;
  }

  function makeChip() {
    var el = document.createElement('div');
    el.className = 'chip';
    el.hidden = true;
    var who = document.createElement('div');
    who.className = 'callout-name';
    var text = document.createElement('div');
    var bar = document.createElement('div');
    bar.className = 'bar';
    var fill = document.createElement('div');
    fill.className = 'bar-fill';
    bar.appendChild(fill);
    el.appendChild(who);
    el.appendChild(text);
    el.appendChild(bar);
    labelsEl.appendChild(el);
    el._who = who;
    el._text = text;
    el._fill = fill;
    return el;
  }

  function makeHit(bot) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hit-btn';
    btn.addEventListener('click', function () { openCard(bot); });
    document.getElementById('hits').appendChild(btn);
    return btn;
  }

  function rosterButton(bot) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'who';
    var face = document.createElement('img');
    face.className = 'mochi';
    face.alt = '';
    face.draggable = false;
    face.decoding = 'async';
    face.src = spriteSrc(bot.id, 'idle');
    var name = document.createElement('span');
    name.className = 'who-name';
    name.textContent = bot.name;
    var dot = document.createElement('i');
    dot.className = 'dot idle';
    btn.appendChild(face);
    btn.appendChild(name);
    btn.appendChild(dot);
    btn.addEventListener('click', function () { openCard(bot); });
    document.getElementById('roster').appendChild(btn);
    bot.rosterDot = dot;
    bot.rosterBtn = btn;
  }

  function districtLabels() {
    var spots = [
      ['CitizenPrep', 0.45, 3.6, '#ea580c'],
      ['PayCheck Easy', 13.7, 3.7, '#059669'],
      ['NokorGo', 0.4, 9.8, '#d97706'],
      ['Etsy shop', 13.65, 10.15, '#e11d48'],
      ['HQ', 6.7, 0.2, '#2563eb'],
      ['Resting', 6.35, 4.55, '#16a34a']
    ];
    spots.forEach(function (s) {
      var el = document.createElement('div');
      el.className = 'district';
      var swatch = document.createElement('i');
      swatch.style.background = s[3];
      el.appendChild(swatch);
      el.appendChild(document.createTextNode(s[0]));
      labelsEl.appendChild(el);
      el._x = s[1];
      el._y = s[2];
      el._kind = 'district';
    });
  }

  function projectName(id) {
    return (PROJECTS[id] && PROJECTS[id].name) || 'the garden';
  }

  function destKey(bot) {
    if (bot.state === 'idle' || !bot.project) return 'rest';
    return bot.project;
  }

  function scatterToPlaza() {
    BOTS.forEach(function (bot, i) {
      bot.x = 6.15 + (i % 4) * 0.48;
      bot.y = 6.05 + Math.floor(i / 4) * 0.42;
      bot.slotKey = '';
      bot.path = [];
      bot.pathIndex = 0;
    });
  }

  function updateBotsFrom(list) {
    var byId = {};
    (list || []).forEach(function (row) {
      if (row && row.id) byId[String(row.id).toLowerCase()] = row;
    });
    BOTS.forEach(function (bot) {
      var row = byId[bot.id];
      if (!row) {
        bot.state = 'idle';
        bot.project = null;
        bot.task = '';
        bot.message = '';
        bot.progress = 0;
        return;
      }
      bot.state = normalizeState(row.state);
      bot.project = bot.state === 'idle' ? null : normalizeProject(row.project);
      if (bot.state !== 'idle' && !bot.project) bot.state = 'idle';
      bot.task = row.task ? String(row.task) : '';
      bot.message = row.message ? String(row.message) : '';
      bot.progress = clampProgress(row.progress);
    });
  }

  function assignSlotsAndPath() {
    var groups = {};
    BOTS.forEach(function (b) {
      var k = destKey(b);
      if (!groups[k]) groups[k] = [];
      groups[k].push(b);
    });
    Object.keys(groups).forEach(function (k) {
      var list = groups[k].slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var pool = k === 'rest' ? REST_SLOTS : (PROJECTS[k] ? PROJECTS[k].slots : REST_SLOTS);
      list.forEach(function (b, i) {
        var slot = pool[i % pool.length];
        var key = k + ':' + (i % pool.length);
        b.slotIndex = i % pool.length;
        if (b.slotKey !== key) {
          b.slotKey = key;
          b.slot = slot;
          b.path = findPath(b.x, b.y, slot.x, slot.y);
          b.pathIndex = 0;
        }
        var end = b.path && b.path.length ? b.path[b.path.length - 1] : slot;
        b.moving = Math.hypot(end.x - b.x, end.y - b.y) > 0.08;
      });
    });
  }

  function refreshBotVisual(bot) {
    var sig = [bot.state, bot.task, bot.message, Math.round(bot.progress), bot.project || ''].join('|');
    bot.el.classList.toggle('is-walking', !!bot.moving);
    bot.el.classList.toggle('is-working', bot.state === 'working');
    bot.el.classList.toggle('is-waiting', bot.state === 'waiting');
    bot.el.classList.toggle('is-idle', bot.state === 'idle' && !bot.moving);
    bot.el.classList.toggle('at-work', bot.state === 'working' && !bot.moving);
    if (bot.sig === sig) return;
    bot.sig = sig;
    bot.nameEl._dot.className = 'dot ' + bot.state;
    bot.rosterDot.className = 'dot ' + bot.state;
    var stateWord = bot.state === 'waiting' ? 'waiting on you' : bot.state === 'working' ? 'working' : 'idle, resting';
    var detail = bot.state === 'waiting' ? (bot.message || 'Waiting on you')
      : bot.state === 'working' ? ((bot.task || 'Working') + ', ' + Math.round(bot.progress) + ' percent')
      : (bot.sips ? 'sipping coffee' : 'dozing');
    var label = bot.name + ', ' + bot.role + '. ' + stateWord + '. ' + detail;
    bot.btn.setAttribute('aria-label', label);
    bot.rosterBtn.setAttribute('aria-label', label);
    bot.bubbleEl._who.textContent = bot.name;
    bot.bubbleEl._text.textContent = bot.message || 'Waiting on you';
    bot.bubbleEl.hidden = bot.state !== 'waiting';
    bot.chipEl._who.textContent = bot.name;
    bot.chipEl._text.textContent = bot.task || 'Working';
    bot.chipEl._fill.style.width = bot.progress + '%';
    bot.chipEl.hidden = bot.state !== 'working';
    if (document.getElementById('scrim').dataset.bot === bot.id) fillCard(bot);
  }

  function refreshAllBotVisuals() {
    BOTS.forEach(refreshBotVisual);
    syncCranes();
  }

  function syncCranes() {
    var working = {};
    BOTS.forEach(function (b) {
      if (b.state === 'working' && b.project) working[b.project] = 1;
    });
    Object.keys(PROJECTS).forEach(function (id) {
      var el = svg.querySelector('.crane-' + id);
      if (!el) return;
      el.classList.toggle('on', !!working[id]);
    });
  }

  function stepBot(bot, dt) {
    if (!bot.path || bot.pathIndex >= bot.path.length) {
      bot.moving = false;
      return;
    }
    var left = SPEED * dt;
    while (left > 0 && bot.pathIndex < bot.path.length) {
      var target = bot.path[bot.pathIndex];
      var dx = target.x - bot.x;
      var dy = target.y - bot.y;
      var dist = Math.hypot(dx, dy);
      if (dist < 0.02) {
        bot.x = target.x;
        bot.y = target.y;
        bot.pathIndex++;
        continue;
      }
      var sdx = dx - dy;
      // Sprites face lower-left. Flip when the step runs toward screen-right.
      if (Math.abs(sdx) > 0.02) bot.face = sdx > 0 ? -1 : 1;
      if (dist <= left) {
        bot.x = target.x;
        bot.y = target.y;
        left -= dist;
        bot.pathIndex++;
      } else {
        bot.x += dx / dist * left;
        bot.y += dy / dist * left;
        left = 0;
      }
    }
    bot.moving = bot.pathIndex < bot.path.length;
  }

  function placeActor(bot) {
    var p = P(bot.x, bot.y, 2);
    bot.el.style.left = (p[0] - vb.x).toFixed(1) + 'px';
    bot.el.style.top = (p[1] - vb.y).toFixed(1) + 'px';
    bot.el.style.zIndex = String(10 + Math.round((bot.x + bot.y) * 8));
    bot.flipEl.style.transform = 'scaleX(' + bot.face + ')';
  }

  function applyPose(bot, now) {
    var pose = 'rest';
    if (bot.moving) {
      pose = (!REDUCE && Math.floor(now / WALK_FRAME_MS) % 2) ? 'walk2' : 'walk1';
    } else if (bot.state === 'working') {
      pose = 'work';
    } else if (bot.state === 'waiting') {
      pose = 'idle';
    }
    if (bot.pose === pose) return;
    bot.pose = pose;
    bot.img.src = spriteSrc(bot.id, pose);
  }

  function animateCranes(now) {
    var ang = Math.sin(now / 680) * 10;
    svg.querySelectorAll('.crane.on .jib').forEach(function (el) {
      el.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ')');
    });
  }

  function userToStage(ux, uy) {
    if (!svgPoint) svgPoint = svg.createSVGPoint();
    svgPoint.x = ux;
    svgPoint.y = uy;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    var sp = svgPoint.matrixTransform(ctm);
    var rect = stage.getBoundingClientRect();
    return { x: sp.x - rect.left, y: sp.y - rect.top };
  }

  var labelKey = '';
  var dockSig = '';

  function pinLabel(el, x, y) {
    el._baseL = x;
    el._baseT = y;
    el.style.left = (x + (el._dx || 0)) + 'px';
    el.style.top = (y + (el._dy || 0)) + 'px';
  }

  function separateLabels(els) {
    function weight(el) {
      if (el.classList.contains('namepill')) return 5;
      if (el.classList.contains('bubble') || el.classList.contains('chip')) return 3;
      if (el.classList.contains('trophy-label')) return 1;
      return 0;
    }
    function nudgePair(a, b, bounds) {
      var ra = a.getBoundingClientRect();
      var rb = b.getBoundingClientRect();
      var ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      var iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ix < 4 || iy < 4) return false;
      var wa = weight(a);
      var wb = weight(b);
      var mover = wa <= wb ? a : b;
      var other = mover === a ? b : a;
      var both = wa === wb;
      var rm = mover.getBoundingClientRect();
      var ro = other.getBoundingClientRect();
      var cx = ((rm.left + rm.right) - (ro.left + ro.right)) / 2;
      var cy = ((rm.top + rm.bottom) - (ro.top + ro.bottom)) / 2;
      var alongX = ix <= iy;
      var step = Math.min(28, (alongX ? ix : iy) * 0.7 + 2);
      var dx = alongX ? (cx === 0 ? 1 : Math.sign(cx)) * step : 0;
      var dy = alongX ? 0 : (cy === 0 ? -1 : Math.sign(cy)) * step;
      if (bounds) {
        var edge = 4;
        if (dx > 0 && rm.right > bounds.right - edge) { dx = 0; dy = (dy || (cy === 0 ? -1 : Math.sign(cy))) * step; }
        if (dx < 0 && rm.left < bounds.left + edge) { dx = 0; dy = (dy || (cy === 0 ? -1 : Math.sign(cy))) * step; }
        if (dy < 0 && rm.top < bounds.top + edge) { dy = 0; dx = (dx || (cx === 0 ? 1 : Math.sign(cx))) * step; }
        if (dy > 0 && rm.bottom > bounds.bottom - edge) { dy = 0; dx = (dx || (cx === 0 ? 1 : Math.sign(cx))) * step; }
      }
      var scale = both ? 0.5 : 1;
      mover.style.left = (parseFloat(mover.style.left) + dx * scale) + 'px';
      mover.style.top = (parseFloat(mover.style.top) + dy * scale) + 'px';
      if (both) {
        other.style.left = (parseFloat(other.style.left) - dx * scale) + 'px';
        other.style.top = (parseFloat(other.style.top) - dy * scale) + 'px';
      }
      return true;
    }
    function pass(rounds, bounds) {
      var n;
      var i;
      var j;
      for (n = 0; n < rounds; n++) {
        var moved = false;
        for (i = 0; i < els.length; i++) {
          for (j = i + 1; j < els.length; j++) {
            if (nudgePair(els[i], els[j], bounds)) moved = true;
          }
        }
        if (!moved) break;
      }
    }
    pass(36, null);
    var bounds = stage.getBoundingClientRect();
    els.forEach(function (el) {
      var driftL = parseFloat(el.style.left) - el._baseL;
      var driftT = parseFloat(el.style.top) - el._baseT;
      var cap = 170;
      if (Math.abs(driftL) > cap) el.style.left = (el._baseL + Math.sign(driftL) * cap) + 'px';
      if (Math.abs(driftT) > cap) el.style.top = (el._baseT + Math.sign(driftT) * cap) + 'px';
      var r = el.getBoundingClientRect();
      var dx = 0;
      var dy = 0;
      if (r.left < bounds.left + 4) dx = bounds.left + 4 - r.left;
      if (r.right > bounds.right - 4) dx = bounds.right - 4 - r.right;
      if (r.top < bounds.top + 4) dy = bounds.top + 4 - r.top;
      if (r.bottom > bounds.bottom - 4) dy = bounds.bottom - 4 - r.bottom;
      if (dx || dy) {
        el.style.left = (parseFloat(el.style.left) + dx) + 'px';
        el.style.top = (parseFloat(el.style.top) + dy) + 'px';
      }
    });
    pass(18, bounds);
    els.forEach(function (el) {
      el._dx = parseFloat(el.style.left) - el._baseL;
      el._dy = parseFloat(el.style.top) - el._baseT;
    });
  }

  function ensureLeaders() {
    if (leadersSvg) return;
    leadersSvg = document.createElementNS(SVGNS, 'svg');
    leadersSvg.setAttribute('id', 'leaders');
    leadersSvg.setAttribute('aria-hidden', 'true');
    stage.insertBefore(leadersSvg, labelsEl);
  }

  function undockLabels() {
    dockSig = '';
    if (leadersSvg) {
      while (leadersSvg.firstChild) leadersSvg.removeChild(leadersSvg.firstChild);
    }
    labelsEl.querySelectorAll('.is-docked').forEach(function (el) {
      el.classList.remove('is-docked');
      if (el.classList.contains('trophy-label')) el.style.transform = '';
    });
  }

  function flowDock(items, originY, maxRight) {
    var x = 8;
    var y = originY;
    var rowH = 0;
    items.forEach(function (el) {
      el.classList.add('is-docked');
      el.style.transform = 'none';
      var ew = el.offsetWidth;
      var eh = el.offsetHeight;
      if (x > 8 && x + ew > maxRight) {
        x = 8;
        y += rowH + 4;
        rowH = 0;
      }
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el._dx = x - el._baseL;
      el._dy = y - el._baseT;
      el._dock = { l: x, t: y, r: x + ew, b: y + eh, cx: x + ew / 2, cy: y + eh / 2 };
      x += ew + 4;
      rowH = Math.max(rowH, eh);
    });
  }

  function holdDock(el) {
    if (!el._dock) return;
    el.style.left = el._dock.l + 'px';
    el.style.top = el._dock.t + 'px';
    el._dx = el._dock.l - el._baseL;
    el._dy = el._dock.t - el._baseT;
  }

  function dockNarrow(callouts, trophies) {
    ensureLeaders();
    while (leadersSvg.firstChild) leadersSvg.removeChild(leadersSvg.firstChild);
    var width = stage.clientWidth;
    var height = stage.clientHeight;
    leadersSvg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    var sig = width + '|' + callouts.map(function (c) { return c.el.textContent; }).join('~') +
      '|' + trophies.map(function (el) { return el.textContent; }).join('~');
    if (sig !== dockSig) {
      dockSig = sig;
      callouts.sort(function (a, b) { return a.x - b.x; });
      flowDock(callouts.map(function (c) { return c.el; }), 8, width - 8);
      var trophyMax = width - 58;
      var rows = [];
      var row = [];
      var rowW = 0;
      trophies.forEach(function (el) {
        el.classList.add('is-docked');
        el.style.transform = 'none';
        var ew = el.offsetWidth;
        if (row.length && rowW + ew > trophyMax - 8) {
          rows.push(row);
          row = [];
          rowW = 0;
        }
        row.push(el);
        rowW += ew + 4;
      });
      if (row.length) rows.push(row);
      var y = height - 8;
      var r;
      for (r = rows.length - 1; r >= 0; r--) {
        var items = rows[r];
        var rh = 0;
        items.forEach(function (el) { rh = Math.max(rh, el.offsetHeight); });
        y -= rh;
        var x = 8;
        items.forEach(function (el) {
          el.style.left = x + 'px';
          el.style.top = y + 'px';
          el._dx = x - el._baseL;
          el._dy = y - el._baseT;
          el._dock = { l: x, t: y };
          x += el.offsetWidth + 4;
        });
        y -= 4;
      }
    } else {
      callouts.forEach(function (c) { holdDock(c.el); });
      trophies.forEach(holdDock);
    }
    callouts.forEach(function (c) {
      var box = c.el._dock;
      if (!box) return;
      var path = document.createElementNS(SVGNS, 'path');
      var x1 = box.cx;
      var y1 = box.b;
      var x2 = c.x;
      var y2 = c.y;
      var mid = (y1 + y2) / 2;
      path.setAttribute('d', 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
        ' C ' + x1.toFixed(1) + ' ' + mid.toFixed(1) + ', ' + x2.toFixed(1) + ' ' + mid.toFixed(1) +
        ', ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', c.color);
      path.setAttribute('stroke-width', '2.25');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('opacity', '0.9');
      leadersSvg.appendChild(path);
      var dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('cx', x2.toFixed(1));
      dot.setAttribute('cy', y2.toFixed(1));
      dot.setAttribute('r', '3.2');
      dot.setAttribute('fill', c.color);
      leadersSvg.appendChild(dot);
    });
  }

  function positionOverlays() {
    var town = userToStage.apply(null, P(7.2, 6.2));
    var narrow = stage.clientWidth < 620;
    var pinned = [];
    var callouts = [];
    if (!narrow) undockLabels();
    BOTS.forEach(function (bot) {
      var feet = P(bot.x, bot.y, 0);
      var head = userToStage(feet[0], feet[1] - 92);
      var foot = userToStage(feet[0], feet[1]);
      if (!foot || !head || !town) return;
      bot.btn.style.left = foot.x + 'px';
      bot.btn.style.top = foot.y + 'px';
      bot.btn.style.zIndex = String(20 + Math.round(bot.y * 10));
      pinLabel(bot.nameEl, foot.x, foot.y);
      pinned.push(bot.nameEl);
      var outward = head.x < town.x ? -1 : 1;
      var lift = bot.slotIndex * 46;
      var ax = head.x + outward * (10 + bot.slotIndex * 8);
      var ay = head.y - lift;
      var grow = outward < 0 ? 'translate(-100%, -115%)' : 'translate(0, -115%)';
      if (!narrow) {
        bot.bubbleEl.style.transform = grow;
        bot.chipEl.style.transform = grow;
      }
      pinLabel(bot.bubbleEl, ax, ay);
      pinLabel(bot.chipEl, ax, ay);
      var shown = !bot.bubbleEl.hidden ? bot.bubbleEl : (!bot.chipEl.hidden ? bot.chipEl : null);
      if (shown && !narrow) pinned.push(shown);
      if (shown && narrow) callouts.push({ el: shown, x: head.x, y: head.y, color: bot.color });
    });
    labelsEl.querySelectorAll('.district').forEach(function (el) {
      var p = P(el._x, el._y, 10);
      var s = userToStage(p[0], p[1]);
      if (!s || !town) return;
      var dx = s.x - town.x;
      var dy = s.y - town.y;
      var len = Math.hypot(dx, dy) || 1;
      var push = el.textContent.indexOf('Resting') === 0 ? 8 : 22;
      pinLabel(el, s.x + dx / len * push, s.y + dy / len * push);
      pinned.push(el);
    });
    var trophies = [];
    sceneryEl.querySelectorAll('[data-trophy]').forEach(function (g) {
      if (!g._label) return;
      var p = P(g._lx, g._ly, 0);
      var s = userToStage(p[0], p[1]);
      if (!s) return;
      pinLabel(g._label, s.x, s.y - 6);
      if (narrow) trophies.push(g._label);
      else pinned.push(g._label);
    });
    var key = (narrow ? 'n:' : 'w:') + stage.clientWidth + ':' + cam.s.toFixed(2) + '|' + BOTS.map(function (b) {
      return b.state + (b.task || '') + (b.message || '') + Math.round(b.x * 2) + ',' + Math.round(b.y * 2);
    }).join(';');
    if (key !== labelKey) {
      pinned.forEach(function (el) {
        el.style.left = el._baseL + 'px';
        el.style.top = el._baseT + 'px';
        el._dx = 0;
        el._dy = 0;
      });
      separateLabels(pinned);
      labelKey = key;
    }
    if (narrow) dockNarrow(callouts, trophies);
  }

  function burst(x, y) {
    var colors = ['#fb7185', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#fff'];
    var i;
    for (i = 0; i < 18; i++) {
      var rect = i % 2 === 0;
      var el = document.createElementNS(SVGNS, rect ? 'rect' : 'circle');
      confettiLayer.appendChild(el);
      particles.push({
        el: el,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 110,
        g: 240,
        life: 0.75 + Math.random() * 0.45,
        age: 0,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 420,
        size: 3 + Math.random() * 3.5,
        color: colors[i % colors.length],
        rect: rect
      });
    }
  }

  function stepParticles(dt) {
    var i;
    for (i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        p.el.remove();
        particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      var alpha = 1 - p.age / p.life;
      if (p.rect) {
        p.el.setAttribute('x', p.x.toFixed(1));
        p.el.setAttribute('y', p.y.toFixed(1));
        p.el.setAttribute('width', p.size.toFixed(1));
        p.el.setAttribute('height', (p.size * 0.62).toFixed(1));
        p.el.setAttribute('fill', p.color);
        p.el.setAttribute('opacity', alpha.toFixed(2));
        p.el.setAttribute('transform', 'rotate(' + p.rot.toFixed(1) + ' ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      } else {
        p.el.setAttribute('cx', p.x.toFixed(1));
        p.el.setAttribute('cy', p.y.toFixed(1));
        p.el.setAttribute('r', (p.size * 0.45).toFixed(1));
        p.el.setAttribute('fill', p.color);
        p.el.setAttribute('opacity', alpha.toFixed(2));
      }
    }
  }

  function stepPops(now) {
    var i;
    for (i = popping.length - 1; i >= 0; i--) {
      var g = popping[i];
      if (!g.isConnected) {
        popping.splice(i, 1);
        continue;
      }
      var t = Math.min(1, (now - g._t0) / 700);
      var c1 = 1.6;
      var c3 = c1 + 1;
      var s = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      if (t >= 1) {
        applyTrophyXform(g, 1);
        popping.splice(i, 1);
      } else {
        applyTrophyXform(g, Math.max(0.02, s));
      }
    }
  }

  function applyCam() {
    world.style.transform = 'translate(' + cam.x.toFixed(2) + 'px,' + cam.y.toFixed(2) + 'px) scale(' + cam.s.toFixed(4) + ')';
  }

  function fitCamera() {
    var vw = viewport.clientWidth;
    var vh = viewport.clientHeight;
    if (!vw || !vh) return;
    var narrow = vw < 620;
    var reserveTop = narrow ? 156 : 0;
    var reserveBot = narrow ? 72 : 0;
    var availH = Math.max(140, vh - reserveTop - reserveBot);
    fitScale = Math.min(vw / vb.w, availH / vb.h) * (narrow ? 0.96 : 0.98);
    cam.s = fitScale;
    cam.x = (vw - vb.w * cam.s) / 2;
    var mapH = vb.h * cam.s;
    cam.y = narrow ? reserveTop + Math.max(0, (availH - mapH) / 2) : (vh - mapH) / 2;
    userMovedCam = false;
    viewport.classList.remove('is-zoomed');
    applyCam();
  }

  function clampCam() {
    var vw = viewport.clientWidth;
    var vh = viewport.clientHeight;
    var mw = vb.w * cam.s;
    var mh = vb.h * cam.s;
    if (mw <= vw) cam.x = (vw - mw) / 2;
    else cam.x = Math.min(48, Math.max(vw - mw - 48, cam.x));
    if (mh <= vh) cam.y = (vh - mh) / 2;
    else cam.y = Math.min(48, Math.max(vh - mh - 48, cam.y));
  }

  function zoomAt(clientX, clientY, factor) {
    var rect = viewport.getBoundingClientRect();
    var px = clientX - rect.left;
    var py = clientY - rect.top;
    var minS = fitScale * 0.85;
    var ns = Math.min(2.8, Math.max(minS, cam.s * factor));
    var k = ns / cam.s;
    cam.x = px - (px - cam.x) * k;
    cam.y = py - (py - cam.y) * k;
    cam.s = ns;
    userMovedCam = true;
    viewport.classList.toggle('is-zoomed', ns > fitScale * 1.08);
    clampCam();
    applyCam();
  }

  function wireCamera() {
    document.getElementById('zoom-in').addEventListener('click', function () {
      var r = viewport.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.18);
    });
    document.getElementById('zoom-out').addEventListener('click', function () {
      var r = viewport.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 0.85);
    });
    document.getElementById('zoom-fit').addEventListener('click', fitCamera);

    stage.addEventListener('wheel', function (e) {
      if (e.target.closest && e.target.closest('.zoom')) return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 0.92 : 1.08);
    }, { passive: false });

    viewport.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('button, a')) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        pan = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false, type: e.pointerType };
      }
      if (ptrs.size === 2) {
        var vals = Array.from(ptrs.values());
        pinchDist = Math.hypot(vals[0].x - vals[1].x, vals[0].y - vals[1].y);
      }
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size >= 2) {
        var pair = Array.from(ptrs.values());
        var d = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
        if (pinchDist > 0) {
          zoomAt((pair[0].x + pair[1].x) / 2, (pair[0].y + pair[1].y) / 2, d / pinchDist);
          pinchDist = d;
        }
        return;
      }
      if (!pan) return;
      var dx = e.clientX - pan.x;
      var dy = e.clientY - pan.y;
      if (Math.hypot(dx, dy) > 6) pan.moved = true;
      if (!pan.moved) return;
      if (!viewport.classList.contains('is-zoomed') && pan.type === 'touch') return;
      cam.x = pan.cx + dx;
      cam.y = pan.cy + dy;
      userMovedCam = true;
      clampCam();
      applyCam();
    });
    function endPtr(e) {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinchDist = 0;
      if (ptrs.size === 0) pan = null;
    }
    viewport.addEventListener('pointerup', endPtr);
    viewport.addEventListener('pointercancel', endPtr);
    window.addEventListener('resize', function () {
      if (!userMovedCam) fitCamera();
      else clampCam();
      applyCam();
      positionOverlays();
    });
  }

  function relTime(iso) {
    var t = new Date(iso).getTime();
    if (!isFinite(t)) return '';
    var s = Math.round((Date.now() - t) / 1000);
    var future = s < 0;
    s = Math.abs(s);
    if (s < 45) return 'just now';
    var mins = Math.round(s / 60);
    if (mins < 60) return future ? 'in ' + mins + ' min' : mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 36) return future ? 'in ' + hrs + ' hr' : hrs + ' hr ago';
    var days = Math.round(hrs / 24);
    if (days === 1) return future ? 'tomorrow' : 'yesterday';
    return future ? 'in ' + days + ' days' : days + ' days ago';
  }

  function fmtUpdated(iso) {
    var d = new Date(iso);
    if (!isFinite(d.getTime())) return 'unknown';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function renderUpdated(iso) {
    var el = document.getElementById('updated');
    el.dateTime = iso || '';
    el.textContent = 'Last updated ' + (iso ? fmtUpdated(iso) : 'unknown');
  }

  function iconFor(kind) {
    if (kind === 'built') {
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#fff" d="M2 8 L8 3 L14 8 V13 H10 V9 H6 V13 H2 Z"/></svg>';
    }
    if (kind === 'wait') {
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M8 5 V8.5 H11" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';
    }
    if (kind === 'move') {
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8 H12 M9 4 L13 8 L9 12" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (kind === 'rest') {
      return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 11 V7 H9 a3 3 0 0 1 0 6 H3z" fill="none" stroke="#fff" stroke-width="1.5"/></svg>';
    }
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 12 L8 4 L13 12" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  }

  function renderNews(events) {
    var list = (events || []).slice().filter(function (e) { return e && e.text; });
    list.sort(function (a, b) {
      return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
    });
    var sig = JSON.stringify(list);
    if (sig === newsSig) {
      tickTimes();
      return;
    }
    newsSig = sig;
    var ol = document.getElementById('news');
    ol.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('li');
      var p = document.createElement('p');
      p.textContent = 'No news yet.';
      empty.appendChild(p);
      ol.appendChild(empty);
      return;
    }
    list.forEach(function (ev) {
      var li = document.createElement('li');
      var mark = document.createElement('span');
      mark.className = 'news-mark';
      var bot = BOT_META.filter(function (b) { return b.id === String(ev.bot || '').toLowerCase(); })[0];
      mark.style.background = bot ? bot.color : '#475569';
      mark.innerHTML = iconFor(ev.kind);
      var copy = document.createElement('div');
      copy.className = 'news-copy';
      var text = document.createElement('p');
      text.textContent = String(ev.text);
      var time = document.createElement('time');
      if (ev.time) {
        time.dateTime = ev.time;
        time.textContent = relTime(ev.time);
      }
      copy.appendChild(text);
      copy.appendChild(time);
      li.appendChild(mark);
      li.appendChild(copy);
      ol.appendChild(li);
    });
  }

  function tickTimes() {
    document.querySelectorAll('#news time[datetime]').forEach(function (t) {
      t.textContent = relTime(t.dateTime);
    });
  }

  function showError(msg) {
    var el = document.getElementById('error');
    el.hidden = false;
    el.textContent = msg;
  }
  function hideError() {
    document.getElementById('error').hidden = true;
  }

  function applyData(data, opts) {
    live = data;
    if (opts && opts.intro) scatterToPlaza();
    updateBotsFrom(data.bots || []);
    assignSlotsAndPath();
    refreshAllBotVisuals();
    syncBuilt(data.built || []);
    renderNews(data.events || []);
    renderUpdated(data.updated);
    var loading = document.getElementById('loading');
    if (loading) loading.hidden = true;
  }

  function patchBots(partial) {
    var data = JSON.parse(JSON.stringify(live));
    Object.keys(partial).forEach(function (id) {
      var bot = (data.bots || []).filter(function (b) { return String(b.id).toLowerCase() === id; })[0];
      if (!bot) return;
      Object.keys(partial[id]).forEach(function (field) {
        bot[field] = partial[id][field];
      });
    });
    data.updated = new Date().toISOString();
    applyData(data, { intro: false });
  }

  function pushBuilt(item) {
    live.built = (live.built || []).concat([item]);
    syncBuilt(live.built);
  }

  function pushEvent(ev) {
    live.events = [ev].concat(live.events || []);
    renderNews(live.events);
  }

  var DEMO_STEPS = [
    function () {
      patchBots({ dex: { state: 'working', project: 'citizenprep', task: 'Pixel test fixes', progress: 28, message: '' } });
    },
    function () { patchBots({ dex: { progress: 72 } }); },
    function () {
      patchBots({ dex: { state: 'idle', project: '', task: '', progress: 0, message: '' } });
      pushBuilt({ project: 'citizenprep', label: 'Pixel pass', date: '2026-10-11' });
      pushEvent({ time: new Date().toISOString(), text: 'Dex finished Pixel pass at CitizenPrep', bot: 'dex', kind: 'built' });
    },
    function () {
      patchBots({ iris: { state: 'working', project: 'paycheck', task: 'Regression pass', progress: 30, message: '' } });
    },
    function () {
      patchBots({ vista: { state: 'working', project: 'etsy', task: 'Painting listings', progress: 36, message: '' } });
    },
    function () {
      patchBots({ harbor: { state: 'working', project: 'paycheck', task: 'Drafting the release', progress: 44, message: '' } });
    },
    function () {
      patchBots({ harbor: { state: 'idle', project: '', task: '', progress: 0, message: '' } });
    },
    function () {
      patchBots({ scout: { state: 'waiting', project: 'nokorgo', task: '', progress: 100, message: 'Which cities next?' } });
      pushBuilt({ project: 'nokorgo', label: 'Place list', date: '2026-10-11' });
      pushEvent({ time: new Date().toISOString(), text: 'Scout finished a place list for NokorGo', bot: 'scout', kind: 'built' });
    },
    function () {
      patchBots({ atlas: { state: 'idle', project: '', task: '', progress: 0, message: '' } });
      pushBuilt({ project: 'hq', label: 'Bot Live map', date: '2026-10-11' });
      pushEvent({ time: new Date().toISOString(), text: 'Atlas finished the Bot Live map at HQ', bot: 'atlas', kind: 'built' });
    },
    function () {
      patchBots({ vista: { state: 'waiting', project: 'etsy', task: '', progress: 0, message: 'Which listing photo?' } });
    }
  ];

  function startDemo() {
    var banner = document.getElementById('demo-banner');
    banner.hidden = false;
    var toggle = document.getElementById('demo-toggle');
    toggle.setAttribute('aria-pressed', 'true');
    toggle.textContent = 'Back to live';
    applyData(JSON.parse(JSON.stringify(baseline)), { intro: true });
    var step = 0;
    demoTimer = setInterval(function () {
      if (step >= DEMO_STEPS.length) {
        step = 0;
        newsSig = '';
        applyData(JSON.parse(JSON.stringify(baseline)), { intro: false });
        return;
      }
      DEMO_STEPS[step++]();
    }, 5000);
  }

  function fillCard(bot) {
    document.getElementById('card-name').textContent = bot.name;
    document.getElementById('card-role').textContent = bot.role;
    var state = document.getElementById('card-state');
    state.className = 'state-pill ' + bot.state;
    state.textContent = bot.state === 'waiting' ? 'Waiting on you' : bot.state === 'working' ? 'Working' : 'Idle';
    var project = document.getElementById('card-project');
    project.textContent = bot.state === 'idle' || !bot.project
      ? 'In the resting garden'
      : projectName(bot.project);
    var detail = document.getElementById('card-detail');
    if (bot.state === 'waiting') detail.textContent = bot.message || 'Waiting on you';
    else if (bot.state === 'working') detail.textContent = bot.task || 'Working';
    else detail.textContent = bot.sips ? 'Sipping coffee on the couch.' : 'Dozing under the trees.';
    var wrap = document.getElementById('card-bar-wrap');
    if (bot.state === 'working') {
      wrap.hidden = false;
      document.getElementById('card-bar').style.width = bot.progress + '%';
      document.getElementById('card-progress').textContent = Math.round(bot.progress) + '%';
    } else {
      wrap.hidden = true;
    }
    var portrait = document.getElementById('card-avatar');
    portrait.innerHTML = '';
    var pic = document.createElement('img');
    pic.className = 'mochi';
    pic.alt = '';
    pic.draggable = false;
    pic.decoding = 'async';
    pic.src = spriteSrc(bot.id, 'idle');
    portrait.appendChild(pic);
  }

  var cardReturn = null;
  function openCard(bot) {
    var scrim = document.getElementById('scrim');
    scrim.dataset.bot = bot.id;
    fillCard(bot);
    scrim.hidden = false;
    cardReturn = document.activeElement;
    document.getElementById('card-close').focus();
  }
  function closeCard() {
    var scrim = document.getElementById('scrim');
    scrim.hidden = true;
    scrim.dataset.bot = '';
    if (cardReturn && cardReturn.focus) cardReturn.focus();
  }

  function wireCard() {
    document.getElementById('card-close').addEventListener('click', closeCard);
    document.getElementById('scrim').addEventListener('click', function (e) {
      if (e.target.id === 'scrim') closeCard();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('scrim').hidden) closeCard();
    });
  }

  function statusUrl() {
    var u = new URL('status.json', document.baseURI);
    u.searchParams.set('t', String(Date.now()));
    return u.toString();
  }

  function poll() {
    lastFetch = Date.now();
    return fetch(statusUrl(), { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || !Array.isArray(data.bots)) throw new Error('bots array missing');
      baseline = data;
      hideError();
      if (DEMO) {
        if (!booted) {
          booted = true;
          startDemo();
        }
        return;
      }
      var intro = !booted;
      booted = true;
      applyData(JSON.parse(JSON.stringify(data)), { intro: intro });
    }).catch(function (err) {
      showError('Could not load status.json (' + (err && err.message ? err.message : 'network') + '). Retrying shortly.');
    });
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
    frame.last = now;
    if (!REDUCE) {
      BOTS.forEach(function (bot) { stepBot(bot, dt); });
    } else {
      BOTS.forEach(function (bot) {
        if (bot.slot) { bot.x = bot.slot.x; bot.y = bot.slot.y; }
        bot.moving = false;
        bot.pathIndex = bot.path ? bot.path.length : 0;
      });
    }
    BOTS.forEach(function (bot) {
      placeActor(bot);
      refreshBotVisual(bot);
      applyPose(bot, now);
    });
    animateCranes(now);
    stepPops(now);
    stepParticles(dt);
    positionOverlays();
    requestAnimationFrame(frame);
  }

  function boot() {
    world = document.getElementById('world');
    viewport = document.getElementById('viewport');
    stage = document.getElementById('stage');
    labelsEl = document.getElementById('labels');
    svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('id', 'town');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Isometric Tun Labs town. Use the bot buttons to open details.');
    world.appendChild(svg);
    actorsEl = document.createElement('div');
    actorsEl.id = 'actors';
    actorsEl.className = 'actors';
    world.appendChild(actorsEl);
    buildMap();
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    svg.setAttribute('width', String(vb.w));
    svg.setAttribute('height', String(vb.h));
    mountBots();
    wireCamera();
    wireCard();
    fitCamera();
    var toggle = document.getElementById('demo-toggle');
    if (DEMO) {
      toggle.setAttribute('aria-pressed', 'true');
      toggle.textContent = 'Back to live';
    }
    toggle.addEventListener('click', function () {
      var url = new URL(location.href);
      if (DEMO) url.searchParams.delete('demo');
      else url.searchParams.set('demo', '1');
      location.href = url.toString();
    });
    requestAnimationFrame(frame);
    poll();
    setInterval(function () { if (!DEMO) poll(); }, 30000);
    setInterval(tickTimes, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !DEMO && Date.now() - lastFetch > 25000) poll();
    });
    window.addEventListener('error', function (e) {
      if (!e.message) return;
      showError(e.message);
    });
  }

  boot();
})();
