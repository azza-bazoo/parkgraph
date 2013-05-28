
var tooltip = {
  tween: null,
  el: $('tooltip'),
  last_displayed_name: '',

  isShowing: function() {
    return (tooltip.el.getStyle('display') === 'block');
  },

  fadeOut: function() {
    tooltip.tween = new Fx.Tween(
      tooltip.el,
      { duration: 250, property: 'opacity' }
    ).start(0.9, 0).chain(
      function(){
        tooltip.el.setStyle('display', 'none');
        tooltip.tween = null;
      }
    );
  },

  updateText: function(name, current_time) {
    if (!name) {
      name = tooltip.last_displayed_name;
    } else {
      tooltip.last_displayed_name = name;
    }

    // find the Feature object corresponding to this point (dumb, yes, but non-slow enough for our needs)
    for (var i = 0; i < symbols.data.features.length; i ++) {
      if (name == symbols.data.features[i].properties.name) {
        var used_spaces = symbols.data.features[i].properties.spaces[current_time];
        var total_spaces = symbols.data.features[i].properties.total;
        break;
      }
    }

    tooltip.el.set('html',
      "<h3>" + name + "</h3>"
      + "<p class=\"time\">at " + current_time + "</p>"
      + "<p>" + used_spaces + " spaces used</p>"
      + "<p>" + (total_spaces - used_spaces) + " spaces free</p>"
    );
  },

  generateAndDisplay: function(e) {
    tooltip.updateText(
      e.target.childNodes[0].textContent,
      slider.values[slider.Slider.step]
    );

    var position = e.target.getBoundingClientRect();

    if (tooltip.tween) {  tooltip.tween.cancel(); }

    if (!tooltip.isShowing()) {
      tooltip.tween = new Fx.Tween(tooltip.el, { duration: 250, property: 'opacity' }).start(0, 0.9).chain(
        function(){ tooltip.tween = null; }
      );
    }

    tooltip.el.setStyles({
      display: 'block',
      top: position.top + position.height + 5,
      left: (position.left + position.width / 2) - 90
    });
  },

  init: function(svg_symbols) {
    svg_symbols.addEvent('mouseover', tooltip.generateAndDisplay);

    $('tooltip').addEvent('mouseleave', tooltip.fadeOut);
  }
}


var slider = {
  Slider: null,
  values: [],
  initial_time: "05:00",

  onChange: function(index) {
    $('current_value').set('html', slider.values[index]);

    symbols.redraw(slider.values[index]);

    if (tooltip.isShowing()) {
      tooltip.updateText(null, slider.values[index]);
    }
  },

  init: function() {
    var u = new URI();
    if (u.getData('time') && slider.values.indexOf(u.getData('time')) !== -1) {
      slider.initial_time = u.getData('time');
    }

    // assume for now that all points have the same times, again due to laziness
    slider.values = Object.keys(symbols.data.features[0].properties.spaces);

    slider.Slider = new Slider(
      $('slider'), $('knob'), {
      range: [ 0, slider.values.length - 1 ],
      initialStep: slider.values.indexOf(slider.initial_time),
      onChange: slider.onChange
    });
  }
}


var symbols = {
  elements: [],
  data: {},

  radius: d3.scale.linear()
      .domain([0, 500])
      .range([4, 20]),

  colours: d3.scale.linear()
      .domain([0, 1])
      .range(["#00cc00", "#ff0000"]),

  valueAt: function(point, time) {
    return point.properties.spaces[time];
  },

  circleColours: function(point, time) {
    return symbols.colours(symbols.valueAt(point, time) / point.properties.total);
  },

  initial_draw: function() {
    map.el.selectAll(".symbol")
      .data(symbols.data.features)
      .enter()
        .append("path")
        .attr("class", "symbol")
        .append("title").text(function(d) { return d.properties.name });

    symbols.elements = map.el.selectAll(".symbol");

    symbols.redraw(slider.initial_time);
  },

  redraw: function(time) {
    symbols.elements
      .style("fill", function(d) { return symbols.circleColours(d, time); })
      .attr("d", map.path.pointRadius(function(d) { return symbols.radius(symbols.valueAt(d, time)); }));
  }
}


var map = {
  el: null,
  projection: null,
  path: null,

  data: {},

  init: function() {
    map.el = d3.select("#display").append("svg")
        .attr("width", window.innerWidth)
        .attr("height", window.innerHeight);

    map.projection = d3.geo.mercator()
        .center([115.865, -31.958])
        .translate([Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)])
        .scale(1200 * window.innerWidth - 26000);

    map.path = d3.geo.path().projection(map.projection);
  },

  draw: function() {
    map.el.append("path")
      .attr("class", "water")
      .datum(topojson.feature(map.data, map.data.objects.rivers))
      .attr("d", map.path);

    map.el.append("path")
      .attr("class", "park")
      .datum(topojson.feature(map.data, map.data.objects.parks))
      .attr("d", map.path);

    map.el.append("path")
      .attr("class", "water")
      .datum(topojson.feature(map.data, map.data.objects.lakes))
      .attr("d", map.path);

    map.el.append("path")
      .attr("class", "building")
      .datum(topojson.feature(map.data, map.data.objects.buildings))
      .attr("d", map.path);

    map.el.append("path")
      .attr("class", "road")
      .datum(topojson.feature(map.data, map.data.objects.roads))
      .attr("d", map.path);
  }
}


var visualisation = {
  interval: null,

  advance: function() {
    if (slider.values[slider.Slider.step] >= '21:00') {
      clearInterval(visualisation.interval);
    } else {
      slider.Slider.set(slider.Slider.step + 1);
    }
  },

  start: function() {
    visualisation.interval = visualisation.advance.periodical(20);
  }
}


var load_screen = {
  animation: null,

  startEverything: function(e) {
    e.preventDefault();

    load_screen.animation = new Fx.Morph('black_box');

    var new_block_width = window.innerWidth - 100 - 40;
    $('slider').setStyle('width', new_block_width - 120 - 20);

    new Fx.Tween('blurb', { property: 'opacity' }).start(1, 0).chain(
        function(){ $('blurb').setStyle('display', 'none'); }
    );

    $('controls').setStyle('display', 'block');
    $('controls').fade('in');

    load_screen.animation.start({
        'height': [250, 85],
        'width': [400, new_block_width],
        'left': [250, 50],
        'top': [200, window.innerHeight - 170]
    });

    symbols.initial_draw();

    slider.init();
    tooltip.init($$(symbols.elements[0]));

    load_screen.animation.addEvent('complete', function() {
      visualisation.start();
    });
  },

  ready: function() {
    $('loading').set('html', "<a href=\"#\">&#8227; Ready to go!</a>");
    $$('#loading a').addEvent('click', load_screen.startEverything);
  }
}


window.addEvent('domready', function() {
  map.init();

  d3.json("map/perth.json", function(error, perth) {
    d3.json("data/perth-2013-05-27.json", function(error, parking) {
      map.data = perth;
      symbols.data = parking;

      map.draw();

      load_screen.ready();
    });
  });
});
