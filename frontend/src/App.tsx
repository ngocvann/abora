import { useEffect, useState } from "react";
import { http } from "./services/http";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    http
      .get<string>("/health")
      .then((res) => setMessage(res.data))
      .catch(() => setMessage("Backend connection failed"));
  }, []);

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Abora</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
