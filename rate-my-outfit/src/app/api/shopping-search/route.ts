import { NextResponse } from "next/server";

interface ShoppingItem {
  title: string;
  price: string;
  seller: string;
  link: string;
  image_url: string;
}

export async function POST(req: Request) {
  try {
    const { searchQuery } = await req.json();
    console.log('Sending search query:', searchQuery);
    
    // Call Python service with updated port
    const response = await fetch('http://127.0.0.1:5001/search', {  // Updated URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });

    // First get the response as text
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse it as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      return NextResponse.json({ 
        error: 'Invalid response from server',
        results: [] 
      }, { status: 500 });
    }

    if (!response.ok) {
      throw new Error(data.error || 'Shopping search failed');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Shopping search error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch shopping results',
      results: [] 
    }, { status: 500 });
  }
} 