
const padding = {
    top: 20,
    right: 100,
    bottom: 20,
    left: 100
};

// Initialize sankey generator
function createSankeyGenerator(viewType) {
  return d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .nodeAlign(getNodeAlignment(viewType))
    .extent([[padding.left, padding.top], [width - padding.right, height - padding.bottom]]);
}

// Add zoom behavior
const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", zoomed)
    .translateExtent([[0, 0], [width, height]]);


// Create separate color scales for each type
const agencyColorScale = d3.scaleOrdinal(d3.schemeBlues[9]);        // Blue spectrum
const recipientColorScale = d3.scaleOrdinal(d3.schemeOranges[9]);   // Orange spectrum
const categoryColorScale = d3.scaleOrdinal(d3.schemePurples[9]);    // Purple spectrum
const businessSizeColorScale = d3.scaleOrdinal(d3.schemeYlGnBu[9]); // Yellow-Green-Blue spectrum
const orgTypeColorScale = d3.scaleOrdinal(d3.schemeReds[9]);        // Red spectrum
const actionTypeColorScale = d3.scaleOrdinal(d3.schemeBrBG[9]);     // Brown-Green spectrum
const awardTypeColorScale = d3.scaleOrdinal(d3.schemePRGn[9]);      // Purple-Green spectrum

// Initialize name sets for each type
let agencyNames = new Set();
let recipientNames = new Set();
let categoryNames = new Set();
let businessSizeNames = new Set();
let orgTypeNames = new Set();
let actionTypeNames = new Set();
let awardTypeNames = new Set();

function updateColorDomains(data) {
    // Clear existing sets
    agencyNames.clear();
    recipientNames.clear();
    categoryNames.clear();
    businessSizeNames.clear();
    orgTypeNames.clear();
    actionTypeNames.clear();
    awardTypeNames.clear();
    
    // Collect names for each type
    data.nodes.forEach(node => {
        switch(node.type) {
            case 'agency':
                agencyNames.add(node.name);
                break;
            case 'recipient':
                recipientNames.add(node.name);
                break;
            case 'category':
                categoryNames.add(node.name);
                break;
            case 'business_size':
                businessSizeNames.add(node.name);
                break;
            case 'org_type':
                orgTypeNames.add(node.name);
                break;
            case 'action_type':
                actionTypeNames.add(node.name);
                break;
            case 'award_type':
                awardTypeNames.add(node.name);
                break;
        }
    });
    
    // Update color scale domains
    agencyColorScale.domain(Array.from(agencyNames));
    recipientColorScale.domain(Array.from(recipientNames));
    categoryColorScale.domain(Array.from(categoryNames));
    businessSizeColorScale.domain(Array.from(businessSizeNames));
    orgTypeColorScale.domain(Array.from(orgTypeNames));
    actionTypeColorScale.domain(Array.from(actionTypeNames));
    awardTypeColorScale.domain(Array.from(awardTypeNames));
}

function getNodeColor(d) {
    // For states, use the predefined state colors
    if (d.type === 'state' && stateColors[d.name]) {
        return stateColors[d.name];
    }
    
    // For other types, use their respective color scales
    switch (d.type) {
        case 'agency':
            return agencyColorScale(d.name);
        case 'recipient':
            return recipientColorScale(d.name);
        case 'category':
            return categoryColorScale(d.name);
        case 'business_size':
            return businessSizeColorScale(d.name);
        case 'org_type':
            return orgTypeColorScale(d.name);
        case 'action_type':
            return actionTypeColorScale(d.name);
        case 'award_type':
            return awardTypeColorScale(d.name);
        default:
            return '#999'; // Default color for unknown types
    }
}

function formatValue(value) {
  // Format number as currency with billions (B) and millions (M)
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}

// Constants for node alignment
const LEFT_ALIGN = d3.sankeyLeft;
const RIGHT_ALIGN = d3.sankeyRight;
const CENTER_ALIGN = d3.sankeyCenter;
const JUSTIFY_ALIGN = d3.sankeyJustify;

