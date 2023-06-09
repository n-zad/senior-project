const mongoose = require("mongoose");
const streamSchema = require("./StreamSchema");

let stream_model = undefined;
try {
  stream_model =
    mongoose.models["Stream"] || mongoose.model("Stream", streamSchema);
} catch (err) {
  stream_model = mongoose.model("Stream", streamSchema);
}
const streamModel = stream_model;
// const streamModel =
//   mongoose.models["Stream"] || mongoose.model("Stream", streamSchema);

const { v4: uuidv4 } = require("uuid");
const uniqueID = () => {
  return uuidv4();
};

// GET /stream/
async function getAllStreams() {
  const streams = await streamModel.find(
    {},
    {
      id: 1,
      createdAt: 1,
      name: 1,
      ended: 1,
      blobCount: 1,
    }
  );
  return streams;
}

// GET /stream?id={}&position={}
async function getStreamBlob(query) {
  const stream = await streamModel.findOne(
    {
      id: query.id,
      blobs: { $elemMatch: { position: query.position } },
    },
    { "blobs.$": 1 }
  );
  return stream;
}

// POST /stream/
async function createStream(req) {
  // delete other streams
  await deleteStreams();

  const streamId = uniqueID().slice(0, 8);
  const streamName = req.name || "";

  const newStream = new streamModel({
    id: streamId,
    name: streamName,
    blobs: [],
    blobCount: 0,
  });

  const result = await newStream.save();

  return result;
}

// UPDATE /stream/
async function updateStream(req) {
  const stream = await streamModel.findOne({ id: req.id }, { blobCount: 1 });
  const position = stream.blobCount;

  let newBlob = {
    id: req.id + "_" + position.toString(),
    position: position,
    data: req.data,
  };

  const result = await streamModel.updateOne(
    { id: req.id },
    { $push: { blobs: newBlob }, $set: { blobCount: position + 1 } }
  );

  return result;
}

// DELETE /stream/
async function deleteStreams() {
  const result = await streamModel.deleteMany();
  return result;
}

module.exports = {
  getAllStreams,
  createStream,
  updateStream,
  getStreamBlob,
};
