import { env } from "@/config/env.mjs"

export interface NearByApiParam extends ApiParam {
  spatialFilter: string
}

export interface ApiParam {
  select?: string
  filter?: string
  orderBy?: string
  top?: string | number
  skip?: string | number
}

export interface BikeStation {
  StationUID: string
  StationID: string
  AuthorityID: string
  StationName: {
    Zh_tw: string
    En: string
  }
  StationPosition: {
    PositionLon: number
    PositionLat: number
    GeoHash: string
  }
  StationAddress: {
    Zh_tw: string
    En: string
  }
  StopDescription: string
  BikesCapacity: number
  ServiceType: number
  SrcUpdateTime: string
  UpdateTime: string
}

export interface BikeAvailability {
  StationUID: string
  StationID: string
  ServiceStatus: number
  ServiceType: number
  AvailableRentBikes: number
  AvailableReturnBikes: number
  SrcUpdateTime: string
  UpdateTime: string
  AvailableRentBikesDetail: {
    GeneralBikes: number
    ElectricBikes: number
  }
}

let accessToken: string | undefined
let expirationTimestamp: number | undefined

const refreshToken = async () => {
  const response = await fetch(
    `${env.TDX_API_ENDPOINT}/auth/realms/TDXConnect/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.TDX_API_CLIENT_ID,
        client_secret: env.TDX_API_CLIENT_SECRET,
      }),
    },
  )

  if (!response.ok) throw new Error(JSON.stringify(response))

  const json = (await response.json()) as {
    access_token: string
    expires_in: number
    token_type: string
  }

  accessToken = json.access_token
  expirationTimestamp = Date.now() + json.expires_in
}

const tdxFetch = async <T, P extends ApiParam = ApiParam>(path: string, params: P): Promise<T> => {
  if (!accessToken || !expirationTimestamp || expirationTimestamp > Date.now()) {
    await refreshToken()
  }

  const query = new URLSearchParams()

  query.append("$format", "JSON")

  for (const key of Object.keys(params)) {
    query.append(`$${key}`, params[key])
  }

  const response = await fetch(`${env.TDX_API_ENDPOINT}${path}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) throw new Error(JSON.stringify(response))

  return response.json()
}

export const getNearByBikeStations = (param: NearByApiParam) =>
  tdxFetch<BikeStation[]>("/api/advanced/v2/Bike/Station/NearBy", param)

export const getNearByBikesAvailability = (param: NearByApiParam) =>
  tdxFetch<BikeAvailability[]>(`/api/advanced/v2/Bike/Availability/NearBy`, param)
