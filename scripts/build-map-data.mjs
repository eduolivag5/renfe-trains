// Genera public/map/spain.json: TopoJSON compacto con las provincias de la península
// y los países vecinos recortados al encuadre (solo como fondo).
//
// Solo hace falta volver a ejecutarlo si se quiere cambiar la geometría. Pasos:
//   1. En una carpeta aparte: npm i d3-geo@3 d3-geo-projection@4 topojson-client@3 topojson-server@3 topojson-simplify@3
//   2. <geoDir>: es-provinces.json  (https://cdn.jsdelivr.net/npm/es-atlas@0.6.0/es/provinces.json)
//                countries-10m.json (https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json)
//   3. node build-map-data.mjs <geoDir> public/map/spain.json
import fs from 'node:fs';
import * as topo from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoIdentity } from 'd3-geo';
import { geoProject } from 'd3-geo-projection';

const [geoDir, outFile] = process.argv.slice(2);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// ---------- 1. Provincias peninsulares ----------
const EXCLUDE = new Set(['07', '35', '38', '51', '52']); // Baleares, Canarias, Ceuta, Melilla
const esTopo = readJSON(`${geoDir}/es-provinces.json`);
const provinces = topo.feature(esTopo, esTopo.objects.provinces);
provinces.features = provinces.features
  .filter((f) => !EXCLUDE.has(f.id))
  .map((f) => ({ type: 'Feature', id: f.id, properties: { name: f.properties.name }, geometry: f.geometry }));

// ---------- 2. Vecinos recortados al encuadre de la península ----------
const world = readJSON(`${geoDir}/countries-10m.json`);
const NEIGHBORS = new Set(['620', '250', '020', '504', '012', '292']); // PRT, FRA, AND, MAR, DZA, GIB
const clip = geoIdentity().reflectY(false).clipExtent([[-12.5, 34], [6.5, 45.5]]);
const neighbors = topo.feature(world, world.objects.countries);
neighbors.features = neighbors.features
  .filter((f) => NEIGHBORS.has(String(f.id)))
  .map((f) => geoProject({ type: 'Feature', id: f.id, properties: {}, geometry: f.geometry }, clip))
  .filter((f) => f.geometry);

// ---------- 3. Topología, simplificación y cuantización ----------
let t = topology({ provinces, neighbors }, 1e5);
t = presimplify(t);
t = simplify(t, quantile(t, 0.2)); // conserva el 20 % de los puntos
t.arcs = t.arcs.map((arc) => arc.map((p) => [p[0], p[1]]));
fs.writeFileSync(outFile, JSON.stringify(topo.quantize(t, 1e5)));
console.log(`${outFile}: ${(fs.statSync(outFile).size / 1024).toFixed(0)} KB`);
