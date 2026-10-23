/*
 * Sizing math for the HA VPN link (see ADR-0004 and the assumptions register).
 * Pure functions, no DOM. Works in the browser (window.Sizing) and in Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Sizing = factory();
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  var GBIT_PER_GB = 8;
  var SECONDS_PER_HOUR = 3600;
  var MBPS_PER_GBPS = 1000;
  var GB_PER_TB = 1000;

  // Google recommends staying under 50% of a tunnel so one tunnel can absorb a failure.
  var OK_LIMIT = 0.5;
  var FULL_LIMIT = 1;

  function assertPositive(name, value) {
    if (typeof value !== 'number' || !isFinite(value) || value <= 0) {
      throw new RangeError(name + ' must be a number greater than 0');
    }
  }

  function gigabits(volumeGb) {
    return volumeGb * GBIT_PER_GB;
  }

  function averageMbps(volumeGb, hours) {
    assertPositive('volumeGb', volumeGb);
    assertPositive('hours', hours);
    return (gigabits(volumeGb) / (hours * SECONDS_PER_HOUR)) * MBPS_PER_GBPS;
  }

  function burstGbps(volumeGb, windowHours) {
    assertPositive('volumeGb', volumeGb);
    assertPositive('windowHours', windowHours);
    return gigabits(volumeGb) / (windowHours * SECONDS_PER_HOUR);
  }

  function annualTb(volumeGb, races) {
    assertPositive('volumeGb', volumeGb);
    assertPositive('races', races);
    return (volumeGb * races) / GB_PER_TB;
  }

  function utilization(requiredGbps, tunnelGbps, tunnelsUp) {
    assertPositive('requiredGbps', requiredGbps);
    assertPositive('tunnelGbps', tunnelGbps);
    assertPositive('tunnelsUp', tunnelsUp);
    return requiredGbps / (tunnelGbps * tunnelsUp);
  }

  function verdict(u) {
    if (u <= OK_LIMIT) {
      return { level: 'ok', label: 'Within the 50% guidance' };
    }
    if (u <= FULL_LIMIT) {
      return { level: 'tight', label: 'Tight: add tunnels or widen the window' };
    }
    return { level: 'insufficient', label: 'Not enough: add tunnels or widen the window' };
  }

  var PERCENT = 100;
  var SCENARIO_GROWTH_FACTORS = { low: 0.5, base: 1, high: 2 };

  function assertNonNegative(name, value) {
    if (typeof value !== 'number' || !isFinite(value) || value < 0) {
      throw new RangeError(name + ' must be a number of 0 or more');
    }
  }

  // Cumulative logical data after `years` of yearly intake that grows by growthPct each year.
  function cumulativeTb(annualTbPerYear, years, growthPct) {
    assertPositive('annualTbPerYear', annualTbPerYear);
    assertPositive('years', years);
    assertNonNegative('growthPct', growthPct);
    var growth = 1 + growthPct / PERCENT;
    var total = 0;
    for (var i = 0; i < years; i += 1) {
      total += annualTbPerYear * Math.pow(growth, i);
    }
    return total;
  }

  // Usable capacity needed: logical data, divided by data reduction, plus protection overhead and headroom.
  // dataReduction 1 means no reduction is assumed (no public figure).
  function usableTb(logicalTb, dataReduction, protectionPct, headroomPct) {
    assertPositive('logicalTb', logicalTb);
    assertPositive('dataReduction', dataReduction);
    assertNonNegative('protectionPct', protectionPct);
    assertNonNegative('headroomPct', headroomPct);
    return (logicalTb / dataReduction) * (1 + protectionPct / PERCENT) * (1 + headroomPct / PERCENT);
  }

  // inputs: annualTb, years, growthPct, dataReduction, protectionPct, headroomPct, bufferPct
  // Returns a low / base / high range, not a point value. Low and high scale the growth rate by 0.5 and 2.
  function capacityRange(inputs) {
    assertNonNegative('bufferPct', inputs.bufferPct);
    var result = {};
    Object.keys(SCENARIO_GROWTH_FACTORS).forEach(function (name) {
      var growth = inputs.growthPct * SCENARIO_GROWTH_FACTORS[name];
      var logical = cumulativeTb(inputs.annualTb, inputs.years, growth);
      var usable = usableTb(logical, inputs.dataReduction, inputs.protectionPct, inputs.headroomPct);
      result[name] = {
        growthPct: growth,
        logicalTb: logical,
        usableTb: usable,
        installedTb: usable * (1 + inputs.bufferPct / PERCENT)
      };
    });
    return result;
  }

  // inputs: volumeGb, windowHours, weekendHours, races, tunnelGbps, tunnels (total, at least 2)
  function analyse(inputs) {
    assertPositive('tunnels', inputs.tunnels);
    if (inputs.tunnels < 2) {
      throw new RangeError('tunnels must be at least 2 for the 99.99% design');
    }
    var burst = burstGbps(inputs.volumeGb, inputs.windowHours);
    var normal = utilization(burst, inputs.tunnelGbps, inputs.tunnels);
    var degraded = utilization(burst, inputs.tunnelGbps, inputs.tunnels - 1);
    return {
      averageMbps: averageMbps(inputs.volumeGb, inputs.weekendHours),
      burstGbps: burst,
      annualTb: annualTb(inputs.volumeGb, inputs.races),
      normal: { utilization: normal, verdict: verdict(normal) },
      degraded: { utilization: degraded, verdict: verdict(degraded) }
    };
  }

  return {
    averageMbps: averageMbps,
    burstGbps: burstGbps,
    annualTb: annualTb,
    utilization: utilization,
    verdict: verdict,
    analyse: analyse,
    cumulativeTb: cumulativeTb,
    usableTb: usableTb,
    capacityRange: capacityRange,
    OK_LIMIT: OK_LIMIT,
    FULL_LIMIT: FULL_LIMIT
  };
});
