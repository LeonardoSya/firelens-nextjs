import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.DB_PG_USER,
  host: process.env.DB_PG_HOST,
  database: process.env.DB_PG_NAME,
  password: process.env.DB_PG_PASSWORD,
  port: parseInt(process.env.DB_PG_PORT || '5432'),
})

export async function GET() {
  try {
    const client = await pool.connect() // 从pg连接池中获取一个可用的数据库连接，之后使用这个连接进行查询操作
    const result = await client.query('SELECT longitude, latitude, ndvi FROM beijing_ndvi')
    client.release() // 将连接释放回连接池。允许其他请求重用这个连接，也防止连接池耗尽（泄漏）

    const data = result.rows.map(row => ({
      longitude: parseFloat(row.longitude),
      latitude: parseFloat(row.latitude),
      ndvi: parseFloat(row.ndvi),
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching ndvi data: ', error)
    return NextResponse.json({ error: (error as Error).message || 'Server Error' }, { status: 500 })
  }
}
