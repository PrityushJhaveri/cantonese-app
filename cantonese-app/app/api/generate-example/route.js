import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { word } = await request.json();

        if (!word) {
            return NextResponse.json({ error: 'Word is required' }, { status: 400 });
        }

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
                        "content": "You are a Cantonese language teacher. Provide 3 short, highly natural, everyday example sentences using the provided vocabulary word. Return ONLY a JSON matching the requested schema."
                    },
                    {
                        "role": "user",
                        "content": `Generate 3 example sentences using the Cantonese word: ${word.jyutping} (${word.english}).
                        
Output ONLY a raw JSON object with this exact schema (no markdown formatting, no backticks, just the json):
{
  "examples": [
    {
      "jyutping": "sentence in jyutping",
      "english": "english translation"
    }
  ]
}`
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Poe API Error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        let parsed;
        try {
            let cleanStr = content;
            if (content.startsWith('```json')) {
                cleanStr = content.substring(7, content.length - 3).trim();
            } else if (content.startsWith('```')) {
                cleanStr = content.substring(3, content.length - 3).trim();
            }
            parsed = JSON.parse(cleanStr);
        } catch (e) {
            console.error('Failed to parse examples JSON:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        return NextResponse.json(parsed);

    } catch (error) {
        console.error('Error generating examples:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
