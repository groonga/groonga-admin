'use strict';

(function(global) {
  function TimeUnit(parameters) {
    this.label = parameters.label;
    this.baseTimeInMilliseconds = parameters.baseTimeInMilliseconds;
    this.getBaseDate = parameters.getBaseDate;
  }
  global.TimeUnit = TimeUnit;

  TimeUnit.units = {};

  TimeUnit.register = function(name, unit) {
    TimeUnit.units[name] = unit;
  };

  TimeUnit.getOrderedUnits = function() {
    var orderedUnits = [];
    for (var name in TimeUnit.units) {
      orderedUnits.push(TimeUnit.units[name]);
    }
    orderedUnits.sort(function(unit1, unit2) {
      return unit1.baseTimeInMilliseconds - unit2.baseTimeInMilliseconds;
    });
    return orderedUnits;
  };

  TimeUnit.findByDateRange = function(start, end) {
    var orderedUnits = TimeUnit.getOrderedUnits();

    if (!start && !end) {
      return orderedUnits[0];
    }

    var unit;
    for (var i = 0; i < orderedUnits.length; i++) {
      var candidateUnit = orderedUnits[i];
      if (start && !candidateUnit.dateIncluded(start)) {
        continue;
      }
      if (end && !candidateUnit.dateIncluded(end)) {
        continue;
      }
      unit = candidateUnit;
      break;
    }
    if (!unit) {
      unit = orderedUnits[orderedUnits.length - 1];
    }
    return unit;
  };

  TimeUnit.prototype.dateIncluded = function(date) {
    var baseDate = this.getBaseDate();
    var baseTime = baseDate.getTime();
    var time = date.getTime();
    return (baseTime <= time &&
            time <= (baseTime * this.baseTimeInMilliseconds));
  };

  TimeUnit.prototype.percentToDate = function(percent) {
    var baseDate = this.getBaseDate();
    var date;
    date = new Date();
    date.setTime(baseDate.getTime() +
                 this.baseTimeInMilliseconds * percent);
    return date;
  };

  TimeUnit.prototype.dateToPercent = function(date) {
    var diffTime = date.getTime() - this.getBaseDate().getTime();
    return diffTime / this.baseTimeInMilliseconds;
  };


  // Built-in units
  TimeUnit.register('hour', new TimeUnit({
    label: 'Hour',
    baseTimeInMilliseconds: 60 * 60 * 1000,
    getBaseDate: function() {
      var now = new Date();
      return new Date(now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                      now.getHours(),
                      now.getMinutes() - 30);
    }
  }));

  TimeUnit.register('day', new TimeUnit({
    label: 'Day',
    baseTimeInMilliseconds: 24 * 60 * 60 * 1000,
    getBaseDate: function() {
      var now = new Date();
      return new Date(now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                      now.getHours() - 12);
    }
  }));

  TimeUnit.register('week', new TimeUnit({
    label: 'Week',
    baseTimeInMilliseconds: 7 * 24 * 60 * 60 * 1000,
    getBaseDate: function() {
      var now = new Date();
      return new Date(now.getFullYear(),
                      now.getMonth(),
                      now.getDate() - 3,
                      now.getHours() - 12);
    }
  }));

  TimeUnit.register('month', new TimeUnit({
    label: 'Month',
    baseTimeInMilliseconds: 30 * 24 * 60 * 60 * 1000,
    getBaseDate: function() {
      var now = new Date();
      return new Date(now.getFullYear(),
                      now.getMonth(),
                      now.getDate() - 15);
    }
  }));

  TimeUnit.register('year', new TimeUnit({
    label: 'Year',
    baseTimeInMilliseconds: 365 * 24 * 60 * 60 * 1000,
    getBaseDate: function() {
      var now = new Date();
      return new Date(now.getFullYear(),
                      now.getMonth() - 6);
    }
  }));

  TimeUnit.register('decade', new TimeUnit({
    label: 'Decade',
    baseTimeInMilliseconds: 10 * 365 * 24 * 60 * 60 * 1000,
    getBaseDate: function() {
      var now = new Date();
      return new Date(now.getFullYear() - 5);
    }
  }));
})(window);
