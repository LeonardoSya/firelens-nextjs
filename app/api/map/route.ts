import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { type FeatureCollection } from 'map-types'

export async function GET(request: Request) {
  try {
    const queryParams = new URLSearchParams(new URL(request.url).search)
    const minLat = parseFloat(queryParams.get('minLat')) ?? -90
    const maxLat = parseFloat(queryParams.get('maxLat')) ?? 90
    const minLon = parseFloat(queryParams.get('minLon')) ?? -180
    const maxLon = parseFloat(queryParams.get('maxLon')) ?? 180

    const query = sql`
      select * from fire_points
      where bright_ti4 >= (select percentile_disc(0.7) within group(order by bright_ti4) from fire_points)
      and fire_points.ndvi between 3000 and 10000
      and latitude >= ${minLat} and latitude <= ${maxLat} and longitude >= ${minLon} and longitude <= ${maxLon}
    `

    const resData = await query

    const resGeoJSON: FeatureCollection = {
      type: 'FeatureCollection',
      features: resData.rows.map(row => ({
        id: Number(row.id),
        type: 'Feature',
        geometry: {
          type: 'Point',
          geodesic: true,
          coordinates: [Number(row.longitude), Number(row.latitude)],
        },
        properties: {
          bright_ti4: Number(row.bright_ti4),
          scan: Number(row.scan),
          track: Number(row.track),
          acq_date: row.acq_date,
          acq_time: row.acq_time,
          satellite: row.satellite,
          confidence: row.confidence,
          version: row.version,
          bright_ti5: Number(row.bright_ti5),
          frp: Number(row.frp),
          daynight: row.daynight,
          ndvi: Number(row.ndvi),
        },
      })),
    }

    return NextResponse.json(resGeoJSON)
  } catch (error) {
    console.error('Error fetching fire_points data: ', error)
    return NextResponse.json({ error: (error as Error).message || 'Server Error' }, { status: 500 })
  }
}
