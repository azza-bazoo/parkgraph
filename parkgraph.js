var data = {};

window.addEvent('domready', function() {

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
    // assume for now that all points have the same times, again due to laziness
    var range = Object.keys(data.values.features[0].properties.spaces);

    var u = new URI();
    var initial_time = "05:00";
    if (u.getData('time') && range.indexOf(u.getData('time')) !== -1) {
      initial_time = u.getData('time');
    }

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


    svg.selectAll(".symbol")
        .data(data.values.features)
        .enter().append("path")
          .attr("class", "symbol");

    var redraw = function(time) {
      svg.selectAll(".symbol")
        .style("fill", function(d) { return circleColours(d, time); })
        .attr("d", path.pointRadius(function(d) { return radius(valueAt(d, time)); }));
    }

    redraw(initial_time);

    $('slider').setStyle("width", (range.length * 5) + "px")

    var slider = new Slider(
      $('slider'), $('knob'), {
      snap: true,
      range: [ 0, range.length - 1 ],
      initialStep: range.indexOf(initial_time),
      onChange: function(index) {
        $('current_value').set('html', range[index]);
        redraw(range[index]);
      }
    });
  }

  d3.json("map/perth.json", function(error, perth) {
    d3.json("data/perth-2013-05-27.json", function(error, parking) {
      data.map = perth;
      data.values = parking;

      $('loading').set('html', "<a href=\"#\">&#8227; Ready to go!</a>")
      $$('#loading a').addEvent('click', function(e) {
        e.preventDefault();

        var activate_animation = new Fx.Morph('black_box');

        activate_animation.start({
            'height': [250, 100],
            'width': [400, window.innerWidth - 100 - 40],
            'left': [250, 50],
            'top': [200, window.innerHeight - 200]
        });

        $('blurb').setStyle('display', 'none');
        $('controls').setStyle('display', 'block');

        drawMap();

        activate_animation.addEvent('complete', function() {
          // start D3 animation
        });
      });

    });
  });

});
