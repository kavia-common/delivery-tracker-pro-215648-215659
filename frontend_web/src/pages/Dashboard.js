import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Welcome{user ? `, ${user.full_name || user.email}` : ''}!</p>
      <p>Use the navigation to explore deliveries, history, and admin panel.</p>
    </div>
  );
}
