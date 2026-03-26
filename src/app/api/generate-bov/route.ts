import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { deal, comparables } = await req.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are an expert commercial real estate appraiser and valuation analyst. Generate a Broker Opinion of Value (BOV) narrative with three valuation approaches and a weighted reconciliation.

INSTRUCTIONS:
1. Income Approach: Analyze the property's Net Operating Income (NOI) and apply an appropriate capitalization rate to derive value. Consider the in-place NOI, market cap rates, and any upside potential.

2. Sales Comparison Approach: Use the provided comparable sales to derive a value per square foot and overall value. Adjust for differences in location, condition, size, lease terms, and other relevant factors.

3. Cost Approach: Estimate the replacement cost of the improvements (using typical construction costs for the property type and market), add land value, and subtract depreciation based on the property's age and condition.

4. Weighted Reconciliation: Weight the three approaches based on their reliability for this property type and provide a final reconciled value estimate.

Respond with ONLY valid JSON in this format:
{
  "narrative": "Full BOV narrative text covering all three approaches and reconciliation (multiple paragraphs, professional tone)...",
  "incomeValue": 12500000,
  "salesCompValue": 13000000,
  "costValue": 11800000,
  "reconciledValue": 12600000
}

No markdown formatting around the JSON. All dollar values should be whole numbers (no decimals).`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Generate a Broker Opinion of Value for this property:\n\nDeal Information:\n${JSON.stringify(deal, null, 2)}\n\nComparable Sales:\n${JSON.stringify(comparables, null, 2)}`,
        },
      ],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Generate BOV error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const maxDuration = 60;
