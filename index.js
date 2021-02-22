const express = require("express");
const dotenv = require("dotenv");
const safeCompare = require('safe-compare');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Load environment vars
dotenv.config();

app.use(express.json());

const db = new sqlite3.Database(':memory:');

// Initialise database
db.serialize(function() {
    db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY, 
                sensor VARCHAR(20), 
                temperature DOUBLE, 
                humidity INTEGER
            )`);
    
    // load dummy data
    for (var i = 0; i < 0; i++) {
        db.run("INSERT INTO sensor_data (sensor, temperature, humidity) VALUES ($sensor, $temperature, $humidity)", {
            $sensor: "cool", 
            $temperature: 20 + Math.random()*30,
            $humidity: Math.floor(Math.random()*100)
        });
    }
  });
  

const authMiddleware = (req, res, next) => {
  const providedAuth = req.headers["x-api-key"] ?? "";
  
  if (!safeCompare(providedAuth, process.env.API_KEY)) {
    return res.sendStatus(401);
  }

  return next();
};

app.get("/data", (req, res) => {
  // TODO: Add cache
  db.all("SELECT * FROM sensor_data", (err, rows) => {
    if(err)
      return res.sendStatus(500);

    return res.json(rows);
  });
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
    return res.sendStatus(201);
  });
});

app.listen(9000, () => {
  console.log("Server listening on port 9000");
});