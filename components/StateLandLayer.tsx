"use client"

import { useEffect, useRef } from "react"

export interface StateLandFeature {
  id: string
  type: "Feature"
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
  properties: {
    // Properties will be defined based on your data file
    [key: string]: any
    fards?: string[] // Array of fard documents
    pictures?: string[] // Array of picture URLs
    landType?: string
    area?: number
    status?: string
    owner?: string
    location?: string
  }
}

export interface StateLandLayerProps {
  map: any
  L: any
  features: StateLandFeature[]
  onFeatureClick?: (feature: StateLandFeature) => void
}

export function StateLandLayer({ map, L, features, onFeatureClick }: StateLandLayerProps) {
  const layerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !L || !features) return

    // Remove existing layer if it exists
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Create GeoJSON layer for state land
    const stateLandLayer = L.geoJSON(
      {
        type: "FeatureCollection",
        features: features
      },
      {
        style: (feature: any) => ({
          fillColor: "#FFD700", // Gold color for state land
          weight: 2,
          opacity: 1,
          color: "#FF8C00", // Orange border
          dashArray: "3",
          fillOpacity: 0.7
        }),
        onEachFeature: (feature: any, layer: any) => {
          // Create popup content with fards and pictures
          const props = feature.properties
          let popupContent = `
            <div style="max-width: 350px;">
              <h4 style="margin: 0 0 8px 0; color: #FF8C00; font-weight: bold;">State Land Information</h4>
              ${props.location ? `<strong>Location:</strong> ${props.location}<br>` : ''}
              ${props.landType ? `<strong>Land Type:</strong> ${props.landType}<br>` : ''}
              ${props.area ? `<strong>Area:</strong> ${props.area} sq meters<br>` : ''}
              ${props.status ? `<strong>Status:</strong> ${props.status}<br>` : ''}
              ${props.owner ? `<strong>Owner:</strong> ${props.owner}<br>` : ''}
          `

          // Add fards section if available
          if (props.fards && props.fards.length > 0) {
            popupContent += `
              <div style="margin-top: 10px;">
                <strong>Fards (Land Records):</strong><br>
                <ul style="margin: 5px 0; padding-left: 20px;">
            `
            props.fards.forEach((fard: string) => {
              popupContent += `<li><a href="${fard}" target="_blank" rel="noopener noreferrer" style="color: #007cba; text-decoration: underline;">View Fard Document</a></li>`
            })
            popupContent += `</ul></div>`
          }

          // Add pictures section if available
          if (props.pictures && props.pictures.length > 0) {
            popupContent += `
              <div style="margin-top: 10px;">
                <strong>Pictures:</strong><br>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
            `
            props.pictures.forEach((picture: string, index: number) => {
              popupContent += `
                <img 
                  src="${picture}" 
                  alt="Land Picture ${index + 1}" 
                  style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;"
                  onclick="window.open('${picture}', '_blank')"
                  title="Click to view full size"
                />
              `
            })
            popupContent += `</div></div>`
          }

          popupContent += `</div>`

          layer.bindPopup(popupContent, {
            maxWidth: 400,
            className: 'state-land-popup'
          })

          // Add click handler
          layer.on('click', (e: any) => {
            if (onFeatureClick) {
              onFeatureClick(feature)
            }
          })

          // Add hover effects
          layer.on('mouseover', (e: any) => {
            const targetLayer = e.target
            targetLayer.setStyle({
              weight: 3,
              color: '#FF4500',
              dashArray: '',
              fillOpacity: 0.9
            })
          })

          layer.on('mouseout', (e: any) => {
            stateLandLayer.resetStyle(e.target)
          })
        }
      }
    )

    // Add to map
    stateLandLayer.addTo(map)
    layerRef.current = stateLandLayer

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, L, features, onFeatureClick])

  return null // This is a layer component, no visual rendering
}

// Helper function to create state land layer from GeoJSON data
export function createStateLandLayer(map: any, L: any, geojsonData: any, onFeatureClick?: (feature: StateLandFeature) => void) {
  if (!map || !L || !geojsonData) return null

  const features = geojsonData.features || []
  
  return new Promise((resolve) => {
    // This mimics the component behavior in a function
    const stateLandLayer = L.geoJSON(geojsonData, {
      style: () => ({
        fillColor: "#FFD700", // Gold color for state land
        weight: 2,
        opacity: 1,
        color: "#FF8C00", // Orange border
        dashArray: "3",
        fillOpacity: 0.7
      }),
      onEachFeature: (feature: any, layer: any) => {
        // Create popup content with fards and pictures
        const props = feature.properties
        let popupContent = `
          <div style="max-width: 350px;">
            <h4 style="margin: 0 0 8px 0; color: #FF8C00; font-weight: bold;">State Land Information</h4>
            ${props.location ? `<strong>Location:</strong> ${props.location}<br>` : ''}
            ${props.landType ? `<strong>Land Type:</strong> ${props.landType}<br>` : ''}
            ${props.area ? `<strong>Area:</strong> ${props.area} sq meters<br>` : ''}
            ${props.status ? `<strong>Status:</strong> ${props.status}<br>` : ''}
            ${props.owner ? `<strong>Owner:</strong> ${props.owner}<br>` : ''}
        `

        // Add fards section if available
        if (props.fards && props.fards.length > 0) {
          popupContent += `
            <div style="margin-top: 10px;">
              <strong>Fards (Land Records):</strong><br>
              <ul style="margin: 5px 0; padding-left: 20px;">
          `
          props.fards.forEach((fard: string) => {
            popupContent += `<li><a href="${fard}" target="_blank" rel="noopener noreferrer" style="color: #007cba; text-decoration: underline;">View Fard Document</a></li>`
          })
          popupContent += `</ul></div>`
        }

        // Add pictures section if available
        if (props.pictures && props.pictures.length > 0) {
          popupContent += `
            <div style="margin-top: 10px;">
              <strong>Pictures:</strong><br>
              <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
          `
          props.pictures.forEach((picture: string, index: number) => {
            popupContent += `
              <img 
                src="${picture}" 
                alt="Land Picture ${index + 1}" 
                style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;"
                onclick="window.open('${picture}', '_blank')"
                title="Click to view full size"
              />
            `
          })
          popupContent += `</div></div>`
        }

        popupContent += `</div>`

        layer.bindPopup(popupContent, {
          maxWidth: 400,
          className: 'state-land-popup'
        })

        // Add click handler
        layer.on('click', (e: any) => {
          if (onFeatureClick) {
            onFeatureClick(feature)
          }
        })

        // Add hover effects
        layer.on('mouseover', (e: any) => {
          const targetLayer = e.target
          targetLayer.setStyle({
            weight: 3,
            color: '#FF4500',
            dashArray: '',
            fillOpacity: 0.9
          })
        })

        layer.on('mouseout', (e: any) => {
          stateLandLayer.resetStyle(e.target)
        })
      }
    })

    stateLandLayer.addTo(map)
    resolve(stateLandLayer)
  })
}