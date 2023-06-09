const mongoose = require("mongoose");

// Creating Post Schema
const streamSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
  name: {
    type: String,
    default: "",
  },
  ended: {
    type: Boolean,
    default: false,
  },
  blobs: [
    {
      _id: {
        type: String,
        required: true,
      },
      position: {
        type: Number,
        required: true,
      },
      data: {
        type: String,
        required: true,
      },
    },
  ],
  blobCount: {
    type: Number,
    default: 0,
  },
});

module.exports = streamSchema;
