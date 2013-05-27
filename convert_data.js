//
// Converts the output of crawler.js into a TopoJSON file for display.
//
// Run as: node convert_data.js data/1234-56-78.json
// Outputs TopoJSON at: data/perth-1234-56-78.json
//

var fs = require('fs');

if (process.argv.length < 3) {
  console.log("Usage:", process.argv[0], process.argv[1], "file_to_process.json");
  process.exit(1);
}


var metadata_file = "map/perth-carparks.json";

var matches = process.argv[2].match(/(\d{4}-\d{2}-\d{2})/);
var output_file = "data/perth-" + matches[1] + ".json";


// skeleton of our output format
var output = {
  "type": "FeatureCollection",
  "features": []
}


// check input file, then read it, and read metadata
fs.exists(process.argv[2], function (exists) {
  if (!exists) {
    console.log("No input file provided, or file does not exist");
    process.exit(1);
  }

  fs.readFile(process.argv[2], function (err, input_raw) {
    if (err) throw err;
    var input = JSON.parse(input_raw);

    fs.readFile(metadata_file, function (err, metadata_raw) {
      if (err) throw err;
      var metadata = JSON.parse(metadata_raw);

      // now munge the crawl data into a displayable TopoJSON format
      var series = {};

      var getTotalSpaces = function(carpark) {
        return metadata[carpark].counts.regular + metadata[carpark].counts.acrod;
      }

      // input format: { timestamp: { carpark_name: number_of_spaces } }
      for (var time in input) {
        for (var carpark in input[time]) {
          // we want to record spaces used, not spaces free
          var free_spaces = input[time][carpark];

          if (!series[carpark]) { series[carpark] = {}; }
          series[carpark][time] = getTotalSpaces(carpark) - free_spaces;

          if (getTotalSpaces(carpark) - free_spaces < 0) {
            series[carpark][time] = 0;
            console.log("Negative result:", carpark, "at", time, "was", getTotalSpaces(carpark), "-", free_spaces);
          }
        }
      }

      // metadata format: { carpark_name: { lat, long, and total spaces count }
      for (var carpark in metadata) {
        // for each carpark, create a Feature
        var feature = {
          "type": "Feature",
          "geometry": {
            "type": "Point"
          },
          "properties": {}
        }

        feature.properties.name = carpark;
        feature.properties.spaces = series[carpark];

        // also store total, so we can compute percentage (for colours)
        feature.properties.total = getTotalSpaces(carpark);

        // GeoJSON/TopoJSON expect longitude first!
        feature.geometry.coordinates = [
          metadata[carpark].long, metadata[carpark].lat
        ];

        output.features.push(feature);
      }

      // hopefully done! write the output
      fs.writeFile(output_file, JSON.stringify(output), function (err) {
        if (err) throw err;
        console.log("Yay! Wrote", output.features.length, "feature objects to", output_file);
      });

    });
  });

});