// Function to determine node alignment based on node type and current view
function getNodeAlignment(viewType) {
  // Multi-level flows that should use justified alignment
  const justifiedViews = [
    'agency_state_recipient',
    'agency_category_state',
    'state_award_business',
    'agency_state_action_business'
  ];
  
  // Views where the final node should be right-aligned
  const rightEndingViews = [
    'state_action_type',
    'state_business_size',
    'state_org_type'
  ];

  // Views where recipients should be on the right
  const rightRecipientViews = [
    'agency_recipient',
    'category_recipient',
    'business_size',
    'org_type',
    'action_type',
    'award_type'
  ];

  if (justifiedViews.includes(viewType)) {
    return JUSTIFY_ALIGN;
  } else if (rightEndingViews.includes(viewType)) {
    return d => d.type === 'action_type' || d.type === 'business_size' || d.type === 'org_type' ? RIGHT_ALIGN : LEFT_ALIGN;
  } else if (rightRecipientViews.includes(viewType)) {
    return d => d.type === 'recipient' ? RIGHT_ALIGN : LEFT_ALIGN;
  } else {
    return LEFT_ALIGN;
  }
}

// Create Sankey generator with dynamic alignment
function createSankeyGenerator(viewType) {
  return d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .nodeAlign(getNodeAlignment(viewType))
    .extent([[padding.left, padding.top], 
            [width - padding.right, height - padding.bottom]]);
}

