import { useEffect, useState } from "react";
import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";

const axios = require("axios");

export default function TestPage() {
  const [streamList, setStreamList] = useState(
    <div style={{ fontSize: 16 }}></div>
  );
  const [selectedStream, setSelectedStream] = useState("");
  const [currentBlob, setCurrentBlob] = useState([]);
  const [nextPos, setNextPos] = useState(0);
  const [readyBlobs, setReadyBlobs] = useState([]);

  useEffect(() => {
    if (currentBlob.length) {
      setNextPos(currentBlob[0] + 1);
    }
  }, [currentBlob]);

  useEffect(() => {
    if (nextPos > 0) {
      (async () => {
        try {
          const res = await axios.get(
            `/api/stream?id=` + selectedStream + `&position=` + nextPos
          );
          const blob = res.data.data;
          if (blob === null) {
            console.log("received the last chunk of the stream");
            return;
          }
          const audio_blob = decodeBlob(blob.data);
          setReadyBlobs((readyBlobs) => [
            ...readyBlobs,
            [blob.position, audio_blob],
          ]);
          setNextPos(blob.position + 1);
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [nextPos]);

  async function getStreams() {
    const response = await axios.get(`/api/stream`);

    if (response.data.status === "success") {
      console.log("GET request successful");
      listStreams(response.data.data);
    } else {
      console.log("err: GET request failed");
      console.log(response);
    }
  }

  async function playStream() {
    // get first blob of selected stream
    const res = await axios.get(
      `/api/stream?id=` + selectedStream + `&position=0`
    );
    const blob = res.data.data;

    // decode audio data
    const audio_blob = decodeBlob(blob.data);

    // update states
    setNextPos(1);
    setCurrentBlob([blob.position, audio_blob]);

    // play audio blob
    playAudio(audio_blob);
  }

  function playNextBlob() {
    if (!readyBlobs.length) {
      console.log("end of stream reached");
      return;
    }

    playAudio(readyBlobs[0][1]);
    readyBlobs.shift();
  }

  // ----------------------------------------
  // Helper functions
  // ----------------------------------------

  function decodeBlob(blob_data) {
    // decode audio data
    const binary_data = atob(blob_data);
    const uint8_array = new Uint8Array(
      binary_data.split("").map((char) => char.charCodeAt(0))
    );
    const audio_blob = new Blob([uint8_array], {
      type: "audio/webm; codecs=opus",
    });
    return audio_blob;
  }

  function playAudio(audio_blob) {
    // play audio blob
    const audioElement = document.getElementById("recordedAudio");
    audioElement.src = URL.createObjectURL(audio_blob);
    audioElement.volume = 1;
    audioElement.play();
  }

  // update streamList with available streams
  function listStreams(streams) {
    if (streams.length > 0) {
      let temp = [];
      streams.forEach((stream) => {
        temp.push(streamRadio(stream.id, stream.createdAt, stream.name));
      });
      setStreamList(<form>{temp}</form>);
    }
  }

  function streamRadio(stream_id, stream_date, stream_name) {
    return (
      <label key={stream_id}>
        <input
          type="radio"
          name="streams"
          id={stream_id}
          onChange={handleStreamSelection}
        ></input>
        {stream_id} : {stream_date} : {stream_name}
        <br></br>
      </label>
    );
  }

  const handleStreamSelection = (changeEvent) => {
    setSelectedStream(changeEvent.target.id);
    console.log("set selected stream to:", changeEvent.target.id);
  };

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>Recent Streams</p>
      </section>
      <div style={{ marginBottom: 20 }}>
        <button onClick={getStreams}>Pull list from database</button>
      </div>
      <div style={{ fontSize: 18, marginBottom: 20 }}>{streamList}</div>
      <div style={{ marginTop: 20 }}>
        <button onClick={playStream}>Listen to selected stream</button>
        <audio
          id="recordedAudio"
          onEnded={playNextBlob}
          style={{ marginLeft: 20 }}
        ></audio>
      </div>
    </Layout>
  );
}
