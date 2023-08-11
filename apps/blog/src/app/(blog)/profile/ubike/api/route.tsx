import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getNearByBikesAvailability, getNearByBikeStations, NearByApiParam } from "./tdx-service"

const fetchStationSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  r: z.coerce.number().gte(500).lte(1000),
})

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

  // TODO: merge stations & bikes

  return NextResponse.json({
    stations,
    bikes,
  })
}
