import { useState, useEffect } from "react";
import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";

export default function TestPage() {
  // define states
  const [streamingStatus, setStreamingStatus] = useState(false);
  const [audioStream, setAudioStream] = useState();
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [audioRecorder, setAudioRecorder] = useState();
  const [chunks, setChunks] = useState([]);

  // console.log chunks when it is updated
  useEffect(() => {
    console.log(chunks);
  }, [chunks]);

  // ----------------------------------------
  // AudioStream
  // ----------------------------------------

  // function to request permission to microphone and start audio stream
  async function startStream() {
    if (!streamingStatus) {
      // get user media
      await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          /* use the stream */
          setAudioStream(stream);
        })
        .catch((err) => {
          /* handle the error */
          console.error(`${err.name}: ${err.message}`);
        });
    } else {
      audioStream.getTracks()[0].enabled = true;
    }
    setStreamingStatus(true);
    console.log("start stream");
  }

  // function to end audio stream
  function endStream() {
    audioStream.getTracks()[0].enabled = false;
    setStreamingStatus(false);
    console.log("end stream");
  }

  // ----------------------------------------
  // AudioRecorder
  // ----------------------------------------

  // function to create MediaRecorder and start recording
  function startRecorder() {
    if (["recording", "paused"].includes(recordingStatus)) {
      console.log("no-op, audio recorder has already started");
      return;
    }

    // reset chunks if not-empty
    if (chunks) {
      setChunks([]);
    }

    // check if MediaRecorder object was already created
    if (!audioRecorder) {
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm; codecs=opus",
        audioBitsPerSecond: 256000,
      });
      mediaRecorder.addEventListener("dataavailable", (e) => {
        setChunks((chunks) => [...chunks, e.data]);
        console.log("chunk pushed!");
      });
      mediaRecorder.start(1000);
      setAudioRecorder(mediaRecorder);
    } else {
      // start recording
      audioRecorder.start(1000);
    }
    setRecordingStatus("recording");
    console.log("start recording");
  }

  // function to stop recording
  function stopRecorder() {
    if (recordingStatus == "inactive") {
      console.log("no-op, audio recorder has already stopped");
      return;
    }

    audioRecorder.stop();
    setRecordingStatus("inactive");

    console.log("stop recording");
  }

  // function to pause/play recording
  function pauseRecorder() {
    if (audioRecorder.state == "paused") {
      audioRecorder.resume();
      setRecordingStatus("recording");
      console.log("audio recorder has resumed");
    } else if (audioRecorder.state == "recording") {
      audioRecorder.pause();
      setRecordingStatus("paused");
      console.log("audio recorder has paused");
    } else {
      console.log("no-op, audio recorder is inactive");
    }
  }

  // ----------------------------------------
  // WASM Media Encoder
  // ----------------------------------------

  // async function encodeChunk(blob) {}

  // ----------------------------------------
  // AudioWorklet
  // ----------------------------------------

  // async function processAudio() {
  //   const audioContext = new AudioContext();

  //   try {
  //     await audioContext.audioWorklet.addModule("/audio-encoder-processor.js");
  //   } catch (error) {
  //     console.log(error);
  //     return;
  //   }

  //   console.log("added AudioWorklet module");

  //   const mediaStreamSource = audioContext.createMediaStreamSource(audioStream);
  //   const audioWorkletNode = new AudioWorkletNode(
  //     audioContext,
  //     "audio-encoder-processor"
  //   );

  //   console.log("created AudioWorkletNode");

  //   audioWorkletNode.port.onmessage = (event) => {
  //     const encodedData = event.data;
  //     console.log(encodedData);
  //     // append encodedData to a buffer or send it to a server
  //   };

  //   mediaStreamSource.connect(audioWorkletNode);
  //   audioWorkletNode.connect(audioContext.destination);
  // }

  // ----------------------------------------
  // Helper functions
  // ----------------------------------------

  function displayStreamingStatus(state) {
    let res = state ^ streamingStatus;
    if (!res) {
      return "True";
    } else {
      return "False";
    }
  }

  // play audio that was just recorded
  function playAudio() {
    const superBlob = new Blob(chunks, { type: "audio/webm; codecs=opus" });
    const audioElement = document.getElementById("recordedAudio");
    audioElement.src = URL.createObjectURL(superBlob);
    audioElement.controls = true;
  }

  // ----------------------------------------
  // returned Layout
  // ----------------------------------------

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>Test Page</p>
      </section>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <button onClick={startStream}>
          Start Audio Stream ({displayStreamingStatus(true)})
        </button>
        <button onClick={endStream} style={{ marginLeft: 20 }}>
          End Audio Stream ({displayStreamingStatus(false)})
        </button>
      </div>
      <div style={{ fontSize: 16 }}>
        Recording Status: <strong>{recordingStatus}</strong>
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={startRecorder}>Start Recording</button>
        <button onClick={pauseRecorder} style={{ marginLeft: 20 }}>
          Resume/Pause Recording
        </button>
        <button onClick={stopRecorder} style={{ marginLeft: 20 }}>
          Stop Recording
        </button>
      </div>
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        {chunks.length} chunks (blobs) have been recorded.
      </div>
      <div>
        <button onClick={playAudio}>Play Recorded Audio</button>
        <br></br>
        <audio id="recordedAudio" style={{ marginTop: 5 }}></audio>
      </div>
    </Layout>
  );
}
