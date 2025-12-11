import React, { useState } from "react";
import { lookupUserByEmail } from "../../api/userAPI";
import { useNavigate } from "react-router-dom";

export default function UserLookup() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await lookupUserByEmail(email.trim());
      localStorage.setItem("triageUser", JSON.stringify(data.user));
      navigate("/chat");
    } catch (e) {
      setError("No user found. Please register instead.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit">Continue to Chat</button>
      {error && (<p className="error">{error}</p>)}
    </form>
  );
}