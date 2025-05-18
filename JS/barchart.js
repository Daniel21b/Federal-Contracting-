// Configuration
const width = 1200;
const height = 800;
const marginTop = 16;
const marginRight = 200;
const marginBottom = 6;
const marginLeft = 0;
const barSize = 40;
const n = 15; // Show top 15 contractors
const k = 10;
const duration = 2000;

// Animation control
let isAnimationPaused = false;
let currentAnimation = null;

// Initialize formatting functions
const formatNumber = d3.format("$,.0f");
const formatDate = d3.utcFormat("%Y");
let tickFormat = d3.format("$,.0f");

// Initialize scales
const x = d3.scaleLinear([0, 1], [marginLeft, width - marginRight]);
const y = d3.scaleBand()
  .domain(d3.range(n + 1))
  .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
  .padding(0.1);

// Color scale for bars
const colors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
  "#D4A5A5", "#9B59B6", "#3498DB", "#E67E22", "#27AE60",
  "#E74C3C", "#F1C40F", "#1ABC9C", "#34495E", "#95A5A6"
];

// Function to get color for a rank
function getColorByRank(rank) {
  return colors[rank % colors.length];
}

// Function to update button states
function updateButtons(selectedState) {
  d3.selectAll('.state-button').classed('active', false);
  d3.select(`[data-state="${selectedState}"]`).classed('active', true);
}

// Function to clear the current chart
function clearChart() {
  d3.select("#chart").selectAll("*").remove();
}

// Function to update statistics
function updateStats(data) {
  const totalValue = d3.sum(data, d => d.value);
  const topContractor = data.sort((a, b) => b.value - a.value)[0];
  
  d3.select("#total-contracts span").text(formatNumber(totalValue));
  d3.select("#top-contractor span").text(topContractor.name);
  d3.select("#current-year span").text(formatDate(data[0].date));
}

// Add tooltip
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Function to load and display data for a state
async function loadStateData(state) {
  clearChart();
  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `../processed_data/${state}_contracts_${currentDate}.csv`;
  
  const container = d3.select("#chart");
  
  try {
    const data = await d3.csv(fileName);
    if (!data) {
      throw new Error('No data loaded');
    }
    
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

      async function animate() {
        for (const keyframe of keyframes) {
          if (isAnimationPaused) {
            await new Promise(resolve => {
              currentAnimation = resolve;
            });
          }

          const transition = svg.transition()
            .duration(duration)
            .ease(d3.easeLinear);

          x.domain([0, keyframe[1][0].value]);

          updateAxis(keyframe, transition);
          updateBars(keyframe, transition);
          updateLabels(keyframe, transition);
          updateTicker(keyframe, transition);
          
          // Update statistics
          updateStats(keyframe[1]);

          await transition.end();
        }
      }

      animate();
    }

    function bars(svg) {
      let bar = svg.append("g")
        .attr("fill-opacity", 0.9)
        .selectAll("rect");

      return ([date, data], transition) => {
        const sortedData = data.slice(0, n);
        
        bar = bar
          .data(sortedData, d => d.name)
          .join(
            enter => enter.append("rect")
              .attr("fill", d => getColorByRank(d.rank))
              .attr("height", y.bandwidth())
              .attr("x", x(0))
              .attr("y", d => y((prev.get(d) || d).rank))
              .attr("width", d => x((prev.get(d) || d).value) - x(0)),
            update => update,
            exit => exit.remove()
          );

        // Add tooltip interactions
        bar
          .on("mouseover", function(event, d) {
            tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            tooltip.html(
              `Company: ${d.name}<br/>
               Value: ${formatNumber(d.value)}<br/>
               Rank: ${d.rank + 1}`
            )
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
            
            d3.select(this)
              .attr("fill-opacity", 1)
              .attr("stroke", "#fff")
              .attr("stroke-width", 2);
          })
          .on("mouseout", function(event, d) {
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
            
            d3.select(this)
              .attr("fill-opacity", 0.9)
              .attr("stroke", "none")
              .attr("fill", getColorByRank(d.rank));
          });

        bar.transition(transition)
          .attr("y", d => y(d.rank))
          .attr("width", d => x(d.value) - x(0))
          .attr("fill", d => getColorByRank(d.rank));

        return bar;
      };
    }

    function labels(svg) {
      let label = svg.append("g")
        .style("font", "bold 12px var(--sans-serif)")
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end")
        .selectAll("text");

      return ([date, data], transition) => {
        label = label
          .data(data.slice(0, n), d => d.name)
          .join(
            enter => {
              const text = enter.append("text")
                .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                .attr("y", y.bandwidth() / 2)
                .attr("x", -6)
                .attr("dy", "-0.25em")
                .text(d => d.name);

              text.append("tspan")
                .attr("fill-opacity", 0.7)
                .attr("font-weight", "normal")
                .attr("x", -6)
                .attr("dy", "1.15em");

              return text;
            },
            update => update,
            exit => exit.transition(transition).remove()
              .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
          );

        label.transition(transition)
          .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`);

        label.select("tspan")
          .transition(transition)
          .tween("text", d => textTween((prev.get(d) || d).value, d.value));

        return label;
      };
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
        transition.end().then(() => {
          now.text(formatDate(date));
          d3.select("#current-year span").text(formatDate(date));
        });
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
      .text(`Error loading ${state} data. Please try again. Make sure the data file exists at ${fileName}`);
  }
}

// Add click handlers to buttons
d3.selectAll('.state-button').on('click', function() {
  const state = d3.select(this).attr('data-state');
  updateButtons(state);
  loadStateData(state);
});

// Add pause/resume handler
d3.select('#pause-button').on('click', function() {
  const button = d3.select(this);
  if (isAnimationPaused) {
    button.text("Pause");
    isAnimationPaused = false;
    if (currentAnimation) {
      currentAnimation();
      currentAnimation = null;
    }
  } else {
    button.text("Resume");
    isAnimationPaused = true;
  }
});

// Add restart handler
d3.select('#restart-button').on('click', function() {
  const currentState = d3.select('.state-button.active').attr('data-state');
  isAnimationPaused = false;
  d3.select('#pause-button').text("Pause");
  loadStateData(currentState);
});

// Load California data by default
loadStateData('california'); 