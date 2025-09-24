"use client"

import { useEffect } from "react"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { MapContainer } from "@/components/MapContainer"
import { useMapStore } from "@/context/mapStore"

export default function Home() {
  const { initializeLayers, isFullscreen, layers } = useMapStore()

  useEffect(() => {
    console.log("🏠 Home: Initializing app")
    console.log("🏠 Home: Current layers before init:", layers.length)
    
    // Try to initialize layers immediately
    initializeLayers()
    console.log("🏠 Home: Called initializeLayers()")
    
    // Check layers after a short delay and retry if needed
    const checkAndRetry = () => {
      const currentLayers = useMapStore.getState().layers
      console.log("🏠 Home: Layers after init attempt:", currentLayers.length)
      
      if (currentLayers.length === 0) {
        console.log("🏠 Home: Layers still empty, retrying initialization...")
        initializeLayers()
      }
    }
    
    setTimeout(checkAndRetry, 200)
    setTimeout(checkAndRetry, 1000) // Second retry after 1 second
    
  }, [initializeLayers])



  return (
    <div className="min-h-screen">
      <div className="flex flex-col h-screen bg-background text-foreground">
        {/* Hide Header in fullscreen mode */}
        {!isFullscreen && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {/* Hide Sidebar in fullscreen mode */}
          {!isFullscreen && <Sidebar />}
          <MapContainer />
        </div>
      </div>
    </div>
  )
}
