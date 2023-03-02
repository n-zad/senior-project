# senior-project
Live Streaming platform for music artists and bands

The streaming process:
- Use navigator.mediaDevices.getUserMedia() to get permissions from the user to record audio from their microphone.  
- Encode the recorded audio using Web Assembly, currently looking at wasm-media-encoders as the way to do that, although using built-in AudioContext and MediaRecorder may be easier.  
- Split the encoded audio into chunks and generate an M3U8 playlist.  
- Serve the data (encoded audio segments and index file) to the user using API functionality provided by Next.js.  
- Play the audio using hls.js.  
