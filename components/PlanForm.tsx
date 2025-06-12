'use client';

import { useState } from 'react';
import PlanResult from './PlanResult';

export default function PlanForm() {
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState('');
  const [sport, setSport] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/planai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age: Number(age), goal, sport })
    });

    const data = await res.json();
    setPlan(data.plan);
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <input
          type="number"
          placeholder="Amžius"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="Tikslas (pvz. numesti svorio)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="Sporto rūšis (pvz. bėgimas)"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          required
          className="input"
        />
        <button type="submit" disabled={loading} className="btn">
          {loading ? 'Kraunasi...' : 'Gauti planą'}
        </button>
      </form>

      {plan && <PlanResult plan={plan} />}
    </div>
  );
}