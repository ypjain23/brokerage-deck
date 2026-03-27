import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { documentUrls, fileNames } = await req.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Fetch each document and convert to base64 for Claude
    const contentBlocks: Anthropic.MessageParam['content'] = [];

    for (let i = 0; i < documentUrls.length; i++) {
      const url = documentUrls[i];
      const fileName = fileNames[i] || `document_${i + 1}`;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        if (ext === 'pdf') {
          contentBlocks.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          } as Anthropic.RequestDocumentBlock);
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          const mediaType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          });
        }
      } catch {
        // Skip files that fail to fetch
        continue;
      }
    }

    if (contentBlocks.length === 0) {
      return NextResponse.json({ success: false, error: 'No documents could be fetched' }, { status: 400 });
    }

    contentBlocks.push({
      type: 'text',
      text: `You are an expert commercial real estate document parser. Extract all available deal information from the documents above into a structured JSON format.

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
- highlights: string[] (3-5 key investment highlights as complete sentences)
- tenant_name: string (primary tenant name)
- lease_type: string (e.g., "NNN", "Gross", "Modified Gross")
- lease_expiration: string (e.g., "December 2028")

Respond with ONLY valid JSON, no markdown formatting, no explanation.`,
    });

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
