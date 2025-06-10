document.getElementById("planForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const age = e.target.age.value;
    const gender = e.target.gender.value;
    const goal = e.target.goal.value;
    const days = e.target.days.value;

    const plan = `
        <h2>Your Weekly Plan:</h2>
        <p><strong>Age:</strong> ${age}</p>
        <p><strong>Gender:</strong> ${gender}</p>
        <p><strong>Goal:</strong> ${goal.replace('_', ' ')}</p>
        <p><strong>Workout Days:</strong> ${days}</p>
        <p><em>(This is a placeholder. AI-based plan generation coming soon!)</em></p>
    `;
    document.getElementById("result").innerHTML = plan;
});
