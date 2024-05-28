import React, { useEffect, useState, useRef } from 'react';

const AgentAudioPlayer = (wsUrl) => {
  const audioContextRef = useRef(null);
  const nextTimeRef = useRef(0);
  const socket = useRef(null);

  const createAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context initialized');
    }
  };

  const openAgentAudioSocket = async () => {
    socket.current = new WebSocket(wsUrl);
    
    createAudioContext();

    socket.current.onmessage = async (event) => {
      // console.log('CDEBUG: Message from server ', event.data);

      const data = JSON.parse(event.data);

      console.log('CDEBUG: Encoded Data', data.audio_data);

      const binaryString = window.atob(data.audio_data);
      
      // console.log('CDEBUG: Decoded Audio', binaryString);

      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode the audio data and play it
      console.log('Current audio context: ', audioContextRef.current.state);
      if (audioContextRef.current) {
        const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
        playAudio(audioBuffer);
      }
    };

    socket.current.onopen = () => {
      console.log('CDEBUG: WebSocket Connected');
    };

    socket.current.onerror = (error) => {
      console.error('CDEBUG: WebSocket Error: ', error);
    };

    socket.current.onclose = (event) => {
      console.log('CDEBUG: WebSocket Disconnected: ', event);
    };
  };

  const closeAgentAudioSocket = () => {
    if (socket.current) {
      socket.current.close();
      console.log('WebSocket closed');
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      console.log('Audio context closed');
    }
    nextTimeRef.current = 0; // Reset the nextTimeRef
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

  return { openAgentAudioSocket, closeAgentAudioSocket }
};

export default AgentAudioPlayer;
