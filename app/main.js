(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var FIELDS = [
    { id: 'volume', label: 'Data per race weekend' },
    { id: 'window', label: 'Post-race copy window' },
    { id: 'weekend', label: 'Weekend length' },
    { id: 'races', label: 'Races per year' },
    { id: 'capacity', label: 'Capacity per tunnel' },
    { id: 'tunnels', label: 'Tunnels in the design' }
  ];

  // Chart geometry (SVG user units). A compact layout puts labels above the bars on narrow screens.
  var BAR_HEIGHT = 28;
  var MIN_AXIS_MAX = 1.2;
  var COMPACT_BELOW_PX = 520;
  var LAYOUTS = {
    wide: { width: 700, height: 180, labelWidth: 150, plotWidth: 450, rowY: [44, 112], labelAbove: false },
    compact: { width: 300, height: 190, labelWidth: 0, plotWidth: 230, rowY: [56, 132], labelAbove: true }
  };

  var specEl = document.getElementById('spec');
  var chartEl = document.getElementById('chart');
  var verdictEl = document.getElementById('verdict');
  var errorEl = document.getElementById('error');
  var formEl = document.getElementById('form');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function number(value, digits) {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function percent(u) {
    return number(u * 100, 1) + '%';
  }

  function readInputs() {
    var values = {};
    var invalid = [];
    FIELDS.forEach(function (field) {
      var raw = document.getElementById(field.id).value;
      var parsed = Number(raw);
      if (raw === '' || !isFinite(parsed) || parsed <= 0) {
        invalid.push(field.label);
      }
      values[field.id] = parsed;
    });
    return { values: values, invalid: invalid };
  }

  function specRow(key, valueText, tagText, emphasis) {
    var row = el('div', 'spec-row');
    row.appendChild(el('dt', null, key));
    var dd = el('dd');
    dd.appendChild(el('span', 'mono' + (emphasis ? ' spec-em' : ''), valueText));
    if (tagText) { dd.appendChild(el('span', 'tag', tagText)); }
    row.appendChild(dd);
    return row;
  }

  function renderSpec(result, inputs) {
    specEl.textContent = '';
    var tunnels = inputs.tunnels;
    var capacity = inputs.capacity;
    specEl.appendChild(specRow('Average rate over the weekend', number(result.averageMbps, 1) + ' Mbps', 'arithmetic', true));
    specEl.appendChild(specRow('Rate in the copy window', number(result.burstGbps, 3) + ' Gbps', 'arithmetic', true));
    specEl.appendChild(specRow('Volume per year', number(result.annualTb, 1) + ' TB', 'arithmetic', true));
    specEl.appendChild(specRow(
      'Use with all ' + tunnels + ' tunnels up',
      percent(result.normal.utilization) + ' of ' + number(tunnels * capacity, 0) + ' Gbps',
      result.normal.verdict.level
    ));
    specEl.appendChild(specRow(
      'Use with one tunnel down',
      percent(result.degraded.utilization) + ' of ' + number((tunnels - 1) * capacity, 0) + ' Gbps',
      result.degraded.verdict.level
    ));
  }

  function pickLayout() {
    return chartEl.clientWidth > 0 && chartEl.clientWidth < COMPACT_BELOW_PX ? LAYOUTS.compact : LAYOUTS.wide;
  }

  function xFor(u, axisMax, layout) {
    return layout.labelWidth + (Math.min(u, axisMax) / axisMax) * layout.plotWidth;
  }

  function renderBarRow(root, layout, y, label, u, level, axisMax) {
    var labelY = layout.labelAbove ? y - 8 : y + BAR_HEIGHT / 2 + 4;
    root.appendChild(svg('text', { x: 0, y: labelY, 'class': 'row-label' })).textContent = label;
    root.appendChild(svg('rect', {
      x: layout.labelWidth, y: y, width: layout.plotWidth, height: BAR_HEIGHT, 'class': 'track'
    }));
    root.appendChild(svg('rect', {
      x: layout.labelWidth, y: y, width: xFor(u, axisMax, layout) - layout.labelWidth, height: BAR_HEIGHT,
      'class': 'bar bar-' + level
    }));
    root.appendChild(svg('text', {
      x: layout.labelWidth + layout.plotWidth + 10, y: y + BAR_HEIGHT / 2 + 5, 'class': 'value-label'
    })).textContent = percent(u);
  }

  function renderGuide(root, layout, u, axisMax, text, className) {
    var x = xFor(u, axisMax, layout);
    root.appendChild(svg('line', {
      x1: x, x2: x, y1: 26, y2: layout.rowY[1] + BAR_HEIGHT + 10, 'class': 'guide ' + (className || '')
    }));
    var label = svg('text', { x: x, y: 16, 'text-anchor': 'middle', 'class': 'axis-label' });
    label.textContent = text;
    root.appendChild(label);
  }

  function renderChart(result) {
    var layout = pickLayout();
    var axisMax = Math.max(MIN_AXIS_MAX, result.degraded.utilization * 1.05);
    var root = svg('svg', {
      viewBox: '0 0 ' + layout.width + ' ' + layout.height,
      role: 'img',
      'aria-label': 'Bar chart of tunnel utilization. All tunnels up: ' + percent(result.normal.utilization) +
        '. One tunnel down: ' + percent(result.degraded.utilization) + '. Guidance line at 50 percent.'
    });
    root.appendChild(svg('title', {})).textContent = 'Tunnel utilization during the copy window';
    renderBarRow(root, layout, layout.rowY[0], 'All up', result.normal.utilization, result.normal.verdict.level, axisMax);
    renderBarRow(root, layout, layout.rowY[1], 'One down', result.degraded.utilization, result.degraded.verdict.level, axisMax);
    renderGuide(root, layout, 0.5, axisMax, '50%', '');
    renderGuide(root, layout, 1, axisMax, '100%', 'guide-full');
    chartEl.textContent = '';
    chartEl.appendChild(root);
  }

  function renderVerdict(result) {
    var d = result.degraded;
    verdictEl.className = 'verdict verdict-' + d.verdict.level;
    verdictEl.textContent = 'One tunnel down: ' + percent(d.utilization) + '. ' + d.verdict.label + '.';
    var state = el('span', 'state');
    state.textContent = 'All tunnels up: ' + percent(result.normal.utilization) + '. ' + result.normal.verdict.label + '.';
    verdictEl.appendChild(state);
  }

  function showError(invalid) {
    errorEl.textContent = 'Enter a number greater than 0 for: ' + invalid.join(', ') + '.';
    errorEl.hidden = false;
  }

  function update() {
    var read = readInputs();
    if (read.invalid.length > 0) {
      showError(read.invalid);
      return;
    }
    errorEl.hidden = true;
    var v = read.values;
    var inputs = {
      volumeGb: v.volume,
      windowHours: v.window,
      weekendHours: v.weekend,
      races: v.races,
      tunnelGbps: v.capacity,
      tunnels: v.tunnels
    };
    var result = window.Sizing.analyse(inputs);
    var shown = { tunnels: v.tunnels, capacity: v.capacity };
    renderSpec(result, shown);
    renderChart(result);
    renderVerdict(result);
  }

  formEl.addEventListener('input', update);
  formEl.addEventListener('change', update);
  formEl.addEventListener('submit', function (event) { event.preventDefault(); });
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  });
  update();
})();
