
# AI Sports Planner 🏋️‍♂️🤖

Pradinė projekto versija, skirta sporto planų generavimui dirbtiniu intelektu.

## Greitas startas

1. **Klonuokite** repozitoriją iš GitHub (arba įkelkite šį zip).
2. Įdiekite priklausomybes:

   ```bash
   npm install
   ```

3. Sukurkite `.env` failą pagal pavyzdį `.env.example`.
4. Paleiskite plėtotės režimą:

   ```bash
   npm run dev
   ```

Aplankykite `http://localhost:3000` naršyklėje.

## Failų struktūra

```
/public          – statiniai failai (HTML, CSS, JS)
/db/schema.sql   – SQLite duomenų bazės schema
server.js        – Express serveris + API
package.json     – projekto metaduomenys
```

## Reikalingos aplinkos kintamieji

| Kintamasis           | Paskirtis                         |
|----------------------|-----------------------------------|
| `OPENAI_API_KEY`     | OpenAI raktas planų generavimui   |
| `STRIPE_SECRET_KEY`  | Stripe paslaptis mokėjimams       |
| `STRIPE_PRICE_ID`    | Stripe Price ID „Premium“ planui |

## AI generavimas

API maršrutas **POST** `/api/plan` tikisi JSON:

```json
{
  "age": 30,
  "gender": "male",
  "goal": "muscle_gain",
  "fitnessLevel": "intermediate",
  "daysPerWeek": 4
}
```

Atsakymas grąžins sugeneruotą planą ir ID, išsaugotą DB.

## Licencija

MIT
