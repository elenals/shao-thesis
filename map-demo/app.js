/* 
SET UP 
*/
const w = 840
const h = 640
const m = ({top: 20, right: 20, bottom: 20, left: 20})

/* 
CREATING EMPTY SVG ROOT ELEMENT ON PAGE LOAD 
*/
const svg = d3.select("body")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

/* 
DEFINE MAP PROJECTION & PATH GENERATOR
*/
const projection = d3.geoAlbers()
  .translate([w/2, h/2])
  //.fitExtent([[m.top, m.left], [w - m.bottom, h - m.right]], states);

const path = d3.geoPath()
  .projection(projection);
  
/* 
LOADING UNITED STATES TOPOJSON DATA 
https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json 
*/
d3.json("data/counties-10m.json").then(
  (data, error) => {
    if (error) {
      console.log(log); // handling error
    } else {
      console.log(data); // inspect topojson object

      states = topojson.feature(data, data.objects.states);



      // we already defined the projection & path outside the D3 JSON request
      svg.selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", path)
        .attr("class", "state-border");

      /* 
      LOADING THE LAT-LONG POINTS DATA 
      */

      d3.csv("data/power-plant-locations.csv").then(
        (points, error) => {
          if (error) {
            console.log(log);
          } else {

            console.log(points);

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
              .data(points)
              .join("circle")
              .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
              .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
              .attr("r", 3)
              .attr("class", "point")
              .on("mouseover", mouseover)
              .on("mouseout",  mouseout)
            
            makeBars();
          }
        }
      )

    }
  }
)