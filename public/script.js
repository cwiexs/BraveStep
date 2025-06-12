
const form = document.getElementById('plan-form');
const resultEl = document.getElementById('result');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    resultEl.textContent = 'Kuriamas planas...';

    try {
        const res = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Serverio klaida');
        const json = await res.json();
        resultEl.textContent = json.plan;
    } catch (err) {
        resultEl.textContent = 'Klaida: ' + err.message;
    }
});
