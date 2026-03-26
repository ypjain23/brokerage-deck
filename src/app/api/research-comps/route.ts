import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { deal } = await req.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are an expert commercial real estate research analyst specializing in comparable sales analysis. Given a subject property's details, generate realistic comparable sales data for the property's submarket.

INSTRUCTIONS:
- Generate 4-6 realistic comparable sales based on the deal's submarket, property type, and size.
- Comps should be from the past 6-24 months.
- Comps should be geographically close to the subject property (within the same submarket or adjacent submarkets).
- Vary the comp characteristics realistically: some slightly larger, some smaller, some higher cap rate, some lower.
- Price per SF and cap rates should be realistic for the property type and market.
- Distances should range from 0.5 to 15 miles from the subject property.
- Use realistic street addresses for the market area.

Respond with ONLY valid JSON in this format:
{
  "comps": [
    {
      "address": "123 Industrial Blvd",
      "city": "City, ST",
      "sale_price": 15000000,
      "sale_date": "2025-06-15",
      "sf": 120000,
      "price_per_sf": 125.00,
      "cap_rate": 5.25,
      "property_type": "Industrial",
      "distance_miles": 2.3
    }
  ]
}

No markdown formatting around the JSON. Sale prices should be whole numbers. Price per SF should have 2 decimal places. Cap rates should have 2 decimal places (e.g., 5.25 for 5.25%).`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Research and generate realistic comparable sales for this subject property:\n\n${JSON.stringify(deal, null, 2)}`,
        },
      ],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Research comps error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
