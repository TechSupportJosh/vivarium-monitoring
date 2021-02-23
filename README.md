# Vivarium Monitoring
A vivarium usually requires specific temperatures at specific times, to simulate environments that reptiles commonly live in. Therefore, many reptile owners use digital thermometers and hygrometers to monitor their vivarium temperatures. I wanted something that would allow me to check my vivarium's temperature/humidity wherever I was. I also wanted something with the ability to setup alerts in the event that the temperatures drop below a specific level. 

While there are a range of products available for this specific purpose, commonly they all come with one or many of these flaws:
- Inaccurate temperature / humidity reporting
- Poorly designed mobile applications
- Lack of / poorly designed alert system
- WiFi access requiring a smart hub

After much research, I found Xiaomi's Mijia BLE Temperature and Humidity sensors (LYWSD03MMC). These sensors are fairly cheap at around £4 from AliExpress (or £7 from Amazon), fairly accurate and can be flashed with [custom firmware](https://github.com/pvvx/ATC_MiThermometer) to remove the requirement to use Xiaomi smart hubs to read their data.

There is also some great Python libraries such as [MiTemperature2](https://github.com/JsBergbau/MiTemperature2) which allow you to read the temperature/humidity through Bluetooth. This library, paired with a Raspberry Pi Zero W, means we can regularly receive data from each of the sensors and send it to whatever service you want.

Which leads us to this project. 

To provide access anywhere to the data, I have a NodeJS application which provides a web interface to view the current state of all sensors and graphs the last 24 hours of data for monitoring. It also provides an interface which allows sending of alerts (through email, notifications, etc.) when specific temperatures/humidities reach certain levels. A web application means that any device connected to the internet can access the state of the sensors and is not restricted to using a specific vendor's mobile application.

For reading the data as mentioned previously, a Raspberry Pi Zero W is loaded with a Python script which will regularly receive data from the sensors and send a HTTP POST request to the webserver with the sensor data. In the event that internet connectivity is lost, the script will also store the last 48 hours worth of sensor data and send it whenever connectivity is restored.

## Website
Requirements:
- NodeJS 14+

Installation of the website is simple and a Dockerfile is also provided if you'd like to run the project in a container.

```
git clone https://github.com/TechSupportJosh/vivarium-monitoring.git
cd vivarium-monitoring
npm ci
npm run start
```

For configuration, you can use a .env file (see .env.defaults for format) to specify any of these configuration values. You can also pass these as normal environment variables which may be more useful when using Docker.

### Configuration values

| Option                 | Description                                                                                                                             | Default Value | 
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|---------------|
| PORT                   | The port the web server should listen at.                                                                                               | 9000          |
| API_KEY                | The API key required to post data to the web server. If no API key is specified, a random one will be generated when the server starts. |               |
| DB_FILE                | The file name for the SQLite database. If no file name is specified, an in memory database in used.                                     | data.db       |
| HISTORICAL_DATA_PERIOD | How many days worth of data is shown on the web frontend.                                                                               | 1             |
| SEED_DATABASE          | Generate random data to insert into the database. When this is true, HISTORICAL_DATA_PERIOD days worth of data will be generated.       | false         |

### POST structure
When sending data to the web server, the `x-api-key` header must be set the value of API_KEY.

An example of the POST request:
```
POST /data HTTP/1.1
Host: localhost:9000
x-api-key: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Content-Type: application/json
{
    "sensor": "left",
    "temperature": 43,
    "humidity": 23,
    "date": 1614076123
}
```

## Raspberry Pi
TODO