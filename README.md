# AI Sporto Planai 🏋️‍♀️🤖

„Next.js 14 App Router“ projektas, kuris su `OpenAI` sugeneruoja individualius treniruočių planus.

## Greitas startas

```bash
pnpm install
cp .env.example .env   # įrašykite savo OPENAI_API_KEY
npx prisma migrate dev --name init
pnpm dev               # http://localhost:3000
```

Paskui tiesiog „push“ į GitHub ir su Vercel viena‑mygtuko deploy.

## Struktūra

Pažiūrėkite `app/` – ten UI ir `app/api/planai/route.ts` API lambda.

## Naudojamos technologijos

* **Next .js 14** (App Router, React Server Components)
* **Prisma ORM** + PostgreSQL
* **OpenAI** (`gpt-4o-mini`)
* **TypeScript** + Vitest testai

Sėkmės 💪