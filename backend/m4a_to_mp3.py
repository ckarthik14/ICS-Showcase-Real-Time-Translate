from pydub import AudioSegment

def convert_m4a_to_mp3(m4a_file_path, mp3_file_path):
    # Load M4A file
    audio = AudioSegment.from_file(m4a_file_path, format="m4a")

    # Convert to MP3
    audio.export(mp3_file_path, format="mp3")

# Example usage
m4a_file_path = "test.m4a"
mp3_file_path = "test.mp3"

convert_m4a_to_mp3(m4a_file_path, mp3_file_path)
