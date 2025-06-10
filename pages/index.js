
import { useState } from 'react';

export default function Home() {
  const [form, setForm] = useState({ age: '', weight: '', gender: '', goals: '', daysPerWeek: '' });
  const [plan, setPlan] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setPlan(data.plan || 'Klaida generuojant planą.');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>BraveStep plan generator</h1>
      <form onSubmit={handleSubmit}>
        {['age', 'weight', 'gender', 'goals', 'daysPerWeek'].map((field) => (
          <div key={field}>
            <label>{field}</label><br />
            <input name={field} onChange={handleChange} required />
            <br /><br />
          </div>
        ))}
        <button type="submit">Generate Plan</button>
      </form>
      <pre>{plan}</pre>
    </div>
  );
}
