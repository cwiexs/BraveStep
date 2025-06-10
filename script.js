function generatePlan() {
    const age = document.getElementById("age").value;
    const weight = document.getElementById("weight").value;
    const goal = document.getElementById("goal").value;
    const customGoal = document.getElementById("custom-goal").value;
  
    let finalGoal = goal === "other" ? customGoal : goal;
  
    let output = "Your Personalized Plan\n\n";
    output += "Age: " + age + " years\n";
    output += "Weight: " + weight + " kg\n";
    output += "Goal: " + finalGoal + "\n\n";
    output += "👉 Plan generation is coming soon... Stay tuned!";
  
    document.getElementById("plan-output").textContent = output;
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    const goalSelect = document.getElementById("goal");
    const customGoalContainer = document.getElementById("custom-goal-container");
  
    goalSelect.addEventListener("change", function () {
      if (goalSelect.value === "other") {
        customGoalContainer.style.display = "block";
      } else {
        customGoalContainer.style.display = "none";
      }
    });
  });
  
