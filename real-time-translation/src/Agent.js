import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Customer from './Customer'; // Component for Customer
import Agent from './Agent'; // Component for Agent

function App() {
  return (
    <Router>
      <div>
        {/* Navigation Buttons */}
        <Link to="/customer"><button>Go to Customer Page</button></Link>
        <Link to="/agent"><button>Go to Agent Page</button></Link>
        
        {/* Route Configuration */}
        <Routes>
          <Route path="/customer" element={<Customer />} />
          <Route path="/agent" element={<Agent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
