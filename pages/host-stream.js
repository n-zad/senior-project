import { useState, useEffect } from "react";
import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";

const axios = require("axios");

export default function TestPage() {
  // states
  const [stream, setStream] = useState();
  const [recorder, setRecorder] = useState();
  const [blobs, setBlobs] = useState();
  const [prevBlobs, setPrevBlobs] = useState();
  const [streamId, setStreamId] = useState("");

  // set up mediaStream
  useEffect(() => {
    async function setupStream() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setStream(stream);
    }
    setupStream();
  }, []);

  // set up recorder when stream is available
  useEffect(() => {
    if (stream !== undefined) {
      console.log("stream: ", stream);
      setupRecorder();
    }
  }, [stream]);

  // print recorder when it is available
  useEffect(() => {
    if (recorder !== undefined) {
      console.log("recorder: ", recorder);
    }
  }, [recorder]);

  // print streamId when it is available
  useEffect(() => {
    if (streamId !== "") {
      console.log("streamId: ", streamId);
    }
  }, [streamId]);

  // check when the audio blobs are updated
  useEffect(() => {
    if (blobs !== undefined) {
      // if there are 2 blobs, start recorder again
      if (blobs.length == 2) {
        setPrevBlobs(blobs);
        setBlobs([]);
        recorder.start(1000);
      }
    }
  }, [blobs]);

  // upload prevBlobs to database when available
  useEffect(() => {
    if (prevBlobs !== undefined) {
      const superBlob = new Blob(prevBlobs, {
        type: "audio/webm; codecs=opus",
      });
      uploadStream(superBlob);
    }
  }, [prevBlobs]);

  // create mediaRecorder
  function setupRecorder() {
    // set up audio context
    const audioContext = new AudioContext();
    const audioInput = audioContext.createMediaStreamSource(stream);
    const dest = audioContext.createMediaStreamDestination();
    audioInput.connect(dest);

    // set up audio recorder
    const mediaRecorder = new MediaRecorder(dest.stream, {
      mimeType: "audio/webm; codecs=opus",
      audioBitsPerSecond: 256000,
    });
    mediaRecorder.onstop = function stop() {
      // recorder has stopped
    };
    mediaRecorder.ondataavailable = function dataavailable(e) {
      setBlobs((blobs) => [...blobs, e.data]);
      mediaRecorder.stop();
    };

    setRecorder(mediaRecorder);
  }

  // create stream in database
  async function createStream(stream_name) {
    const response = await axios.post(`/api/stream`, {
      name: stream_name,
    });
    if (response.data.status == "success") {
      console.log("audio stream successfully stored in the database");
      setStreamId(response.data.data.id);
    } else {
      console.log("err: POST request failed");
    }
  }

  // upload stream recording to database
  async function uploadStream(blob) {
    const reader = new FileReader();
    reader.onload = async () => {
      const audio_array_buffer = reader.result;
      const audio_data = new Uint8Array(audio_array_buffer);
      const audio_data_base64 = btoa(String.fromCharCode(...audio_data));

      const response = await axios.patch(`/api/stream`, {
        id: streamId,
        data: audio_data_base64,
      });
      if (response.data.status !== "success") {
        console.log("err: PATCH request failed");
      }
    };
    try {
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      console.log("error reading audio blob: ", err);
    }
  }

  async function start() {
    // create stream in database and start recording audio
    await createStream("stream1");
    setBlobs([]);
    recorder.start(1000);
  }

  async function end() {
    // stop recording audio
    recorder.stop();
    console.log("ended stream");
  }

  // page content
  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>Start Streaming</p>
      </section>
      <div style={{ position: "relative" }}>
        <button onClick={start}>Start</button>
        &emsp;&emsp;
        <button onClick={end}>End</button>
      </div>
      <div>
        <audio id="audio"></audio>
      </div>
    </Layout>
  );
}
