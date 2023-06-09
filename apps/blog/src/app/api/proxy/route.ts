import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const urlSchema = z.string().url()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) return NextResponse.json({ message: "Missing url parameter" }, { status: 400 })

  const result = urlSchema.safeParse(url)

  if (!result.success)
    return NextResponse.json({ message: "Invalid url parameter" }, { status: 400 })

  const response = await fetch(url)

  if (!response.ok)
    return NextResponse.json({ message: response.statusText }, { status: response.status })

  const html = await response.text()

  return NextResponse.json({ data: html })
}
