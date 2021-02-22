const sensors = {
    left: {
        label: "Cool End"
    },
    middle: {
        label: "Middle"
    },
    right: {
        label: "Basking"
    }
}

const chartContext = document.getElementById("sensor-chart").getContext("2d");
const sensorNames = Object.keys(sensors);
const sensorDisplayContainer = document.getElementById("sensor-display-container");

Object.entries(sensors).forEach(([sensor, config]) => {
    sensorDisplayContainer.insertAdjacentHTML("beforeend", `
        <div class="col-4">
            <h4>${config.label} Sensor</h4>
            <h5><span id="${sensor}-temperature"></span>°C</h5>
            <h5><span id="${sensor}-humidity"></span>%</h5>
        </div>
    `);
    config.temperature = document.getElementById(`${sensor}-temperature`);
    config.humidity = document.getElementById(`${sensor}-humidity`);
});

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
                },
                time: {
                    unit: "hour",
                    displayFormats: {
                        hour: 'dd h:mm a'
                    }
                }
            }],
            yAxes: [{
                type: "linear",
                scaleLabel: {
                    display: true,
                    labelString: "Temperature (°C)"
                },
                ticks: {
                    min: 15,
                    max: 45
                }
            }]
        },
        plugins: {
            colorschemes: {
                scheme: "brewer.SetOne3"
            }
        },
        animation: {
            duration: 0
        },
        tooltips: {
            callbacks: {
                label: (item, data) => {
                    return data.datasets[item.datasetIndex].label + ": " + item.yLabel + "°C";
                }
            }
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
                label: sensors[sensorName].label,
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