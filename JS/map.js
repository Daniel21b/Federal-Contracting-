// Ensure we're using D3 v4 for the map
var d3 = d3v4;
console.log("Map script started - using D3 version:", d3.version);

// Debug check if map-vis element exists
console.log("Map container exists:", document.getElementById("map-vis") !== null);
console.log("SVG in map-vis exists:", document.getElementById("map-vis")?.querySelector("svg") !== null);

var svg = d3.select("#map-vis svg");
console.log("SVG selection:", svg.empty() ? "FAILED - Not found" : "SUCCESS");

var path = svg.append("path");
console.log("Path appended:", path.empty() ? "FAILED" : "SUCCESS");

var mapCurrentState = null;
var scaleFactor = 0.57;
var statesData = null;

// Define allowed states
var allowedStates = ['CA', 'MD', 'VA'];
console.log("Allowed states:", allowedStates);

// State name mapping
var stateNames = {
    'CA': 'California',
    'MD': 'Maryland',
    'VA': 'Virginia'
};

// Get SVG dimensions
var svgWidth = parseInt(svg.attr("width"));
var svgHeight = parseInt(svg.attr("height"));
console.log("SVG dimensions:", {width: svgWidth, height: svgHeight});

// Complete state color mapping for maps
var stateColors = {
    'CA': '#FFD670', // Beige
    'MD': '#f4d35e', // Golden yellow
    'VA': '#e6b89c', // Light peach
    'default': '#F5F5F5' // White smoke
};

// Text color mapping
var textColors = {
    'CA': '#ffffff', // Coral red
    'MD': '#ffffff', // Turquoise
    'VA': '#ffffff', // Sky blue
    'default': '#FFFFFF' // White
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
    console.log("Morphing to state:", targetState.id);
    if (!mapCurrentState) {
        console.error("No current state defined for morphing");
        return;
    }
    
    var interpolator = flubber.interpolate(
        scaleAndCenterCoordinates(mapCurrentState.coordinates),
        scaleAndCenterCoordinates(targetState.coordinates)
    );

    // Animate state name change
    const stateNameElement = d3.select("#state-name");
    console.log("State name element found:", !stateNameElement.empty());
    
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
            mapCurrentState = targetState;
            console.log("Morph transition completed");
        });
}

function morphToStateById(stateId) {
    console.log("morphToStateById called with:", stateId);
    if (!statesData) {
        console.error("No states data available");
        return;
    }
    const targetState = statesData.find(state => state.id === stateId);
    if (targetState) {
        console.log("Found target state:", targetState.id);
        morphToState(targetState);
        
        // Hide all state descriptions
        document.querySelectorAll('.state-description').forEach(desc => {
            desc.style.display = 'none';
        });
        
        // Show the selected state's description
        const selectedDescription = document.getElementById(`${stateId.toLowerCase()}-description`);
        if (selectedDescription) {
            selectedDescription.style.display = 'block';
        } else {
            console.error("Description element not found for state:", stateId);
        }
    } else {
        console.error("Target state not found:", stateId);
    }
}

function createPathFromCoordinates(coordinates) {
    var scaledCoords = scaleAndCenterCoordinates(coordinates);
    return d3.line()(scaledCoords);
}

// Initialize the map
console.log("Attempting to load map data...");
d3.json("../data/MapCoordinates/states.json").then(function(topo) {
    console.log("Map data loaded successfully");
    
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

    console.log("Processed states data:", statesData.map(s => s.id));
    
    // Set initial state (California)
    mapCurrentState = statesData.find(state => state.id === 'CA');
    console.log("Initial state set:", mapCurrentState ? mapCurrentState.id : "FAILED");
    
    path.attr("d", createPathFromCoordinates(mapCurrentState.coordinates))
        .style("fill", mapCurrentState.color);
    
    // Set initial state name color
    d3.select("#state-name")
        .style("color", mapCurrentState.color);

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
    
    console.log("Map initialization complete");
}).catch(function(err) {
    console.error("Error loading map data:", err);
});

// Make morphToStateById globally accessible
window.morphToStateById = morphToStateById;
console.log("morphToStateById function made globally accessible");
