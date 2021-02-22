const sensors = {
    left: {
        temperature: document.getElementById("left-temperature"),
        humidity: document.getElementById("left-humidity")
    },
    middle: {
        temperature: document.getElementById("middle-temperature"),
        humidity: document.getElementById("middle-humidity")
    },
    right: {
        temperature: document.getElementById("right-temperature"),
        humidity: document.getElementById("right-humidity")
    }
}
const chartContext = document.getElementById("sensor-chart").getContext("2d");
const sensorNames = Object.keys(sensors);

const temperatureChart = new Chart(chartContext, {
    type: "line",
    data: {
        datasets: []
    },
    options: {
        scales: {
            xAxes: [{
                type: "time",
                scaleLabel: {
                    display: true,
                    labelString: "Time"
                }
            }],
            yAxes: [{
                type: "linear"
            }]
        },
        plugins: {
            colorschemes: {
                scheme: "brewer.SetOne3"
            }
        },
        animation: {
            duration: 0
        }
    }
});

const fetchData = async () => {
    const response = await fetch("/data");
    const data = await response.json();
    
    // Clear graph data
    temperatureChart.data.datasets = [];

    sensorNames.forEach(sensorName => {
        const sensorsWithName = data.filter(element => element.sensor === sensorName);
        const currentValue = sensorsWithName[sensorsWithName.length - 1];
        if(currentValue)
        {
            sensors[sensorName].temperature.textContent = currentValue.temperature;
            sensors[sensorName].humidity.textContent = currentValue.humidity;

            temperatureChart.data.datasets.push({
                label: sensorName,
                fill: false,
                data: sensorsWithName.map(data => ({
                    x: new Date(data.date * 1000),
                    y: data.temperature
                }))
            });
        }
    });

    temperatureChart.update();
};

fetchData();
setInterval(fetchData, 30000);