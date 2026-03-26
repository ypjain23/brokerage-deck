import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { documentUrls, fileNames } = await req.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are an expert commercial real estate document parser. Given the following document file names and URLs from a broker's listing package, extract all available deal information into a structured JSON format.

File names: ${fileNames.join(', ')}

Extract these fields (use null for any field you cannot determine):
- property_name: string
- address: string
- city: string
- state: string (2-letter code)
- zip: string
- property_type: string (Industrial, Office, Retail, Multifamily, Mixed-Use, Land)
- asset_class: string (e.g., "Single-Tenant NNN", "Multi-Tenant", "Class A Office")
- total_sf: number
- land_area_acres: number
- year_built: number
- occupancy_pct: number (0-100)
- num_tenants: number
- num_buildings: number
- clear_height: string (e.g., "32' clear")
- dock_doors: number
- grade_doors: number
- asking_price: number
- cap_rate: number (e.g., 5.5 for 5.5%)
- price_per_sf: number
- noi: number
- walt: number (years)
- zoning: string
- parking_spaces: number
- submarket: string
- county: string
- highlights: string[] (3-5 key investment highlights)

Respond with ONLY valid JSON, no markdown formatting.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
