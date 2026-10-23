(function () {
  'use strict';

  var FIELDS = [
    { id: 'cap-annual', key: 'annualTb', label: 'New data per year', min: 'positive' },
    { id: 'cap-years', key: 'years', label: 'Years kept online', min: 'positive' },
    { id: 'cap-growth', key: 'growthPct', label: 'Yearly growth', min: 'zero' },
    { id: 'cap-protection', key: 'protectionPct', label: 'Snapshot and protection overhead', min: 'zero' },
    { id: 'cap-headroom', key: 'headroomPct', label: 'Headroom', min: 'zero' },
    { id: 'cap-reduction', key: 'dataReduction', label: 'Data-reduction ratio', min: 'positive' },
    { id: 'cap-buffer', key: 'bufferPct', label: 'Buffer capacity', min: 'zero' }
  ];

  var specEl = document.getElementById('cap-spec');
  var errorEl = document.getElementById('cap-error');
  var formEl = document.getElementById('cap-form');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function number(value, digits) {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function readInputs() {
    var values = {};
    var invalid = [];
    FIELDS.forEach(function (field) {
      var raw = document.getElementById(field.id).value;
      var parsed = Number(raw);
      var tooSmall = field.min === 'positive' ? parsed <= 0 : parsed < 0;
      if (raw === '' || !isFinite(parsed) || tooSmall) {
        invalid.push(field.label);
      }
      values[field.key] = parsed;
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

  function render(range, inputs) {
    specEl.textContent = '';
    specEl.appendChild(specRow(
      'Data after ' + number(inputs.years, 0) + ' years, base growth',
      number(range.base.logicalTb, 1) + ' TB',
      'assumed'
    ));
    ['low', 'base', 'high'].forEach(function (name) {
      specEl.appendChild(specRow(
        'Usable capacity, ' + name + ' (' + number(range[name].growthPct, 1) + '% growth)',
        number(range[name].usableTb, 0) + ' TB',
        'assumed',
        name === 'base'
      ));
    });
    specEl.appendChild(specRow(
      'Installed with buffer, base',
      number(range.base.installedTb, 0) + ' TB',
      'assumed'
    ));
  }

  function update() {
    var read = readInputs();
    if (read.invalid.length > 0) {
      errorEl.textContent = 'Check these fields (annual data, years, and ratio must be above 0; the others 0 or more): ' + read.invalid.join(', ') + '.';
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    render(window.Sizing.capacityRange(read.values), read.values);
  }

  formEl.addEventListener('input', update);
  formEl.addEventListener('change', update);
  formEl.addEventListener('submit', function (event) { event.preventDefault(); });
  update();
})();
