# Code Translator AI

An AI-powered web application that translates code snippets between programming languages using large language models.

## Features

- Translate code between 20+ programming languages
- Syntax highlighting for both input and output
- Real-time translation powered by OpenAI / Anthropic
- Clean, responsive UI

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | OpenAI API / Anthropic API |
| Linting | ESLint + Prettier |
| CI | GitHub Actions |

## Project Structure

```
code-translator-ai/
├── .github/
│   └── workflows/
│       └── ci.yml          # Lint, type-check, build on every PR
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   └── translate/
│   │   │       └── route.ts  # POST /api/translate
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── translator/     # Feature-specific components
│   │   └── ui/             # Shared, reusable UI components
│   ├── lib/                # Shared utilities & AI client helpers
│   └── types/              # Global TypeScript types
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9 or pnpm >= 8

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Jeah84/code-translator-ai.git
cd code-translator-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your API key(s)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (optional) |
| `AI_PROVIDER` | `openai` (default) or `anthropic` |

See `.env.example` for a full list of required variables.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checker |
| `npm test` | Run test suite |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
