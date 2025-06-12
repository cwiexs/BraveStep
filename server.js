
    import express from 'express';
    import cors from 'cors';
    import dotenv from 'dotenv';
    import { Configuration, OpenAIApi } from 'openai';
    import Database from 'better-sqlite3';
    import Stripe from 'stripe';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';

    dotenv.config();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const app = express();
    const port = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // DB
    const db = new Database('db/data.db');
    db.exec(require('fs').readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8'));

    // OpenAI
    const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

    // Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-08-16' });

    // Generate plan endpoint
    app.post('/api/plan', async (req, res) => {
        const input = req.body;
        try {
            const prompt = `
You are a professional sports trainer. Create a detailed ${input.daysPerWeek}-day-per-week training plan for a ${input.age}-year-old ${input.gender} at ${input.fitnessLevel} level whose main goal is ${input.goal}. 
Include warm‑up, main exercises, cool‑down, and brief nutrition tips. Respond in friendly Lithuanian.
`;
            const completion = await openai.createChatCompletion({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            });
            const plan = completion.data.choices[0].message.content.trim();

            // Save to DB
            const stmt = db.prepare("INSERT INTO plans (input_json, plan_text) VALUES (?, ?)");
            const info = stmt.run(JSON.stringify(input), plan);

            res.json({ id: info.lastInsertRowid, plan });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Stripe checkout session
    app.post('/api/create-checkout-session', async (req, res) => {
        try {
            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                line_items: [
                    {
                        price: process.env.STRIPE_PRICE_ID,
                        quantity: 1,
                    },
                ],
                success_url: `${req.headers.origin}/success.html`,
                cancel_url: `${req.headers.origin}/cancel.html`,
            });
            res.json({ url: session.url });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Stripe error' });
        }
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
