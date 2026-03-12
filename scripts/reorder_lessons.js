const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function reorderLessonWords() {
    const baseDir = "/Users/prityushjhaveri/Projects/Year 4/cantonese";
    const outputFile = path.join(baseDir, "cantonese-app", "data", "chapters.json");

    if (!fs.existsSync(outputFile)) {
        console.error("chapters.json not found!");
        return;
    }

    const rawData = fs.readFileSync(outputFile, 'utf8');
    let chaptersData = JSON.parse(rawData);

    // Group by lesson
    const lessonGroups = {};
    for (const word of chaptersData) {
        const lesson = word.lessonStr;
        if (!lessonGroups[lesson]) {
            lessonGroups[lesson] = [];
        }
        lessonGroups[lesson].push(word);
    }

    console.log(`Loaded ${chaptersData.length} words across ${Object.keys(lessonGroups).length} lessons.`);

    const apiKey = "C0CZJ6kdNd9fRWaJP1wiMefMGd_Zsge38axkhB1oJvg";
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    let reorderedData = [];

    for (const [lesson, words] of Object.entries(lessonGroups)) {
        if (words.length <= 3) {
            reorderedData.push(...words);
            continue;
        }

        console.log(`Reordering ${lesson} (${words.length} words)...`);

        const wordList = words.map(w => ({ word: w.english, pos: w.pos }));
        
        const prompt = `
You are an expert curriculum designer. Please reorder the following list of vocabulary words so that words of similar categories, themes, grammatical functions, or logical pairs appear sequentially together (e.g. all countries together, all numbers together, all time words together, question words together). 

Here is the list:
${JSON.stringify(wordList, null, 2)}

Return ONLY a flat JSON array of strings containing the exact 'word' (English) values, but in the new, logically grouped order. Do not change the strings, do not list the POS, just an array of the English strings. Do not use markdown backticks, return raw flat JSON array only.
`;

        try {
            const response = await fetch('https://api.poe.com/v1/chat/completions', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: "Gemini-3-Flash",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const respJson = await response.json();
                let content = respJson.choices[0].message.content.trim();

                if (content.startsWith('```json')) {
                    content = content.substring(7, content.length - 3).trim();
                } else if (content.startsWith('```')) {
                    content = content.substring(3, content.length - 3).trim();
                }

                let newOrderStrings;
                try {
                     newOrderStrings = JSON.parse(content);
                } catch(e) {
                     console.error("Failed to parse LLM array. Falling back.");
                     reorderedData.push(...words);
                     continue;
                }

                const orderedFullWords = [];
                const usedWords = new Set();
                
                // Construct new objects based on the returned English string
                for (const englishWord of newOrderStrings) {
                    const match = words.find(w => w.english === englishWord && !usedWords.has(w));
                    if (match) {
                        orderedFullWords.push(match);
                        usedWords.add(match);
                    }
                }

                // Handle any words that the LLM forgot or hallucinated out
                for (const w of words) {
                    if (!usedWords.has(w)) {
                        orderedFullWords.push(w);
                    }
                }

                reorderedData.push(...orderedFullWords);
            } else {
                console.log(`Failed to reorder ${lesson}, falling back to original. Status: ${response.status}`);
                reorderedData.push(...words);
            }
        } catch (e) {
            console.error(`Error reordering ${lesson}:`, e.message);
            reorderedData.push(...words);
        }
    }

    // Re-apply sequential numbering based on the new order
    reorderedData = reorderedData.map((word, index) => {
        return { ...word, number: index + 1 };
    });

    // Save it back
    fs.writeFileSync(outputFile, JSON.stringify(reorderedData, null, 2), 'utf8');

    console.log(`Successfully reordered and saved ${reorderedData.length} words.`);
}

reorderLessonWords();
