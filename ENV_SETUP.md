Environment variables

Create a local .env file in the project root with:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key

Restart the dev server after adding environment variables.

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your .env file as VITE_GEMINI_API_KEY

The AI event creator feature requires this API key to parse natural language input into structured events and tasks.


