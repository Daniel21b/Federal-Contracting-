# Tracing Federal Dollars: A State-by-State Exploration of U.S. Government Contracting

## Team Information
- Team Members: Benjamin Tanowitz, Daniel Asfaw Berhane, Jonathan Hale, Robel Endashaw
- Canvas Group Number: Final Project Group 8

## Project Overview
This project creates an interactive visualization of federal contract spending across three key states (VA, CA, MD) from 2020-2024. Using real data from USAspending.gov, we demonstrate the distribution and evolution of government contracts through dynamic visualizations including an animated bar chart race and interactive state map.

### Problem Statement
Federal contracting represents over $600 billion in annual spending, but this complex dataset can be difficult for the public to understand. Our visualization makes this data accessible by:
- Showing temporal changes in contract values through animation
- Highlighting geographic distribution of spending
- Revealing patterns in contractor rankings and categories
- Enabling interactive exploration of the data

### Dataset Complexity
Our dataset from USAspending.gov API presents several challenges that warrant visualization:
- Large scale: Processing hundreds of contractors across multiple years
- Multiple dimensions: Time, geography, contract values, and contractor categories
- Complex relationships: Showing connections between states, contractors, and spending patterns
- Dynamic updates: Monthly data refreshes requiring robust processing

## Setup and Running Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari)
- Local web server (e.g., Python's SimpleHTTPServer or Live Server VS Code extension)
- Node.js and npm (for development)

### Dependencies
- D3.js v4 and v6 (for different visualization components)
- Topojson v3
- Flubber v0.4.2

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Daniel21b/Federal-Contracting-.git
   cd Federal-Contracting-
   ```

2. Start a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   # OR using Node.js
   npx http-server
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000/IndexFiles/index.html
   ```

## Project Structure
```
Federal-Contracting-/
├── CSS/
│   ├── styles.css
│   ├── map.css
│   └── bar-chart-visualization.css
├── JS/
│   ├── barchart.js
│   └── map.js
├── IndexFiles/
│   └── index.html
└── data/
    └── [Various data files]
```

## Implementation Details
- **Bar Chart Race**: Implemented using D3.js, showing dynamic contractor rankings
- **Interactive Map**: Uses D3.js with TopoJSON for state morphing
- **Data Processing**: Custom scripts for fetching and processing USAspending.gov data
- **Color Coding**: Rank-based color system for contractor visualization

## Data Sources
- Primary: [USAspending.gov API](https://www.usaspending.gov/download_center/custom_award_data)
- Visualization Inspiration:
  - Bar Chart: [Observable Bar Chart Race](https://observablehq.com/@d3/bar-chart-race-explained)
  - Map: [Observable Centerline Labeling](https://observablehq.com/@veltman/centerline-labeling)

## Work Distribution
[Document how work was divided among team members]

## Development Notes
- The visualization updates monthly with new USAspending.gov data
- Color scheme indicates contractor rankings
- Interactive elements include state selection, play/pause, and tooltips


