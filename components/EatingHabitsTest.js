// EatingHabitsTest.js
import React from "react";
function EatingHabitsTest({ onClose }) {
  return (
    <div>
      <p>Testo klausimai bus čia.</p>
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-100 rounded">Uždaryti</button>
    </div>
  );
}
export default EatingHabitsTest;
