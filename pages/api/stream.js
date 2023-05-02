const StreamHandler = require("../../lib/StreamHandler");
const DatabaseHandler = require("../../lib/DatabaseHandler");
DatabaseHandler.createDbConnection();

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Process a POST request
    // store audio blob with blobs from the same stream

    const newStream = await StreamHandler.createStream(req.body);
    res.status(201).json({
      status: "success",
      data: newStream,
    });
  } else if (req.method === "GET") {
    // Process a GET request
    // get the requested blob

    // for now return all streams
    const streams = await StreamHandler.getAllStreams();
    res.status(200).json({
      status: "success",
      data: streams,
    });
  } else if (req.method === "DELETE") {
    // Process a DELETE request
    // delete stream by ID

    if (req.body["id"] === null) {
      res.status(500).json({
        status: "failure, no id field in request body...",
        data: req.body,
      });
      return;
    }

    const result = await StreamHandler.deleteStreamById(req.body);
    if (result.deletedCount == 1) {
      res.status(200).json({
        status: "success",
        data: { result },
      });
    } else {
      res.status(404).json({
        status: "failure",
        data: { result },
      });
    }
  } else {
    // Handle any other HTTP method
    res.status(400).json({});
  }
}
