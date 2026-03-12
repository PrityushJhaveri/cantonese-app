import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { word, userInput } = await request.json();

        if (!word || !userInput) {
            return NextResponse.json({ error: 'Word and userInput are required' }, { status: 400 });
        }

        // Using Poe API with Gemini-3-Flash
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
                        "content": "You are a strict but encouraging Cantonese teacher. The student is practicing vocabulary flashcards and was asked to translate or provide the meaning of a Cantonese word. Evaluate their answer."
                    },
                    {
                        "role": "user",
                        "content": `The target Cantonese vocabulary word is "${word.jyutping}", which means "${word.english}". 
                        
The student provided the following English answer: "${userInput}".

Please evaluate if their English answer is correct, partially correct, or incorrect in conveying the meaning of "${word.jyutping}". Provide a very brief (1-2 sentences) explanation or encouragement.

Output ONLY a JSON object with two keys:
- "isCorrect": boolean (true if correct or close enough, false if completely wrong)
- "feedback": string (your brief explanation)`
                    }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Poe API error:', errText);
            return NextResponse.json({ error: `LLM API Error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        // Try to parse the output as JSON
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
            console.error('Failed to parse LLM response:', content);
            return NextResponse.json({ error: 'Failed to parse grading result' }, { status: 500 });
        }

        return NextResponse.json(parsed);

    } catch (error) {
        console.error('Error grading test:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
