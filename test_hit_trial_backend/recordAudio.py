import sounddevice as sd
import numpy as np
import subprocess
import wave
import os

os.environ['KVS_STREAM_NAME'] = 'ICS_Showcase_from_customer'

def record_audio(output_filename, duration=10, fs=44100):
    print("Recording...")
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='float32')
    sd.wait()  # Wait until recording is complete
    # Normalize to the range of int16 to prevent data loss in conversion
    audio_data = np.int16(recording * 32767)

    # Save the raw audio to a temporary WAV file
    temp_filename = 'temp.wav'
    with wave.open(temp_filename, 'w') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(fs)
        wf.writeframes(audio_data.tobytes())

    # Convert WAV to MKV using ffmpeg
    command = ['ffmpeg', '-y', '-i', temp_filename, output_filename]
    subprocess.run(command)

    # Remove the temporary file
    subprocess.run(['rm', temp_filename])

record_audio("output.mkv", duration=5)
