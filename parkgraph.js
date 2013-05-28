var data = {};

window.addEvent('domready', function() {
  var tooltip_tween;
  var slider;
  var range;
  var current_time;
  var data_animation;

  var svg = d3.select("#display").append("svg")
      .attr("width", window.innerWidth)
      .attr("height", window.innerHeight);

  var radius = d3.scale.linear()
      .domain([0, 500])
      .range([4, 20]);

  var colours = d3.scale.linear()
      .domain([0, 1])
      .range(["#00cc00", "#ff0000"]);

  var projection = d3.geo.mercator()
      .center([115.865, -31.958])
      .translate([Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)])
      .scale(1200 * window.innerWidth - 26000);

  var path = d3.geo.path().projection(projection);

  var valueAt = function(point, time) {
    return point.properties.spaces[time];
  }

  var circleColours = function(point, time) {
    return colours(valueAt(point, time) / point.properties.total);
  }

  var drawMap = function() {
    svg.append("path")
      .attr("class", "water")
      .datum(topojson.feature(data.map, data.map.objects.rivers))
      .attr("d", path);

    svg.append("path")
      .attr("class", "park")
      .datum(topojson.feature(data.map, data.map.objects.parks))
      .attr("d", path);

    svg.append("path")
      .attr("class", "water")
      .datum(topojson.feature(data.map, data.map.objects.lakes))
      .attr("d", path);

    svg.append("path")
      .attr("class", "building")
      .datum(topojson.feature(data.map, data.map.objects.buildings))
      .attr("d", path);

    svg.append("path")
      .attr("class", "road")
      .datum(topojson.feature(data.map, data.map.objects.roads))
      .attr("d", path);
  }

  var drawSymbolsAndSlider = function() {
    // assume for now that all points have the same times, again due to laziness
    range = Object.keys(data.values.features[0].properties.spaces);

    var u = new URI();
    var initial_time = "05:00";
    if (u.getData('time') && range.indexOf(u.getData('time')) !== -1) {
      initial_time = u.getData('time');
    }

    svg.selectAll(".symbol")
      .data(data.values.features)
      .enter()
        .append("path")
        .attr("class", "symbol")
        .append("title").text(function(d) { return d.properties.name });

    var symbols = svg.selectAll(".symbol");

    var redraw = function(time) {
      symbols
        .style("fill", function(d) { return circleColours(d, time); })
        .attr("d", path.pointRadius(function(d) { return radius(valueAt(d, time)); }));
    }

    redraw(initial_time);

    $$(symbols[0]).addEvent('mouseover', function(e) {
      var name = e.target.childNodes[0].textContent;

      // find the Feature object corresponding to this point (dumb, yes, but non-slow enough for our needs)
      for (var i = 0; i < data.values.features.length; i ++) {
        if (name == data.values.features[i].properties.name) {
          var used_spaces = data.values.features[i].properties.spaces[current_time];
          var total_spaces = data.values.features[i].properties.total;
          break;
        }
      }

      $('tooltip').set('html',
        "<h3>" + name + "</h3>"
        + "<p>At " + current_time + ":</p>"
        + "<p>" + used_spaces + " spaces used</p>"
        + "<p>" + (total_spaces - used_spaces) + " spaces free</p>"
      );

      var position = e.target.getBoundingClientRect();

      if (tooltip_tween) {  tooltip_tween.cancel(); }

      if ($('tooltip').getStyle('display') !== 'block') {
        tooltip_tween = new Fx.Tween('tooltip', { duration: 250, property: 'opacity' }).start(0, 0.9).chain(
          function(){
            tooltip_tween = null;
          }
        );
      }

      $('tooltip').setStyles({
        display: 'block',
        top: position.top + position.height + 5,
        left: (position.left + position.width / 2) - 90
      });
    });

    slider = new Slider(
      $('slider'), $('knob'), {
      range: [ 0, range.length - 1 ],
      initialStep: range.indexOf(initial_time),
      onChange: function(index) {
        current_time = range[index];
        $('current_value').set('html', range[index]);

        fadeOutTooltip();
        redraw(range[index]);
      }
    });
  }

  var fadeOutTooltip = function() {
    tooltip_tween = new Fx.Tween('tooltip', { duration: 250, property: 'opacity' }).start(0.9, 0).chain(
      function(){
        $('tooltip').setStyle('display', 'none');
        tooltip_tween = null;
      }
    );
  }

  $('tooltip').addEvent('mouseleave', fadeOutTooltip);

  d3.json("map/perth.json", function(error, perth) {
    d3.json("data/perth-2013-05-27.json", function(error, parking) {
      data.map = perth;
      data.values = parking;

      drawMap();

      $('loading').set('html', "<a href=\"#\">&#8227; Ready to go!</a>");

      $$('#loading a').addEvent('click', function(e) {
        e.preventDefault();

        var activate_animation = new Fx.Morph('black_box');

        var new_block_width = window.innerWidth - 100 - 40;
        $('slider').setStyle('width', new_block_width - 120 - 20);

        new Fx.Tween('blurb', { property: 'opacity' }).start(1, 0).chain(
            function(){ $('blurb').setStyle('display', 'none'); }
        );

        $('controls').setStyle('display', 'block');
        $('controls').fade('in');

        activate_animation.start({
            'height': [250, 85],
            'width': [400, new_block_width],
            'left': [250, 50],
            'top': [200, window.innerHeight - 170]
        });

        drawSymbolsAndSlider();

        activate_animation.addEvent('complete', function() {
          data_animation = (function(){
            if (current_time >= '21:00') {
              clearInterval(data_animation);
            } else {
              slider.set(slider.step + 1);
            }
          }).periodical(20);
        });
      });

    });
  });

});
