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
    
    // Debug environment variables
    console.log('Environment variables:', {
      SERP_API_KEY: process.env.SERP_API_KEY ? 'Exists' : 'Missing',
      NODE_ENV: process.env.NODE_ENV,
    });
    
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
      console.error('API Key missing. Check .env.local file and server restart.');
      throw new Error('SERP API key not configured');
    }
    
    // Call SerpApi with GBP currency and UK locale
    const serpApiUrl = `https://serpapi.com/search.json?` + 
      `q=${encodeURIComponent(searchQuery)}&` +
      `tbm=shop&` +
      `location=United+Kingdom&` +
      `hl=en&` +
      `gl=uk&` +
      `currency=GBP&` +
      `api_key=${apiKey}`;
    
    console.log('Calling SerpAPI URL (without API key):', serpApiUrl.replace(apiKey, 'HIDDEN'));
    
    const response = await fetch(serpApiUrl);
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Shopping search failed');
    }

    // Format the shopping results
    const results = data.shopping_results?.map((item: any) => ({
      title: item.title,
      price: item.price?.includes('£') ? item.price : `£${item.price?.replace('$', '')}`,
      seller: item.source || item.merchant || item.seller || 'Unknown retailer',
      link: item.link,
      image_url: item.thumbnail
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Shopping search error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch shopping results',
      results: [] 
    }, { status: 500 });
  }
} 