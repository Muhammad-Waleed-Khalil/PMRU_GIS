"use client"

import { useEffect, useRef } from "react"

export interface StateOfficeFeature {
  id: string
  type: "Feature"
  geometry: {
    type: "Point" | "Polygon"
    coordinates: number[] | number[][][] 
  }
  properties: {
    // Properties for state offices
    [key: string]: any
    officeName?: string
    officeType?: string
    department?: string
    address?: string
    contactNumber?: string
    email?: string
    workingHours?: string
    services?: string[]
    inCharge?: string
    pictures?: string[] // Array of office picture URLs
    documents?: string[] // Array of related documents
  }
}

export interface StateOfficeLayerProps {
  map: any
  L: any
  features: StateOfficeFeature[]
  onFeatureClick?: (feature: StateOfficeFeature) => void
}

export function StateOfficeLayer({ map, L, features, onFeatureClick }: StateOfficeLayerProps) {
  const layerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !L || !features) return

    // Remove existing layer if it exists
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Create custom icon for state offices
    const stateOfficeIcon = L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: #DC2626;
          border-radius: 8px;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="white">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              <path d="M12 8v8M8 12h8" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round"/>
            </g>
          </svg>
        </div>
      `,
      className: 'state-office-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    })

    // Create GeoJSON layer for state offices
    const stateOfficeLayer = L.geoJSON(
      {
        type: "FeatureCollection",
        features: features
      },
      {
        pointToLayer: (feature: any, latlng: any) => {
          return L.marker(latlng, { icon: stateOfficeIcon })
        },
        style: (feature: any) => {
          // For polygon features (office buildings)
          if (feature.geometry.type === "Polygon") {
            return {
              fillColor: "#DC2626", // Red color for state offices
              weight: 2,
              opacity: 1,
              color: "#B91C1C", // Darker red border
              fillOpacity: 0.6
            }
          }
          return {}
        },
        onEachFeature: (feature: any, layer: any) => {
          // Create popup content with office information
          const props = feature.properties
          let popupContent = `
            <div style="max-width: 350px;">
              <h4 style="margin: 0 0 8px 0; color: #DC2626; font-weight: bold;">State Office Information</h4>
              ${props.officeName ? `<strong>Office Name:</strong> ${props.officeName}<br>` : ''}
              ${props.officeType ? `<strong>Office Type:</strong> ${props.officeType}<br>` : ''}
              ${props.department ? `<strong>Department:</strong> ${props.department}<br>` : ''}
              ${props.address ? `<strong>Address:</strong> ${props.address}<br>` : ''}
              ${props.contactNumber ? `<strong>Contact:</strong> ${props.contactNumber}<br>` : ''}
              ${props.email ? `<strong>Email:</strong> <a href="mailto:${props.email}" style="color: #007cba;">${props.email}</a><br>` : ''}
              ${props.workingHours ? `<strong>Working Hours:</strong> ${props.workingHours}<br>` : ''}
              ${props.inCharge ? `<strong>In Charge:</strong> ${props.inCharge}<br>` : ''}
          `

          // Add services section if available
          if (props.services && props.services.length > 0) {
            popupContent += `
              <div style="margin-top: 10px;">
                <strong>Services Provided:</strong><br>
                <ul style="margin: 5px 0; padding-left: 20px;">
            `
            props.services.forEach((service: string) => {
              popupContent += `<li>${service}</li>`
            })
            popupContent += `</ul></div>`
          }

          // Add documents section if available
          if (props.documents && props.documents.length > 0) {
            popupContent += `
              <div style="margin-top: 10px;">
                <strong>Related Documents:</strong><br>
                <ul style="margin: 5px 0; padding-left: 20px;">
            `
            props.documents.forEach((document: string) => {
              popupContent += `<li><a href="${document}" target="_blank" rel="noopener noreferrer" style="color: #007cba; text-decoration: underline;">View Document</a></li>`
            })
            popupContent += `</ul></div>`
          }

          // Add pictures section if available
          if (props.pictures && props.pictures.length > 0) {
            popupContent += `
              <div style="margin-top: 10px;">
                <strong>Office Pictures:</strong><br>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
            `
            props.pictures.forEach((picture: string, index: number) => {
              popupContent += `
                <img 
                  src="${picture}" 
                  alt="Office Picture ${index + 1}" 
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
            className: 'state-office-popup'
          })

          // Add click handler
          layer.on('click', (e: any) => {
            if (onFeatureClick) {
              onFeatureClick(feature)
            }
          })

          // Add hover effects for polygons
          if (feature.geometry.type === "Polygon") {
            layer.on('mouseover', (e: any) => {
              const targetLayer = e.target
              targetLayer.setStyle({
                weight: 3,
                color: '#991B1B',
                fillOpacity: 0.8
              })
            })

            layer.on('mouseout', (e: any) => {
              stateOfficeLayer.resetStyle(e.target)
            })
          }
        }
      }
    )

    // Add to map
    stateOfficeLayer.addTo(map)
    layerRef.current = stateOfficeLayer

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, L, features, onFeatureClick])

  return null // This is a layer component, no visual rendering
}

