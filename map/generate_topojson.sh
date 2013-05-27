#!/bin/bash
# Generates TopoJSON (suitable for d3.js maps) from bbbike.org's awesome OpenStreetMap extracts
#
# Largely based upon http://bost.ocks.org/mike/map/
#
# Preparatory steps:
# - get Perth.osm.shp.zip from http://download.bbbike.org/osm/bbbike/Perth/
# - brew install gdal (or sudo apt-get install gdal-bin)
# - sudo npm install -g topojson
#

if [ ! -e shape/roads.shp ]
  then echo "no shapefiles? download and unzip Perth.osm.shp.zip from http://download.bbbike.org/osm/"; exit 1
fi

echo "ogr2ogr on roads.shp"
ogr2ogr -f GeoJSON -clipdst 115.83 -31.93 115.90 -31.98 roads.json shape/roads.shp

echo "ogr2ogr on waterways.shp"
ogr2ogr -f GeoJSON -clipdst 115.83 -31.93 115.90 -31.98 waterways.json shape/waterways.shp


echo "topojson to combine the above into perth.json"
topojson -o perth.json waterways.json roads.json

rm roads.json
rm waterways.json
