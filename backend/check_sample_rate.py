from pydub import AudioSegment

def check_audio_properties(filename):
    # Load the audio file
    audio = AudioSegment.from_file(filename)

    # Get the sample rate
    sample_rate = audio.frame_rate

    # Check PCM encoding based on sample_width
    sample_width = audio.sample_width
    is_pcm_encoded = sample_width in (1, 2, 4)

    channels = audio.channels
    return sample_rate, is_pcm_encoded, channels

# Example usage
filename = 'test.mp3'
try:
    sample_rate, is_pcm_encoded, channels = check_audio_properties(filename)
    print(f"The sample rate of the file is: {sample_rate} Hz")
    print(f"The file has {channels} channel(s).")
    if is_pcm_encoded:
        print("The file is PCM encoded.")
    else:
        print("The file is not PCM encoded or uses compression.")
except Exception as e:
    print(f"Error processing the WAV file: {e}")