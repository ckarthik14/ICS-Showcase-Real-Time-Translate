import React, { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import customerSupportImage from './assets/customer-support.png';

function Customer() {
  const connectionWebSocket = useRef(null);
  const [audioWebSocket, setAudioWebSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [language, setLanguage] = useState('');

  const handleChange = (event) => {
    setLanguage(event.target.value);
  };

  // Connect to WebSocket
  const openConnectionWebSocket = () => {
    if (connectionWebSocket.current) return;

    connectionWebSocket.current = new WebSocket('wss://csum7708d4.execute-api.us-east-1.amazonaws.com/dev/?communicator=CUSTOMER');
    
    connectionWebSocket.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    connectionWebSocket.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    return () => {
      closeWebSocket();
    };
  };

  // Function to initiate a call
  const initiateCall = () => {
    if (connectionWebSocket.current) {
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {status: "INITIALISED"}}));
    }
  };

  // Optional function to close WebSocket explicitly
  const closeWebSocket = () => {
    if (connectionWebSocket.current && isConnected) {
      connectionWebSocket.current.close();
    }
  };

  // Effect to establish WebSocket connection on mount
  useEffect(() => {
    openConnectionWebSocket();

    return () => {
      closeWebSocket();
    };
  }, []);

  return (
    <Container maxWidth="sm" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box style={{ textAlign: 'center', padding: '20px 0' }}>
        <img src={customerSupportImage} alt="Customer Support" style={{ maxWidth: '100%', height: 'auto' }} />
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
        <Button onClick={initiateCall} variant="contained" color="primary" size="large" style={{ minWidth: 200 }}>
          Call
        </Button>
      </Box>
    </Container>
  );
}

export default Customer;
