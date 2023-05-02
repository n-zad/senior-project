const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// dotenv.config();

// Initializing DB Connection
let dbConnection;

function createDbConnection() {
  if (!dbConnection) {
    const uri = process.env.MONGODB_URI;
    const opts = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    };
    dbConnection = mongoose.connect(uri, opts).then((err) => {
      console.log(err);
    });
  }
}

module.exports = {
  createDbConnection,
};
