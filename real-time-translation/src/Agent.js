import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Box, Grid, Typography, MenuItem, InputLabel, FormControl, Select } from '@mui/material';
import customerSupportImage from './assets/customer-support.png';

function Agent() {
  const connectionWebSocket = useRef(null);
  const [isConnectionWebSocketConnected, setIsConnectionWebSocketConnected] = useState(false);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [language, setLanguage] = useState('');

  const handleChange = (event) => {
    setLanguage(event.target.value);
  };

  const openConnectionWebSocket = () => {
    if (connectionWebSocket.current) return;

    connectionWebSocket.current = new WebSocket('wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=AGENT');
    
    connectionWebSocket.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnectionWebSocketConnected(true);
    };

    connectionWebSocket.current.onmessage = async (event) => {
      console.log('Received message', event);
      const data = JSON.parse(event.data);

      if (data.message && data.message.status === "INITIALISED") {
        console.log("Found that call is initialised");
        setIsCallIncoming(true);
      }
    };

    connectionWebSocket.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnectionWebSocketConnected(false);
      setIsCallIncoming(false);
      setIsCallConnected(false); // Reset on disconnect
    };
  };

  const acceptCall = () => {
    if (connectionWebSocket.current) {
      setIsCallConnected(true);
      setIsCallIncoming(false);
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {communicator: "AGENT", status: "ACCEPTED"}}));
    }
  };

  const closeWebSocket = () => {
    if (connectionWebSocket.current && isConnectionWebSocketConnected) {
      connectionWebSocket.current.close();
    }
  };

  useEffect(() => {
    openConnectionWebSocket();

    return () => {
      closeWebSocket();
    };
  }, []);

  return (
    <Container maxWidth="sm" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box style={{ textAlign: 'center' }}>
        <Grid container alignItems="center" justifyContent="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Agent
            </Typography>
          </Grid>
        </Grid>
      </Box>
      <Box style={{ textAlign: 'center', padding: '20px 0' }}>
        <img src={customerSupportImage} alt="Customer Support" style={{ maxWidth: '70%', height: 'auto' }} />
      </Box>
      <Box style={{ textAlign: 'center', padding: '20px 0' }}>
        <FormControl variant="outlined" size="large" sx={{ minWidth: 240, width: '50%' }}>
          <InputLabel id="demo-simple-select-outlined-label">Language</InputLabel>
          <Select
            labelId="demo-simple-select-outlined-label"
            id="demo-simple-select-outlined"
            value={language}
            onChange={handleChange}
            label="Language"
            style={{ height: 56 }}
          >
            <MenuItem value={'English'}>English</MenuItem>
            <MenuItem value={'Spanish'}>Spanish</MenuItem>
            <MenuItem value={'French'}>French</MenuItem>
            <MenuItem value={'Hindi'}>Hindi</MenuItem>
            <MenuItem value={'Chinese'}>Chinese</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {isCallIncoming && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '60px', position: 'absolute', bottom: '30%', width: '100%' }}>
          <Button variant="contained" color="success" onClick={acceptCall}>
            Accept
          </Button>
          <Button variant="contained" color="error" onClick={closeWebSocket}>
            Reject
          </Button>
        </Box>
      )}
      {isCallConnected && (
        <Box sx={{ display: 'flex', justifyContent: 'center', position: 'absolute', bottom: '30%', width: '100%' }}>
          <Button variant="contained" color="success" disabled>
            Connected
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Agent;
