const express = require("express");
const dotenv = require("dotenv-defaults");
const safeCompare = require('safe-compare');
const sqlite3 = require('sqlite3').verbose();
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Logger = require("./logger.js");

const app = express();

// Load environment vars
dotenv.config();

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  skipSuccessfulRequests: true
});

const logger = new Logger("server");
const requestLogger = new Logger("request");
const dbLogger = new Logger("database");

app.use(helmet());
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(morgan("dev", {
  stream: {
    write: (str) => requestLogger.info(str)
  }
}));

// If no DB_FILE is specified, use an in-memory database.
const db = new sqlite3.Database(process.env.DB_FILE === "" ? ":memory:" : process.env.DB_FILE);

let cache = [];

// Initialise database
db.serialize(function() {
    db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY, 
                date DATETIME,
                sensor VARCHAR(20), 
                temperature DOUBLE, 
                humidity INTEGER
            )`);
    
    // Generate dummy data
    if(process.env.SEED_DATABASE === "true")
    {
      logger.info("Seeding database with randomly generated data.");
      ["left", "middle", "right"].forEach((sensorName) => {
        let now = new Date();
        // Generates HISTORICAL_DATA_PERIOD's days worth of data at 5 minute intervals
        for (var i = 0; i < process.env.HISTORICAL_DATA_PERIOD * 1440/5; i++) {
          now.setMinutes(now.getMinutes() - 5);
          db.run("INSERT INTO sensor_data (date, sensor, temperature, humidity) VALUES ($date, $sensor, $temperature, $humidity)", {
              $date: now.toISOString(),
              $sensor: sensorName,
              $temperature: Math.round((20 + Math.random()*5) * 10) / 10,
              $humidity: Math.round(15 + Math.floor(Math.random()*35))
          });
        }
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
  return res.json(cache);
});

app.post("/data", postLimiter, authMiddleware, (req, res) => {
  const {sensor, temperature, humidity, date} = req.body;
  // All requests must include a sensor name, temperature and humidity
  if(!sensor || !temperature || !humidity)
    return res.sendStatus(400);

  if(typeof sensor !== "string" || typeof temperature !== "number" || typeof humidity !== "number"|| typeof date !== "number")
    return res.sendStatus(400);

  db.run("INSERT INTO sensor_data (sensor, date, temperature, humidity) VALUES ($sensor, $date, $temperature, $humidity)", {
    $sensor: sensor,
    $date: date,
    $temperature: temperature,
    $humidity: humidity
  }, (err) => {
    if(err)
    {
      dbLogger.error(`Failed to insert sensor data: ${err}`);
      return res.sendStatus(500);
    }

    logger.info(`Inserted datapoint from ${sensor}: ${temperature}°C, ${humidity}%`);
    updateDataCache();
    return res.sendStatus(201);
  });
});

const updateDataCache = () => {
  db.all(`SELECT id, sensor, temperature, humidity, date FROM sensor_data WHERE datetime(date, "unixepoch") > datetime("now", "localtime", "-${process.env.HISTORICAL_DATA_PERIOD} day") ORDER BY date DESC;`, (err, rows) => {
    if(err)
      return dbLogger.error(`Failed to retrieve sensor data: ${err}`);

    cache = JSON.parse(JSON.stringify(rows));
  });
}

// Provide a warning if no API key is specified
if(process.env.API_KEY === "")
{
  const crypto = require("crypto");
  process.env.API_KEY = crypto.randomBytes(30).toString("hex");
  logger.warn(`No API key was specified. A random API key has been generated: ${process.env.API_KEY}`)
}

app.listen(process.env.PORT, () => {
  updateDataCache();
  
  logger.info(`Server listening on port ${process.env.PORT}`);
});