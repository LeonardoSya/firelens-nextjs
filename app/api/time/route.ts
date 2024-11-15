import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const result = await sql`
      select acq_date, acq_time, bright_ti4, count(*) as count from fire_points
      where bright_ti4 > 340 and frp > 100
      group by acq_date, acq_time, bright_ti4
      order by acq_date ASC, acq_time ASC
    `

    const data = result.rows.map(row => {
      const date = new Date(row.acq_date)
      const timeStr = row.acq_time.padStart(4, '0')
      const hours = parseInt(timeStr.slice(0, 2))
      const minutes = parseInt(timeStr.slice(2))
      date.setUTCHours(hours, minutes)

      return {
        datetime: date.toISOString(),
        bright: parseFloat(row.bright_ti4),
        count: parseInt(row.count),
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetchingtime series data:', error)
    return NextResponse.json({ error: (error as Error).message || 'Server Error' }, { status: 500 })
  }
}
