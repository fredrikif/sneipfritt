import { API_KEY } from "./secret.mjs"; // unprotected key for testing

const ctx = document.getElementById("chart");
const locationDropDown = document.getElementById("locationDropDown");

const myChart = (yAxisLabels, sneipList, snusList, maxSneipSnus) =>
  new Chart(ctx, {
    type: "horizontalBar",
    data: {
      labels: yAxisLabels,
      datasets: [
        {
          label: "Sneip",
          data: sneipList,
          backgroundColor: "#F4B144" // Yellow Orange
        },
        {
          label: "Snus",
          data: snusList,
          backgroundColor: "#486C7C" // Payne's Grey
        }
      ]
    },
    options: {
      onResize: function(chart, size) {
        chart.options.legend.display = size.height > 128;
      },
      responsive: true,
      responsiveAnimationDuration: 500,
      maintainAspectRatio: false,
      scales: {
        xAxes: [
          {
            stacked: true,
            ticks: {
              beginAtZero: true,
              max:
                Math.ceil(
                  maxSneipSnus /
                    (maxSneipSnus >= 100 ? 100 : maxSneipSnus >= 50 ? 10 : 5)
                ) * (maxSneipSnus >= 100 ? 100 : maxSneipSnus >= 50 ? 10 : 5),
              stepSize:
                maxSneipSnus >= 100
                  ? 100
                  : maxSneipSnus >= 50
                  ? 10
                  : maxSneipSnus >= 20
                  ? 5
                  : 2
            }
          }
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              fontSize: 10
            }
          }
        ]
      }
    }
  });

const sneipDict = {};

// Formats data from sheets to fit chartjs' requirements
const formatData = myJson => {
  const weather = myJson.values[1].slice(2, myJson.values[1].length);
  const dates = myJson.values[0].slice(2, myJson.values[0].length);

  for (let i = 2; i < myJson.values.length; i += 3) {
    const yAxisLabels = [];
    const sneipList = [];
    const snusList = [];
    for (let j = 0; j < weather.length; j++) {
      const sneip = myJson.values[i].slice(2, myJson.values[i].length);
      const snus = myJson.values[i + 1].slice(2, myJson.values[i + 1].length);
      const harKasse = myJson.values[i + 2].slice(
        2,
        myJson.values[i + 2].length
      );
      if (/^\d+$/.test(sneip[j]) && /^\d+$/.test(snus[j])) {
        yAxisLabels.push(
          `${dates[j]}, ${weather[j]}, ${
            harKasse[j].match(/[ja]/i) ? "Har kasse" : "Uten kasse"
          }`
        );
        sneipList.push(sneip[j]);
        snusList.push(snus[j]);
      }
    }
    const maxSneipSnus =
      Math.max(...sneipList.map(Number)) + Math.max(...snusList.map(Number));
    sneipDict[myJson.values[i][0]] = {
      yAxisLabels: yAxisLabels,
      sneipList: sneipList,
      snusList: snusList,
      maxSneipSnus: maxSneipSnus
    };
  }
  return sneipDict;
};

const renderChart = sneipLocation =>
  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/1utNjf7RxgKBd8J19Kc0RgP9LMivQ9Oa5u_MyP_RBoQA/values/Sneipfritt_lokka!A:AF?majorDimension=COLUMNS&key=${API_KEY}`
  )
    .then(response => response.json())
    .then(myJson => {
      const chartData = formatData(myJson);

      // Populate <select> with values from sheets
      for (let i = 2; i < myJson.values.length; i += 3) {
        sneipDict[i] = myJson.values[i][0];
        let option = document.createElement("option");
        option.value = i;
        option.text = sneipDict[i];
        locationDropDown.add(option, null);
      }

      let location = document.getElementById("locationDropDown").value;

      // destroys previously rendered chart, avoids overlapping charts
      const drawChart = () => {
        if (window.bar != undefined) window.bar.destroy();
        window.bar = myChart(
          chartData[chartData[location]].yAxisLabels,
          chartData[chartData[location]].sneipList,
          chartData[chartData[location]].snusList,
          chartData[chartData[location]].maxSneipSnus
        );
      };
      drawChart();

      locationDropDown.addEventListener("change", function() {
        location = this.value;
        drawChart();
      });

      window.addEventListener("resize", drawChart());

      window.addEventListener("orientationchange", drawChart());
    });

renderChart(2);
