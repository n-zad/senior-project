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
  blobs: [
    {
      id: {
        type: String,
        required: true,
      },
      position: {
        type: Number,
        require: true,
      },
      data: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = streamSchema;
