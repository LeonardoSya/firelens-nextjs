import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
const apiKey = 'app-67DemuMbWorrw4L4CUo42IxP'
const DIFY_API_URL = 'https://api.dify.ai/v1/workflows/run'

export async function POST(req: NextRequest) {
  try {
    const { query, user } = await req.json()
    if (!query) {
      return NextResponse.json({ error: '对话内容不能为空～' }, { status: 400 })
    }

    const payload = {
      inputs: {
        user_input: query,
      },
      user: user,
      response_mode: 'streaming',
    }

    const difyRes = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    console.log('--- Received from Dify API ---')
    console.log('Status:', difyRes.status, difyRes.statusText)

    if (!difyRes.ok) {
      const errText = await difyRes.text()
      console.error('Dify API Error:', errText)
      return new NextRequest(errText, { status: difyRes.status })
    }

    return new Response(difyRes.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('--- Error in API Route ---')
    console.error(err)
    return NextResponse.json({ error: 'Error in Dify API route' }, { status: 500 })
  }
}
