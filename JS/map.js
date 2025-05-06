var svg = d3.select("#vis svg"),
    path = svg.append("path");

var currentState = null;

// Complete state color mapping with lighter shades
var stateColors = {
    // Pacific Coast
    'CA': '#FFD580', // Light orange
    'OR': '#98FB98', // Light forest green
    'WA': '#90EE90', // Light green

    // Southwest
    'AZ': '#E9967A', // Light terracotta
    'NM': '#F08080', // Light coral red
    'NV': '#F5DEB3', // Wheat/light tan
    'TX': '#FFE4B5', // Light peach/moccasin

    // Northeast
    'NY': '#B0C4DE', // Light steel blue
    'MA': '#ADD8E6', // Light blue
    'CT': '#B0E0E6', // Powder blue
    'RI': '#87CEEB', // Sky blue
    'NJ': '#C0C0C0', // Silver
    'ME': '#E0FFFF', // Light cyan
    'VT': '#98FB98', // Light green
    'NH': '#B0E0E6', // Powder blue
    'PA': '#D3D3D3', // Light gray

    // Midwest
    'IA': '#FFF68F', // Light khaki/corn
    'KS': '#FAFAD2', // Light goldenrod
    'NE': '#FFFACD', // Lemon chiffon
    'IL': '#90EE90', // Light green
    'IN': '#98FB98', // Pale green
    'OH': '#DEB887', // Light brown/burlywood
    'MI': '#87CEEB', // Sky blue
    'WI': '#DEB887', // Light brown/burlywood
    'MN': '#98FB98', // Pale green
    'MO': '#F0E68C', // Light khaki
    'SD': '#F5DEB3', // Wheat
    'ND': '#F5F5DC', // Beige

    // South/Southeast
    'FL': '#AFEEEE', // Pale turquoise
    'GA': '#FFDAB9', // Peachpuff
    'AL': '#DEB887', // Light brown/burlywood
    'MS': '#D2B48C', // Tan
    'LA': '#E6E6FA', // Lavender
    'SC': '#FFE4B5', // Moccasin
    'NC': '#F0FFF0', // Honeydew
    'TN': '#FFF0F5', // Lavender blush
    'KY': '#F5F5DC', // Beige
    'WV': '#E0FFFF', // Light cyan
    'VA': '#E6E6FA', // Lavender
    'AR': '#DEB887', // Light brown/burlywood
    'OK': '#FFE4B5', // Moccasin

    // Mountain States
    'CO': '#B0E0E6', // Powder blue
    'MT': '#98FB98', // Pale green
    'UT': '#FFA07A', // Light salmon
    'ID': '#E0FFFF', // Light cyan
    'WY': '#F5DEB3', // Wheat
    'NM': '#FFB6C1', // Light pink

    // Capital & Nearby
    'DC': '#B0C4DE', // Light steel blue
    'MD': '#E6E6FA', // Lavender
    'DE': '#E0FFFF', // Light cyan

    // Alaska & Hawaii (if included)
    'AK': '#E0FFFF', // Light cyan
    'HI': '#98FF98', // Mint green

    // Default color for any missing states
    'default': '#F5F5F5' // White smoke
};

d3.json("../data/MapCoordinates/states.json", function(err, topo) {
  if (err) throw err;
  
  // Get states with their IDs and coordinates
  var states = topojson.feature(topo, topo.objects.states)
    .features.map(function(d) {
      return {
        id: d.id,
        coordinates: d.geometry.coordinates[0],
        color: stateColors[d.id] || stateColors.default // Add color property
      };
    });

  // Create radio buttons for each state
  var controls = d3.select("#stateControls");
  
  states.forEach(function(state) {
    var formCheck = controls.append("div")
      .attr("class", "form-check me-4 mb-2");

    var input = formCheck.append("input")
      .attr("class", "form-check-input")
      .attr("type", "radio")
      .attr("name", "stateRadio")
      .attr("id", state.id.toLowerCase())
      .attr("value", state.id)
      .on("change", function() {
        morphToState(state);
      });

    formCheck.append("label")
      .attr("class", "form-check-label")
      .attr("for", state.id.toLowerCase())
      .text(state.id);

    // Set the first state as checked
    if (states.indexOf(state) === 0) {
      input.attr("checked", true);
    }
  });

  // Set initial state
  currentState = states[0];
  path.attr("d", createPathFromCoordinates(currentState.coordinates))
      .style("fill", currentState.color); // Set initial color

  function morphToState(targetState) {
    if (!currentState) return;
    
    var interpolator = flubber.interpolate(
      currentState.coordinates,
      targetState.coordinates
    );

    path.transition()
      .duration(800)
      .attrTween("d", function() { return interpolator; })
      .style("fill", targetState.color) // Transition the color
      .on("end", function() {
        currentState = targetState;
      });
  }

  function createPathFromCoordinates(coordinates) {
    return d3.line()(coordinates);
  }
});
