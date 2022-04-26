/* 
SET UP 
*/
const wMap = 840
const hMap = 640
const mMap = ({top: 20, right: 20, bottom: 20, left: 20})

const wChart = 840
const hChart = 150
const mChart = ({top: 20, right: 20, bottom: 20, left: 20})

/* 
CREATING EMPTY SVG ROOT ELEMENT ON PAGE LOAD 
*/
const svg = d3.select("body")
  .append("svg")
  .attr("width", wMap)
  .attr("height", hMap);

/* 
DEFINE MAP PROJECTION & PATH GENERATOR
*/
const projection = d3.geoAlbers()
  .translate([wMap/2, hMap/2])
  //.fitExtent([[m.top, m.left], [w - m.bottom, h - m.right]], states);

const path = d3.geoPath()
  .projection(projection);

/*
MAKING THE MAP
*/
function makeMap(data) {
  // projection.fitExtent([[m.top, m.left], [w - m.bottom, h - m.right]], states);
  states = topojson.feature(data, data.objects.states);
  // we already defined the projection & path outside the D3 JSON request
  svg.selectAll("path")
    .data(states.features)
    .join("path")
    .attr("d", path)
    .attr("class", "state-border");

}

/* 
PLOTTING THE POINTS
*/
/*
function plotPoints(data) {
  let tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .classed("hidden", true)
  
  let mouseover = function(event, d) {
    d3.select("#tooltip")
      .text(d.county_state)
      .style("left", (event.pageX - 20) + "px")
      .style("top", (event.pageY + 20) + "px")
      .style("opacity", 1);

    d3.select("#tooltip")
      .classed("hidden", false);
  }

  let mouseout = function(event, d) {
    d3.select("#tooltip")
      .style("opacity", 0)
  }

  svg.selectAll(".point")
    .data(data)
    .join("circle")
    .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
    .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
    .attr("r", 3)
    .attr("class", "point")
    .on("mouseover", mouseover)
    .on("mouseout",  mouseout);
}*/

/*
MAKING THE BAR CHART
*/
function makeBars(data) {

  console.log(data)

  const dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13,
    11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ];
  
  let x = d3.scaleBand()
    .range([0, wChart])
    .domain(d3.range(dataset.length));

  let y = d3.scaleLinear()
    .range([0, hChart])
    .domain([0, d3.max(dataset)]);

  const barSvg = d3.select("body")
    .append("svg")
    .attr("width", wChart)
    .attr("height", hChart);
  
  barSvg.selectAll(".bar")
    .data(dataset)
    .join("rect")
    .attr("x", (d, i) => x(i))
    .attr("y", (d, i) => hChart - y(d))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(d))
    .attr("class", "bar");
}


function plotPoints(data) {
  let selection = document.querySelector("#slider").value;
  console.log(selection)

  d3.select("h3")
    .text(selection);

  let tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .classed("hidden", true)
  
  let size = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.nameplate_capacity_mw))
    .range([3, 15]);
  
  let mouseover = function(event, d) {
    d3.select("#tooltip")
      .html(
        `<p>
        <b>${d.entity_name}</b> in ${d.county_state}
        <br>
        <i>${d.technology}</i>
        <br><br>
        <b>Operating Since:</b> ${d.operating_year}
        <br>
        <b>Retirement Year:</b> ${d.retirement_year}
        <br>
        <b>Capacity:</b> ${d.nameplate_capacity_mw} MW
        </p>`
      )
      .style("left", (event.pageX - 20) + "px")
      .style("top", (event.pageY + 20) + "px")
      .transition().duration(300)
      .style("opacity", 1);

    d3.select("#tooltip")
      .classed("hidden", false);
  }

  let mouseout = function(event, d) {
    d3.select("#tooltip")
      .transition().duration(300)
      .style("opacity", 0)
  }

  svg.selectAll(".point")
    .data(data)
    .join("circle")
    .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
    .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
    .attr("r", function(d) {
      if (selection === d.retirement_year) {
        return size(d.nameplate_capacity_mw)
      } else {
        return 0
      }
    })
    .attr("class", "point")
    .on("mouseover", mouseover)
    .on("mouseout",  mouseout);
}
/* 
LOADING UNITED STATES TOPOJSON DATA 
https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json 
*/
d3.json("data/counties-10m.json").then(
  (data, error) => {
    if (error) {
      console.log(log); // handling error
    } else {
      //console.log(data); // inspect topojson object

      makeMap(data);

      d3.csv("data/power-plant-locations.csv").then(
        (data, error) => {
          if (error) {
            console.log(log);
          } else {
            //console.log(data)
            d3.select("#slider")
              .on("input", (d) => plotPoints(data));
            //makeBars(data);
          }
        }
      )

    }
  }
)