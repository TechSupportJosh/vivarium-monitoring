const express = require("express");
const dotenv = require("dotenv");
const safeCompare = require('safe-compare');
const sqlite3 = require('sqlite3').verbose();
const morgan = require("morgan");
const helmet = require("helmet");

const app = express();

// Load environment vars
dotenv.config();

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

const db = new sqlite3.Database(':memory:');

let cache = [];

// Initialise database
db.serialize(function() {
    db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY, 
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                sensor VARCHAR(20), 
                temperature DOUBLE, 
                humidity INTEGER
            )`);
    
    // load dummy data
    for (var i = 0; i < 0; i++) {
        db.run("INSERT INTO sensor_data (date, sensor, temperature, humidity) VALUES ($date, $sensor, $temperature, $humidity)", {
            $date: `2021-02-22 00:45:15`,
            $sensor: "cool", 
            $temperature: 20 + Math.random()*30,
            $humidity: Math.floor(Math.random()*100)
        });
      }

      db.all(`SELECT * FROM sensor_data`, (err, rows) => {
        console.log(rows);
      });
  });
  

const authMiddleware = (req, res, next) => {
  const providedAuth = req.headers["x-api-key"] ?? "";
  
  if (!safeCompare(providedAuth, process.env.API_KEY)) {
    return res.sendStatus(401);
  }

  return next();
};

app.get("/data", (req, res) => {
  return res.json(cache);
});

app.post("/data", authMiddleware, (req, res) => {
  const {sensor, temperature, humidity} = req.body;
  // All requests must include a sensor name, temperature and humidity
  if(!sensor || !temperature || !humidity)
    return res.sendStatus(400);

  if(typeof sensor !== "string" || typeof temperature !== "number" || typeof humidity !== "number")
    return res.sendStatus(400);

  db.run("INSERT INTO sensor_data (sensor, temperature, humidity) VALUES ($sensor, $temperature, $humidity)", {
    $sensor: sensor,
    $temperature: temperature,
    $humidity: humidity
  }, (err) => {
    if(err)
    {
      console.error("Error when inserting data into database", err);
      return res.sendStatus(500);
    }

    console.log(`Received datapoint from ${sensor}: ${temperature}°C, ${humidity}%`);
    updateDataCache();
    return res.sendStatus(201);
  });
});

const updateDataCache = () => {
  db.all(`SELECT * FROM sensor_data WHERE date > datetime('now', 'localtime', '-1 day');`, (err, rows) => {
    if(err)
      return console.error("Failed to retrieve sensor data.", err);

    cache = JSON.parse(JSON.stringify(rows));
  });
}

app.listen(9000, () => {
  updateDataCache();
  
  console.log("Server listening on port 9000");
});