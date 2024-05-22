import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function Home() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" minHeight="60vh" style={{ paddingTop: '10vh', transform: 'translateY(-10%)' }}>
      <h1>Customer or Agent?</h1>
      <Box mt={2}>
        <Link to="/customer" style={{ textDecoration: 'none', marginRight: '10px' }}>
          <Button variant="contained" color="primary">Customer</Button>
        </Link>
        <Link to="/agent" style={{ textDecoration: 'none' }}>
          <Button variant="contained" color="secondary">Agent</Button>
        </Link>
      </Box>
    </Box>
  );
}

export default Home;
