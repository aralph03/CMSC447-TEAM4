// ========================================================
// File description: Implements the reset password
// functionality and creates a new page for the user to
// reset their password. This is not used in the final
// project since the implementation was more complicated
// than initially expected and is outside the scope of
// what we wanted to get done
// ========================================================

// Import required modules
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function check() {
      try {
        const res = await axios.get(`/auth/reset/${token}`);
        setValid(res.data.valid === true);
      } catch (err) {
        setValid(false);
      }
    }
    check();
  }, [token]);

  // Handles submit
  const submit = async () => {
    if (!password || password.length < 8) return setStatus('Password must be 8+ characters');
    try {
      // Calls backend API
      await axios.post(`/auth/reset/${token}`, { password });
      setStatus('Password updated. Redirecting to login...');
      setTimeout(() => navigate('/admin-login'), 1500);
    } catch (err) {
      console.error(err);
      setStatus(err?.response?.data?.error || 'Failed to reset password');
    }
  };

  if (valid === null) return <div>Checking token...</div>;
  if (valid === false) return <div>Invalid or expired reset token.</div>;

  // Returns reset password main structure
  return (
    <div className="main-panel-container" style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2 className="panel-title">Reset Password</h2>
      <p>Enter a new password for your account.</p>
      <input className="form-input" type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-gold" onClick={submit}>Set New Password</button>
      </div>
      {status && <p style={{ marginTop: 10 }}>{status}</p>}
    </div>
  );
}