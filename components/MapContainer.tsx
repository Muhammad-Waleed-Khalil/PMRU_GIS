"use client"

import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { MapControls } from "./MapControls"
import { useMapStore } from "../context/mapStore"

// Dynamically import the Leaflet map component
const DynamicLeafletMap = dynamic(() => import("./SimpleMapNew"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
})

export function MapContainer() {
  const { isCollapsed, isFullscreen, forceLayerUpdate } = useMapStore()

  // Force layer update when component mounts to ensure synchronization
  useEffect(() => {
    console.log(`📦 MapContainer: Initializing Leaflet map`)
    
    // Conservative synchronization approach to prevent race conditions
    const timeouts = [
      setTimeout(() => {
        console.log(`📦 MapContainer: Forcing layer update (initial)`)
        forceLayerUpdate()
      }, 150), // Increased initial delay to let map fully initialize
      setTimeout(() => {
        console.log(`📦 MapContainer: Forcing layer update (final)`)
        forceLayerUpdate()
      }, 800) // Single follow-up after a longer delay
    ]

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [forceLayerUpdate])

  return (
    <motion.div
      className={`flex-1 relative bg-white ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
      style={
        isFullscreen
          ? {
              width: "100vw",
              height: "100vh",
              marginTop: 0,
              marginLeft: 0,
            }
          : {
              marginTop: "88px",
              height: "calc(100vh - 88px)",
            }
      }
      animate={
        isFullscreen
          ? {}
          : {
              marginLeft: isCollapsed ? "64px" : "320px",
            }
      }
      transition={{ duration: 0.3 }}
    >
      {/* Map Controls - Keep visible in fullscreen */}
      <MapControls />

      {/* Map */}
      <div className="w-full h-full">
        <DynamicLeafletMap />
      </div>
    </motion.div>
  )
}
