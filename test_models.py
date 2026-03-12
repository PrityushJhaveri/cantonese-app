import openai
import base64

client = openai.OpenAI(
    api_key="C0CZJ6kdNd9fRWaJP1wiMefMGd_Zsge38axkhB1oJvg",
    base_url="https://api.poe.com/v1",
)

with open("pdf_images/page_222.png", "rb") as image_file:
    b64 = base64.b64encode(image_file.read()).decode('utf-8')
    
for model in ["Gemini-1.5-Flash", "Gemini-3-Flash"]:
    print(f"Testing {model}...")
    try:
        chat = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image? Just give one word."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
                ]
            }]
        )
        print(f"Success! Response: {chat.choices[0].message.content}")
    except Exception as e:
        print(f"Failed: {e}")
