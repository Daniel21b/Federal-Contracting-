// ── CONFIG ─────────────────────────────────────────────────────────────────────
const width      = 1200;
const height     = 500;
const n          = 10;     // show top-10 bars
const k          = 40;     // frames per year (increased for smoother animation)
const duration   = 150;    // ms per frame (increased for better visibility)
const marginTop  = 16;
const marginRight= 6;
const marginBottom=6;
const marginLeft = 120;    // Increased to make room for labels
const barSize    = 48;
let currentState = "ca";  // Default state is California

// Add controls container and button
function createControls() {
  const controls = d3.select("#vis")
    .insert("div", "svg")
    .attr("class", "race-controls")
    .style("text-align", "center")
    .style("margin", "20px 0");
    
  // Add state selector
  controls.append("select")
    .attr("class", "state-selector")
    .style("padding", "10px")
    .style("font-size", "16px")
    .style("margin-right", "20px")
    .on("change", function() {
      currentState = this.value;
      loadDataAndCreateChart(currentState);
    })
    .selectAll("option")
    .data([
      {value: "ca", text: "California"},
      {value: "md", text: "Maryland"},
      {value: "va", text: "Virginia"}
    ])
    .enter()
    .append("option")
    .attr("value", d => d.value)
    .text(d => d.text);
    
  controls.append("button")
    .attr("class", "start-button")
    .text("Start Race")
    .style("padding", "10px 20px")
    .style("font-size", "16px")
    .style("cursor", "pointer")
    .style("background-color", "#4CAF50")
    .style("color", "white")
    .style("border", "none")
    .style("border-radius", "5px")
    .style("margin", "0 10px")
    .on("mouseover", function() {
      d3.select(this).style("background-color", "#45a049");
    })
    .on("mouseout", function() {
      d3.select(this).style("background-color", "#4CAF50");
    });

  return controls;
}

