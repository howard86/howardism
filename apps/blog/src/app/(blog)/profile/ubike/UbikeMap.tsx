"use client"

import "mapbox-gl/dist/mapbox-gl.css"

import circle from "@turf/circle"
import mapboxgl from "mapbox-gl"
import { useEffect, useRef } from "react"
import { FaSearchLocation } from "react-icons/fa"

import { env } from "@/config/env.mjs"

import type { NormalizedMergedBikeStation } from "./api/route"

type LngLat = { lng: number; lat: number }

const DEFAULT_WIDE_ZOOM = 8.5
const DEFAULT_SEARCH_ZOOM = 15
const DEFAULT_CENTER: LngLat = {
  lat: 25.036090392183638,
  lng: 121.56217868623094,
}

const DEFAULT_RADIUS = 500

mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

const getDigit = (magnitude: number) => magnitude.toFixed(6)

export default function UbikeMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const positionRef = useRef<LngLat>(DEFAULT_CENTER)
  const markersRef = useRef<NodeJS.Dict<mapboxgl.Marker>>({})
  const layerRef = useRef<mapboxgl.FillLayer | null>(null)

  const handleSearch = async () => {
    if (!mapRef.current) return

    if (mapRef.current.getZoom() < DEFAULT_SEARCH_ZOOM) {
      mapRef.current.zoomTo(DEFAULT_SEARCH_ZOOM)
    }

    const response = await fetch(
      `/profile/ubike/api?lat=${getDigit(positionRef.current.lat)}&lng=${getDigit(
        positionRef.current.lng,
      )}&r=${DEFAULT_RADIUS}`,
    )

    if (!response.ok) return

    const json = (await response.json()) as NormalizedMergedBikeStation

    if (layerRef.current) {
      mapRef.current.removeLayer(layerRef.current.id)
    }

    layerRef.current = {
      id: Date.now().toString(),
      type: "fill",
      source: {
        type: "geojson",
        data: circle([positionRef.current.lng, positionRef.current.lat], DEFAULT_RADIUS, {
          units: "meters",
        }),
      },
      paint: {
        "fill-color": "#FF0000",
        "fill-opacity": 0.1,
      },
    }

    mapRef.current.addLayer(layerRef.current)

    for (const id of json.ids) {
      const station = json.entities[id]

      if (station && !markersRef.current[id]) {
        const popup = new mapboxgl.Popup({
          closeOnMove: true,
        }).setHTML(
          `
          <div>
            <h2 class="font-semibold">${station.name}</h2>
            <p>可租借: ${station.availableRentBikes}台</p>
            <p>可歸還: ${station.availableRentBikes}台</p>
          </div>
        `,
        )

        const marker = new mapboxgl.Marker({
          color: "#FF0000",
        })
          .setLngLat({
            lng: station.lng,
            lat: station.lat,
          })
          .setPopup(popup)
          .addTo(mapRef.current)

        markersRef.current[id] = marker
      }
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: positionRef.current,
      attributionControl: false,
      zoom: DEFAULT_WIDE_ZOOM,
      logoPosition: "top-left",
    })
      .addControl(
        new mapboxgl.AttributionControl({
          compact: true,
        }),
        "bottom-left",
      )
      .addControl(new mapboxgl.NavigationControl(), "bottom-right")
      .addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
            maximumAge: 0,
          },
          trackUserLocation: true,
          showAccuracyCircle: true,
        }),
        "bottom-right",
      )
      .addControl(new mapboxgl.FullscreenControl(), "top-right")

    const handleMove = () => {
      if (!mapRef.current) return

      positionRef.current = mapRef.current.getCenter()
    }

    mapRef.current.on("moveend", handleMove)

    // eslint-disable-next-line consistent-return
    return () => {
      if (!mapRef.current) return

      mapRef.current.off("moveend", handleMove)

      // eslint-disable-next-line react-hooks/exhaustive-deps
      const markeyKeys = Object.keys(markersRef.current)

      for (const key of markeyKeys) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const entity = markersRef.current[key]

        if (entity) entity.remove()
      }

      mapRef.current.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full">
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="mapboxgl-ctrl mapboxgl-ctrl-group">
          <button aria-label="Locate" type="button" onClick={handleSearch} title="Locate">
            <FaSearchLocation className="w-4 h-auto mx-auto" />
          </button>
        </div>
      </div>
    </div>
  )
}
