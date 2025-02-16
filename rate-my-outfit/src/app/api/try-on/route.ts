import { NextResponse } from 'next/server';

async function pollForResult(id: string, apiKey: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 30;
  const delay = 2000; // 2 seconds

  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (data.status === 'completed') {
      return data.result_url;
    } else if (data.status === 'failed') {
      throw new Error(`Processing failed: ${data.error || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }

  throw new Error('Timeout waiting for result');
}

export async function POST(req: Request) {
  try {
    const { modelImage, garmentImage } = await req.json();
    
    console.log('Validating inputs...');
    if (!modelImage || !garmentImage) {
      console.error('Missing required images:', { 
        hasModelImage: !!modelImage, 
        hasGarmentImage: !!garmentImage 
      });
      return NextResponse.json({ error: "Missing required images" }, { status: 400 });
    }

    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      console.error('FASHN API Key missing');
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Log request details (truncated for security)
    console.log('Making API request to FASHN...', {
      modelImageLength: modelImage?.length,
      garmentImageLength: garmentImage?.length,
      hasApiKey: !!apiKey
    });

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

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 200)); // Log first 200 chars

    // Handle non-JSON responses
    if (!response.ok) {
      return NextResponse.json({ 
        error: `FASHN API Error (${response.status})`,
        details: {
          status: response.status,
          body: responseText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: response.status });
    }

    // Try to parse JSON only if response was OK
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse successful response as JSON:', responseText);
      return NextResponse.json({ 
        error: 'Invalid JSON response from FASHN API',
        details: {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          responseText
        }
      }, { status: 500 });
    }

    if (data.error) {
      console.error('FASHN API returned error:', data);
      return NextResponse.json({ error: data.error, details: data }, { status: 400 });
    }

    console.log('Starting polling for result...');
    const resultImage = await pollForResult(data.id, apiKey);
    
    return NextResponse.json({ 
      status: 'completed',
      result: resultImage 
    });

  } catch (error: unknown) {
    console.error('Try-on error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process try-on request',
      details: error
    }, { status: 500 });
  }
} 