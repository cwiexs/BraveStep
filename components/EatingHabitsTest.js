function TestFetch() {
  const handleClick = async () => {
    const resp = await fetch("/api/generate-eating-habits-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });

    const text = await resp.text();
    console.log("Atsakymas:", text);
  };

  return <button onClick={handleClick}>Testuoti API</button>;
}
