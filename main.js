document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    age: document.getElementById('age').value,
    weight: document.getElementById('weight').value,
    gender: document.getElementById('gender').value,
    goals: document.getElementById('goals').value,
    daysPerWeek: document.getElementById('days').value
  };

  const res = await fetch('api/generate-plan', {

    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  document.getElementById('result').textContent = json.plan;
});