// Helper function to create state office layer from GeoJSON data
export function createStateOfficeLayer(map: any, L: any, geojsonData: any, onFeatureClick?: (feature: StateOfficeFeature) => void) {
  if (!map || !L || !geojsonData) return null

  const features = geojsonData.features || []
  
  return new Promise((resolve) => {
    // Create custom icon for state offices
    const stateOfficeIcon = L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: #DC2626;
          border-radius: 8px;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="white">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              <path d="M12 8v8M8 12h8" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round"/>
            </g>
          </svg>
        </div>
      `,
      className: 'state-office-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    })

    // This mimics the component behavior in a function
    const stateOfficeLayer = L.geoJSON(geojsonData, {
      pointToLayer: (feature: any, latlng: any) => {
        return L.marker(latlng, { icon: stateOfficeIcon })
      },
      style: (feature: any) => {
        // For polygon features (office buildings)
        if (feature.geometry.type === "Polygon") {
          return {
            fillColor: "#DC2626", // Red color for state offices
            weight: 2,
            opacity: 1,
            color: "#B91C1C", // Darker red border
            fillOpacity: 0.6
          }
        }
        return {}
      },
      onEachFeature: (feature: any, layer: any) => {
        // Create popup content with office information
        const props = feature.properties
        let popupContent = `
          <div style="max-width: 350px;">
            <h4 style="margin: 0 0 8px 0; color: #DC2626; font-weight: bold;">State Office Information</h4>
            ${props.officeName ? `<strong>Office Name:</strong> ${props.officeName}<br>` : ''}
            ${props.officeType ? `<strong>Office Type:</strong> ${props.officeType}<br>` : ''}
            ${props.department ? `<strong>Department:</strong> ${props.department}<br>` : ''}
            ${props.address ? `<strong>Address:</strong> ${props.address}<br>` : ''}
            ${props.contactNumber ? `<strong>Contact:</strong> ${props.contactNumber}<br>` : ''}
            ${props.email ? `<strong>Email:</strong> <a href="mailto:${props.email}" style="color: #007cba;">${props.email}</a><br>` : ''}
            ${props.workingHours ? `<strong>Working Hours:</strong> ${props.workingHours}<br>` : ''}
            ${props.inCharge ? `<strong>In Charge:</strong> ${props.inCharge}<br>` : ''}
        `

        // Add services section if available
        if (props.services && props.services.length > 0) {
          popupContent += `
            <div style="margin-top: 10px;">
              <strong>Services Provided:</strong><br>
              <ul style="margin: 5px 0; padding-left: 20px;">
          `
          props.services.forEach((service: string) => {
            popupContent += `<li>${service}</li>`
          })
          popupContent += `</ul></div>`
        }

        // Add documents section if available
        if (props.documents && props.documents.length > 0) {
          popupContent += `
            <div style="margin-top: 10px;">
              <strong>Related Documents:</strong><br>
              <ul style="margin: 5px 0; padding-left: 20px;">
          `
          props.documents.forEach((document: string) => {
            popupContent += `<li><a href="${document}" target="_blank" rel="noopener noreferrer" style="color: #007cba; text-decoration: underline;">View Document</a></li>`
          })
          popupContent += `</ul></div>`
        }

        // Add pictures section if available
        if (props.pictures && props.pictures.length > 0) {
          popupContent += `
            <div style="margin-top: 10px;">
              <strong>Office Pictures:</strong><br>
              <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
          `
          props.pictures.forEach((picture: string, index: number) => {
            popupContent += `
              <img 
                src="${picture}" 
                alt="Office Picture ${index + 1}" 
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
          className: 'state-office-popup'
        })

        // Add click handler
        layer.on('click', (e: any) => {
          if (onFeatureClick) {
            onFeatureClick(feature)
          }
        })

        // Add hover effects for polygons
        if (feature.geometry.type === "Polygon") {
          layer.on('mouseover', (e: any) => {
            const targetLayer = e.target
            targetLayer.setStyle({
              weight: 3,
              color: '#991B1B',
              fillOpacity: 0.8
            })
          })

          layer.on('mouseout', (e: any) => {
            stateOfficeLayer.resetStyle(e.target)
          })
        }
      }
    })

    stateOfficeLayer.addTo(map)
    resolve(stateOfficeLayer)
  })
}