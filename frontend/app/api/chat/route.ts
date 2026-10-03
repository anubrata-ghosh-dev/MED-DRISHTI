import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Chat API Proxy Error]', response.status, errorText);
      return NextResponse.json(
        { reply: 'Chat service is currently unavailable. Please try again.', language: body.language ?? 'en' },
        { status: 200 } // Return 200 so frontend handles gracefully
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Chat API Proxy Exception]', err);
    return NextResponse.json(
      { reply: 'Unable to connect to chat service. Please check your connection.', language: 'en' },
      { status: 200 }
    );
  }
}
