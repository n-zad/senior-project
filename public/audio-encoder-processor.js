// audio-encoder-processor.js
import { createMp3Encoder } from "wasm-media-encoders";

class AudioEncoderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    // take the first input
    const audioData = inputs[0];

    // create encoder and encode each channel
    const encodedData = createMp3Encoder().then((encoder) => {
      encoder.configure({
        sampleRate: 48000,
        channels: 2,
        vbrQuality: 2,
      });

      let outBuffer = new Uint8Array(1024 * 1024);
      let offset = 0;
      let moreData = true;
      let channel_index = 0;

      while (true) {
        const mp3Data = moreData
          ? encoder.encode(audioData[channel_index])
          : /* finalize() returns the last few frames */
            encoder.finalize();

        /* mp3Data is a Uint8Array that is still owned by the encoder and MUST be copied */

        if (mp3Data.length + offset > outBuffer.length) {
          const newBuffer = new Uint8Array(mp3Data.length + offset);
          newBuffer.set(outBuffer);
          outBuffer = newBuffer;
        }

        outBuffer.set(mp3Data, offset);
        offset += mp3Data.length;

        if (!moreData) {
          break;
        } else if (channel_index >= audioData.length()) {
          moreData = false;
        }
      }

      return new Uint8Array(outBuffer.buffer, 0, offset);
    });

    this.port.postMessage(encodedData);

    return true;
  }
}

registerProcessor("audio-encoder-processor", AudioEncoderProcessor);
