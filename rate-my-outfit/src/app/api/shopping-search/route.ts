import { NextResponse } from "next/server";

export interface ShoppingItem {
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
    
    // Add "men's" to the search query if it's not already included
    const menSearchQuery = searchQuery.toLowerCase().includes("men") 
      ? searchQuery 
      : `men's ${searchQuery}`;
    
    // Call SerpApi with GBP currency and UK locale
    const serpApiUrl = `https://serpapi.com/search.json?` + 
      `q=${encodeURIComponent(menSearchQuery)}&` +
      `tbm=shop&` +
      `location=United+Kingdom&` +
      `hl=en&` +
      `gl=uk&` +
      `currency=GBP&` +
      `num=5&` +
      `api_key=${apiKey}`;
    
    console.log('Calling SerpAPI URL (without API key):', serpApiUrl.replace(apiKey, 'HIDDEN'));
    
    const response = await fetch(serpApiUrl);
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Shopping search failed');
    }

    // Format the shopping results
    const results = data.shopping_results?.map((item: ShoppingResult) => ({
      title: item.title,
      price: item.price?.includes('£') ? item.price : `£${item.price?.replace('$', '')}`,
      seller: item.source || item.merchant || item.seller || 'Unknown retailer',
      link: item.link,
      image_url: item.thumbnail
    })) || [];

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('Shopping search error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch shopping results',
      results: [] 
    }, { status: 500 });
  }
}

interface ShoppingResult {
  title: string;
  price?: string;
  source?: string;
  merchant?: string;
  seller?: string;
  link: string;
  thumbnail: string;
} 