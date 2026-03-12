import openai
client = openai.OpenAI(
    api_key="C0CZJ6kdNd9fRWaJP1wiMefMGd_Zsge38axkhB1oJvg",
    base_url="https://api.poe.com/v1",
)
import base64
with open("pdf_images/page_222.png", "rb") as image_file:
    b64 = base64.b64encode(image_file.read()).decode('utf-8')
    
chat = client.chat.completions.create(
    model="Gemini-1.5-Flash",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What is in this image?"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
        ]
    }]
)
print(chat.choices[0].message.content)
