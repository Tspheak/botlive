/* Tun Labs Town — painted island, mochi bots. No build step. */
(function () {
  'use strict';

  var IW = 1280;
  var IH = 640;
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPEED = REDUCE ? 2.4 : 0.105;
  var WALK_FRAME_MS = 200;

  var STATIONS = {
    citizenprep: {
      name: 'CitizenPrep', color: '#ea580c', file: 'citizenprep.png', wide: 'w200',
      x: 0.33, y: 0.255,
      crane: { x: 0.41, y: 0.23 },
      label: { x: 0.18, y: 0.06 },
      slots: [
        { x: 0.28, y: 0.325 },
        { x: 0.345, y: 0.34 },
        { x: 0.40, y: 0.315 }
      ],
      trophies: [
        { x: 0.24, y: 0.20 },
        { x: 0.40, y: 0.16 },
        { x: 0.22, y: 0.30 },
        { x: 0.43, y: 0.28 }
      ]
    },
    paycheck: {
      name: 'PayCheck Easy', color: '#059669', file: 'paycheck.png', wide: 'w200',
      x: 0.67, y: 0.24,
      crane: { x: 0.75, y: 0.21 },
      label: { x: 0.84, y: 0.06 },
      slots: [
        { x: 0.62, y: 0.31 },
        { x: 0.69, y: 0.325 },
        { x: 0.75, y: 0.29 }
      ],
      trophies: [
        { x: 0.58, y: 0.16 },
        { x: 0.76, y: 0.15 },
        { x: 0.60, y: 0.28 },
        { x: 0.78, y: 0.27 }
      ]
    },
    nokorgo: {
      name: 'NokorGo', color: '#d97706', file: 'nokorgo.png', wide: 'w200',
      x: 0.19, y: 0.50,
      crane: { x: 0.30, y: 0.44 },
      label: { x: 0.045, y: 0.40 },
      slots: [
        { x: 0.15, y: 0.575 },
        { x: 0.22, y: 0.585 },
        { x: 0.28, y: 0.55 }
      ],
      trophies: [
        { x: 0.10, y: 0.44 },
        { x: 0.26, y: 0.42 },
        { x: 0.12, y: 0.56 },
        { x: 0.30, y: 0.50 }
      ]
    },
    hq: {
      name: 'HQ', color: '#2563eb', file: 'hq.png', wide: 'w214',
      x: 0.50, y: 0.47,
      crane: { x: 0.58, y: 0.42 },
      label: { x: 0.50, y: 0.08 },
      slots: [
        { x: 0.45, y: 0.55 },
        { x: 0.52, y: 0.565 },
        { x: 0.58, y: 0.53 }
      ],
      trophies: [
        { x: 0.42, y: 0.40 },
        { x: 0.58, y: 0.38 },
        { x: 0.40, y: 0.52 },
        { x: 0.60, y: 0.50 }
      ]
    },
    rest: {
      name: 'Resting', color: '#16a34a', file: 'garden.png', wide: 'w250',
      x: 0.80, y: 0.51,
      crane: null,
      label: { x: 0.96, y: 0.40 },
      slots: [
        { x: 0.73, y: 0.57 },
        { x: 0.79, y: 0.59 },
        { x: 0.85, y: 0.565 },
        { x: 0.74, y: 0.63 },
        { x: 0.81, y: 0.64 },
        { x: 0.87, y: 0.61 },
        { x: 0.70, y: 0.53 }
      ],
      trophies: []
    },
    etsy: {
      name: 'Etsy shop', color: '#e11d48', file: 'etsy.png', wide: 'w200',
      x: 0.33, y: 0.72,
      crane: { x: 0.41, y: 0.68 },
      label: { x: 0.46, y: 0.64 },
      slots: [
        { x: 0.27, y: 0.78 },
        { x: 0.34, y: 0.79 },
        { x: 0.40, y: 0.76 }
      ],
      trophies: [
        { x: 0.24, y: 0.66 },
        { x: 0.42, y: 0.66 },
        { x: 0.22, y: 0.76 },
        { x: 0.43, y: 0.74 }
      ]
    }
  };

  var NODES = {
    cp: { x: 0.33, y: 0.31 },
    cpj: { x: 0.34, y: 0.38 },
    north: { x: 0.50, y: 0.30 },
    pay: { x: 0.66, y: 0.29 },
    hq: { x: 0.50, y: 0.50 },
    midw: { x: 0.32, y: 0.50 },
    nok: { x: 0.20, y: 0.52 },
    mide: { x: 0.66, y: 0.52 },
    rest: { x: 0.76, y: 0.55 },
    south: { x: 0.36, y: 0.62 },
    etsy: { x: 0.34, y: 0.72 }
  };
  var LINKS = {
    cp: ['cpj'],
    cpj: ['cp', 'north', 'midw'],
    north: ['cpj', 'pay', 'hq'],
    pay: ['north'],
    hq: ['north', 'midw', 'mide', 'south'],
    midw: ['cpj', 'nok', 'hq', 'south'],
    nok: ['midw'],
    mide: ['hq', 'rest'],
    rest: ['mide'],
    south: ['hq', 'midw', 'etsy'],
    etsy: ['south']
  };

  var TREES = [
    [0.09, 0.31, 0.9], [0.16, 0.21, 1.05], [0.55, 0.12, 0.85], [0.77, 0.29, 1],
    [0.78, 0.36, 0.8], [0.88, 0.66, 1.1], [0.91, 0.59, 0.9], [0.08, 0.56, 0.85],
    [0.62, 0.74, 0.95], [0.48, 0.24, 0.75], [0.94, 0.46, 0.9], [0.69, 0.84, 0.8]
  ];
  var FLOWERS = [
    [0.12, 0.34, 0.7], [0.58, 0.16, 0.65], [0.84, 0.34, 0.75], [0.12, 0.58, 0.6],
    [0.72, 0.32, 0.7], [0.90, 0.62, 0.65], [0.56, 0.78, 0.7], [0.22, 0.22, 0.6]
  ];

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
  var TROPHY_KINDS = [
    { file: 'trophy_house.png', wide: 'w96' },
    { file: 'check_sign.png', wide: 'w54' },
    { file: 'star_trophy.png', wide: 'w50' }
  ];

  function asset(path) {
    return new URL(path, document.baseURI).href;
  }
  function spriteSrc(id, pose) {
    return asset('assets/sprites/' + id + '_' + pose + '.png');
  }
  function townSrc(file) {
    return asset('assets/town/' + file);
  }

  function preloadImages() {
    var urls = [];
    BOT_META.forEach(function (meta) {
      POSES.forEach(function (pose) { urls.push(spriteSrc(meta.id, pose)); });
    });
    ['island.png', 'citizenprep.png', 'paycheck.png', 'nokorgo.png', 'etsy.png', 'hq.png', 'garden.png',
      'crane.png', 'trophy_house.png', 'check_sign.png', 'star_trophy.png', 'tree.png', 'flowers.png'
    ].forEach(function (file) { urls.push(townSrc(file)); });
    urls.forEach(function (src) {
      var img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
  }
  preloadImages();

  var BOTS = [];
  var live = null;
  var baseline = null;
  var booted = false;
  var userMovedCam = false;
  var fitScale = 1;
  var cam = { x: 0, y: 0, s: 1 };
  var particles = [];
  var pan = null;
  var ptrs = new Map();
  var pinchDist = 0;
  var newsSig = '';
  var demoTimer = 0;
  var lastFetch = 0;
  var labelKey = '';
  var world, viewport, stage, sceneEl, labelsEl;

  function nearestNode(x, y) {
    var best = 'hq';
    var bestD = Infinity;
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id];
      var d = (n.x - x) * (n.x - x) + (n.y - y) * (n.y - y);
      if (d < bestD) { bestD = d; best = id; }
    });
    return best;
  }

  function bfs(start, goal) {
    if (start === goal) return [start];
    var q = [start];
    var prev = {};
    prev[start] = '';
    var i = 0;
    while (i < q.length) {
      var cur = q[i++];
      var next = LINKS[cur] || [];
      var k;
      for (k = 0; k < next.length; k++) {
        var n = next[k];
        if (prev[n] != null) continue;
        prev[n] = cur;
        if (n === goal) {
          var out = [n];
          while (prev[n]) { n = prev[n]; out.push(n); }
          return out.reverse();
        }
        q.push(n);
      }
    }
    return [start, goal];
  }

  function findPath(x, y, gx, gy) {
    var ids = bfs(nearestNode(x, y), nearestNode(gx, gy));
    var pts = [{ x: x, y: y }];
    ids.forEach(function (id) { pts.push({ x: NODES[id].x, y: NODES[id].y }); });
    pts.push({ x: gx, y: gy });
    var slim = [];
    pts.forEach(function (p) {
      var last = slim[slim.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.012) slim.push(p);
    });
    return slim.length ? slim : [{ x: gx, y: gy }];
  }

  function makeImg(file, wide) {
    var img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.className = wide;
    img.src = townSrc(file);
    return img;
  }

  function addProp(x, y, file, wide, extra) {
    var el = document.createElement('div');
    el.className = 'prop' + (extra || '');
    el.style.left = (x * IW) + 'px';
    el.style.top = (y * IH) + 'px';
    el.style.zIndex = String(10 + Math.round(y * IH));
    el.appendChild(makeImg(file, wide));
    sceneEl.appendChild(el);
    return el;
  }

  function buildMap() {
    sceneEl = document.createElement('div');
    sceneEl.className = 'scene';
    sceneEl.setAttribute('role', 'img');
    sceneEl.setAttribute('aria-label', 'Tun Labs island. Sandy paths join the project clearings. Use the bot buttons to open details.');
    var island = makeImg('island.png', '');
    island.className = 'island';
    island.style.width = IW + 'px';
    island.style.height = IH + 'px';
    sceneEl.appendChild(island);
    world.appendChild(sceneEl);
    world.style.width = IW + 'px';
    world.style.height = IH + 'px';

    TREES.forEach(function (t) {
      var el = addProp(t[0], t[1], 'tree.png', 'w78');
      el.querySelector('img').style.width = Math.round(78 * t[2]) + 'px';
    });
    FLOWERS.forEach(function (t) {
      var el = addProp(t[0], t[1], 'flowers.png', 'w56');
      el.querySelector('img').style.width = Math.round(56 * t[2]) + 'px';
    });

    Object.keys(STATIONS).forEach(function (id) {
      var s = STATIONS[id];
      var bld = addProp(s.x, s.y, s.file, s.wide);
      bld.dataset.station = id;
      if (s.crane) {
        var crane = addProp(s.crane.x, s.crane.y, 'crane.png', 'w108');
        crane.classList.add('crane');
        crane.dataset.project = id;
        crane.hidden = true;
        s.craneEl = crane;
      }
      var label = document.createElement('div');
      label.className = 'district';
      var swatch = document.createElement('i');
      swatch.style.background = s.color;
      label.appendChild(swatch);
      label.appendChild(document.createTextNode(s.name));
      labelsEl.appendChild(label);
      label._fx = s.label.x;
      label._fy = s.label.y;
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
      sceneEl.appendChild(el);
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
        x: 0.46 + (index % 4) * 0.03,
        y: 0.48 + Math.floor(index / 4) * 0.03,
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

  function projectName(id) {
    return (STATIONS[id] && STATIONS[id].name) || 'the garden';
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

  function destKey(bot) {
    if (bot.state === 'idle' || !bot.project) return 'rest';
    return bot.project;
  }

  function scatterToPlaza() {
    BOTS.forEach(function (bot, i) {
      bot.x = 0.46 + (i % 4) * 0.035;
      bot.y = 0.47 + Math.floor(i / 4) * 0.035;
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
      var pool = (STATIONS[k] && STATIONS[k].slots) || STATIONS.rest.slots;
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
        b.moving = Math.hypot(end.x - b.x, end.y - b.y) > 0.015;
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
    sceneEl.querySelectorAll('.crane').forEach(function (el) {
      el.hidden = !working[el.dataset.project];
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
      if (dist < 0.004) {
        bot.x = target.x;
        bot.y = target.y;
        bot.pathIndex++;
        continue;
      }
      if (Math.abs(dx) > 0.003) bot.face = dx > 0 ? -1 : 1;
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
    bot.el.style.left = (bot.x * IW) + 'px';
    bot.el.style.top = (bot.y * IH) + 'px';
    bot.el.style.zIndex = String(20 + Math.round(bot.y * IH));
    bot.flipEl.style.transform = 'scaleX(' + bot.face + ')';
  }

  function applyPose(bot, now) {
    var pose = 'rest';
    if (bot.moving) pose = (!REDUCE && Math.floor(now / WALK_FRAME_MS) % 2) ? 'walk2' : 'walk1';
    else if (bot.state === 'working') pose = 'work';
    else if (bot.state === 'waiting') pose = 'idle';
    if (bot.pose === pose) return;
    bot.pose = pose;
    bot.img.src = spriteSrc(bot.id, pose);
  }

  function worldToStage(fx, fy) {
    var wr = world.getBoundingClientRect();
    var sr = stage.getBoundingClientRect();
    return {
      x: wr.left + fx * wr.width - sr.left,
      y: wr.top + fy * wr.height - sr.top
    };
  }

  var labelsCompact = null;

  function layoutSky(els) {
    var rows = { '-1': 0, '0': 0, '1': 0 };
    var pad = 10;
    var badge = document.getElementById('demo-badge');
    var top = pad;
    if (badge && !badge.hidden) {
      var br = badge.getBoundingClientRect();
      var sr = stage.getBoundingClientRect();
      top = Math.max(pad, br.bottom - sr.top + 6);
    }
    els.forEach(function (el) {
      var bot = null;
      var i;
      for (i = 0; i < BOTS.length; i++) {
        if (BOTS[i].bubbleEl === el || BOTS[i].chipEl === el) { bot = BOTS[i]; break; }
      }
      var side = bot && bot._calloutSide ? bot._calloutSide : 0;
      var row = rows[String(side)]++;
      var x = side < 0 ? pad : (side > 0 ? stage.clientWidth - pad : stage.clientWidth / 2);
      var y = top + row * (el.classList.contains('bubble') ? 52 : 48);
      el.style.transform = side < 0 ? 'none' : (side > 0 ? 'translate(-100%, 0)' : 'translate(-50%, 0)');
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    });
  }

  function layoutDock(els) {
    var pad = 8;
    var gap = 6;
    var maxW = stage.clientWidth - pad;
    var badge = document.getElementById('demo-badge');
    var y = pad;
    if (badge && !badge.hidden) {
      var br = badge.getBoundingClientRect();
      var sr = stage.getBoundingClientRect();
      y = Math.max(pad, br.bottom - sr.top + gap);
    }
    var x = pad;
    var rowH = 0;
    els.forEach(function (el) {
      el.classList.add('is-docked');
      el.style.transform = 'none';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      if (x > pad && x + w > maxW) {
        x = pad;
        y += rowH + gap;
        rowH = 0;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
      }
      x += w + gap;
      if (h > rowH) rowH = h;
    });
  }

  function pinLabel(el, x, y) {
    el._baseL = x;
    el._baseT = y;
    el.style.left = (x + (el._dx || 0)) + 'px';
    el.style.top = (y + (el._dy || 0)) + 'px';
  }

  function separateLabels(els) {
    function weight(el) {
      if (el.classList.contains('namepill')) return 4;
      if (el.classList.contains('bubble') || el.classList.contains('chip')) return 3;
      if (el.classList.contains('trophy-label')) return 1;
      return 0;
    }
    var n, i, j;
    for (n = 0; n < 16; n++) {
      var moved = false;
      for (i = 0; i < els.length; i++) {
        for (j = i + 1; j < els.length; j++) {
          var a = els[i];
          var b = els[j];
          var ra = a.getBoundingClientRect();
          var rb = b.getBoundingClientRect();
          var ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          var iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ix < 3 || iy < 3) continue;
          var wa = weight(a);
          var wb = weight(b);
          var mover = wa <= wb ? a : b;
          var other = mover === a ? b : a;
          var rm = mover.getBoundingClientRect();
          var ro = other.getBoundingClientRect();
          var cx = ((rm.left + rm.right) - (ro.left + ro.right)) / 2;
          var cy = ((rm.top + rm.bottom) - (ro.top + ro.bottom)) / 2;
          var alongX = ix <= iy;
          var step = Math.min(18, (alongX ? ix : iy) * 0.6 + 2);
          var dx = alongX ? (cx === 0 ? 1 : Math.sign(cx)) * step : 0;
          var dy = alongX ? 0 : (cy === 0 ? -1 : Math.sign(cy)) * step;
          var scale = wa === wb ? 0.5 : 1;
          mover.style.left = (parseFloat(mover.style.left) + dx * scale) + 'px';
          mover.style.top = (parseFloat(mover.style.top) + dy * scale) + 'px';
          moved = true;
        }
      }
      if (!moved) break;
    }
    var bounds = stage.getBoundingClientRect();
    els.forEach(function (el) {
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
      el._dx = parseFloat(el.style.left) - el._baseL;
      el._dy = parseFloat(el.style.top) - el._baseT;
    });
  }

  function positionOverlays() {
    var compact = stage.clientWidth < 640;
    if (compact !== labelsCompact) {
      labelsCompact = compact;
      labelKey = '';
      labelsEl.classList.toggle('is-compact', compact);
      labelsEl.querySelectorAll('.district, .trophy-label').forEach(function (el) {
        el.hidden = compact;
      });
    }
    var pinned = [];
    var docked = [];
    BOTS.forEach(function (bot) {
      var foot = worldToStage(bot.x, bot.y);
      bot.btn.style.left = foot.x + 'px';
      bot.btn.style.top = foot.y + 'px';
      var callout = bot.state === 'waiting' || bot.state === 'working';
      bot.nameEl.hidden = compact && callout;
      if (!bot.nameEl.hidden) {
        pinLabel(bot.nameEl, foot.x, foot.y - 8);
        pinned.push(bot.nameEl);
      }
      var station = STATIONS[bot.project] || STATIONS.rest;
      if (!compact) {
        bot.bubbleEl.classList.remove('is-docked');
        bot.chipEl.classList.remove('is-docked');
      }
      if (!bot.bubbleEl.hidden) docked.push(bot.bubbleEl);
      else if (!bot.chipEl.hidden) docked.push(bot.chipEl);
      bot._calloutSide = station === STATIONS.hq ? 0 : (station.x < 0.48 ? -1 : 1);
    });
    if (!compact) {
      labelsEl.querySelectorAll('.district').forEach(function (el) {
        if (el.hidden) return;
        var p = worldToStage(el._fx, el._fy);
        pinLabel(el, p.x, p.y);
        pinned.push(el);
      });
      sceneEl.querySelectorAll('[data-trophy]').forEach(function (g) {
        if (!g._label || g._label.hidden) return;
        var p = worldToStage(g._fx, g._fy);
        pinLabel(g._label, p.x, p.y + 4);
        pinned.push(g._label);
      });
    }
    var key = (compact ? 'c' : 'w') + cam.s.toFixed(2) + '|' + stage.clientWidth + '|' + BOTS.map(function (b) {
      return b.state + (b.task || '') + (b.message || '') + Math.round(b.x * 40) + ',' + Math.round(b.y * 40);
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
    if (compact) layoutDock(docked);
    else layoutSky(docked);
  }

  function burst(fx, fy) {
    if (REDUCE) return;
    var colors = ['#fb7185', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#fff'];
    var i;
    for (i = 0; i < 16; i++) {
      var el = document.createElement('i');
      el.className = 'bit';
      el.style.background = colors[i % colors.length];
      el.style.borderRadius = i % 2 ? '50%' : '2px';
      sceneEl.appendChild(el);
      particles.push({
        el: el,
        x: fx * IW,
        y: fy * IH,
        vx: (Math.random() - 0.5) * 220,
        vy: -80 - Math.random() * 140,
        g: 380,
        life: 0.8 + Math.random() * 0.4,
        age: 0
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
      p.el.style.left = p.x.toFixed(1) + 'px';
      p.el.style.top = p.y.toFixed(1) + 'px';
      p.el.style.opacity = String(1 - p.age / p.life);
    }
  }

  function nextTrophySlot(project) {
    var used = {};
    sceneEl.querySelectorAll('[data-trophy][data-project="' + project + '"]').forEach(function (n) {
      used[n.dataset.slot] = 1;
    });
    var i = 0;
    while (used[String(i)]) i++;
    return i;
  }

  function addTrophy(item, slotIndex, delay) {
    var station = STATIONS[item.project] || STATIONS.hq;
    var spots = station.trophies.length ? station.trophies : STATIONS.hq.trophies;
    var spot = spots[slotIndex % spots.length];
    var shift = Math.floor(slotIndex / spots.length);
    var fx = spot.x + shift * 0.03;
    var fy = spot.y + shift * 0.025;
    var kind = TROPHY_KINDS[slotIndex % TROPHY_KINDS.length];
    var el = addProp(fx, fy, kind.file, kind.wide);
    el.dataset.trophy = '1';
    el.dataset.key = item.key;
    el.dataset.project = item.project;
    el.dataset.slot = String(slotIndex);
    el._fx = fx;
    el._fy = fy + 0.02;
    var img = el.querySelector('img');
    if (!REDUCE) img.classList.add('sprout');
    var label = document.createElement('div');
    label.className = 'trophy-label';
    label.textContent = item.label;
    if (labelsCompact) label.hidden = true;
    labelsEl.appendChild(label);
    el._label = label;
    if (REDUCE) return;
    setTimeout(function () {
      if (!el.isConnected) return;
      burst(fx, fy - 0.04);
    }, delay || 0);
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
    sceneEl.querySelectorAll('[data-trophy]').forEach(function (n) { have.set(n.dataset.key, n); });
    var keep = new Set();
    var delay = 0;
    list.forEach(function (item) {
      keep.add(item.key);
      if (have.has(item.key)) return;
      addTrophy(item, nextTrophySlot(item.project), delay);
      delay += 160;
    });
    have.forEach(function (node, key) {
      if (keep.has(key)) return;
      if (node._label) node._label.remove();
      node.remove();
    });
  }

  function applyCam() {
    world.style.transform = 'translate(' + cam.x.toFixed(2) + 'px,' + cam.y.toFixed(2) + 'px) scale(' + cam.s.toFixed(4) + ')';
  }

  function fitCamera() {
    var vw = viewport.clientWidth;
    var vh = viewport.clientHeight;
    if (!vw || !vh) return;
    fitScale = Math.min(vw / IW, vh / IH) * 0.94;
    cam.s = fitScale;
    cam.x = (vw - IW * cam.s) / 2;
    cam.y = (vh - IH * cam.s) / 2;
    userMovedCam = false;
    viewport.classList.remove('is-zoomed');
    applyCam();
  }

  function clampCam() {
    var vw = viewport.clientWidth;
    var vh = viewport.clientHeight;
    var mw = IW * cam.s;
    var mh = IH * cam.s;
    if (mw <= vw) cam.x = (vw - mw) / 2;
    else cam.x = Math.min(40, Math.max(vw - mw - 40, cam.x));
    if (mh <= vh) cam.y = (vh - mh) / 2;
    else cam.y = Math.min(40, Math.max(vh - mh - 40, cam.y));
  }

  function zoomAt(clientX, clientY, factor) {
    var rect = viewport.getBoundingClientRect();
    var px = clientX - rect.left;
    var py = clientY - rect.top;
    var minS = fitScale * 0.9;
    var ns = Math.min(2.6, Math.max(minS, cam.s * factor));
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
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
    });
    document.getElementById('zoom-out').addEventListener('click', function () {
      var r = viewport.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 0.84);
    });
    document.getElementById('zoom-fit').addEventListener('click', fitCamera);
    stage.addEventListener('wheel', function (e) {
      if (e.target.closest && e.target.closest('.zoom, .demo-badge')) return;
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
    if (sig === newsSig) { tickTimes(); return; }
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
      Object.keys(partial[id]).forEach(function (field) { bot[field] = partial[id][field]; });
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

  function leaveDemo() {
    var url = new URL(location.href);
    url.searchParams.delete('demo');
    location.href = url.toString();
  }

  function startDemo() {
    var badge = document.getElementById('demo-badge');
    badge.hidden = false;
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
    document.getElementById('card-project').textContent = bot.state === 'idle' || !bot.project
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
    if (!REDUCE) BOTS.forEach(function (bot) { stepBot(bot, dt); });
    else {
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
    stepParticles(dt);
    positionOverlays();
    requestAnimationFrame(frame);
  }

  function boot() {
    world = document.getElementById('world');
    viewport = document.getElementById('viewport');
    stage = document.getElementById('stage');
    labelsEl = document.getElementById('labels');
    buildMap();
    mountBots();
    wireCamera();
    wireCard();
    fitCamera();
    var toggle = document.getElementById('demo-toggle');
    if (DEMO) {
      toggle.setAttribute('aria-pressed', 'true');
      toggle.textContent = 'Back to live';
      document.getElementById('demo-badge').hidden = false;
    }
    toggle.addEventListener('click', function () {
      var url = new URL(location.href);
      if (DEMO) url.searchParams.delete('demo');
      else url.searchParams.set('demo', '1');
      location.href = url.toString();
    });
    document.getElementById('demo-back').addEventListener('click', leaveDemo);
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
