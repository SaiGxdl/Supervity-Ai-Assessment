import sys
sys.path.insert(0, 'backend')
import dotenv
dotenv.load_dotenv('backend/.env')
from google import genai
import os

key = os.getenv('GEMINI_API_KEY', '')
print('Key loaded:', key[:15] + '...' if key else 'MISSING')

client = genai.Client(api_key=key)

models_to_try = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash',
    'gemini-3.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
]

print('\nTesting all Gemini models...\n')
working = None
for model in models_to_try:
    try:
        r = client.models.generate_content(
            model=model,
            contents='Reply with this exact JSON: {"status": "ok", "model": "' + model + '"}',
        )
        print(f'  [WORKS] {model}')
        print(f'          Response: {r.text.strip()[:80]}')
        if working is None:
            working = model
    except Exception as e:
        err = str(e)[:100]
        print(f'  [FAIL]  {model}: {err}')

print()
if working:
    print(f'BEST MODEL TO USE: {working}')
else:
    print('No working model found. Key may be invalid or restricted to specific projects.')
    print('Get a fresh key from: https://aistudio.google.com/apikey')
