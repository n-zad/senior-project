const StreamHandler = require("../../lib/StreamHandler");
const DatabaseHandler = require("../../lib/DatabaseHandler");
DatabaseHandler.createDbConnection();

export default async function handler(req, res) {
  if (req.method === "POST") {
    // POST request:
    // - create stream and store metadata

    const newStream = await StreamHandler.createStream(req.body);
    res.status(201).json({
      status: "success",
      data: newStream,
    });
  } else if (req.method === "PATCH") {
    // PATCH request:
    // - store audio blob within stream object

    const result = await StreamHandler.updateStream(req.body);
    res.status(201).json({
      status: "success",
      data: result,
    });
  } else if (req.method === "GET") {
    // GET request: (two options)
    // - get the requested blob
    // - or return metadata for all streams

    // if stream ID and blob position are given return blob
    if (req.query["position"] !== undefined) {
      const stream = await StreamHandler.getStreamBlob(req.query);
      if (stream === null) {
        res.status(200).json({
          status: "failure, blob not found at the specified position",
          data: null,
        });
      } else {
        res.status(200).json({
          status: "success",
          data: stream.blobs[0],
        });
      }
    } else {
      // otherwise return all streams
      const streams = await StreamHandler.getAllStreams();
      res.status(200).json({
        status: "success",
        data: streams,
      });
    }
  } else {
    // Respond to any other HTTP method with BAD REQUEST status code
    res.status(400).json({});
  }
}
