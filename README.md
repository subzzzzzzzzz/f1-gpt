# F1GPT

F1GPT is a web-based AI assistant for Formula 1 fans. It lets users ask questions in a chat interface, retrieves relevant Formula 1 context from Astra DB, and uses an OpenAI-powered model to generate responses grounded in that information.

## What this project does

This app is designed for fans who want quick, conversational answers about Formula 1 racing, teams, drivers, results, and general F1 knowledge. The interface is a simple chat UI, and the backend searches a vector database for related documents before responding.

## Stack

- Language: TypeScript
- Frontend: Next.js 16 App Router, React 19
- Backend: Next.js API routes
- AI: OpenAI GPT-4, OpenAI embeddings
- Vector database: DataStax Astra DB
- Retrieval: LangChain + text splitters, Puppeteer web scraping
- Styling: CSS

## Project structure

```text
app/
  api/chat/       Chat endpoint that embeds the latest question,
                  retrieves similar documents from Astra DB,
                  and streams the LLM response.
  assets/         F1GPT logo and background image assets.
  components/     UI elements for chat bubbles, loading state,
                  and prompt suggestions.
  page.tsx        Main chat interface.
  layout.tsx      Root layout and page metadata.
  global.css      App styling.
scripts/
  loadDb.ts       Scrapes Formula 1 sources, splits the content into chunks,
                 creates embeddings, and seeds Astra DB.
