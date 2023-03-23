import { useState, useEffect } from "react";
import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";

export default function TestPage() {
  // define states
  const [audioDevices, setAudioDevices] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState([]);
  const [streamingStatus, setStreamingStatus] = useState(false);
  const [audioStreams, setAudioStreams] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [audioRecorder, setAudioRecorder] = useState();
  const [chunks, setChunks] = useState([]);

  // update audioDevices when permision is given to include device names
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((device_info_arr) => {
      let temp = [];
      device_info_arr.forEach((deviceInfo) => {
        if (deviceInfo.kind == "audioinput") {
          temp.push(deviceInfo);
        }
      });
      setAudioDevices(temp);
    });
  }, [permissionStatus]);

  useEffect(() => {
    console.log("audio streams: ", audioStreams);
  }, [audioStreams]);

  // console.log chunks when it is updated
  useEffect(() => {
    console.log(chunks);
  }, [chunks]);

  // ----------------------------------------
  // AudioStream
  // ----------------------------------------

  // function to create audio streams for each audio device
  async function getAudioDevices() {
    if (permissionStatus.length > 0) {
      console.log("no-op, already have permission...");
      return;
    }

    // get audio stream for each deviceId
    audioDevices.forEach(async (deviceInfo) => {
      await getAudioDevice(deviceInfo.deviceId).then(() => {
        setPermissionStatus((permissionStatus) => [
          ...permissionStatus,
          deviceInfo.deviceId,
        ]);
      });
    });
  }

  async function getAudioDevice(deviceInfo) {
    // get user media
    await navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: deviceInfo,
        },
      })
      .then((stream) => {
        /* use the stream */
        stream.getTracks()[0].enabled = false;
        setAudioStreams((audioStreams) => [...audioStreams, stream]);
      })
      .catch((err) => {
        /* handle the error */
        console.error(`${err.name}: ${err.message}`);
      });
  }

  // function to start audio streams
  async function startStreams() {
    // **assume user uses all audio input devices for now**
    // if (!deviceOptions) {
    //   console.log("select which devices to stream");
    //   console.log(audioStreams);
    // }

    if (!streamingStatus) {
      audioStreams.forEach((stream) => {
        stream.getTracks()[0].enabled = true;
      });
      setStreamingStatus(true);
      console.log("start stream with %d devices", audioStreams.length);
    } else {
      console.log("no-op, stream already started...");
    }
  }

  // function to end audio stream
  function endStream() {
    if (streamingStatus) {
      audioStreams.forEach((stream) => {
        stream.getTracks()[0].enabled = false;
      });
      setStreamingStatus(false);
      console.log("end stream with %d devices", audioStreams.length);
    } else {
      console.log("no-op, stream already ended...");
    }
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
      // run old code if there's only 1 audio input device
      if (audioStreams.length == 1) {
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
        // merge audio streams using audio context
        const audioContext = new AudioContext();

        const audioIn = [];
        audioStreams.forEach((stream) => {
          audioIn.push(audioContext.createMediaStreamSource(stream));
        });

        const dest = audioContext.createMediaStreamDestination();

        audioIn.forEach((audioInput) => {
          audioInput.connect(dest);
        });

        const mediaRecorder = new MediaRecorder(dest.stream, {
          mimeType: "audio/webm; codecs=opus",
          audioBitsPerSecond: 256000,
        });
        mediaRecorder.addEventListener("dataavailable", (e) => {
          setChunks((chunks) => [...chunks, e.data]);
          console.log("chunk pushed!");
        });
        mediaRecorder.start(1000);
        setAudioRecorder(mediaRecorder);
      }
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
      <div style={{ marginBottom: 20 }}>
        <button onClick={getAudioDevices}>
          Allow Permission to Audio Input Devices
        </button>
      </div>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <button onClick={startStreams}>
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
