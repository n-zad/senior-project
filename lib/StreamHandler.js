const mongoose = require("mongoose");
const streamSchema = require("./StreamSchema");

const streamModel =
  mongoose.models["Stream"] || mongoose.model("Stream", streamSchema);

const { v4: uuidv4 } = require("uuid");
const uniqueID = () => {
  return uuidv4();
};

// GET /stream/
async function getAllStreams() {
  let streams = await streamModel.find();
  return streams;
}

// POST /stream/
async function createStream(stream) {
  const streamId = uniqueID().slice(0, 8);

  const newStream = new streamModel({
    id: streamId,
    blobs: [
      {
        id: streamId,
        position: 0,
        data: stream.data,
      },
    ],
  });

  const result = await newStream.save();

  return result;
}

// GET /stream/{id}
async function getStreamById(id) {
  const stream = await streamModel.findById({ id: id });
  return stream;
}

// DELETE /stream/{id}
async function deleteStreamById(stream) {
  const result = await streamModel.deleteOne({ id: stream.id });
  return result;
}

module.exports = {
  getAllStreams,
  createStream,
  getStreamById,
  deleteStreamById,
};
