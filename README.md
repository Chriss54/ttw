# Text-to-Workflow: n8n Architect

Generate production-ready n8n workflow prompts from natural language descriptions.

## Features

- 🚀 **Mega Mode**: Generate 15,000+ character detailed workflow specifications
- 🎯 **Template Detection**: Auto-detect RAG, ETL, Multi-Agent, Webhook patterns
- 🔧 **AI-Powered**: Uses Gemini API for dynamic prompt generation
- ✅ **Validation**: Real-time prompt quality checking

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Usage

1. **Standard Mode**: Quick workflow prompts (up to 5000 chars)
2. **Mega Mode**: Toggle to generate detailed specifications for complex workflows

## License

MIT License - see [LICENSE](LICENSE) for details.
