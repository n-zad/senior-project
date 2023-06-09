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
  // additional states for the "complex version"
  const [audioDevices, setAudioDevices] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState([]);
  const [deviceList, setDeviceList] = useState(
    <div style={{ fontSize: 16 }}>
      (need device permissions in order to list devices)
    </div>
  );
  const [audioStreams, setAudioStreams] = useState([]);
  const [deviceStream, setDeviceStream] = useState([]); // state to pair deviceId to audioStream
  const [streamingStatus, setStreamingStatus] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [recordingLength, setRecordingLength] = useState(0);

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
        setRecordingLength((recordingLength) => recordingLength + 1);
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

      // also update the list of available devices shown to the user
      listDevices(temp);
    });
  }, [permissionStatus]);

  // --------------------
  //   Stream Functions
  // --------------------

  // create mediaRecorder
  function setupRecorder() {
    // set up audio context
    const audioContext = new AudioContext();
    const audioIn = [];
    audioStreams.forEach((stream) => {
      audioIn.push(audioContext.createMediaStreamSource(stream));
    });
    const dest = audioContext.createMediaStreamDestination();
    audioIn.forEach((audioInput) => {
      audioInput.connect(dest);
    });

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
    if (!streamingStatus) {
      console.log("no-op, audio device recording has not been started yet");
      return;
    }

    // create stream in database and start recording audio
    await createStream("stream1");
    setBlobs([]);
    recorder.start(1000);
    setRecordingStatus("recording");
  }

  async function end() {
    if (recordingStatus === "inactive") {
      console.log("no-op, there is no stream running currently");
      return;
    }

    // stop recording audio
    recorder.stop();
    console.log("ended stream");
    setRecordingStatus("inactive");
    setRecordingLength(0);
  }

  // -------------------------------
  //   "Complex Version" Functions
  // -------------------------------

  // function to get recording permission for each audio device
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

        // add deviceId / audioStream pair
        setDeviceStream((deviceStream) => [
          ...deviceStream,
          [deviceInfo, stream],
        ]);
      })
      .catch((err) => {
        /* handle the error */
        console.error(`${err.name}: ${err.message}`);
      });
  }

  // update deviceList with available devices
  function listDevices(devices) {
    if (permissionStatus.length > 0) {
      let temp = [];
      devices.forEach((deviceInfo) => {
        temp.push(deviceCheckbox(deviceInfo.deviceId, deviceInfo.label));
      });
      setDeviceList(<div>{temp}</div>);
    }
  }

  function deviceCheckbox(device_id, device_name) {
    return (
      <div key={device_id}>
        <input type="checkbox" id={device_id}></input> {device_name}
        <br></br>
      </div>
    );
  }

  // function to start audio streams
  async function startStreams() {
    if (!streamingStatus) {
      let devices = [];
      audioStreams.forEach((stream) => {
        let device = "";
        deviceStream.forEach((pair) => {
          if (pair[1].id == stream.id) {
            device = pair[0];
          }
        });
        let checkbox = document.getElementById(device);
        if (checkbox.checked) {
          stream.getTracks()[0].enabled = true;
          devices.push(device);
        }
      });
      if (devices.length > 0) {
        setStreamingStatus(true);
        setStream(audioStreams);
        console.log("start stream with devices: %s", devices);
      } else {
        console.log("no-op, no audio devices selected...");
      }
    } else {
      console.log("no-op, stream already started...");
    }
  }

  // function to end audio stream
  function endStream() {
    if (streamingStatus) {
      if (recordingStatus === "recording") {
        console.log("no-op, stream in progress");
        return;
      }

      let runningStreams = 0;
      audioStreams.forEach((stream) => {
        if (stream.getTracks()[0].enabled) {
          runningStreams++;
        }
        stream.getTracks()[0].enabled = false;
      });
      setStreamingStatus(false);
      console.log("end stream with %d devices", runningStreams);
    } else {
      console.log("no-op, stream already ended...");
    }
  }

  function displayStreamingStatus(state) {
    let res = state ^ streamingStatus;
    if (!res) {
      return "True";
    } else {
      return "False";
    }
  }

  // -------------------
  //   Returned Layout
  // -------------------

  // page content
  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>Start Stream (complex version)</p>
      </section>
      <div style={{ marginBottom: 20 }}>
        <button onClick={getAudioDevices}>
          Allow Permission to Record Audio Input Devices
        </button>
      </div>
      <div style={{ fontSize: 18, marginBottom: 20 }}>
        Available Audio Input Devices:<br></br>
        {deviceList}
      </div>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <button onClick={startStreams}>
          Start Recording Audio ({displayStreamingStatus(true)})
        </button>
        <button onClick={endStream} style={{ marginLeft: 20 }}>
          Stop Recording Audio ({displayStreamingStatus(false)})
        </button>
      </div>
      <div style={{ fontSize: 16, marginBottom: 5 }}>
        Recording Status: <strong>{recordingStatus}</strong>
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={start}>Start</button>
        &emsp;&emsp;
        <button onClick={end}>End</button>
      </div>
      <div style={{ fontSize: 16, marginTop: 5 }}>
        Stream Duration: <strong>{recordingLength} seconds</strong>
      </div>
      <div>
        <audio id="audio"></audio>
      </div>
    </Layout>
  );
}
