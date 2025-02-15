import { NextResponse } from 'next/server';

async function pollForResult(id: string, apiKey: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Polling attempt ${i + 1}/${maxAttempts}`);
    
    const statusResponse = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    
    const statusData = await statusResponse.json();
    console.log('Status response:', statusData);

    if (statusData.status === 'completed' && statusData.output?.[0]) {
      return statusData.output[0];
    } else if (statusData.status === 'failed') {
      throw new Error('Try-on processing failed');
    }

    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Timeout waiting for try-on result');
}

export async function POST(req: Request) {
  try {
    const { modelImage, garmentImage } = await req.json();
    
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      console.error('FASHN API Key missing');
      throw new Error('FASHN API key not configured');
    }

    console.log('Starting try-on request...');
    
    // Initial request to start the try-on process
    const response = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_image: modelImage,
        garment_image: garmentImage,
        category: 'tops',
        mode: 'balanced',
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    // Poll for the result
    const resultImage = await pollForResult(data.id, apiKey);
    
    return NextResponse.json({ 
      status: 'completed',
      result: resultImage 
    });
  } catch (error: any) {
    console.error('Try-on error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process try-on request',
      details: error
    }, { status: 500 });
  }
} 