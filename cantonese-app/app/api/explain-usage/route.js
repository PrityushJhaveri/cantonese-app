import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Using Poe API with Gemini-3-Flash as requested
        const response = await fetch('https://api.poe.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer C0CZJ6kdNd9fRWaJP1wiMefMGd_Zsge38axkhB1oJvg`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Gemini-3-Flash',
                messages: [
                    {
                        "role": "system",
                        "content": "You are a helpful Cantonese teacher. You explain Cantonese grammar, usage, and cultural nuances clearly and concisely. Do NOT use traditional Cantonese characters in your output, only use Jyutping and English."
                    },
                    {
                        "role": "user",
                        "content": `Please explain the usage, context, and nuance of the following Cantonese vocabulary/grammar point: "${query.jyutping}" (meaning: "${query.english}").\n\nKeep the explanation concise, formatted in Markdown, and focus on practical conversational usage.`
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Poe API error:', errText);
            return NextResponse.json({ error: `LLM API Error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        return NextResponse.json({ explanation: content });

    } catch (error) {
        console.error('Error generating explanation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
