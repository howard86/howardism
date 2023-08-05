"use client"

import "mapbox-gl/dist/mapbox-gl.css"

import mapboxgl from "mapbox-gl"
import { useEffect, useRef } from "react"
import { FaSearchLocation } from "react-icons/fa"

import { env } from "@/config/env.mjs"

const DEFAULT_ZOOM = 8.5
const DEFAULT_CENTER = [121.61268338965431, 24.89844807067884] satisfies mapboxgl.LngLatLike

mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export default function UbikeMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const positionRef = useRef<mapboxgl.LngLatLike>(DEFAULT_CENTER)

  const handleClick = async () => {
    // TODO: call external api & draw a circular layer
    console.log("positionRef.current:>> ", positionRef.current)
  }

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: positionRef.current,
        zoom: DEFAULT_ZOOM,
      })
        .addControl(new mapboxgl.NavigationControl(), "bottom-right")
        .addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: true,
          }),
          "bottom-left",
        )
        .addControl(new mapboxgl.FullscreenControl(), "top-right")

      mapRef.current.on("move", () => {
        if (!mapRef.current) return

        positionRef.current = mapRef.current.getCenter()
      })
    }

    return () => {
      if (!mapRef.current) return

      mapRef.current.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full">
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="mapboxgl-ctrl mapboxgl-ctrl-group">
          <button type="button" onClick={handleClick} aria-label="Locate">
            <FaSearchLocation className="w-4 h-auto mx-auto" />
          </button>
        </div>
      </div>
    </div>
  )
}
