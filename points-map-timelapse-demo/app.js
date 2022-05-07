/* SET UP */

const w = 840;
const h = 640;
const m = { top: 20, right: 20, bottom: 20, left: 20 };

/* MAKING THE MAP */

// creating empty svg root element on page load
const svg = d3
	.select("#map-container")
	.append("svg")
	.attr("width", w)
	.attr("height", h);

const label = svg
	.append("text")
	.text("January 8, 2022")
	.attr("id", "label")
	.attr("x", m.left)
	.attr("y", h - 3 * m.bottom);

// defining map projection and path generator
const projection = d3.geoAlbers().rotate([-30, 0, 0]);
const path = d3.geoPath().projection(projection);

// FUNCTION to create the base map
function makeMap(data, projection) {
	ukraineGeo = topojson.feature(data, data.objects.UKR_adm1);
	projection.fitExtent(
		[
			[m.top, m.left],
			[w - m.bottom, h - m.right],
		],
		ukraineGeo
	);

	// bind to paths
	svg
		.selectAll("path")
		.data(ukraineGeo.features)
		.join("path")
		.attr("d", path)
		.attr("class", "country-border");
}

// FUNCTION to plot the points
// adapted from: https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763
//let moving = false;
//let currentWidth = 0;
//let targetWidth = w;

const playButton = d3.select("#play-button");

const start = new Date("01/09/22");
const end = new Date("04/19/22");
const numDays = Math.round((end - start) / (1000 * 60 * 60 * 24)); // denominator: # of miliseconds in a day
const formatTime = d3.timeFormat("%m/%d/%y");
const parseTime = d3.timeFormat("%B %e, %A");

const xScale = d3
	.scaleTime()
	.domain([start, end])
	.range([1, numDays])
	.clamp(true); // domain's value will always be in range

function update(data, inverted) {
	// filtering and plotting points data over time

	let filtered = data.filter((d) => d.D_VERIFIED_DATE <= formatTime(inverted));

	//console.log("filtered data", filtered);

	// displaying tooltips on hover
	let tooltip = d3
		.select("body")
		.append("div")
		.attr("id", "tooltip")
		.classed("hidden", true);

	let mouseover = function (event, d) {
		//console.log(event);
		d3.select("#tooltip")
			.html(
				`<p>
				<b>${d.D_TOWN_CITY}, ${d.D_PROVINCE}</b> on ${d.D_VERIFIED_DATE}:
			 	<br>
			 	${d.C_BRIEF_DESCRIPTION}
			 	</p>`
			)
			.style("left", event.pageX - 20 + "px")
			.style("top", event.pageY + 20 + "px")
			.transition()
			.duration(200)
			.style("opacity", 1);

		d3.select("#tooltip").classed("hidden", false);
	};

	let mouseout = function (event, d) {
		d3.select("#tooltip").transition().duration(200).style("opacity", 0);
	};

	points = svg
		.selectAll(".point")
		.data(filtered)
		.join("circle")
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		.attr("cx", (d) => projection([+d.D_LONGITUDE, +d.D_LATITUDE])[0])
		.attr("cy", (d) => projection([+d.D_LONGITUDE, +d.D_LATITUDE])[1])
		.attr("class", "point")
		.transition()
		.duration(200)
		.attr("r", 4);

	let labelText = parseTime(inverted);
	label.data(filtered).text(labelText);
}

// loading in TopoJSON data
d3.json("ukraine-regions.json").then((data, error) => {
	if (error) {
		//console.log(log);
	} else {
		//console.log(data); // check if data was loaded correctly

		// calls function to make the base map
		makeMap(data, projection);

		d3.json("ukraine-data.json").then((data) => {
			//console.log("ukraine witness data", data);

			let pointer = 1;

			/* 
			THIS CODE IS IF YOU ONLY WANT TO START THE ANIMATION ON BUTTON CLICK 
			make sure to change the button to "Play" 
			*/

			playButton.on("click", function () {
				const button = d3.select(this);
				if (button.text() == "Play" || button.text() == "Restart") {
					timer = setInterval(function () {
						inverted = xScale.invert(pointer);
						update(data, inverted);
						if (pointer < numDays) {
							pointer++;
						} else {
							clearInterval(timer);
							pointer = 1;
							button.text("Restart");
						}
					}, 250);
					button.text("Pause");
				} else {
					clearInterval(timer);
					button.text("Play");
				}
			});
		});
	}
});
