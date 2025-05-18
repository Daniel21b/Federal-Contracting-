// ── CONFIG ─────────────────────────────────────────────────────────────────────
const width      = 1200;    // Reduced width to fit better in container
const height     = 800;     // Reduced height to fit better in container
const n          = 10;      // show top-10 bars
const k          = 40;      // frames per year
const duration   = 150;     // ms per frame
const marginTop  = 40;      // Increased from 10 to 40 for better axis label visibility
const marginRight= 60;      // Much larger right margin
const marginBottom= 30;     // Much larger bottom margin
const marginLeft = 30;      // Much larger left margin for longer labels
const barSize    = 70;      // Reduced bar size to fit in smaller container
let currentState = "ca";    // Default state is California

// Store d3 reference locally for this file
const d3 = d3v6;

// Function to load data for a specific state
function loadDataAndCreateChart(stateCode) {
  // Update current state
  currentState = stateCode;
  
  // Clear existing chart
  d3.select("#bar-vis .race-visualization").remove();
  
  // Create visualization container
  const vizContainer = d3.select("#bar-vis")
    .append("div")
    .attr("class", "race-visualization")
    .style("width", "100%")
    .style("min-height", "450px")
    .style("background-color", "#1a1a1a")
    .style("border", "2px solid #4ECDC4")
    .style("border-radius", "6px")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("padding", "20px 10px"); // Added padding all around
  
  // Show loading message
  const loadingMsg = vizContainer.append("p")
    .attr("class", "loading-message")
    .style("color", "white")
    .style("font-family", "'Courier New', Courier, monospace")
    .style("font-size", "16px")
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
    d3.json(`../data/${dataDir}/${stateCode}_recipients_fy2020_2025-05-05.json`),
    d3.json(`../data/${dataDir}/${stateCode}_recipients_fy2021_2025-05-05.json`),
    d3.json(`../data/${dataDir}/${stateCode}_recipients_fy2022_2025-05-05.json`),
    d3.json(`../data/${dataDir}/${stateCode}_recipients_fy2023_2025-05-05.json`),
    d3.json(`../data/${dataDir}/${stateCode}_recipients_fy2024_2025-05-05.json`)
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
    
    // Generate a state data summary
    createStateSummary(data, stateCode);
    
    // Create the race chart
    createRaceChart(data);
  })
  .catch(err => {
    console.error(`Error loading ${stateCode.toUpperCase()} JSON:`, err);
    vizContainer.append("p")
      .attr("class", "loading-message")
      .style("color", "white")
      .style("font-family", "'Courier New', Courier, monospace")
      .style("font-size", "16px")
      .text(`Error loading data for ${stateCode.toUpperCase()}. Please try another state.`);
  });
}

// Helper function for number formatting (moved up for accessibility)
const formatNumber = d => {
  const n = Math.abs(d);
  if (n >= 1e9) return (d/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (d/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (d/1e3).toFixed(1) + 'K';
  return d.toString();
};

// Function to create a summary of the state data
function createStateSummary(data, stateCode) {
  // Calculate total contract amount
  const totalAmount = d3.sum(data, d => d.value);
  
  // Find unique recipients
  const uniqueRecipients = new Set(data.map(d => d.name)).size;
  
  // Get fiscal year range
  const years = [...new Set(data.map(d => d.date.getFullYear()))].sort();
  const yearRange = `${years[0]}-${years[years.length-1]}`;
  
  // Find top recipient in the most recent year
  const mostRecentYear = Math.max(...years);
  const mostRecentData = data.filter(d => d.date.getFullYear() === mostRecentYear);
  
  // Sort by value and get top recipient
  mostRecentData.sort((a, b) => b.value - a.value);
  const topRecipient = mostRecentData.length > 0 ? mostRecentData[0].name : "Not available";
  const topAmount = mostRecentData.length > 0 ? formatNumber(mostRecentData[0].value) : "N/A";
  
  // Create formatted summary
  const stateName = stateCode === 'ca' ? 'California' : stateCode === 'md' ? 'Maryland' : 'Virginia';
  const summary = `
    <p><strong>${stateName}</strong> received a total of <strong>${formatNumber(totalAmount)}</strong> in federal contracts 
    during fiscal years ${yearRange}, distributed among <strong>${uniqueRecipients}</strong> unique recipients. 
    In FY ${mostRecentYear}, the top recipient was <strong>${topRecipient}</strong> 
    with <strong>${topAmount}</strong> in contract value.</p>
  `;
  
  // Update the total-description div
  document.getElementById('total-description').innerHTML = summary;
  
  // Make it visible if it's not already
  document.getElementById('total-description').style.display = 'block';
}

// Helper function to format company names - shortened for smaller chart dimensions
function formatCompanyName(name) {
  // Truncate to 25 characters and add ellipsis if longer
  return name.length > 25 ? name.substring(0, 25) + '...' : name;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to restart the race animation for the current state
function restartRace() {
  // Get the data from the current chart
  const vizContainer = d3.select("#bar-vis .race-visualization");
  
  // If no visualization exists yet, load the default state
  if (vizContainer.empty()) {
    loadDataAndCreateChart(currentState);
    return;
  }
  
  // Otherwise, show a "restarting" message and trigger the race
  const raceButton = d3.select(".restart-button");
  
  // Disable the button during animation
  raceButton
    .property("disabled", true)
    .style("opacity", "0.5")
    .style("cursor", "not-allowed")
    .text("Restarting...");
  
  // Run the race
  runBarChartRace(window.currentChartData);
  
  // Re-enable the button after animation
  setTimeout(() => {
    raceButton
      .property("disabled", false)
      .style("opacity", "1")
      .style("cursor", "pointer")
      .text("Restart Race");
  }, duration * k * 5 + 500); // Approximate animation duration
}

// ── MAIN ENTRY ─────────────────────────────────────────────────────────────────
// Initialize with California data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDataAndCreateChart(currentState);
});

function createRaceChart(data) {
  // Save data reference for restart function
  window.currentChartData = data;
  
  // Start the race immediately
  runBarChartRace(data);
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

  // Build SVG
  const svg = createSvg();

  // set up scales with adjusted positioning
  const x = d3.scaleLinear([0,1], [marginLeft, width - marginRight]);
  const y = d3.scaleBand()
      .domain(d3.range(n+1))
      .rangeRound([marginTop, marginTop + barSize*n])  // Remove extra space multiplier
      .padding(0.05);  // Reduce padding to bring bars closer

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
  let bar = svg.append("g")
    .attr("fill-opacity", 0.92)
    .selectAll("rect");
  return ([, data], transition) => bar = bar
    .data(data.slice(0,n), d=>d.name)
    .join(
      enter => enter.append("rect")
        .attr("fill", color)
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("y", d=>y((prev.get(d)||d).rank))
        .attr("width", d=>x((prev.get(d)||d).value)-x(0))
        // Add subtle rounded corners and stroke for better visibility
        .attr("rx", 6) // Larger corner radius
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.4),
      update => update,
      exit => exit.transition(transition).remove()
        .attr("y", d=>y((next.get(d)||d).rank))
        .attr("width", d=>x((next.get(d)||d).value)-x(0))
    )
    .call(sel=>sel.transition(transition)
      .attr("y", d=>y(d.rank))
      .attr("width", d=>x(d.value)-x(0)));
}

