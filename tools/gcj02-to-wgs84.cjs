/**
 * 将 src/assets/china.json (GCJ-02) 转换为 WGS84
 * 用法: node tools/gcj02-to-wgs84.js
 */
const fs = require('fs')
const path = require('path')

const a = 6378245.0
const ee = 0.00669342162296594323

function outOfChina(lng, lat) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

function gcj02ToWgs84(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat]
  let dlat = transformLat(lng - 105.0, lat - 35.0)
  let dlng = transformLng(lng - 105.0, lat - 35.0)
  const radlat = lat / 180.0 * Math.PI
  let magic = Math.sin(radlat)
  magic = 1 - ee * magic * magic
  const sqrtmagic = Math.sqrt(magic)
  dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * Math.PI)
  dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI)
  return [lng * 2 - (lng + dlng), lat * 2 - (lat + dlat)]
}

function convertCoordArray(coords) {
  if (!Array.isArray(coords)) return coords
  if (typeof coords[0] === 'number') {
    return gcj02ToWgs84(coords[0], coords[1])
  }
  return coords.map(convertCoordArray)
}

function convertFeature(feature) {
  if (!feature.geometry) return feature
  const geom = feature.geometry
  return {
    ...feature,
    geometry: {
      ...geom,
      coordinates: convertCoordArray(geom.coordinates),
    },
    properties: feature.properties
      ? {
          ...feature.properties,
          center: feature.properties.center
            ? gcj02ToWgs84(feature.properties.center[0], feature.properties.center[1])
            : undefined,
          centroid: feature.properties.centroid
            ? gcj02ToWgs84(feature.properties.centroid[0], feature.properties.centroid[1])
            : undefined,
        }
      : feature.properties,
  }
}

const inputPath = path.resolve(__dirname, '../src/assets/china.json')
const outputPath = path.resolve(__dirname, '../src/assets/china.json')

console.log('Reading china.json ...')
const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

console.log(`Converting ${raw.features.length} features from GCJ-02 to WGS84 ...`)
const converted = {
  ...raw,
  features: raw.features.map(convertFeature),
}

fs.writeFileSync(outputPath, JSON.stringify(converted), 'utf-8')
console.log('Done. china.json has been converted to WGS84.')
