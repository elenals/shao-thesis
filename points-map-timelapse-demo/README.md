# Assignment 7: JavaScript Tinkering
**COMM 277T: Building News Apps, Spring 2022**
Elena Shao

## Skill
For this assignment, I will be exploring mapping using the D3.js library. This first assumes some basic knowledge of HTML/CSS/JS workflow, asynchronous JS, DOM manipulation, SVG, and data/requests in D3. 

For this assignment, I'll be learning several skills and techniques: (1) using GeoJSON and TopoJSON data, (2) using map projections, (3) using geographic path generators to convert shapes into SVG paths, and (4) importing CSV data with D3. My goal is to create a simple map of Ukraine in D3, onto which I will plot latitude and longitude points. 

## Mapping in D3
### Geographic data
First, we need to obtain geographic data in a format that D3 can use. The most popular formats for geographic information are [GeoJSON](https://geojson.org/) and [TopoJSON](https://github.com/topojson/topojson). 

Both are JSON-based formats for displaying geographic data, but TopoJSON plays especially well with D3, since the creator of TopoJSON (Mike Bostock) also invented D3. TopoJSON files are often 80% smaller than GeoJSON files; TopoJSON represents lines and polygons as sequences of arcs rather than sequences of coordinates. The latter, used in GeoJSON, ends up resulting in repeating coordinates. In addition, TopoJSON can be [quantized](https://github.com/topojson/topojson-client/blob/master/README.md#quantize), meaning that coordinates are represented as small integers instead of floating-point values (with many decimal places). 

A sample TopoJSON object:

```
{
  "type": "Topology",
  "objects": {
    "example": {
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Point",
          "properties": {
            "prop0": "value0"
          },
          "coordinates": [102, 0.5]
        },
        {
          "type": "LineString",
          "properties": {
            "prop0": "value0",
            "prop1": 0
          },
          "arcs": [0]
        },
        {
          "type": "Polygon",
          "properties": {
            "prop0": "value0",
            "prop1": {
              "this": "that"
            }
          },
          "arcs": [[-2]]
        }
      ]
    }
  },
  "arcs": [
    [[102, 0], [103, 1], [104, 0], [105, 1]],
    [[100, 0], [101, 0], [101, 1], [100, 1], [100, 0]]
  ]
}
```

and sample GeoJSON:
```
{ "type": "FeatureCollection",
  "features": [
    { "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
      "properties": {"prop0": "value0"}
      },
    { "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
          ]
        },
      "properties": {
        "prop0": "value0",
        "prop1": 0.0
        }
      },
    { "type": "Feature",
       "geometry": {
         "type": "Polygon",
         "coordinates": [
           [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
             [100.0, 1.0], [100.0, 0.0] ]
           ]

       },
       "properties": {
         "prop0": "value0",
         "prop1": {"this": "that"}
         }
       }
    ]
  }
```

Mike Bostock's [Command-Line Cartography tutorial](https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c), specifically the [Part 3](https://medium.com/@mbostock/command-line-cartography-part-3-1158e4c55a1e), goes more in depth on how to use manually manipulate TopoJSON, and how to convert other geographic data formats into TopoJSON. For now, I'm using a pre-made TopoJSON file of Ukraine and its political subdivisions (oblasts or regions) that I found [online](https://raw.githubusercontent.com/org-scn-design-studio-community/sdkcommunitymaps/master/geojson/Europe/Ukraine-regions.json).

### Requesting JSON data
To request JSON data, I'm using the `d3.json()` method. This method, like other data-loading methods (e.g.: `d3.csv()`) sends an HTTP request to the specified URL to load the file. 

The `d3.json()` method accepts the file path/URL as its first argument, and returns a [**promise** object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). A JavaScript promise represents the eventual completion (or failure) of an asynchronous operation. You can attach callbacks to the returned object, as opposed to passing callbacks into a function &mdash; not a big deal with a few callbacks, but super useful to avoid "Callback Hell" that happens with multiple nested functions:

```js
// "Callback Hell"
fs.readdir(source, function (err, files) {
  if (err) {
    console.log('Error finding files: ' + err)
  } else {
    files.forEach(function (filename, fileIndex) {
      console.log(filename)
      gm(source + filename).size(function (err, values) {
        if (err) {
          console.log('Error identifying file size: ' + err)
        } else {
...
```
I will use the [`.then()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) syntax, which ensures that the following code won't run unless the promise for the requested data is fulfilled:

```js
d3.json("ukraine-regions.json").then(
  (data, error) => {
    if (error) {
      console.log(log)
    } else {
      console.log(data) // examine the data using Dev Tools
    }
  });
```
In the Console of the Chrome browser's Developer Tools, I can check to make sure the data has been loaded correctly. 

Repeating this process with the csv data:
```js
d3.csv("ukraine-witness.csv").then(
  (points) => {
     console.log(points)
    } 
  });
```        

I also considered using the [`d3.queue()` method](http://using-d3js.com/08_03_queue.html) which allows you to run asynchronous tasks simultaneously. I ended up not using this since I only needed to make two requests:

```js
d3.queue()
  .defer(d3.json, "ukraine-regions.json")
  .defer(d3.csv, "ukraine-witness.csv")
  .await() // some function after all the data is loaded
```

### TopoJSON to GeoJSON
I'm using [`topojson.feature()` ](https://github.com/topojson/topojson-client/blob/master/README.md#feature) which converts TopoJSON to GeoJSON object. This step returns a collection of geometries which are then mapped to a feature. To figure out which object to access, I had to look at the data in the Console. 

```js
topojson.feature(data, data.objects.UKR_adm1);
```

### Projections
(Note: For these next steps I'm following the D3 In Depth tutorial on [Geographic](https://www.d3indepth.com/geographic/) D3 pretty closely.)

Another crucial element to mapping in D3 is a projection function, which takes a longitude and latitude coordinate and transforms it into a x- and y-coordinate. D3 provides [a number of geographic projection functions](https://d3-wiki.readthedocs.io/zh_CN/master/Geo-Projections/), and it's probably not necessary to learn how to do them myself.

For this visualization, I'm going to need to use the projection on the geographic shapes as well as the coordinate points, so I'm storing the projection function as a variable:

```js
const projection = d3.geoAlbers();
```

### Geographic path generators
Another thing that D3 handles easily for us is the geographic path generator, which takes a GeoJSON object and converts it into a SVG Path string. 

To create a generator, I use the `.geoPath()` generator and configure it with the projection function I set up earlier:

```js
const path = d3.geoPath()
  .projection(projection);
```

### Putting it together

First, I'm setting up my `index.html` file by using HTML boilerplate, importing D3 and TopoJSON scripts, and linking a `style.css` file for my CSS (totally not necessary since there's few styles, but did it to practice the workflow) and my `app.js` file with my JavaScript.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BNA JS Tinker</title>
	<!-- external stylesheet -->
	<link rel="stylesheet" href="style.css">
	<!-- avoid favicon request error -->
	<link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon"> 
</head>

<body>
	<!-- D3 -->
  <script src="https://d3js.org/d3.v7.min.js"></script>
	<!-- TopoJSON -->
	<script src="http://d3js.org/topojson.v3.min.js"></script>
	<!-- external javascript -->
	<script src="app.js"></script>

</body>
</html>
```

Next, some simple CSS styling:
```css
.country-border {
  fill: #e7e7e7;
  stroke: #424242;
  stroke-width: 1px;
}

.point {
  fill: red;
  opacity: 0.75;
}
```

Now, the main part, in `app.js`. First, I'm setting up variables for width, height, and margin (for the SVG later):
```js
const w = 840
const h = 640
const m = ({top: 20, right: 20, bottom: 20, left: 20})
```

Next, I'm creating an empty SVG at the root, instead of doing it within the JSON request. This was recommended in the [Let's Make a Map tutorial](https://bost.ocks.org/mike/map/) by Mike Bostock:

```js
const svg = d3.select("body").append("svg")
  .attr("width", w)
  .attr("height", h);
```

Now, I'm going to load the TopoJSON data, handling errors, and accessing the geometries:
```js
d3.json("ukraine-regions.json").then(
  (data, error) => {
    if (error) {
      console.log(log)
    } else {
      // console.log(data)
      ukraineGeo = topojson.feature(data, data.objects.UKR_adm1);
      console.log(ukraineGeo);
      ...
```

Continuing on, I'm creating the projection and geographic path generators:
```js
const projection = d3.geoAlbers()
  .rotate([-30, 0, 0])
  .fitExtent([[m.top, m.left], [w - m.bottom, h - m.right]], ukraineGeo);

const path = d3.geoPath()
  .projection(projection);
```

Now that I have everything set up, it's time to select the SVG and draw the map. Two steps ago, I converted the TopoJSON to GeoJSON and assigned in the variable name `ukraineGeo`, so now, I can use GeoJSON's `.features` to access the array of features. Then, I use D3 [data joins](https://www.d3indepth.com/datajoins/) to append the data to `path` elements. The SVG `d` attribute defines the path (`path`, from earlier, when I set up the geographic path generator) to be drawn. Then, I assign it the class of `.country-border`, which I set up in the CSS stylesheet. 
```js
svg.selectAll("path")
  .data(ukraineGeo.features)
  .join("path")
    .attr("d", path)
    .attr("class", "country-border");
```

Finally, we load the CSV with points data, using a similar technique as the D3 JSON request. The longitude data corresponds with the x-coordinate ("cx") value and the latitude data corresponds with y-coordinate ("cy") value. I apply the same projection onto the coordinates:
```js
d3.csv("ukraine-prominent-cities.csv").then(
  (points) => {
    console.log(points);

    svg.selectAll(".point")
      .data(points)
      .join("circle")
        .attr("cx", (d) => projection([+d.lng, +d.lat])[0])
        .attr("cy", (d) => projection([+d.lng, +d.lat])[1])
        .attr("class", "point")
        .attr("r", 3)
  }
);         
```

## Assessment of Mastery
Last week, I watched several video tutorials on mapping in D3 and read several book chapters on the topic as well. So, going into this assignment, I had a very "ambient" awareness of the general tasks I would need to accomplish. However, it wasn't until I began creating maps of my own that I gained a better understanding of each step in the process. 

I think I would be able to, at the very least, write the pseudocode to recreate this technique, and I think I'd be able to explain line-by-line what's happening in the code (even if not in the most technical of terms). What's more difficult is dealing with bugs, errors, and the particularities of geographic data &mdash; for that I think I would need to reference documentation and troubleshoot on StackOverflow. 

That being said, my next step to deepen my understanding is to simply create more maps. The more "errors" I can get introduced to by working with different datasets and paramters, the more I'm forced to dig "behind the scenes" to figure out what went wrong. I learn a lot from debugging and troubleshooting, and over time, paired with some tinkering/remixing of other people's code, I think this can be an effective method to gain advanced mastery of this skill. 