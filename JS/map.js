var svg = d3.select("#vis svg"),
    path = svg.append("path");

var currentState = null;
var scaleFactor = 0.57;
var statesData = null;

// Define allowed states
var allowedStates = ['CA', 'MD', 'VA'];

// State name mapping
var stateNames = {
    'CA': 'California',
    'MD': 'Maryland',
    'VA': 'Virginia'
};

// Get SVG dimensions
var svgWidth = parseInt(svg.attr("width"));
var svgHeight = parseInt(svg.attr("height"));

// Complete state color mapping with lighter shades - only for allowed states
var stateColors = {
    'CA': '#f5deb3', // Beige
    'MD': '#f4d35e', // Lavender
    'VA': '#e6b89c', // Lavender
    'default': '#F5F5F5' // White smoke
};

function getBoundingBox(coordinates) {
    var xCoords = coordinates.map(d => d[0]);
    var yCoords = coordinates.map(d => d[1]);
    return {
        x0: Math.min(...xCoords),
        y0: Math.min(...yCoords),
        x1: Math.max(...xCoords),
        y1: Math.max(...yCoords)
    };
}

function scaleAndCenterCoordinates(coordinates) {
    var bbox = getBoundingBox(coordinates);
    var width = bbox.x1 - bbox.x0;
    var height = bbox.y1 - bbox.y0;
    var scale = Math.min(svgWidth / width, svgHeight / height) * 0.8;
    
    return coordinates.map(function(coord) {
        var x = (coord[0] - bbox.x0) * scale;
        var y = (coord[1] - bbox.y0) * scale;
        
        // Center the shape
        x += (svgWidth - width * scale) / 2;
        y += (svgHeight - height * scale) / 2;
        
        return [x, y];
    });
}

function morphToState(targetState) {
    if (!currentState) return;
    
    var interpolator = flubber.interpolate(
        scaleAndCenterCoordinates(currentState.coordinates),
        scaleAndCenterCoordinates(targetState.coordinates)
    );

    // Animate state name change
    const stateNameElement = d3.select("#state-name");
    
    // Fade out current name
    stateNameElement
        .style("opacity", 0)
        .on("transitionend", function() {
            // Update text and trigger fade in with new color
            d3.select(this)
                .text(stateNames[targetState.id])
                .style("color", targetState.color)
                .style("opacity", 1)
                .classed("fade-in", true);
            
            // Remove the class after animation
            setTimeout(() => {
                d3.select(this).classed("fade-in", false);
            }, 500);
        });

    path.transition()
        .duration(800)
        .attrTween("d", function() { return interpolator; })
        .style("fill", targetState.color)
        .on("end", function() {
            currentState = targetState;
        });
}

function morphToStateById(stateId) {
    if (!statesData) return;
    const targetState = statesData.find(state => state.id === stateId);
    if (targetState) {
        morphToState(targetState);
    }
}

function createPathFromCoordinates(coordinates) {
    var scaledCoords = scaleAndCenterCoordinates(coordinates);
    return d3.line()(scaledCoords);
}

// Initialize the map
d3.json("../data/MapCoordinates/states.json", function(err, topo) {
    if (err) throw err;
    
    // Filter to only include allowed states
    statesData = topojson.feature(topo, topo.objects.states)
        .features
        .filter(d => allowedStates.includes(d.id))
        .map(function(d) {
            return {
                id: d.id,
                coordinates: d.geometry.coordinates[0],
                color: stateColors[d.id] || stateColors.default
            };
        });

    // Set initial state (California)
    currentState = statesData.find(state => state.id === 'CA');
    path.attr("d", createPathFromCoordinates(currentState.coordinates))
        .style("fill", currentState.color);
    
    // Set initial state name color
    d3.select("#state-name")
        .style("color", currentState.color);

    // Create radio buttons for each state
    var controls = d3.select("#stateControls");
    
    statesData.forEach(function(state) {
        var formCheck = controls.append("div")
            .attr("class", "form-check me-4 mb-2");

        var input = formCheck.append("input")
            .attr("class", "form-check-input")
            .attr("type", "radio")
            .attr("name", "stateRadio")
            .attr("id", state.id.toLowerCase())
            .attr("value", state.id)
            .on("change", function() {
                morphToStateById(state.id);
            });

        formCheck.append("label")
            .attr("class", "form-check-label")
            .attr("for", state.id.toLowerCase())
            .text(state.id);

        // Set the first state as checked
        if (statesData.indexOf(state) === 0) {
            input.attr("checked", true);
        }
    });
});

// Make morphToStateById globally accessible
window.morphToStateById = morphToStateById;
