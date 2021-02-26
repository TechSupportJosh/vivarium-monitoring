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

const temperatureChartContext = document.getElementById("temperature-chart").getContext("2d");
const humidityChartContext = document.getElementById("humidity-chart").getContext("2d");
const sensorNames = Object.keys(sensors);
const sensorDisplayContainer = document.getElementById("sensor-display-container");
const dataPeriodSelector = document.getElementById("data-period");

Object.entries(sensors).forEach(([sensor, config]) => {
    sensorDisplayContainer.insertAdjacentHTML("beforeend", `
        <div class="col-12 col-md-4">
            <div class="card mb-2">
                <div class="card-body">
                    <h4 class="card-title">${config.label} Sensor</h4>
                    <h5>Temperature: <span id="${sensor}-temperature"></span>°C</h5>
                    <h5>Humidity: <span id="${sensor}-humidity"></span>%</h5>
                    <p class="mb-0 text-muted">
                        Received <span id="${sensor}-update-time" class="timeago" datetime="0">Never</span>
                    </p>
                </div>
            </div>
        </div>
    `);
    config.temperature = document.getElementById(`${sensor}-temperature`);
    config.humidity = document.getElementById(`${sensor}-humidity`);
    config.lastUpdated = document.getElementById(`${sensor}-update-time`);
});

const chartConfig = {
    type: "line",
    options: {
        scales: {
            xAxes: [{
                type: "time",
                scaleLabel: {
                    display: true,
                    labelString: "Time"
                },
                time: {
                    displayFormats: {
                        hour: 'dd h:mm a'
                    }
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
        responsive: true,
        maintainAspectRatio: false
    }
}

const temperatureChart = new Chart(temperatureChartContext, {...chartConfig, 
    data: {
        datasets: []
    },
    options: {
        ...chartConfig.options,
        scales: {
            ...chartConfig.options.scales,
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
        tooltips: {
            callbacks: {
                label: (item, data) => {
                    return data.datasets[item.datasetIndex].label + ": " + item.yLabel + "°C";
                }
            }
        }
    }
});

const humidityChart = new Chart(humidityChartContext, {...chartConfig, 
    data: {
        datasets: []
    },
    options: {
        ...chartConfig.options,
        scales: {
            ...chartConfig.options.scales,
            yAxes: [{
                type: "linear",
                scaleLabel: {
                    display: true,
                    labelString: "Humidity (%)"
                },
                ticks: {
                    min: 10,
                    max: 60
                }
            }]
        },
        tooltips: {
            callbacks: {
                label: (item, data) => {
                    return data.datasets[item.datasetIndex].label + ": " + item.yLabel + "%";
                }
            }
        }
    }
});

const fetchData = async () => {
    const response = await fetch(`/data?interval=${dataPeriodSelector.value}`);
    const data = await response.json();
    
    // Clear graph data
    temperatureChart.data.datasets = [];
    humidityChart.data.datasets = [];

    sensorNames.forEach(sensorName => {
        const sensorsWithName = data.filter(element => element.sensor === sensorName);
        const currentValue = sensorsWithName[0];
        if(currentValue)
        {
            sensors[sensorName].temperature.textContent = currentValue.temperature;
            sensors[sensorName].humidity.textContent = currentValue.humidity;
            sensors[sensorName].lastUpdated.setAttribute("datetime", currentValue.date * 1000);

            temperatureChart.data.datasets.push({
                label: sensors[sensorName].label,
                fill: false,
                data: sensorsWithName.map(data => ({
                    x: new Date(data.date * 1000),
                    y: data.temperature
                }))
            });

            humidityChart.data.datasets.push({
                label: sensors[sensorName].label,
                fill: false,
                data: sensorsWithName.map(data => ({
                    x: new Date(data.date * 1000),
                    y: data.humidity
                }))
            });
        }
    });

    timeago.cancel()
    timeago.render(document.querySelectorAll(".timeago"), "en_GB");

    temperatureChart.update();
    humidityChart.update();
};

dataPeriodSelector.addEventListener("input", () => fetchData());

fetchData();
setInterval(fetchData, 30000);