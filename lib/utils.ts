import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// GeoJSON types for bounds calculation
export interface GeoJSONBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface LatLngBounds {
  lat: number
  lng: number
}

/**
 * Calculate the bounding box from GeoJSON data
 * Supports both FeatureCollection and individual Feature objects
 * Returns bounds in a format compatible with Leaflet
 */
export function calculateGeoJSONBounds(geojsonData: any): GeoJSONBounds | null {
  if (!geojsonData) {
    console.warn("calculateGeoJSONBounds: No GeoJSON data provided")
    return null
  }

  console.log("calculateGeoJSONBounds: Processing GeoJSON data:", {
    type: geojsonData.type,
    featuresCount: geojsonData.features?.length || 0,
    hasCoordinates: !!geojsonData.coordinates
  })

  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  let validCoordinatesCount = 0

  const processCoordinates = (coordinates: any) => {
    if (!Array.isArray(coordinates)) return

    // Handle different geometry types
    const flattenCoordinates = (coords: any): number[][] => {
      if (coords.length === 0) return []

      // Check if this is a coordinate pair [lng, lat]
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        return [coords]
      }

      // Recursively flatten nested arrays
      const result: number[][] = []
      for (const coord of coords) {
        result.push(...flattenCoordinates(coord))
      }
      return result
    }

    const flatCoords = flattenCoordinates(coordinates)

    for (const coord of flatCoords) {
      if (coord.length >= 2) {
        const [lng, lat] = coord
        
        // Validate coordinate values
        if (typeof lng === 'number' && typeof lat === 'number' &&
            !isNaN(lng) && !isNaN(lat) &&
            isFinite(lng) && isFinite(lat) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180) {
          
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
          validCoordinatesCount++
        } else {
          console.warn(`Invalid coordinate pair found: [${lng}, ${lat}]`)
        }
      }
    }
  }

  const processGeometry = (geometry: any) => {
    if (!geometry || !geometry.coordinates) return
    processCoordinates(geometry.coordinates)
  }

  const processFeature = (feature: any) => {
    if (!feature) return

    if (feature.geometry) {
      processGeometry(feature.geometry)
    }
  }

  try {
    // Handle FeatureCollection
    if (geojsonData.type === 'FeatureCollection' && geojsonData.features) {
      for (const feature of geojsonData.features) {
        processFeature(feature)
      }
    }
    // Handle individual Feature
    else if (geojsonData.type === 'Feature') {
      processFeature(geojsonData)
    }
    // Handle Geometry directly
    else if (geojsonData.coordinates) {
      processGeometry(geojsonData)
    }
    else {
      console.warn("calculateGeoJSONBounds: Unrecognized GeoJSON structure", geojsonData)
      return null
    }

    // Check if we found valid bounds
    if (minLat === Infinity || maxLat === -Infinity || minLng === Infinity || maxLng === -Infinity) {
      console.warn("calculateGeoJSONBounds: No valid coordinates found in GeoJSON data")
      return null
    }

    // Ensure minimum bounds size to prevent infinite tile loading
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const minSize = 0.0001 // Minimum bounds size in degrees
    
    if (latDiff < minSize || lngDiff < minSize) {
      console.warn(`Bounds too small (lat: ${latDiff}, lng: ${lngDiff}), expanding to minimum size`)
      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      const halfMinSize = minSize / 2
      
      minLat = centerLat - halfMinSize
      maxLat = centerLat + halfMinSize
      minLng = centerLng - halfMinSize
      maxLng = centerLng + halfMinSize
    }

    const bounds = {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng
    }

    console.log("calculateGeoJSONBounds: Calculated bounds:", bounds, `(${validCoordinatesCount} valid coordinates)`)
    return bounds
  } catch (error) {
    console.error("calculateGeoJSONBounds: Error processing GeoJSON data", error)
    return null
  }
}

/**
 * Convert GeoJSONBounds to Leaflet bounds format [[south, west], [north, east]]
 */
export function toLeafletBounds(bounds: GeoJSONBounds): [[number, number], [number, number]] {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  ]
}
