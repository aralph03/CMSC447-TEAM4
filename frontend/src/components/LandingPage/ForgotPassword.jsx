// ========================================================
// File description: Implements the forgot password
// functionality and creates a new page for the user to
// entter their email. This is not used in the final
// project since the implementation was more complicated
// than initially expected and is outside the scope of
// what we wanted to get done
// ========================================================

// Import required modules
import React, { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const submit = async () => {
    if (!email) { setStatus('Please enter an email'); return; }
    try {
      const res = await axios.post('http://localhost:3000/auth/request-reset', { email }); // New line with full URL for frontend
      setStatus('If the email exists, a reset link has been sent.');
    } catch (err) {
      console.error(err);
      setStatus('Failed to send reset. Try again later.');
    }
  };

  // Returns main structure for forgot password page
  return (
    <div className="main-panel-container" style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2 className="panel-title">Forgot Password</h2>
      <p>Enter the admin email to receive a password reset link.</p>
      <input className="form-input" placeholder="you@umbc.edu" value={email} onChange={e => setEmail(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-gold" onClick={submit}>Send Reset Link</button>
      </div>
      {status && <p style={{ marginTop: 10 }}>{status}</p>}
    </div>
  );
}