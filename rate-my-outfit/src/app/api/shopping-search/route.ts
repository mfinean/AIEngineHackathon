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
    
    // Using SerpApi's Google Shopping Search
    const response = await fetch(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(searchQuery)}&location=United Kingdom&api_key=${process.env.SERPAPI_KEY}`);
    
    if (!response.ok) {
      throw new Error('Shopping API request failed');
    }

    const data = await response.json();
    
    const results: ShoppingItem[] = data.shopping_results?.map((item: any) => ({
      title: item.title,
      price: item.price,
      seller: item.seller || 'Various Sellers',
      link: item.link,
      image_url: item.thumbnail
    })) || [];

    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error) {
    console.error('Shopping search error:', error);
    return NextResponse.json({ error: 'Failed to fetch shopping results' }, { status: 500 });
  }
} 