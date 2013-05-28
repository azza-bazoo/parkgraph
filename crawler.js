//
// crontab for this file:
// */5 *       *       *       *       cd ~/parkimorph; /usr/local/bin/node crawler.js
//

var http = require('http');
var fs = require('fs');

var parking_url = "http://cityofperthparking.com.au/sites/all/modules/cppparkavailabilityhome/jsongetter.php";

var now = new Date();

// lazy sprintf! maybe I should just use moment.js
var numberFormat = function(num) {
  var padding = "";
  if (num < 10) { padding = "0"; }
  return padding + num;
}

var output_file = 'data/crawl-perth-' + now.getFullYear() + '-' + numberFormat(now.getMonth() + 1) + '-' + numberFormat(now.getDate()) + '.json';



var writeOutput = function(new_raw_data, old_data) {
  var time = numberFormat(now.getHours()) + ':' + numberFormat(now.getMinutes());
  var new_data = {};

  // munge the format from the City of Perth website
  new_raw_data.response.forEach(function(carpark) {
    new_data[carpark.displayName] = carpark.freeSpaces;
  });

  old_data[time] = new_data;

  fs.writeFile(output_file, JSON.stringify(old_data), function (err) {
    if (err) throw err;
    // Successful crawl! TODO: log something
  });
}



http.get(parking_url, function(http_response) {
  http_response.on("data", function(parking_json) {
    var parking = JSON.parse(parking_json);

    fs.exists(output_file, function (exists) {
      if (exists) {
        // read previous output first, then write
        fs.readFile(output_file, function (err, existing_data) {
          if (err) throw err;

          var previous_output = JSON.parse(existing_data);
          writeOutput(parking, previous_output);
        });

      } else {
        var previous_output = {};
        writeOutput(parking, previous_output);
      }
    });
  });
});

