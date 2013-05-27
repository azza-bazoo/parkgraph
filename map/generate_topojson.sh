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
ogr2ogr -f GeoJSON -where "type IN ('primary', 'secondary', 'tertiary', 'residential', 'motorway', 'trunk', 'primary_link', 'motorway_link', 'trunk_link', 'unclassified')" -clipdst 115.837 -31.92 115.891 -31.99 roads.json shape/roads.shp

echo "ogr2ogr on natural.shp (looking for parks)"
ogr2ogr -f GeoJSON -where "type = 'park'" -clipdst 115.837 -31.92 115.891 -31.99 parks.json shape/natural.shp

echo "ogr2ogr on natural.shp (looking for water)"
ogr2ogr -f GeoJSON -where "type IN ('water', 'riverbank')" -clipdst 115.837 -31.92 115.891 -31.99 water.json shape/natural.shp

# use tighter clip bounds on buildings (Vincent St to the Narrows); we really only care about the CBD
echo "ogr2ogr on buildings.shp"
ogr2ogr -f GeoJSON -clipdst 115.837 -31.9365 115.891 -31.962 buildings.json shape/buildings.shp


echo "topojson to combine the above into perth.json"
topojson -o perth.json water.json parks.json buildings.json roads.json

rm roads.json
rm parks.json
rm water.json
rm buildings.json
