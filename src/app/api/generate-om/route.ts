import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FIRM_STYLES } from '@/lib/firm-styles';

export async function POST(req: NextRequest) {
  try {
    const { deal, firmStyle } = await req.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const style = FIRM_STYLES[firmStyle as keyof typeof FIRM_STYLES];

    if (!style) {
      return NextResponse.json(
        { success: false, error: `Unknown firm style: ${firmStyle}` },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert commercial real estate copywriter generating an Offering Memorandum (OM) in the voice and style of ${style.displayName}.

FIRM STYLE PROFILE:
- Full Name: ${style.fullName}
- Group: ${style.group}
- Voice: ${style.voiceDescriptor}
- Opening Phrase: ${style.openingPhrase}
- Property Term: ${style.propertyTerm}
- SF Symbol: ${style.sfSymbol ? `Use "${style.sfSymbol}" before SF figures` : 'No special SF symbol'}
- WALT Format: ${style.walFormat}
- Highlights Format: ${style.highlightsFormat}
- Cover Line Format: ${style.coverlineFormat}
- Key Vocabulary (use these terms naturally throughout): ${style.keyVocabulary.join(', ')}
- Opening Formula Template: ${style.industrialOpeningFormula}
- Disclaimer Note: ${style.disclaimerNote}
- Disclaimer: ${style.disclaimer}

SECTION ORDER (generate sections in this exact order):
${style.sectionOrder.map((s, i) => `${i + 1}. ${s}`).join('\n')}

INSTRUCTIONS:
- Generate a complete OM with sections matching the firm's section order above.
- Each section should be a rich, detailed paragraph or set of paragraphs following the firm's voice and style.
- The Executive Summary should use the firm's opening formula, filling in the deal data.
- Use the firm's key vocabulary naturally throughout the document.
- Investment highlights should follow the firm's highlights format.
- Include specific numbers and metrics from the deal data wherever possible.
- End with the firm's standard disclaimer language.

Respond with ONLY valid JSON in this format:
{
  "sections": [
    { "title": "Section Title", "content": "Section content..." },
    ...
  ]
}

No markdown formatting around the JSON.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Generate a complete Offering Memorandum for this deal:\n\n${JSON.stringify(deal, null, 2)}`,
        },
      ],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Generate OM error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
