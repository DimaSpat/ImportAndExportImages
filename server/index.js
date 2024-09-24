const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;
const mongoDB_URL = "mongodb://localhost:27017/images";

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(mongoDB_URL)
    .then(() => console.log("Connected to database"))
    .catch((error) => console.error("Error connected to database, " + error));

app.use("/api/import", require("./routes/import.route"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
