import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Box, Grid, Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import customerImage from './assets/customer.png';

function Customer() {
  const connectionWebSocket = useRef(null);
  const [isConnectionWebSocketConnected, setIsConnectionWebSocketConnected] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [language, setLanguage] = useState('');

  const handleChange = (event) => {
    setLanguage(event.target.value);
  };

  const openConnectionWebSocket = () => {
    if (connectionWebSocket.current) return;

    connectionWebSocket.current = new WebSocket('wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=CUSTOMER');
    
    connectionWebSocket.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnectionWebSocketConnected(true);
    };

    connectionWebSocket.current.onmessage = async (event) => {
      console.log('Received message', event);
      const data = JSON.parse(event.data);

      if (data.message && data.message.status === "ACCEPTED") {
        console.log("Found that call is accepted");
        setIsCallConnected(true);
        setIsCallConnecting(false);  // Ensure to update connecting state
      }
    };

    connectionWebSocket.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnectionWebSocketConnected(false);
      setIsCallConnecting(false);
      setIsCallConnected(false);
    };
  };

  const initiateCall = () => {
    if (connectionWebSocket.current) {
      setIsCallConnecting(true);
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {communicator: "CUSTOMER", status: "INITIALISED"}}));
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
              Customer
            </Typography>
          </Grid>
        </Grid>
      </Box>
      <Box style={{ textAlign: 'center', padding: '20px 0' }}>
        <img src={customerImage} alt="Customer Support" style={{ maxWidth: '70%', height: 'auto' }} />
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
      <Box style={{ textAlign: 'center', paddingBottom: '50px' }}>
        <Button
          onClick={initiateCall}
          variant="contained"
          color="primary"
          size="large"
          style={{ minWidth: 200 }}
          disabled={isCallConnecting || isCallConnected}
        >
          {isCallConnected ? "Connected" : isCallConnecting ? "Calling..." : "Call"}
        </Button>
      </Box>
    </Container>
  );
}

export default Customer;