// Update labels with appropriate text sizes for the new dimensions
function labels(svg, x, y, prev, next) {
  // Create a container group for labels and connecting lines
  const labelGroup = svg.append("g");
  
  // Add a group for the connecting lines, placed before the text group
  const lineGroup = labelGroup.append("g")
    .attr("class", "connecting-lines")
    .attr("stroke", "#9ecaed")
    .attr("stroke-width", 2)    // Slightly thinner lines
    .attr("stroke-dasharray", "4,3");
  
  // Add text group with proper styling
  const textGroup = labelGroup.append("g")
    .style("font", `bold 18px var(--sans-serif)`) // Smaller font size
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
          .attr("x1", -30)  // Shorter connecting line
          .attr("x2", 0)
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
          .attr("x", -35)  // Position text with sufficient spacing
          .attr("dy", "-0.25em")
          .attr("fill", "#fff")
          .attr("text-shadow", "0 0 6px rgba(0,0,0,0.9)")  // Less extreme shadow
          .attr("font-size", "18px")  // Smaller font size
          .text(d => formatCompanyName(d.name))
          .call(t => t.append("tspan")
            .attr("fill", "#9ecaed")
            .attr("font-weight", "normal")
            .attr("x", -35)
            .attr("dy", "1.15em")
            .attr("font-size", "16px")  // Slightly smaller than the name
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

// Update ticker to update the external fiscal year display instead of the SVG
function ticker(svg, keyframes) {
  // Select the external fiscal year display element
  const fiscalYearDisplay = d3.select("#fiscal-year-display");
  
  // Set initial year
  if (keyframes && keyframes.length > 0 && keyframes[0][0]) {
    const initialYear = keyframes[0][0].getFullYear();
    const yearText = "FY " + initialYear;
    fiscalYearDisplay.text(yearText);
  } else {
    console.warn("No valid initial keyframe found");
  }

  return ([date], transition) => {
    if (date) {
      const year = date.getFullYear();
      
      transition.end().then(() => {
        const yearText = "FY " + year;
        
        // Update the text in the external element
        fiscalYearDisplay.text(yearText)
          .style("opacity", 0)
          .transition()
          .duration(300)
          .style("opacity", 1);
      });
    } else {
      console.warn("Received invalid date in ticker update");
    }
  };
}

// Update axis with appropriate text size and positioning
function axis(svg, x, y) {
  // Create a group for the axis, positioned with enough space from the top
  const g = svg.append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .attr("class", "axis");
    
  // Configure the axis
  const ax = d3.axisTop(x)
    .ticks(width/200, ",d")
    .tickSizeOuter(0)
    .tickSizeInner(-barSize*n - marginTop);
    
  return (_, transition) => {
    // Apply the axis with transition
    g.transition(transition).call(ax);
    
    // Remove the first tick text (usually 0)
    g.select(".tick:first-of-type text").remove();
    
    // Style the grid lines
    g.selectAll(".tick:not(:first-of-type) line")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,3");
    
    // Style the tick labels
    g.selectAll(".tick text")
      .attr("fill", "#fff")
      .attr("font-size", "16px") // Increased font size
      .attr("font-weight", "bold")
      .attr("dy", "-0.7em") // Increased upward shift
      .attr("text-anchor", "middle"); // Ensure text is centered on tick
    
    // Remove the domain line
    g.select(".domain").remove();
  };
}

function textTween(a, b) {
  const i = d3.interpolateNumber(a, b);
  return t => this.textContent = formatNumber(i(t));
}

const formatDate = d3.utcFormat("%Y");

// Update the createSvg function to make the chart more responsive
function createSvg() {
  // Clear any existing SVG
  d3.select("#bar-vis .race-visualization svg").remove();

  // Create the SVG with proper dimensions for the container
  const svg = d3.select("#bar-vis .race-visualization")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", "100%")
    .attr("height", "100%")
    .style("max-width", "100%")
    .style("display", "block")
    .style("margin", "0 auto")
    .style("padding-top", "20px"); // Add padding at the top for axis labels
    
  // Add a background for better visibility
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#2a2a2a");
    
  return svg;
}