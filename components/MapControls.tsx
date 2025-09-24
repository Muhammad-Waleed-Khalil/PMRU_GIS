"use client"

import { Map, Satellite, RotateCcw, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMapStore } from "@/context/mapStore"
import { FullscreenToggle } from "@/components/FullscreenToggle"

export function MapControls() {
  const { mapType, setMapType } = useMapStore()

  const handleZoomIn = () => {
    try {
      const event = new CustomEvent("mapZoomIn")
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Zoom in error:", error)
    }
  }

  const handleZoomOut = () => {
    try {
      const event = new CustomEvent("mapZoomOut")
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Zoom out error:", error)
    }
  }

  const handleResetView = () => {
    try {
      const event = new CustomEvent("mapResetView")
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Reset view error:", error)
    }
  }

  const handleMapTypeChange = (type: "default" | "satellite") => {
    try {
      setMapType(type)
    } catch (error) {
      console.error("Map type change error:", error)
    }
  }

  return (
    <TooltipProvider>
      {/* Map Type Toggle - Right next to left sidebar */}
      <div className="absolute left-4 top-4 z-50 space-y-2">
        <div className="map-control-group flex rounded-md overflow-hidden border border-gray-200 bg-white shadow-md relative z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mapType === "default" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMapTypeChange("default")}
                className={`rounded-none border-r flex-1 h-full w-full ${
                  mapType === "default"
                    ? "bg-[#4285F4] hover:bg-[#3367D6] text-white border-[#4285F4] shadow-sm !m-0 !p-2"
                    : "hover:bg-gray-100 hover:text-gray-900 !m-0 !p-2"
                }`}
              >
                <Map className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Default Map View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mapType === "satellite" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMapTypeChange("satellite")}
                className={`rounded-none rounded-r-md flex-1 h-full w-full ${
                  mapType === "satellite"
                    ? "bg-[#4285F4] hover:bg-[#3367D6] text-white border-[#4285F4] shadow-sm !border-r-[#4285F4] !m-0 !p-2"
                    : "hover:bg-gray-100 hover:text-gray-900 !m-0 !p-2"
                }`}
              >
                <Satellite className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Satellite View</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Zoom Controls and Fullscreen - Right side */}
      <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2">
        {/* Fullscreen Toggle */}
        <FullscreenToggle className="rounded-full h-8 w-8" />
        
        {/* Zoom In */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomIn} 
              className="rounded-full h-8 w-8 bg-white shadow-md border hover:bg-gray-50 flex items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom In</TooltipContent>
        </Tooltip>

        {/* Zoom Out */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomOut} 
              className="rounded-full h-8 w-8 bg-white shadow-md border hover:bg-gray-50 flex items-center justify-center"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom Out</TooltipContent>
        </Tooltip>

        {/* Reset View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleResetView} 
              className="bg-white shadow-md rounded-full h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset Map View</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
