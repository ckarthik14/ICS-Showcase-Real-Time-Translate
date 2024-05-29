import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Box, Grid, Typography, MenuItem, InputLabel, FormControl, Select } from '@mui/material';
import customerSupportImage from './assets/customer-support.png';
import Translation from './Translation';

function Agent() {
  // Used for speaking and listening
  const audioContextRef = useRef(null);

  const closeAudioContext = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().then(() => {
          console.log('AudioContext closed');
      });
    }
  }

  // Audio Player Setup
  const nextTimeRef = useRef(0);
  const translatedAudioSocket = useRef(null);
  const [isTranslatedAudioSocketConnected, setIsTranslatedAudioSocketConnected] = useState(false);

  const createAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000 // setting the sample rate to 16kHz
      });
      console.log('Audio context initialized');
    }
  }

  const openAgentAudioSocket = async () => {
    if (translatedAudioSocket.current) return;

    translatedAudioSocket.current = new WebSocket("wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=AGENT_RECEIVER&connectionType=TRANSLATED_AUDIO");

    translatedAudioSocket.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Audio data: ", data);
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

    translatedAudioSocket.current.onopen = () => {
      console.log('Translated Audio WebSocket Connected');
      setIsTranslatedAudioSocketConnected(true);
    };

    translatedAudioSocket.current.onerror = (error) => {
      console.error('Translated Audio WebSocket Error:', error);
    };

    translatedAudioSocket.current.onclose = () => {
      console.log('Translated Audio WebSocket Disconnected');
      setIsTranslatedAudioSocketConnected(false);
    };
  };

  const closeAgentAudioSocket = () => {
    if (translatedAudioSocket.current && isTranslatedAudioSocketConnected) {
      translatedAudioSocket.current.close();
    }
    closeAudioContext();
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

  // transmit raw audio
  const rawAudioWebSocket = useRef(null);
  const [isRawAudioWebSocketConnected, setIsRawAudioWebSocketConnected] = useState(false);

  const openRawAudioWebSocket = () => {
    if (rawAudioWebSocket.current) return;

    rawAudioWebSocket.current = new WebSocket('wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=AGENT_RAW&connectionType=RAW_AUDIO');
    
    rawAudioWebSocket.current.onopen = () => {
      console.log('Raw Audio WebSocket Connected');
      setIsRawAudioWebSocketConnected(true);
    };

    rawAudioWebSocket.current.onmessage = async (event) => {
    };

    rawAudioWebSocket.current.onclose = () => {
      console.log('Raw Audio WebSocket Disconnected');
      setIsRawAudioWebSocketConnected(false);
    };
  };

  const setupAudioProcessing = (stream) => {
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1); // buffer size, input channels, output channels

    processor.onaudioprocess = (e) => {
      if (rawAudioWebSocket.current && rawAudioWebSocket.current.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0); // get mono channel data
          const output = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
              // convert float32 audio data to int16
              output[i] = inputData[i] * 0x7FFF; // scale float32 to int16 range
          }
  
          // Convert Int16Array to Blob
          const blob = new Blob([output], { type: 'application/octet-stream' });
  
          // Create a FileReader to read the Blob as a base64 string
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64data = reader.result.split(',')[1];
              
              // Send the base64 encoded string over the WebSocket
              rawAudioWebSocket.current.send(JSON.stringify({
                  action: 'rawAudio',
                  message: { "communicator": "AGENT_RAW", "audio_data": base64data }
              }));
          };
          reader.readAsDataURL(blob);
      }
    };
  
    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };


  const startMicStream = async () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(setupAudioProcessing)
        .catch(err => console.error('Error accessing the microphone:', err));
  }

  const closeRawAudioWebSocket = () => {
    if (rawAudioWebSocket.current && isRawAudioWebSocketConnected) {
      rawAudioWebSocket.current.close();
    }
  };

  // Agent Communication Setup
  const connectionWebSocket = useRef(null);
  const [isConnectionWebSocketConnected, setIsConnectionWebSocketConnected] = useState(false);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [language, setLanguage] = useState('English');

  // trigger lambda
  const { triggerLambda } = Translation();

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
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {communicator: "AGENT", status: "ACCEPTED", agent_lang: language}}));
      startMicStream();
      createAudioContext();
      triggerLambda("arn:aws:kinesis:us-east-1:471112798145:stream/ICS_Showcase_from_agent_audio/", "AGENT", null, language);
    }
  };

  const closeConnectionWebSocket = () => {
    if (connectionWebSocket.current && isConnectionWebSocketConnected) {
      connectionWebSocket.current.close();
    }
  };

  useEffect(() => {
    openConnectionWebSocket();
    openRawAudioWebSocket();
    openAgentAudioSocket();

    return () => {
      closeConnectionWebSocket();
      closeRawAudioWebSocket();
      closeAgentAudioSocket();
      closeAudioContext();
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
