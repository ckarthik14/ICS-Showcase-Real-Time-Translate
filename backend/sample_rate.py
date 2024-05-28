from pydub import AudioSegment

def get_sample_rate(filename):
    audio = AudioSegment.from_file(filename)
    sample_rate = audio.frame_rate
    return sample_rate

# Usage
filename = 'output.mp3'
sample_rate = get_sample_rate(filename)
print(f"The sample rate of the file is: {sample_rate} Hz")
