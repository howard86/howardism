import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import type { Normalized } from "@/utils/array"

import {
  BikeAvailability,
  BikeStation,
  getNearByBikesAvailability,
  getNearByBikeStations,
  NearByApiParam,
} from "./tdx-service"

const fetchStationSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  r: z.coerce.number().gte(0).lte(1000),
})

export type MergedBikeStation = {
  id: string
  name: string
  lat: number
  lng: number
  availableRentBikes: number
  availableReturnBikes: number
  // TODO: add distance by calculating from lat & lng
}

const mapBikeStation = (station: BikeStation, bike: BikeAvailability): MergedBikeStation => {
  const [prefix, name] = station.StationName.Zh_tw.split("_")

  return {
    id: station.StationUID,
    name: name || prefix,
    lat: station.StationPosition.PositionLat,
    lng: station.StationPosition.PositionLon,
    availableRentBikes: bike.AvailableRentBikes,
    availableReturnBikes: bike.AvailableReturnBikes,
  }
}

export type NormalizedMergedBikeStation = Normalized<MergedBikeStation>

// TODO: add auth
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const result = fetchStationSchema.safeParse({
    lat: searchParams.get("lat") ?? Number.NaN,
    lng: searchParams.get("lng") ?? Number.NaN,
    r: searchParams.get("r") ?? Number.NaN,
  })

  if (!result.success) return NextResponse.json(result.error, { status: 400 })

  const param = {
    top: 30,
    spatialFilter: `nearby(${result.data.lat}, ${result.data.lng}, ${result.data.r})`,
  } satisfies NearByApiParam

  const [stations, bikes] = await Promise.all([
    getNearByBikeStations(param),
    getNearByBikesAvailability(param),
  ])

  console.debug("stations:>> ", stations, "bikes:>> ", bikes)

  const bikeDict: NodeJS.Dict<BikeAvailability> = {}

  for (const bike of bikes) {
    bikeDict[bike.StationUID] = bike
  }

  const normalizedStations: NormalizedMergedBikeStation = { ids: [], entities: {} }

  for (const station of stations) {
    const bike = bikeDict[station.StationUID]

    if (bike?.ServiceStatus === 1) {
      normalizedStations.ids.push(station.StationUID)

      normalizedStations.entities[station.StationUID] = mapBikeStation(station, bike)
    }
  }

  return NextResponse.json(normalizedStations)
}
