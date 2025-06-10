
document.getElementById("planForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => data[key] = value);

  try {
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (res.ok) {
      document.getElementById("output").textContent = result.plan;
    } else {
      document.getElementById("output").textContent = "Klaida: " + result.error;
    }
  } catch (error) {
    document.getElementById("output").textContent = "Užklausos klaida.";
  }
});
