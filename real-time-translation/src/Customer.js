import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Box, Grid, Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import customerImage from './assets/customer.png';
import MicrophoneStream from 'microphone-stream';

function Customer() {
  // phone call socket
  const connectionWebSocket = useRef(null);
  const [isConnectionWebSocketConnected, setIsConnectionWebSocketConnected] = useState(false);

  const rawAudioWebSocket = useRef(null);
  const [isRawAudioWebSocketConnected, setIsRawAudioWebSocketConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleChange = (event) => {
    setLanguage(event.target.value);
  };


  const openConnectionWebSocket = () => {
    if (connectionWebSocket.current) return;

    connectionWebSocket.current = new WebSocket('wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=CUSTOMER&connectionType=PHONE_CALL');
    
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
        setIsCallConnecting(false);
        startTranslationAlt();
      }
    };

    connectionWebSocket.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnectionWebSocketConnected(false);
      setIsCallConnecting(false);
      setIsCallConnected(false);
    };
  };


  const openRawAudioWebSocket = () => {
    if (rawAudioWebSocket.current) return;

    rawAudioWebSocket.current = new WebSocket('wss://encgiyvrte.execute-api.us-east-1.amazonaws.com/dev/?communicator=CUSTOMER_RAW&connectionType=RAW_AUDIO');
    
    rawAudioWebSocket.current.onopen = () => {
      console.log('Raw Audio WebSocket Connected');
    };

    rawAudioWebSocket.current.onmessage = () => {
    };

    rawAudioWebSocket.current.onclose = () => {
      console.log('Raw Audio WebSocket Disconnected');
    };
  };



  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        // The result attribute contains the data as a base64-encoded string
        let base64String = reader.result;
        // To extract the base64 string, you might want to remove the prefix
        // e.g., 'data:audio/webm;base64,' to get only the base64 data
        console.log(base64String);
        base64String = base64String.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => {
        reject(error);
      };
    });
  }

  const startTranslation = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported on this browser!');
        setIsRecording(false);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.addEventListener('dataavailable', async event => {
            if (event.data.size > 0 && rawAudioWebSocket.current.readyState === WebSocket.OPEN) {
              console.log("Audio blob: ", event.data);
              const base64String = await blobToBase64(event.data); // Convert ArrayBuffer to Base64

              console.log("Base64 audio data created and sending via WebSocket");
              rawAudioWebSocket.current.send(JSON.stringify({
                  action: 'rawAudio',
                  message: { communicator: "CUSTOMER_RAW", audio_data: base64String }
              }));
            }
        });

        mediaRecorderRef.current.start(1000); // Collect 1 second chunks of audio
        setIsRecording(true);
    } catch (err) {
        console.error('Failed to start recording:', err);
        setIsRecording(false); // Ensure recording state is off if setup fails
    }
};

const startTranslationAlt = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported on this browser!');
      setIsRecording(false);
      return;
  }

  try {
    const stream = await getUserMedia({ audio: true, video: false });
    const micStream = new MicrophoneStream();
    micStreamRef.current = micStream;
    micStream.setStream(stream);

    micStream.on('data', (chunk) => {
        const raw = MicrophoneStream.toRaw(chunk); // Convert chunk to raw audio data
        if (rawAudioWebSocket.current.readyState === WebSocket.OPEN) {
            // Convert raw audio to base64 string
            const base64String = btoa(String.fromCharCode(...new Uint8Array(raw)));
            rawAudioWebSocket.current.send(JSON.stringify({
                action: 'rawAudio',
                message: { communicator: "CUSTOMER_RAW", audio_data: base64String }
            }));
        }
    });

    micStream.on('format', (format) => {
        console.log('Audio format:', format);
    });

    setIsRecording(true);
} catch (error) {
    console.error('Failed to start recording:', error);
}
};


const stopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop(); // This triggers the 'ondataavailable' event
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    }
};

  const initiateCall = () => {
    if (connectionWebSocket.current) {
      setIsCallConnecting(true);
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {communicator: "CUSTOMER", status: "INITIALISED"}}));
    }
  };

  const closeConnectionWebSocket = () => {
    if (connectionWebSocket.current && isConnectionWebSocketConnected) {
      connectionWebSocket.current.close();
    }
  };

  const closeRawAudioWebSocket = () => {
    if (rawAudioWebSocket.current && isRawAudioWebSocketConnected) {
      rawAudioWebSocket.current.close();
    }
  };

  useEffect(() => {
    openConnectionWebSocket();
    openRawAudioWebSocket();

    return () => {
      closeConnectionWebSocket();
      closeRawAudioWebSocket();
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
