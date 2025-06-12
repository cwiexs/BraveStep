
# AI Sports Planner (Neon edition)

Ši versija veikia su **OpenAI** ir **Neon Postgres** duomenų baze, skirta Vercel deploy'ui.

## Greitas startas

```bash
# lokaliai
cp .env.example .env
npm install
vercel dev
```

## Aplinkos kintamieji

| Kintamasis        | Paskirtis                           |
|-------------------|-------------------------------------|
| `OPENAI_API_KEY`  | OpenAI raktas                       |
| `DATABASE_URL`    | Neon prisijungimo eilutė (Postgres) |

## API

### POST `/api/plan`
JSON laukia:
```json
{
  "age": 30,
  "gender": "male",
  "fitnessLevel": "intermediate",
  "goal": "muscle_gain",
  "daysPerWeek": 4
}
```
Grąžina:
```json
{
  "id": 1,
  "plan": "..."
}
```

## Duomenų bazės schema

```sql
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  input_json JSONB NOT NULL,
  plan_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
