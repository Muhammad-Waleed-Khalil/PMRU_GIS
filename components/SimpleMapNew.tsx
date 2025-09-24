"use client"

import { useEffect, useRef, useState } from "react"
import { useMapStore } from "../context/mapStore"
import { calculateGeoJSONBounds, toLeafletBounds } from "../lib/utils"
import type { Map as LeafletMap } from "leaflet"

// Utility functions for area conversion
const convertAreaToKanalsMarlas = (sqMeters: number) => {
  const MARLA_IN_SQ_M = 25.3 // 1 marla = 25.3 sq meters
  const KANAL_IN_SQ_M = 506 // 1 kanal = 20 marlas = 506 sq meters
  
  if (!sqMeters || sqMeters <= 0) return "0 Kanals 0 Marlas"
  
  const kanals = Math.floor(sqMeters / KANAL_IN_SQ_M)
  const remainingArea = sqMeters % KANAL_IN_SQ_M
  const marlas = Math.floor(remainingArea / MARLA_IN_SQ_M)
  
  if (kanals > 0 && marlas > 0) {
    return `${kanals} Kanals ${marlas} Marlas`
  } else if (kanals > 0) {
    return `${kanals} Kanals`
  } else {
    return `${marlas} Marlas`
  }
}

// Utility function to create photo gallery
const createPhotoGallery = (pictures: string[], containerId: string): string => {
  if (!pictures || pictures.length === 0) return ''
  
  // Register the gallery function globally
  ;(window as any)[`openPhotoGallery_${containerId}`] = () => {
    openPhotoGalleryModal(pictures)
  }
  
  return `
    <div style="margin-top: 10px;">
      <strong>Photos:</strong>
      <button 
        onclick="window.openPhotoGallery_${containerId}()"
        style="
          margin-left: 10px;
          padding: 4px 8px;
          background: #4285F4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        "
      >
        Gallery (${pictures.length})
      </button>
    </div>
  `
}