// Function to load data for a specific state
function loadDataAndCreateChart(stateCode) {
  // Clear existing chart
  d3.select("#vis svg").remove();
  
  // Show loading message
  const loadingMsg = d3.select("#vis").append("p")
    .attr("class", "loading-message")
    .text(`Loading ${stateCode.toUpperCase()} data...`);
  
  // Get correct data directory name based on state code
  let dataDir;
  if (stateCode === "ca") {
    dataDir = "BarChartCaliforniadata";
  } else if (stateCode === "md") {
    dataDir = "BarChartMarylandData";
  } else if (stateCode === "va") {
    dataDir = "BarChartVirginiaData";
  }
  
  Promise.all([
    d3.json(`../data 2/${dataDir}/${stateCode}_recipients_fy2020_2025-05-05.json`),
    d3.json(`../data 2/${dataDir}/${stateCode}_recipients_fy2021_2025-05-05.json`),
    d3.json(`../data 2/${dataDir}/${stateCode}_recipients_fy2022_2025-05-05.json`),
    d3.json(`../data 2/${dataDir}/${stateCode}_recipients_fy2023_2025-05-05.json`),
    d3.json(`../data 2/${dataDir}/${stateCode}_recipients_fy2024_2025-05-05.json`)
  ])
  .then(allData => {
    console.log(`Loaded data for ${stateCode.toUpperCase()}`);
    
    // Remove loading message
    loadingMsg.remove();
    
    // Combine and flatten the data from all years
    const raw = allData.flat();
    
    // flatten into { date: Date, name: String, value: Number, category? }
    const data = raw.map(d => {
      const year = parseInt(d.fiscal_year);
      return {
        date: new Date(year, 0, 1),
        name: d.recipient_name,
        value: +d.amount,
        category: d.state
      };
    });

    // Log summary of years and records
    const years = [...new Set(data.map(d => d.date.getFullYear()))].sort();
    console.log("Years in dataset:", years);
    console.log("Total records:", data.length);
    
    // Create the race chart with start button
    createRaceChart(data);
  })
  .catch(err => {
    console.error(`Error loading ${stateCode.toUpperCase()} JSON:`, err);
    loadingMsg.text(`Error loading data for ${stateCode.toUpperCase()}. Please try another state.`);
  });
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// ── MAIN ENTRY ─────────────────────────────────────────────────────────────────
// Initialize with California data on page load
document.addEventListener('DOMContentLoaded', () => {
  createControls();
  loadDataAndCreateChart(currentState);
});

function createRaceChart(data) {
  // Get controls already created
  const controls = d3.select(".race-controls");
  const startButton = controls.select(".start-button");
  
  // Function to run the race
  async function runRace() {
    startButton.property("disabled", true)
               .style("opacity", "0.5")
               .text("Racing...");
               
    await runBarChartRace(data);
    
    startButton.property("disabled", false)
               .style("opacity", "1")
               .text("Restart Race");
  }
  
  // Attach click handler
  startButton.on("click", runRace);
}

// ── MAIN ENTRY ─────────────────────────────────────────────────────────────────
function runBarChartRace(data) {
  // unique names
  const names = new Set(data.map(d => d.name));

  // roll up per year & name → sum(value)
  const datevalues = Array.from(
    d3.rollup(
      data,
      vals => d3.sum(vals, d => d.value),
      d => d.date.getFullYear(),
      d => d.name
    ),
    ([year, map]) => [new Date(year, 0, 1), map]
  ).sort(([a], [b]) => d3.ascending(a, b));

  console.log("Years available:", datevalues.map(d => d[0].getFullYear()));

  // build keyframes
  const keyframes = (() => {
    const frames = [];
    if (datevalues.length < 2) {
      console.warn("Not enough years in data");
      return frames;
    }

    for (let i = 0; i < datevalues.length - 1; i++) {
      const [year0, data0] = datevalues[i];
      const [year1, data1] = datevalues[i + 1];
      
      for (let j = 0; j < k; j++) {
        const t = j / k;
        const year = new Date(year0.getTime() * (1 - t) + year1.getTime() * t);
        frames.push([
          year,
          rankList(name => {
            const v0 = data0.get(name) || 0;
            const v1 = data1.get(name) || 0;
            return v0 * (1 - t) + v1 * t;
          })
        ]);
      }
    }

    frames.push([datevalues[datevalues.length - 1][0], 
      rankList(name => datevalues[datevalues.length - 1][1].get(name) || 0)]);

    return frames;
  })();

  // helper: turn a value→value(name) into sorted [ {name,value,rank}, … ]
  function rankList(valueFn) {
    const list = Array.from(names, name => ({ name, value: valueFn(name) }));
    list.sort((a,b) => d3.descending(a.value, b.value));
    list.forEach((d,i) => d.rank = i < n ? i : n);
    return list;
  }

  // Clear any existing SVG
  d3.select("#vis svg").remove();

  // build SVG
  const svg = d3.select("#vis").append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("max-width", "100%");

  // set up scales
  const x = d3.scaleLinear([0,1], [marginLeft, width - marginRight]);
  const y = d3.scaleBand()
      .domain(d3.range(n+1))
      .rangeRound([marginTop, marginTop + barSize*(n+1.1)])
      .padding(0.1);

  // Enhanced color scale - generate distinct colors for better visual appeal
  const color = (() => {
    // Create a colorful, enhanced scheme by interpolating between vibrant hues
    const generateColors = (count) => {
      return d3.quantize(t => d3.interpolateRainbow(t * 0.85), count);
    };
    
    // Create palette with enough distinct colors for all bars
    const colorPalette = generateColors(n);
    
    // Use enhanced color palette based on rank to ensure consistent, distinct colors
    return d => colorPalette[d.rank % colorPalette.length];
  })();

  // Generate the race
  async function race() {
    const updateAxis = axis(svg, x, y);
    const updateBars = bars(svg, x, y, color, prev, next);
    const updateLabels = labels(svg, x, y, prev, next);
    const updateTicker = ticker(svg, keyframes);

    for (const keyframe of keyframes) {
      const transition = svg.transition()
        .duration(duration)
        .ease(d3.easeLinear);

      // Extract the top bar's value to update domain
      x.domain([0, keyframe[1][0].value]);

      // Update the visualization
      await Promise.all([
        updateAxis(keyframe, transition),
        updateBars(keyframe, transition),
        updateLabels(keyframe, transition),
        updateTicker(keyframe, transition),
        transition.end()
      ]);
    }
  }

  // maps for enter/exit transitions
  const nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.name);
  const prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a,b) => [b,a])));
  const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

  // Start the race
  race();
}

// ── HELPER FUNCTIONS ────────────────────────────────────────────────────────────
// (Copy your existing bars(), axis(), labels(), ticker(), textTween(), formatDate() here.)
// They don't need to change now that data items are {name,value,date}.

function bars(svg, x, y, color, prev, next) {
  // Improved fill opacity for better color vibrancy while maintaining readability
  let bar = svg.append("g").attr("fill-opacity", 0.75).selectAll("rect");
  return ([, data], transition) => bar = bar
    .data(data.slice(0,n), d=>d.name)
    .join(
      enter => enter.append("rect")
        .attr("fill", color)
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("y", d=>y((prev.get(d)||d).rank))
        .attr("width", d=>x((prev.get(d)||d).value)-x(0))
        // Add subtle rounded corners for a more modern look
        .attr("rx", 2),
      update => update,
      exit => exit.transition(transition).remove()
        .attr("y", d=>y((next.get(d)||d).rank))
        .attr("width", d=>x((next.get(d)||d).value)-x(0))
    )
    .call(sel=>sel.transition(transition)
      .attr("y", d=>y(d.rank))
      .attr("width", d=>x(d.value)-x(0)));
}