function createSankey(data) {
  // Clear existing content
  d3.select("#sankey-vis").selectAll("*").remove();
  
  // Get the current view type from the select element
  const viewType = d3.select("#sankey-view-select").property("value");
  
  const svg = d3.select("#sankey-vis")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("min-width", "100%");

  // Add zoom controls
  const zoomControls = svg.append("g")
    .attr("class", "zoom-controls")
    .attr("transform", "translate(20, 20)");

  zoomControls.append("rect")
    .attr("class", "zoom-btn")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", 30)
    .attr("rx", 5)
    .style("fill", "#fff")
    .style("stroke", "#666")
    .on("click", () => zoomBy(1.2));

  zoomControls.append("text")
    .attr("x", 15)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("+");

  zoomControls.append("rect")
    .attr("class", "zoom-btn")
    .attr("x", 0)
    .attr("y", 40)
    .attr("width", 30)
    .attr("height", 30)
    .attr("rx", 5)
    .style("fill", "#fff")
    .style("stroke", "#666")
    .on("click", () => zoomBy(0.8));

  zoomControls.append("text")
    .attr("x", 15)
    .attr("y", 60)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .text("−");

  // Create main group for zoom
  const g = svg.append("g")
    .attr("class", "zoom-group");

  // Enable zoom behavior
  svg.call(zoom)
    .on("dblclick.zoom", null); // Disable double-click zoom

  // Create Sankey generator with dynamic alignment
  const sankey = createSankeyGenerator(viewType);

  // Compute the Sankey layout
  const {nodes, links} = sankey(data);

  // Create the gradients for the links
  const defs = g.append("defs");
  const gradients = defs.selectAll("linearGradient")
    .data(links)
    .join("linearGradient")
      .attr("id", (d, i) => `link-gradient-${i}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => d.source.x1)
      .attr("x2", d => d.target.x0);    gradients.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", d => getNodeColor(d.source));

  gradients.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", d => getNodeColor(d.target));

  // Create a group for the links
  const linkGroup = g.append("g")
    .attr("class", "links")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.4);

  // Add the links with hover effects
  const link = linkGroup.selectAll("path")
    .data(links)
    .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", (d, i) => `url(#link-gradient-${i})`)
      .attr("stroke-width", d => Math.max(1, d.width))
      .style("mix-blend-mode", "multiply")
      .on("mouseover", function(event, d) {
        // Highlight connected nodes
        const nodeElements = node.filter(n => n === d.source || n === d.target);
        nodeElements.style("opacity", 1);
        
        // Dim other links
        link.style("stroke-opacity", l => (l === d) ? 0.8 : 0.1);
        
        // Show tooltip
        const tooltip = d3.select(this).select("title");
        if (!tooltip.empty()) {
          tooltip.style("display", "block");
        }
      })
      .on("mouseout", function(event, d) {
        // Restore normal state
        node.style("opacity", 0.8);
        link.style("stroke-opacity", 0.4);
        
        // Hide tooltip
        const tooltip = d3.select(this).select("title");
        if (!tooltip.empty()) {
          tooltip.style("display", "none");
        }
      })
    .append("title")
      .text(d => `${d.source.name} → ${d.target.name}\n${formatValue(d.value)}`);

  // Create a group for the nodes
  const nodeGroup = g.append("g")
    .attr("class", "nodes");

  // Add the nodes with hover effects
  const node = nodeGroup.selectAll("rect")
    .data(nodes)
    .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => getNodeColor(d))
      .attr("opacity", 0.8)
      .on("mouseover", function(event, d) {
        // Highlight connected links
        const connectedLinks = link.filter(l => l.source === d || l.target === d);
        connectedLinks.style("stroke-opacity", 0.8);
        
        // Dim other nodes
        node.style("opacity", n => (n === d) ? 1 : 0.3);
        
        // Show tooltip
        const tooltip = d3.select(this).select("title");
        if (!tooltip.empty()) {
          tooltip.style("display", "block");
        }
      })
      .on("mouseout", function(event, d) {
        // Restore normal state
        link.style("stroke-opacity", 0.4);
        node.style("opacity", 0.8);
        
        // Hide tooltip
        const tooltip = d3.select(this).select("title");
        if (!tooltip.empty()) {
          tooltip.style("display", "none");
        }
      })
    .append("title")
      .text(d => `${d.name}\n${formatValue(d.value)}`);

  // Add labels with better positioning and hover effects
  const label = g.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name)
        .style("font-size", "12px")
        .style("font-weight", "normal")
        .style("fill-opacity", 0.9)
        .style("cursor", "default")
        .on("mouseover", function(event, d) {
          // Highlight corresponding node and its connections
          const nodeElement = node.filter(n => n === d);
          const connectedLinks = link.filter(l => l.source === d || l.target === d);
          
          nodeElement.style("opacity", 1);
          connectedLinks.style("stroke-opacity", 0.8);
          d3.select(this)
            .style("font-weight", "bold")
            .style("fill-opacity", 1);
        })
        .on("mouseout", function(event, d) {
          // Restore normal state
          node.style("opacity", 0.8);
          link.style("stroke-opacity", 0.4);
          d3.select(this)
            .style("font-weight", "normal")
            .style("fill-opacity", 0.9);
        });
}

// Zoom functions
function zoomed(event) {
    const {transform} = event;
    const zoomGroup = d3.select(".zoom-group");
    
    // Apply the transform to the main group
    zoomGroup.attr("transform", transform);
    
    // Update font sizes and styling based on zoom level
    const baseFontSize = 12;
    const maxFontSize = 24;
    const minFontSize = 8;
    
    // Calculate new font size based on zoom level with min/max limits
    const newFontSize = Math.min(maxFontSize, Math.max(minFontSize, baseFontSize / transform.k));
    
    // Apply font size to all text elements
    zoomGroup.selectAll("text")
        .style("font-size", `${newFontSize}px`)
        .style("font-weight", newFontSize <= 10 ? "normal" : "bold");
    
    // Update node label positions for better readability
    zoomGroup.selectAll(".labels text")
        .attr("x", d => d.x0 < width / 2 ? 
            d.x1 + (6 / transform.k) : 
            d.x0 - (6 / transform.k))
        .attr("dy", `${0.35 / transform.k}em`);
        
    // Adjust stroke width for better visibility at different zoom levels
    zoomGroup.selectAll(".links path")
        .style("stroke-opacity", transform.k < 1 ? 0.3 : 0.4);
    
    zoomGroup.selectAll(".nodes rect")
        .style("stroke-width", transform.k < 1 ? 0.5 : 1);
}

