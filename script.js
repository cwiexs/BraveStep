document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("goalForm");
  const result = document.getElementById("result");
  const goalSelect = document.getElementById("goal");
  const customGoalContainer = document.getElementById("customGoalContainer");

  goalSelect.addEventListener("change", () => {
    if (goalSelect.value === "other") {
      customGoalContainer.style.display = "block";
    } else {
      customGoalContainer.style.display = "none";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const age = document.getElementById("age").value;
    const weight = document.getElementById("weight").value;
    const goal = document.getElementById("goal").value;
    const customGoal = document.getElementById("customGoal").value;

    let finalGoal = goal === "other" ? customGoal : goal;

    const plan = `
      <h2>Your Weekly Plan</h2>
      <p><strong>Age:</strong> ${age}</p>
      <p><strong>Weight:</strong> ${weight} kg</p>
      <p><strong>Goal:</strong> ${finalGoal}</p>
      <ul>
        <li>Monday: Warm-up + Cardio + Stretching</li>
        <li>Wednesday: Strength training + Core</li>
        <li>Friday: Full-body workout + Mobility</li>
      </ul>
    `;
    result.innerHTML = plan;
    result.classList.remove("hidden");
  });
});
