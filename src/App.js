import React from 'react';
import logo from './logo.svg';
import './App.css';
import AdminDashboard from './home/adminDashboard';

function App() {
  return (
    <div className="App">
      <AdminDashboard role='admin' />
    </div>
  );
}

export default App;