function zoomBy(factor) {
    const svg = d3.select("#sankey-vis svg");
    const currentTransform = d3.zoomTransform(svg.node());
    
    svg.transition()
        .duration(300)
        .call(zoom.transform, 
            currentTransform.scale(currentTransform.k * factor));
}

// Remove the old processData functions since we're now using pre-processed JSON
function processAgencyFlow(data) {
  // Agency → State → Recipient
  const nodes = [];
  const links = [];
  const agencies = new Set();
  const states = new Set(['CA', 'MD', 'VA']);
  const recipients = new Set();

  // Process data to create nodes and links
  data.forEach(d => {
    agencies.add(d.awarding_agency_name);
    recipients.add(d.recipient_name);
    
    links.push({
      source: d.awarding_agency_name,
      target: d.state,
      value: +d.amount
    });
    
    links.push({
      source: d.state,
      target: d.recipient_name,
      value: +d.amount
    });
  });

  return {
    nodes: [...agencies, ...states, ...recipients].map(name => ({name})),
    links: links
  };
}

function processStateCategoryFlow(data) {
  // State → Category → Recipient
  const nodes = [];
  const links = [];
  const states = new Set(['CA', 'MD', 'VA']);
  const categories = new Set();
  
  data.forEach(d => {
    categories.add(d.category);
    
    links.push({
      source: d.state,
      target: d.category,
      value: +d.amount
    });
    
    links.push({
      source: d.category,
      target: d.recipient_name,
      value: +d.amount
    });
  });

  return {
    nodes: [...states, ...categories].map(name => ({name})),
    links: links
  };
}


// Add controls to switch between views
function initializeSankeyControls() {
  const controls = d3.select("#sankey-controls")
    .append("div")
    .attr("class", "sankey-view-controls");
    
  controls.append("select")
    .attr("id", "sankey-view-select")
    .on("change", function() {
      loadAndDisplayView(this.value);
    })
    .selectAll("option")
    .data([
      {value: 'agency_state', text: 'Agency to State'},
      {value: 'agency_state_recipient', text: 'Agency → State → Recipient'},
      {value: 'agency_category_state', text: 'Agency → Category → State'},
      {value: 'business_size', text: 'Business Size to Recipient'},
      {value: 'org_type', text: 'Organization Type to Recipient'},
      {value: 'award_type_state', text: 'Award Type to State'},
      {value: 'state_action_type', text: 'State to Action Type'},
      {value: 'state_business_size', text: 'State to Business Size'},
      {value: 'state_org_type', text: 'State to Organization Type'},
      {value: 'action_type_state', text: 'Action Type to State'},
      {value: 'state_award_business', text: 'State → Award Type → Business Size'},
      {value: 'agency_state_action_business', text: 'Agency → State → Action Type → Business Size'}
    ])
    .join("option")
    .attr("value", d => d.value)
    .text(d => d.text);
}

// Load and display the selected view
function loadAndDisplayView(view) {
  // Store the current view type
  d3.select("#sankey-view-select").property("value", view);
  
  d3.json(`../data/SankeyData/sankey_${view}.json`)
    .then(data => {
      if (!data || !data.nodes || !data.links) {
        throw new Error('Invalid data format: data must contain nodes and links arrays');
      }
      if (data.nodes.length === 0 || data.links.length === 0) {
        throw new Error('Empty data: both nodes and links arrays must contain items');
      }
      updateColorDomains(data);  // Update color scales before creating the diagram
      createSankey(data);
    })
    .catch(error => {
      console.error("Error loading the data:", error);
      // Clear the visualization and show an error message
      const sankeyVis = d3.select("#sankey-vis");
      sankeyVis.selectAll("*").remove();
      sankeyVis.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text("Error loading data. Please try another view.");
    });
}