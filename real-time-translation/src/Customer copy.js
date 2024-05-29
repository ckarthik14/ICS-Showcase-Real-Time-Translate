import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Box, Grid, Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import customerImage from './assets/customer.png';

import lamejs from 'lamejs';
import Translation from './Translation';

function Customer() {
  // phone call socket
  const connectionWebSocket = useRef(null);
  const [isConnectionWebSocketConnected, setIsConnectionWebSocketConnected] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);

  // transmit raw audio
  const rawAudioWebSocket = useRef(null);
  const [isRawAudioWebSocketConnected, setIsRawAudioWebSocketConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const micStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const firstSeqNumRef = useRef(null);
  const audioContext = useRef(null);

  // trigger lambda
  const { triggerLambda } = Translation();

  // languages
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
        triggerLambda("arn:aws:kinesis:us-east-1:471112798145:stream/ICS_Showcase_from_customer_audio_final", "CUSTOMER");
        startMicStream();
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

    rawAudioWebSocket.current.onmessage = async (event) => {
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

              rawAudioWebSocket.current.send(JSON.stringify({
                  action: 'rawAudio',
                  message: { "communicator": "CUSTOMER_RAW", "audio_data": base64String }
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


  const setupAudioProcessing = (stream) => {
    const source = audioContext.current.createMediaStreamSource(stream);
    const processor = audioContext.current.createScriptProcessor(4096, 1, 1); // buffer size, input channels, output channels

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
                  message: { "communicator": "CUSTOMER_RAW", "audio_data": base64data }
              }));
          };
          reader.readAsDataURL(blob);
      }
    };
  
    source.connect(processor);
    processor.connect(audioContext.current.destination);
  };


  const startMicStream = async () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(setupAudioProcessing)
        .catch(err => console.error('Error accessing the microphone:', err));
  }

  const initiateCall = () => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000 // setting the sample rate to 16kHz
    });

    if (connectionWebSocket.current) {
      setIsCallConnecting(true);
      connectionWebSocket.current.send(JSON.stringify({ action: 'sendMessage', message: {communicator: "CUSTOMER", status: "INITIALISED", customer_lang: language}}));
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
    firstSeqNumRef.current = null;

    return () => {
      closeConnectionWebSocket();
      closeRawAudioWebSocket();
      
      if (audioContext.current) {
        audioContext.current.close().then(() => {
            console.log('AudioContext closed');
            audioContext = null;  // Set to null if you keep a reference in a variable
        });
      }
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
