import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Box, Grid, Typography, MenuItem, InputLabel, FormControl, Select } from '@mui/material';
import customerSupportImage from './assets/customer-support.png';

function Agent() {
  // Used for speaking and listening
  const audioContextRef = useRef(null);

  // Audio Player Setup
  const nextTimeRef = useRef(0);
  const socket = useRef(null);

  const createAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context initialized');
    }
  };

  const openAgentAudioSocket = async () => {
    const wsUrl = "wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=AGENT_RECEIVER&connectionType=TRANSLATED_AUDIO";
    socket.current = new WebSocket(wsUrl);
    
    createAudioContext();

    socket.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const binaryString = window.atob(data.audio_data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (audioContextRef.current) {
        const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
        playAudio(audioBuffer);
      }
    };

    socket.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    socket.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    socket.current.onclose = () => {
      console.log('WebSocket Disconnected');
    };
  };

  const closeAgentAudioSocket = () => {
    if (socket.current) {
      socket.current.close();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    nextTimeRef.current = 0;
  };

  const playAudio = (audioBuffer) => {
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    const currentTime = audioContextRef.current.currentTime;
    const nextTime = nextTimeRef.current > currentTime ? nextTimeRef.current : currentTime;
    source.start(nextTime);
    nextTimeRef.current = nextTime + audioBuffer.duration;
  };

  // Agent Communication Setup
  const connectionWebSocket = useRef(null);
  const [isConnectionWebSocketConnected, setIsConnectionWebSocketConnected] = useState(false);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleChange = (event) => {
    setLanguage(event.target.value);
  };

  const openConnectionWebSocket = () => {
    if (connectionWebSocket.current) return;

    const wsUrl = 'wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=AGENT&connectionType=PHONE_CALL';
    connectionWebSocket.current = new WebSocket(wsUrl);
    
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
        openAgentAudioSocket();
      }
    };

    connectionWebSocket.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnectionWebSocketConnected(false);
      setIsCallIncoming(false);
      setIsCallConnected(false);
    };
  };

  const acceptCall = () => {
    if (connectionWebSocket.current) {
      setIsCallConnected(true);
      setIsCallIncoming(false);
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {communicator: "AGENT", status: "ACCEPTED"}}));
    }
  };

  const closeConnectionWebSocket = () => {
    if (connectionWebSocket.current && isConnectionWebSocketConnected) {
      connectionWebSocket.current.close();
    }
  };

  useEffect(() => {
    openConnectionWebSocket();
    return () => {
      closeConnectionWebSocket();
      closeAgentAudioSocket();
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
      <Box style={{ textAlign: 'center', paddingBottom: '50px' }}>
      {isCallIncoming && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '100px' }}>  {/* Increased gap between buttons */}
          <Button variant="contained" color="success" onClick={acceptCall}>
            Accept
          </Button>
          <Button variant="contained" color="error" onClick={closeConnectionWebSocket}>
            Reject
          </Button>
        </Box>
      )}
      {!isCallIncoming && !isCallConnected && (
          <Button variant="contained" color="success" disabled>
            No Calls at the moment
          </Button>
      )}
      {isCallConnected && (
          <Button variant="contained" color="success" disabled>
            Connected
          </Button>
      )}
      </Box>
    </Container>
  );
}

export default Agent;
