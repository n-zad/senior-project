import { useState } from "react";
import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";

const axios = require("axios");

export default function TestPage() {
  const [streams, setStreams] = useState([]);
  const [streamList, setStreamList] = useState(
    <div style={{ fontSize: 16 }}></div>
  );
  const [selectedStream, setSelectedStream] = useState("");

  async function getStreams() {
    const response = await axios.get(`/api/stream`);

    if (response.data.status === "success") {
      console.log("GET request successful");
      listStreams(response.data.data);
      setStreams(response.data.data);
      console.log(response.data.data);
    } else {
      console.log("err: GET request failed");
      console.log(response);
    }
  }

  function playStream() {
    // find selected stream
    let blob_data;
    streams.forEach((stream) => {
      if (stream.id === selectedStream) {
        console.log("playing stream:", stream.id);
        blob_data = stream.blobs[0].data;
      }
    });

    const binary_data = atob(blob_data);
    const uint8_array = new Uint8Array(
      binary_data.split("").map((char) => char.charCodeAt(0))
    );

    const audio_blob = new Blob([uint8_array], {
      type: "audio/webm; codecs=opus",
    });

    const audioElement = document.getElementById("recordedAudio");
    audioElement.src = URL.createObjectURL(audio_blob);
    audioElement.controls = true;
  }

  // ----------------------------------------
  // Helper functions
  // ----------------------------------------

  // update streamList with available streams
  function listStreams(streams) {
    if (streams.length > 0) {
      let temp = [];
      streams.forEach((stream) => {
        temp.push(streamRadio(stream.id, stream.createdAt));
      });
      setStreamList(<form>{temp}</form>);
    }
  }

  function streamRadio(stream_id, stream_date) {
    return (
      <label key={stream_id}>
        <input
          type="radio"
          name="streams"
          id={stream_id}
          onChange={handleStreamSelection}
        ></input>
        {stream_id} : {stream_date}
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
        <audio id="recordedAudio" style={{ marginLeft: 20 }}></audio>
      </div>
    </Layout>
  );
}