function formatCompanyName(name) {
  // Truncate to 25 characters and add ellipsis if longer
  return name.length > 25 ? name.substring(0, 25) + '...' : name;
}

function labels(svg, x, y, prev, next) {
  // Create a container group for labels and connecting lines
  const labelGroup = svg.append("g");
  
  // Add a group for the connecting lines, placed before the text group
  const lineGroup = labelGroup.append("g")
    .attr("class", "connecting-lines")
    .attr("stroke", "#555555")  // Medium gray for better visibility
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2,2");  // Dotted line for subtle effect
  
  // Add text group with proper styling
  const textGroup = labelGroup.append("g")
    .style("font", "bold 12px var(--sans-serif)")
    .style("font-variant-numeric", "tabular-nums")
    .attr("text-anchor", "end");
  
  // Initialize selections
  let line = lineGroup.selectAll("line");
  let label = textGroup.selectAll("text");
  
  return ([, data], transition) => {
    // Update lines first
    line = line
      .data(data.slice(0, n), d => d.name)
      .join(
        enter => enter.append("line")
          .attr("transform", d => `translate(${x((prev.get(d)||d).value)},${y((prev.get(d)||d).rank)})`)
          .attr("x1", -20)  // Extend more to connect with text
          .attr("x2", 0)   // Connect to the start of the bar
          .attr("y1", y.bandwidth() / 2)
          .attr("y2", y.bandwidth() / 2),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("transform", d => `translate(${x((next.get(d)||d).value)},${y((next.get(d)||d).rank)})`)
      )
      .call(sel => sel.transition(transition)
        .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
      );
    
    // Update text labels
    label = label
      .data(data.slice(0, n), d => d.name)
      .join(
        enter => enter.append("text")
          .attr("transform", d => `translate(${x((prev.get(d)||d).value)},${y((prev.get(d)||d).rank)})`)
          .attr("y", y.bandwidth() / 2)
          .attr("x", -22)  // Position text with spacing for the connecting line
          .attr("dy", "-0.25em")
          .text(d => formatCompanyName(d.name))
          .call(t => t.append("tspan")
            .attr("fill-opacity", 0.8)  // Improved opacity for better readability
            .attr("font-weight", "normal")
            .attr("x", -22)  // Match the new x position
            .attr("dy", "1.15em")
            .text(d => formatNumber((prev.get(d)||d).value))),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("transform", d => `translate(${x((next.get(d)||d).value)},${y((next.get(d)||d).rank)})`)
          .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d)||d).value)))
      )
      .call(sel => sel.transition(transition)
        .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
        .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d)||d).value, d.value)))
      );
      
    return [line, label];
  };
}

function axis(svg, x, y) {
  const g = svg.append("g").attr("transform",`translate(0,${marginTop})`);
  const ax = d3.axisTop(x).ticks(width/160,",d")
      .tickSizeOuter(0)
      .tickSizeInner(-barSize*(n+ y.padding()));
  return (_, transition) => {
    g.transition(transition).call(ax);
    g.select(".tick:first-of-type text").remove();
    g.selectAll(".tick:not(:first-of-type) line").attr("stroke","#cccccc");
    g.select(".domain").remove();
  };
}

function ticker(svg, keyframes) {
  console.log("Initializing ticker with keyframes:", keyframes);
  
  const now = svg.append("text")
    .style("font", `bold ${barSize * 1.2}px var(--sans-serif)`) // Increased font size for better visibility
    .style("font-variant-numeric", "tabular-nums")
    .attr("text-anchor", "end")
    .attr("x", width - marginRight)
    .attr("y", height - marginBottom)
    .attr("dy", "0.32em")
    .attr("fill", "#333"); // Darker color for better contrast

  // Set initial year
  if (keyframes && keyframes.length > 0 && keyframes[0][0]) {
    console.log("Initial keyframe date:", keyframes[0][0]);
    const initialYear = keyframes[0][0].getFullYear();
    console.log("Initial year:", initialYear);
    now.text("FY " + initialYear);
  } else {
    console.warn("No valid initial keyframe found:", keyframes);
  }

  return ([date], transition) => {
    console.log("Updating ticker with date:", date);
    if (date) {
      const year = date.getFullYear();
      console.log("New year to display:", year);
      transition.end().then(() => {
        console.log("Setting year text to:", "FY " + year);
        now.text("FY " + year);
      });
    } else {
      console.warn("Received invalid date in ticker update:", date);
    }
  };
}

function textTween(a, b) {
  const i = d3.interpolateNumber(a, b);
  return t => this.textContent = formatNumber(i(t));
}

const formatNumber = d => {
  const n = Math.abs(d);
  if (n >= 1e9) return (d/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (d/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (d/1e3).toFixed(1) + 'K';
  return d.toString();
};

const formatDate = d3.utcFormat("%Y");
