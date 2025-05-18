// Configuration
const width = 1200;
const height = 800; // Increased height for more bars
const marginTop = 16;
const marginRight = 200; // Increased for longer company names
const marginBottom = 6;
const marginLeft = 0;
const barSize = 40;
const n = 15; // Show top 15 contractors
const k = 10;
const duration = 2000;

// Initialize formatting functions
const formatNumber = d3.format("$,.0f"); // Format as currency
const formatDate = d3.utcFormat("%Y");
let tickFormat = d3.format("$,.0f"); // Format axis ticks as currency

// Initialize scales
const x = d3.scaleLinear([0, 1], [marginLeft, width - marginRight]);
const y = d3.scaleBand()
  .domain(d3.range(n + 1))
  .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
  .padding(0.1);

// Color scale for bars
const color = d => {
  return "#2E86C1"; // Use a consistent blue color for federal contracts
};

// Function to update button states
function updateButtons(selectedState) {
  d3.selectAll('.state-button').classed('active', false);
  d3.select(`[data-state="${selectedState}"]`).classed('active', true);
}

// Function to clear the current chart
function clearChart() {
  const container = d3.select("#chart");
  container.selectAll("*").remove();
}

// Function to load and display data for a state
async function loadStateData(state) {
  clearChart();
  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `processed_data/${state}_contracts_${currentDate}.csv`;
  
  try {
    const data = await d3.csv(fileName);
    data.forEach(d => {
      d.value = +d.value;
      d.date = new Date(d.date);
    });
    
    // Process data
    const names = new Set(data.map(d => d.name));
    const datevalues = Array.from(d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
      .map(([date, data]) => [new Date(date), data])
      .sort(([a], [b]) => d3.ascending(a, b));

    function rank(value) {
      const data = Array.from(names, name => ({name, value: value(name)}));
      data.sort((a, b) => d3.descending(a.value, b.value));
      for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
      return data;
    }

    // Generate keyframes
    const keyframes = (() => {
      const frames = [];
      let ka, a, kb, b;
      for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
        for (let i = 0; i < k; ++i) {
          const t = i / k;
          frames.push([
            new Date(ka * (1 - t) + kb * t),
            rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
          ]);
        }
      }
      frames.push([new Date(kb), rank(name => b.get(name) || 0)]);
      return frames;
    })();

    const nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.name);
    const prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
    const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

    // Create and append the visualization
    const container = d3.select("#chart");
    
    async function createChart() {
      const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");

      container.node().appendChild(svg.node());

      const updateBars = bars(svg);
      const updateAxis = axis(svg);
      const updateLabels = labels(svg);
      const updateTicker = ticker(svg);

      for (const keyframe of keyframes) {
        const transition = svg.transition()
          .duration(duration)
          .ease(d3.easeLinear);

        // Extract the top bar's value.
        x.domain([0, keyframe[1][0].value]);

        updateAxis(keyframe, transition);
        updateBars(keyframe, transition);
        updateLabels(keyframe, transition);
        updateTicker(keyframe, transition);

        await transition.end();
      }
    }

    function bars(svg) {
      let bar = svg.append("g")
        .attr("fill-opacity", 0.6)
        .selectAll("rect");

      return ([date, data], transition) => bar = bar
        .data(data.slice(0, n), d => d.name)
        .join(
          enter => enter.append("rect")
            .attr("fill", color)
            .attr("height", y.bandwidth())
            .attr("x", x(0))
            .attr("y", d => y((prev.get(d) || d).rank))
            .attr("width", d => x((prev.get(d) || d).value) - x(0)),
          update => update,
          exit => exit.transition(transition).remove()
            .attr("y", d => y((next.get(d) || d).rank))
            .attr("width", d => x((next.get(d) || d).value) - x(0))
        )
        .call(bar => bar.transition(transition)
          .attr("y", d => y(d.rank))
          .attr("width", d => x(d.value) - x(0)));
    }

    function labels(svg) {
      let label = svg.append("g")
        .style("font", "bold 12px var(--sans-serif)")
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end")
        .selectAll("text");

      return ([date, data], transition) => label = label
        .data(data.slice(0, n), d => d.name)
        .join(
          enter => enter.append("text")
            .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
            .attr("y", y.bandwidth() / 2)
            .attr("x", -6)
            .attr("dy", "-0.25em")
            .text(d => d.name)
            .call(text => text.append("tspan")
              .attr("fill-opacity", 0.7)
              .attr("font-weight", "normal")
              .attr("x", -6)
              .attr("dy", "1.15em")),
          update => update,
          exit => exit.transition(transition).remove()
            .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
            .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
        )
        .call(bar => bar.transition(transition)
          .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
          .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))));
    }

    function textTween(a, b) {
      const i = d3.interpolateNumber(a, b);
      return function(t) {
        this.textContent = formatNumber(i(t));
      };
    }

    function axis(svg) {
      const g = svg.append("g")
        .attr("transform", `translate(0,${marginTop})`);

      const axis = d3.axisTop(x)
        .ticks(width / 160, tickFormat)
        .tickSizeOuter(0)
        .tickSizeInner(-barSize * (n + y.padding()));

      return (_, transition) => {
        g.transition(transition).call(axis);
        g.select(".tick:first-of-type text").remove();
        g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
        g.select(".domain").remove();
      };
    }

    function ticker(svg) {
      const now = svg.append("text")
        .style("font", `bold ${barSize}px var(--sans-serif)`)
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end")
        .attr("x", width - 6)
        .attr("y", marginTop + barSize * (n - 0.45))
        .attr("dy", "0.32em")
        .text(formatDate(keyframes[0][0]));

      return ([date], transition) => {
        transition.end().then(() => now.text(formatDate(date)));
      };
    }

    // Start the animation
    await createChart();
  } catch (error) {
    console.error(`Error loading ${state} data:`, error);
    container.append("p")
      .attr("class", "error")
      .style("color", "red")
      .style("text-align", "center")
      .text(`Error loading ${state} data. Please try again.`);
  }
}

// Add click handlers to buttons
d3.selectAll('.state-button').on('click', function() {
  const state = d3.select(this).attr('data-state');
  updateButtons(state);
  loadStateData(state);
});

// Load California data by default
loadStateData('california');