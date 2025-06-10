
import { useState } from 'react';

export default function Home() {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [goals, setGoals] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [plan, setPlan] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPlan('Generating...');

    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age, weight, gender, goals, daysPerWeek }),
    });

    const data = await res.json();
    setPlan(data.plan || 'Error generating plan.');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>BraveStep - Workout Plan Generator</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} /><br />
        <input placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} /><br />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select><br />
        <input placeholder="Your goals" value={goals} onChange={(e) => setGoals(e.target.value)} /><br />
        <input placeholder="Days per week" value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} /><br />
        <button type="submit">Generate Plan</button>
      </form>
      <pre>{plan}</pre>
    </div>
  );
}
