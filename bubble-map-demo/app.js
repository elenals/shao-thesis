/* 
SET UP 
*/
const wMap = 840
const hMap = 640
const mMap = ({top: 20, right: 20, bottom: 20, left: 20})

/* 
CREATING EMPTY SVG ROOT ELEMENT ON PAGE LOAD 
*/
const svg = d3.select("#container")
  .append("svg")
  .attr("width", wMap)
  .attr("height", hMap);

/* 
DEFINE MAP PROJECTION & PATH GENERATOR
*/
const projection = d3.geoAlbersUsa()
  .translate([wMap/2, hMap/2]);
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
PLOT POINTS & TOOLTIP
*/
function plotPoints(data) {
  let selection = document.querySelector("#slider").value;
  d3.select("#year")
    .text(selection);

  let filtered = data.filter((d) => d.retirement_year == selection);
  let size = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.nameplate_capacity_mw))
    .range([3, 15]);
  
  let tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .classed("hidden", true)

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

  points = svg.selectAll(".point")
    .data(filtered)
    .join("circle")
    .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
    .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
    .attr("r", (d) => size(d.nameplate_capacity_mw))
    .attr("class", "point")
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
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

            // plot first year's data on page load
            plotPoints(data)

            // plotting new points based on the input from the slider
            d3.select("#slider")
              .on("input", function() {
                plotPoints(data)
            });

          }
        }
      )

    }
  }
)