// Global function to open photo gallery modal
const openPhotoGalleryModal = (pictures: string[]) => {
  // Create overlay
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `
  
  // Create gallery container
  const galleryContainer = document.createElement('div')
  galleryContainer.style.cssText = `
    width: 95%;
    max-width: 1200px;
    height: 90%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `
  
  // Create header
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 15px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  
  const title = document.createElement('h3')
  title.style.cssText = 'margin: 0; color: #333;'
  title.textContent = `Photo Gallery (${pictures.length} photos)`
  
  const closeBtn = document.createElement('button')
  closeBtn.style.cssText = `
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 16px;
  `
  closeBtn.textContent = '×'
  closeBtn.onclick = () => overlay.remove()
  
  header.appendChild(title)
  header.appendChild(closeBtn)
  
  // Create photo grid
  const photoGrid = document.createElement('div')
  photoGrid.style.cssText = `
    padding: 15px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    flex: 1;
    overflow-y: auto;
  `
  
  pictures.forEach((photo, index) => {
    const img = document.createElement('img')
    img.src = photo
    img.alt = `Photo ${index + 1}`
    img.style.cssText = `
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    `
    
    img.onmouseover = () => img.style.borderColor = '#4285F4'
    img.onmouseout = () => img.style.borderColor = 'transparent'
    
    img.onclick = () => {
      // Create fullscreen image viewer
      const fullscreenOverlay = document.createElement('div')
      fullscreenOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      `
      
      const fullImg = document.createElement('img')
      fullImg.src = photo
      fullImg.style.cssText = `
        max-width: 95%;
        max-height: 95%;
        object-fit: contain;
      `
      
      const fullCloseBtn = document.createElement('button')
      fullCloseBtn.innerHTML = '×'
      fullCloseBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 20px;
      `
      fullCloseBtn.onclick = () => fullscreenOverlay.remove()
      
      fullscreenOverlay.appendChild(fullImg)
      fullscreenOverlay.appendChild(fullCloseBtn)
      fullscreenOverlay.onclick = (e) => {
        if (e.target === fullscreenOverlay) fullscreenOverlay.remove()
      }
      
      document.body.appendChild(fullscreenOverlay)
    }
    
    photoGrid.appendChild(img)
  })
  
  galleryContainer.appendChild(header)
  galleryContainer.appendChild(photoGrid)
  overlay.appendChild(galleryContainer)
  
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
  
  document.body.appendChild(overlay)
}

export default function SimpleMapNew() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const layerGroupsRef = useRef<Record<string, any>>({})
  const initializingRef = useRef(false) // Add flag to prevent double initialization
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [L, setL] = useState<any>(null)
  const {
    mapType,
    layers,
    layerVersion,
    zoomToBoundsRequest,
    clearZoomToBoundsRequest,
  } = useMapStore()

  console.log("🍃 Leaflet: Component rendered. Layers:", layers.map(l => ({ id: l.id, active: l.active })))
  console.log("🍃 Leaflet: Active layers count:", layers.filter(l => l.active).length)

  // Initialize Leaflet map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Prevent multiple initialization attempts
        if (initializingRef.current || mapInstanceRef.current) {
          console.log('🍃 Leaflet: Map already initializing or initialized, skipping...')
          return
        }
        
        if (typeof window !== "undefined" && mapRef.current) {
          initializingRef.current = true
          console.log('🍃 Leaflet: Starting map initialization...')
          
          // Ensure container is properly sized before initialization
          if (!mapRef.current.offsetHeight || !mapRef.current.offsetWidth) {
            console.log('🍃 Leaflet: Container not properly sized, retrying...')
            initializingRef.current = false
            setTimeout(() => initializeMap(), 100)
            return
          }
          
          // Clear any existing map instance on the container
          if ((mapRef.current as any)._leaflet_id) {
            console.log('🍃 Leaflet: Container already has map, cleaning up...')
            try {
              // Remove existing map from container
              (mapRef.current as any)._leaflet_id = undefined;
              mapRef.current.innerHTML = '';
            } catch (cleanupError) {
              console.warn('🍃 Leaflet: Error during container cleanup:', cleanupError)
            }
          }

          // Dynamically import Leaflet to avoid SSR issues
          const leaflet = await import("leaflet")
          const L = leaflet.default
          setL(L)

          // Fix for default markers
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          })

          // Initialize map centered on Pakistan/KP region
          const map = L.map(mapRef.current, {
            center: [34.0151, 71.5249], // Centered on KP/Pakistan region
            zoom: 7,
            zoomControl: false, // Disable default zoom control since we have custom ones
            attributionControl: true,
            keyboard: true, // Enable keyboard navigation
            keyboardPanDelta: 80, // Set keyboard pan distance
          })

          // Add base tile layers with English labels
          const baseLayers: Record<string, any> = {
            satellite: L.tileLayer(
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
                maxZoom: 18,
              }
            ),
            default: L.tileLayer(
              'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
              {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
              }
            )
          }

          // Add the appropriate base layer based on mapType (default to "default" type)
          baseLayers[mapType].addTo(map)

          mapInstanceRef.current = map
          setIsLoaded(true)
          initializingRef.current = false // Reset initialization flag

          // Add custom zoom event listeners
          const handleZoomIn = () => {
            if (mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom()
              mapInstanceRef.current.setZoom(currentZoom + 1)
            }
          }

          const handleZoomOut = () => {
            if (mapInstanceRef.current) {
              const currentZoom = mapInstanceRef.current.getZoom()
              mapInstanceRef.current.setZoom(currentZoom - 1)
            }
          }

          const handleResetView = () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([34.0151, 71.5249], 7)
            }
          }

          // Add event listeners for custom zoom controls
          window.addEventListener("mapZoomIn", handleZoomIn)
          window.addEventListener("mapZoomOut", handleZoomOut)
          window.addEventListener("mapResetView", handleResetView)

          console.log("🍃 Leaflet: Map initialized successfully with custom zoom controls")
        }
      } catch (error) {
        console.error("🍃 Leaflet: Error initializing map:", error)
        initializingRef.current = false // Reset initialization flag on error
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        setError(`Failed to initialize map: ${errorMessage}`)
        
        // Clean up on error
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
          } catch (cleanupError) {
            console.warn("🍃 Leaflet: Error during cleanup:", cleanupError)
          }
        }
      }
    }

    initializeMap()

    return () => {
      // Enhanced cleanup to prevent re-initialization errors
      if (mapInstanceRef.current) {
        try {
          console.log('🍃 Leaflet: Cleaning up map instance')
          
          // Clean up custom zoom event listeners
          window.removeEventListener("mapZoomIn", () => {})
          window.removeEventListener("mapZoomOut", () => {})
          window.removeEventListener("mapResetView", () => {})
          
          // Clear all layers first
          Object.values(layerGroupsRef.current).forEach((layerGroup: any) => {
            if (layerGroup && mapInstanceRef.current) {
              try {
                // Clean up patwarkhana zoom event handler if it exists
                if (layerGroup._patwarkhanaZoomHandler) {
                  mapInstanceRef.current.off('zoomend', layerGroup._patwarkhanaZoomHandler)
                  delete layerGroup._patwarkhanaZoomHandler
                }
                mapInstanceRef.current.removeLayer(layerGroup)
              } catch (e) {
                console.warn('🍃 Leaflet: Error removing layer during cleanup:', e)
              }
            }
          })
          layerGroupsRef.current = {}
          
          // Remove the map instance
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          
          // Clear container reference
          if (mapRef.current) {
            (mapRef.current as any)._leaflet_id = undefined;
            mapRef.current.innerHTML = '';
          }
          
          setIsLoaded(false)
          setL(null)
          initializingRef.current = false // Reset initialization flag
          
        } catch (error) {
          console.error('🍃 Leaflet: Error during cleanup:', error)
        }
      }
    }
  }, [])

  // Handle map type changes
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    const map = mapInstanceRef.current
    
    // Remove all existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    // Add new tile layer based on mapType with English labels
    if (mapType === 'satellite') {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
          maxZoom: 18,
        }
      ).addTo(map)
    } else {
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)
    }
  }, [mapType, L])

  // Load layers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !isLoaded) return

    const loadAllLayers = async () => {
      try {
        console.log("🍃 Leaflet: Loading layers, version:", layerVersion)
        
        // Remove all existing feature layers (keep base tiles)
        Object.values(layerGroupsRef.current).forEach((layerGroup: any) => {
          if (layerGroup && mapInstanceRef.current) {
            // Clean up patwarkhana zoom event handler if it exists
            if (layerGroup._patwarkhanaZoomHandler) {
              mapInstanceRef.current.off('zoomend', layerGroup._patwarkhanaZoomHandler)
              delete layerGroup._patwarkhanaZoomHandler
            }
            mapInstanceRef.current.removeLayer(layerGroup)
          }
        })
        layerGroupsRef.current = {}

        // Load active layers
        for (const layer of layers) {
          if (layer.active) {
            await loadLayer(mapInstanceRef.current, L, layer)
          }
        }
      } catch (error) {
        console.error("🍃 Leaflet: Error loading layers:", error)
        setError("Failed to load map layers")
      }
    }

    loadAllLayers()
  }, [layers, layerVersion, L, isLoaded])

  // Handle zoom to bounds requests
  useEffect(() => {
    if (zoomToBoundsRequest && mapInstanceRef.current) {
      // Wrap in try-catch to prevent infinite tile loading errors
      const safeZoomToBounds = async () => {
        try {
          await zoomToLayerBounds(zoomToBoundsRequest.layerId)
        } catch (error) {
          console.error(`Safe zoom to bounds failed for ${zoomToBoundsRequest.layerId}:`, error)
          // Clear the request even if it failed
        } finally {
          clearZoomToBoundsRequest()
        }
      }
      
      safeZoomToBounds()
    }
  }, [zoomToBoundsRequest, clearZoomToBoundsRequest])

  // Function to load a layer
  const loadLayer = async (map: any, L: any, layer: any) => {
    try {
      console.log(`🍃 Leaflet: Loading layer: ${layer.name} from ${layer.geojsonPath}`)
      
      if (!layer.geojsonPath) {
        console.warn(`🍃 Leaflet: No geojsonPath for layer ${layer.id}`)
        return
      }

      // Special handling for state land and state office layers
      if (layer.id === "state-land") {
        await loadStateLandLayer(map, L, layer)
        return
      }

      if (layer.id === "state-office") {
        await loadStateOfficeLayer(map, L, layer)
        return
      }

      if (layer.id === "patwarkhana") {
        await loadPatwarkhanaLayer(map, L, layer)
        return
      }

      // Load regular GeoJSON layers
      const response = await fetch(layer.geojsonPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${layer.name}: ${response.status} ${response.statusText}`)
      }

      const geojsonData = await response.json()
      
      // Create layer group
      const layerGroup = L.layerGroup()
      
      // Create GeoJSON layer with styling (no fill for boundaries)
      const geoJsonLayer = L.geoJSON(geojsonData, {
        style: {
          color: layer.color,
          weight: 2,
          opacity: 1,
          fillOpacity: 0, // No fill for boundary layers
        },
        pointToLayer: (feature: any, latlng: any) => {
          // Custom marker for point data
          if (layer.type === "point") {
            const icon = L.divIcon({
              html: `<div style="background: ${layer.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              className: 'custom-point-marker',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })
            return L.marker(latlng, { icon })
          }
          return L.marker(latlng)
        },
        onEachFeature: (feature: any, featureLayer: any) => {
          // Add popup with feature information
          if (feature.properties) {
            const popupContent = Object.entries(feature.properties)
              .filter(([key, value]) => value && key !== "OBJECTID")
              .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
              .join("<br>")
            
            if (popupContent) {
              featureLayer.bindPopup(`<div style="max-width: 200px;">${popupContent}</div>`)
            }
          }
        }
      })
      
      layerGroup.addLayer(geoJsonLayer)
      layerGroup.addTo(map)
      layerGroupsRef.current[layer.id] = layerGroup
      
      console.log(`🍃 Leaflet: Successfully loaded ${layer.name} with ${geojsonData.features.length} features`)
      
    } catch (error) {
      console.error(`🍃 Leaflet: Error loading layer ${layer.name}:`, error)
    }
  }

  // Function to load state land layer
  const loadStateLandLayer = async (map: any, L: any, layer: any) => {
    try {
      const response = await fetch(layer.geojsonPath)
      if (!response.ok) {
        console.warn(`State land file not found: ${layer.geojsonPath}`)
        return
      }
      
      const geojsonData = await response.json()
      
      // Create layer group
      const layerGroup = L.layerGroup()
      
      // Create state land layer
      const stateLandLayer = L.geoJSON(geojsonData, {
        style: {
          fillColor: "#FFD700",
          weight: 2,
          opacity: 1,
          color: "#FF8C00",
          dashArray: "3",
          fillOpacity: 0.7
        },
        onEachFeature: (feature: any, featureLayer: any) => {
          const props = feature.properties
          const uniqueId = `stateland_${Math.random().toString(36).substr(2, 9)}`
          
          let popupContent = `
            <div style="max-width: 350px;">
              <h4 style="margin: 0 0 8px 0; color: #FF8C00; font-weight: bold;">State Land Information</h4>
              ${props.location ? `<strong>Location:</strong> ${props.location}<br>` : ''}
              ${props.landType ? `<strong>Land Type:</strong> ${props.landType}<br>` : ''}
              ${props.area ? `<strong>Area:</strong> ${convertAreaToKanalsMarlas(props.area)} (${props.area} sq meters)<br>` : ''}
              ${props.status ? `<strong>Status:</strong> ${props.status}<br>` : ''}
              ${props.owner ? `<strong>Owner:</strong> ${props.owner}<br>` : ''}
          `

          // Add fards section if available
          if (props.fards && props.fards.length > 0) {
            popupContent += `
              <div style="margin-top: 10px;">
                <strong>Fards:</strong>
                <button 
                  onclick="window.open('${props.fards[0]}', '_blank')"
                  style="
                    margin-left: 10px;
                    padding: 4px 8px;
                    background: #10B981;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                  "
                >
                  View Document
                </button>
                ${props.fards.length > 1 ? `<span style="margin-left: 8px; font-size: 12px; color: #666;">${props.fards.length - 1} more</span>` : ''}
              </div>
            `
          }

          // Add pictures section if available
          if (props.pictures && props.pictures.length > 0) {
            popupContent += createPhotoGallery(props.pictures, uniqueId)
          }

          popupContent += `</div>`

          featureLayer.bindPopup(popupContent, {
            maxWidth: 400,
            className: 'state-land-popup'
          })

          // Add hover effects
          featureLayer.on('mouseover', (e: any) => {
            const targetLayer = e.target
            targetLayer.setStyle({
              weight: 3,
              color: '#FF4500',
              dashArray: '',
              fillOpacity: 0.9
            })
          })

          featureLayer.on('mouseout', (e: any) => {
            stateLandLayer.resetStyle(e.target)
          })
        }
      })
      
      layerGroup.addLayer(stateLandLayer)
      layerGroup.addTo(map)
      layerGroupsRef.current[layer.id] = layerGroup
      
      console.log(`🍃 Leaflet: Successfully loaded ${geojsonData.features.length} state land features`)
      
    } catch (error) {
      console.error(`🍃 Leaflet: Error loading state land layer:`, error)
    }
  }

  // Function to load state office layer
  const loadStateOfficeLayer = async (map: any, L: any, layer: any) => {
    try {
      const response = await fetch(layer.geojsonPath)
      if (!response.ok) {
        console.warn(`State office file not found: ${layer.geojsonPath}`)
        return
      }
      
      const geojsonData = await response.json()
      
      // Create layer group
      const layerGroup = L.layerGroup()
      
      // Create custom SVG icon for state offices using PMRU GIS Icons
      const createStateOfficeIcon = (isBlinking: boolean = true) => {
        const className = isBlinking ? 'state-office-blink' : 'state-office-static'
        const iconColor = isBlinking ? '#DC2626' : '#FBBF24' // Red for blinking, Yellow for static
        const strokeColor = isBlinking ? '#DC2626' : '#F59E0B' // Darker red/yellow for stroke
        
        const pmruSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 375 375" preserveAspectRatio="xMidYMid meet">
            <circle cx="187.5" cy="187.5" r="187.5" fill="#ffffff" stroke="${strokeColor}" stroke-width="2"/>
            <g transform="scale(0.6) translate(70, 70)">
              <path fill="${iconColor}" d="M 187.5 69.046875 C 172.921875 83.625 88.539062 152.050781 88.539062 152.050781 L 122.527344 152.050781 L 122.527344 225.339844 L 161.492188 225.339844 L 161.492188 186.664062 C 161.527344 172.652344 172.894531 161.3125 186.90625 161.308594 C 200.917969 161.308594 212.285156 172.652344 212.320312 186.664062 L 212.320312 225.339844 L 252.464844 225.339844 L 252.464844 152.050781 L 286.457031 152.050781 C 286.457031 152.050781 203.226562 84.773438 187.5 69.046875 Z M 187.5 69.046875"/>
            </g>
          </svg>
        `
        
        return L.divIcon({
          html: `
            <div class="${className}" style="
              width: 32px;
              height: 32px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${pmruSvg}
            </div>
          `,
          className: 'state-office-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })
      }
      
      // Add CSS for blinking animation if not already present
      if (!document.getElementById('state-office-styles')) {
        const style = document.createElement('style')
        style.id = 'state-office-styles'
        style.textContent = `
          .state-office-blink {
            animation: pmru-blink 2s infinite;
          }
          .state-office-static {
            opacity: 1;
          }
          @keyframes pmru-blink {
            0%, 50% { 
              opacity: 1; 
              transform: scale(1);
            }
            51%, 100% { 
              opacity: 0.4; 
              transform: scale(1.1);
            }
          }
          .state-office-marker {
            filter: drop-shadow(0 2px 4px rgba(0,112,49,0.3));
          }
        `
        document.head.appendChild(style)
      }

      // Create markers for each office
      geojsonData.features.forEach((feature: any, index: number) => {
        if (feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates
          
          // Handle both 2D and 3D coordinates
          const lng = coords[0]
          const lat = coords[1]
          
          // Validate coordinates
          if (typeof lng !== 'number' || typeof lat !== 'number' || 
              isNaN(lng) || isNaN(lat) || 
              lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`🏢 Invalid coordinates for feature ${index + 1}:`, { lng, lat })
            return
          }
          
          const props = feature.properties
          const uniqueId = `stateoffice_${Math.random().toString(36).substr(2, 9)}`
          
          // Check if this point should blink (default to true for backward compatibility)
          const shouldBlink = props.blinking !== false
          const iconForThisMarker = createStateOfficeIcon(shouldBlink)
          
          // Add slight random offset to prevent complete overlap since all points are very close
          const offsetLat = lat + (Math.random() - 0.5) * 0.0001
          const offsetLng = lng + (Math.random() - 0.5) * 0.0001
          
          const marker = L.marker([offsetLat, offsetLng], { icon: iconForThisMarker })
          
          // Create popup content
          let popupContent = `
            <div style="max-width: 400px;">
              <h4 style="margin: 0 0 8px 0; color: #DC2626; font-weight: bold;">State Office Information</h4>
              ${props.Name ? `<strong>Employee Name:</strong> ${props.Name}<br>` : ''}
              ${props.DateTime ? `<strong>Date Recorded:</strong> ${props.DateTime}<br>` : ''}
              ${props.Retirment_ ? `<strong>Retirement Date:</strong> ${props.Retirment_}<br>` : ''}
              ${props.Elevation ? `<strong>Elevation:</strong> ${props.Elevation}m<br>` : ''}
              ${props.OBJECTID ? `<strong>ID:</strong> ${props.OBJECTID}<br>` : ''}
          `

          // Add employee photo if available
          if (props.Attachemen) {
            const imagePath = `/images/${props.Attachemen}`
            // Convert single photo to array for gallery
            const photoArray = [imagePath]
            popupContent += createPhotoGallery(photoArray, uniqueId)
          }

          popupContent += `</div>`

          marker.bindPopup(popupContent, {
            maxWidth: 450,
            className: 'state-office-popup'
          })
          
          layerGroup.addLayer(marker)
        } else {
          console.warn(`🏢 Feature ${index + 1} is not a Point geometry:`, feature.geometry.type)
        }
      })
      
      layerGroup.addTo(map)
      layerGroupsRef.current[layer.id] = layerGroup
      
      console.log(`🍃 Leaflet: Successfully loaded ${geojsonData.features.length} state office features`)
      
    } catch (error) {
      console.error(`🍃 Leaflet: Error loading state office layer:`, error)
    }
  }

  // Function to load patwarkhana layer with professional SVG icons
  const loadPatwarkhanaLayer = async (map: any, L: any, layer: any) => {
    try {
      const response = await fetch(layer.geojsonPath)
      if (!response.ok) {
        console.warn(`Patwarkhana file not found: ${layer.geojsonPath}`)
        return
      }
      
      const geojsonData = await response.json()
      
      // Create layer group
      const layerGroup = L.layerGroup()
      
      // Create professional Patwarkhana icon using 15.svg
      const patwarkhanaIcon = L.icon({
        iconUrl: '/icons/15.svg',
        iconSize: [96, 96], // 2xl size (96px)
        iconAnchor: [48, 96], // Bottom center anchor
        popupAnchor: [0, -96], // Popup opens above the icon
        className: 'patwarkhana-marker-professional'
      })

      // Add CSS for professional patwarkhana markers
      if (!document.getElementById('patwarkhana-professional-styles')) {
        const style = document.createElement('style')
        style.id = 'patwarkhana-professional-styles'
        style.textContent = `
          .patwarkhana-marker-professional {
            transition: all 0.2s ease;
          }
          .patwarkhana-marker-professional:hover {
            transform: scale(1.15);
          }
          .patwarkhana-popup .leaflet-popup-content {
            margin: 12px 16px;
            line-height: 1.4;
            font-family: Arial, sans-serif;
          }
          .patwarkhana-popup .leaflet-popup-content h4 {
            background: linear-gradient(135deg, #146DC4, #0F5AA6);
            color: white;
            padding: 8px 12px;
            margin: -12px -16px 12px -16px;
            border-radius: 4px 4px 0 0;
            font-weight: bold;
            font-size: 14px;
          }
        `
        document.head.appendChild(style)
      }

      // Create markers for each patwarkhana point
      geojsonData.features.forEach((feature: any, index: number) => {
        if (feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates
          
          // Handle both 2D and 3D coordinates
          const lng = coords[0]
          const lat = coords[1]
          
          // Validate coordinates
          if (typeof lng !== 'number' || typeof lat !== 'number' || 
              isNaN(lng) || isNaN(lat) || 
              lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`🏛️ Invalid coordinates for patwarkhana feature ${index + 1}:`, { lng, lat })
            return
          }
          
          const props = feature.properties
          
          // Create marker with professional icon
          const marker = L.marker([lat, lng], { icon: patwarkhanaIcon })
          
          // Create comprehensive popup content with professional styling
          let popupContent = `
            <div style="max-width: 380px; font-family: Arial, sans-serif;">
              <h4>🏛️ Patwarkhana Land Record Office</h4>
          `
          
          // Add main information with proper styling
          if (props.Name_of_Pa) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Patwari:</strong> ${props.Name_of_Pa}</div>`
          }
          if (props.Name_of_Mo) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Moza:</strong> ${props.Name_of_Mo}</div>`
          }
          if (props.District_N) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">District:</strong> ${props.District_N}</div>`
          }
          if (props.Tehsil_Nam) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Tehsil:</strong> ${props.Tehsil_Nam}</div>`
          }
          if (props.Name_of_Bu) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Building:</strong> ${props.Name_of_Bu}</div>`
          }
          
          // Add coordinates and technical details
          if (props.Latitude && props.Longitude) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Coordinates:</strong> ${props.Latitude}, ${props.Longitude}</div>`
          }
          if (props.Rectificat) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Status:</strong> ${props.Rectificat}</div>`
          }
          if (props.S_No) {
            popupContent += `<div style="margin-bottom: 6px;"><strong style="color: #146DC4;">Serial No:</strong> ${props.S_No}</div>`
          }
          
          // Add remarks if available
          if (props.Rmarks_if_) {
            popupContent += `
              <div style="
                margin-top: 10px;
                padding: 8px;
                background: #F0F7FF;
                border-left: 3px solid #146DC4;
                border-radius: 3px;
              ">
                <strong style="color: #146DC4;">Remarks:</strong><br>
                <span style="color: #333; font-size: 13px;">${props.Rmarks_if_}</span>
              </div>
            `
          }

          popupContent += `</div>`

          marker.bindPopup(popupContent, {
            maxWidth: 420,
            className: 'patwarkhana-popup'
          })
          
          layerGroup.addLayer(marker)
        } else {
          console.warn(`🏛️ Feature ${index + 1} is not a Point geometry:`, feature.geometry.type)
        }
      })
      
      layerGroup.addTo(map)
      layerGroupsRef.current[layer.id] = layerGroup
      
      console.log(`🍃 Leaflet: Successfully loaded ${geojsonData.features.length} patwarkhana features with professional styling`)
      
    } catch (error) {
      console.error(`🍃 Leaflet: Error loading patwarkhana layer:`, error)
    }
  }

  // Function to zoom to bounds of a specific layer
  const zoomToLayerBounds = async (layerId: string) => {
    console.log(`SimpleMap: zoomToLayerBounds called for ${layerId}`)

    if (!mapInstanceRef.current) {
      console.warn("SimpleMap: Cannot zoom to bounds - map not initialized")
      return
    }

    const layer = layers.find(l => l.id === layerId)
    if (!layer || !layer.geojsonPath) {
      console.warn(`SimpleMap: Cannot zoom to bounds - layer ${layerId} not found or has no geojsonPath`)
      return
    }

    try {
      console.log(`SimpleMap: Fetching GeoJSON for bounds calculation: ${layer.geojsonPath}`)
      const response = await fetch(layer.geojsonPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${layer.name}: ${response.status} ${response.statusText}`)
      }

      const geojsonData = await response.json()
      const bounds = calculateGeoJSONBounds(geojsonData)

      if (!bounds) {
        console.warn(`SimpleMap: Could not calculate bounds for layer ${layerId}`)
        return
      }

      // Validate bounds to prevent infinite tile loading
      const isValidBounds = (
        !isNaN(bounds.north) && !isNaN(bounds.south) &&
        !isNaN(bounds.east) && !isNaN(bounds.west) &&
        isFinite(bounds.north) && isFinite(bounds.south) &&
        isFinite(bounds.east) && isFinite(bounds.west) &&
        bounds.north > bounds.south &&
        bounds.east !== bounds.west &&
        Math.abs(bounds.north - bounds.south) > 0.0001 && // Minimum height
        Math.abs(bounds.east - bounds.west) > 0.0001 &&   // Minimum width
        bounds.north <= 90 && bounds.south >= -90 &&      // Valid latitude range
        bounds.east <= 180 && bounds.west >= -180         // Valid longitude range
      )

      if (!isValidBounds) {
        console.warn(`SimpleMap: Invalid bounds calculated for layer ${layerId}:`, bounds)
        console.warn(`SimpleMap: Falling back to default Pakistan view`)
        // Fallback to Pakistan/KP region
        mapInstanceRef.current.setView([34.0151, 71.5249], 7)
        return
      }

      const leafletBounds = toLeafletBounds(bounds)
      console.log(`SimpleMap: Zooming to bounds for ${layer.name}:`, leafletBounds)

      // Additional safety check on the leaflet bounds format
      const [[south, west], [north, east]] = leafletBounds
      if (isNaN(south) || isNaN(west) || isNaN(north) || isNaN(east)) {
        console.warn(`SimpleMap: Invalid leaflet bounds format:`, leafletBounds)
        return
      }

      // Use Leaflet fitBounds with additional safety options
      mapInstanceRef.current.fitBounds(leafletBounds, {
        padding: [20, 20],
        maxZoom: 16  // Prevent zooming too close which might cause tile issues
      })

    } catch (error) {
      console.error(`SimpleMap: Error zooming to bounds for ${layerId}:`, error)
      // Fallback to default view on any error
      if (mapInstanceRef.current) {
        console.log(`SimpleMap: Falling back to default view due to error`)
        mapInstanceRef.current.setView([34.0151, 71.5249], 7)
      }
    }
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <div className="text-red-600 text-lg font-semibold mb-2">Map Error</div>
          <div className="text-red-500 mb-4">{error}</div>
          <div className="space-y-2">
            <button 
              onClick={() => {
                setError(null)
                setIsLoaded(false)
                initializingRef.current = false
                if (mapInstanceRef.current) {
                  try {
                    mapInstanceRef.current.remove()
                    mapInstanceRef.current = null
                  } catch (e) {
                    console.warn('Error cleaning up map on retry:', e)
                  }
                }
                // Clear container
                if (mapRef.current) {
                  (mapRef.current as any)._leaflet_id = undefined;
                  mapRef.current.innerHTML = '';
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Retry Map
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ 
          backgroundColor: '#f0f0f0',
          minHeight: '400px'
        }}
      />
      
      {/* Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  )
}