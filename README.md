# Parkgraph

Parkgraph is an interactive animation that shows the change in utilisation of car parks in Perth over an average working day.

To view, just open `perth.html` in any modern browser. Some browsers require the use of an HTTP server, such as `staticfiles.js`.

Besides the fairly simple data-wrangling scripts described below, most of the interesting code is in `parkgraph.js`.

(I'm [Hourann Bosci](http://hourann.com) and built this in the lead-up to [GovHack Perth](http://www.govhack.org/locations/perth/), mainly as an excuse to learn about [D3.js](http://bost.ocks.org/mike/map/).)


## Not-so-frequently asked questions

#### Why Perth?

As [the GovPond folks say](http://www.govpond.org/about.php), we're all liberationists in Western Australia, fighting for [secession](http://en.wikipedia.org/wiki/File:Western_Australia_Secession_Cover_1933.jpg)!

Perth is actually unique among big Australian cities in having a large percentage of central-city parking in public ownership (only [Adelaide](http://upark.com.au/) comes close). What's more, the City of Perth is one of the few parking operators anywhere that publishes [live availability online](http://www.cityofperthparking.com.au/?q=node/109).

Something similar could easily be done with San Francisco's very cool [SFpark](http://sfpark.org/) system and its (complex) [API](http://sfpark.org/how-it-works/open-data-page/). Or maybe you could somehow crunch data out of the many places that have [Streetline](http://www.streetline.com/)-based systems.


#### Why car parking?

Mainly because it's urban data available online in an easily-scraped format.

It would be cool to overlay the parking statistics with other measures of city busy-ness, like tag ons and tag offs at train stations, or traffic on major bike routes -- if only that data were available.

Here are some similar efforts: [Lisbon](http://vimeo.com/10218235), [London](http://www.cartopedia.co.uk/blog/2012/02/17/visualising-bike-flow-data-in-processing/), [Copenhagen](http://vimeo.com/56412526), [Madrid](http://vimeo.com/645554), [Boston](http://hubwaydatachallenge.org/).


#### Do the circles really represent used spaces?

Well, sort of. Each circle's radius is proportional to `total_spaces - free_spaces` for a car park, and its colour corresponds to the ratio of that value over `total_spaces`.

But the published numbers don't distinguish spaces that are reserved (for monthly permit holders, etc.), and these show on the map as always in use -- even very late at night.


## Generating the base map

`perth.json`, representing most OpenStreetMap objects around the city centre, can be regenerated with the `generate-topojson.sh` script. I've included building data for a nicer-looking map, but that can be a problem in browsers with poorer SVG performance.

```bash
$ curl -O http://download.bbbike.org/osm/bbbike/Perth/Perth.osm.shp.zip && unzip Perth.osm.shp.zip

$ ~/parkgraph/map/generate_topojson.sh
$ cp perth.json ~/parkgraph/map/
```

The script requires [ogr2ogr](http://www.gdal.org/ogr2ogr.html), from the [gdal-bin](http://packages.ubuntu.com/raring/gdal-bin) package in apt-get or [gdal](https://github.com/mxcl/homebrew/blob/master/Library/Formula/gdal.rb) in Homebrew, and [topojson](https://npmjs.org/package/topojson) from npm.

## Running the crawler and generating display data

The crawler is simply a Node application that outputs into the `data/` directory. Run something like this via cron:

```bash
$ cd ~/parkgraph && node crawler.js
```

The raw crawl output is a basic mapping of times to carparks to available spaces. To convert this into GeoJSON for [display](http://bl.ocks.org/mbostock/4342045) by D3.js, run:

```bash
$ node convert_data.js data/crawl-perth-`date +%Y-%m-%d`.json
```
