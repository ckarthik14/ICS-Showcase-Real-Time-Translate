import React from 'react';
import { BrowserRouter as Router, Routes, Route, } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Customer from './Customer'; // Component for Customer
import Agent from './Agent'; // Component for Agent, assuming similar to Customer
import awsLogo from './assets/aws-logo.png'; // Ensure path is correct
import { Container } from '@mui/material';
import Home from './Home';

function App() {
  return (
      <Container maxWidth="sm" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box style={{ padding: '20px 0', textAlign: 'center' }}>
          <Grid container alignItems="center" justifyContent="center">
            <Grid item>
              <img src={awsLogo} alt="AWS Logo" style={{ height: '30px', marginRight: '10px' }} />
            </Grid>
            <Grid item>
              <Typography variant="h5" component="h1" gutterBottom>
                Amazon Connect Customer Support
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Router>
          {/* Routing setup for different components */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/agent" element={<Agent />} />
          </Routes>
        </Router>
      </Container>
  );
}

export default App;
