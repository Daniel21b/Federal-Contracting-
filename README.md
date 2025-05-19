# Federal Contracting Visualization

## Team Information
- Team Members: 
  - Daniel Asfaw Berhane: Bar chart race visualization, data visualization
  - Robel Endashaw: Interactive map visualization, state transitions
  - Benjamin Tanowitz: Data processing, API integration, map visualization elements
  - Jonathan Hale: UI/UX design, CSS styling, treemap visualization
- Canvas Group: Final Project Group 8

## Project Overview
An interactive visualization system exploring federal contract spending across Virginia, California, and Maryland (2020-2024). The project features dynamic visualizations including an animated bar chart race and an interactive state map, making complex federal spending data accessible to the public.

**Live Demo:** [https://federal-contracting.onrender.com](https://federal-contracting.onrender.com)

## Running Instructions

### Online Access
The easiest way to view the visualization is through our live demo:
- **Live Demo:** [https://federal-contracting.onrender.com](https://federal-contracting.onrender.com)

### Local Setup
If you prefer to run the visualization locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/Daniel21b/Federal-Contracting-.git
   cd Federal-Contracting-
   ```

2. Access the visualization:
   - Open your browser
   - Navigate to: `http://localhost:8000/IndexFiles/index.html`

## Project Structure
```
Federal-Contracting-/
├── CSS/                  # Styling files
│   ├── styles.css       # Main styles
│   ├── map.css          # Map-specific styles
│   └── bar-chart-visualization.css
├── JS/                  # JavaScript implementations
│   ├── barchart.js     # Bar chart race visualization
│   └── map.js          # Interactive map functionality
├── IndexFiles/
│   └── index.html      # Main application page
└── data/               # Data files and processing scripts
    ├── MapCoordinates/
    └── BarChartData/
```

## Work Distribution

### Daniel Asfaw Berhane
- Implemented bar chart race visualization
- Created dynamic ranking updates
- Developed animation controls
- Integrated state data transitions

### Robel Endashaw
- Designed and implemented interactive map
- Created state morphing transitions
- Integrated state selection functionality
- Developed state description displays

### Benjamin Tanowitz
- Managed data processing pipeline
- Implemented API data fetching
- Created data transformation scripts
- Contributed to map visualization implementation
- Handled data updates and storage

### Jonathan Hale
- Developed UI/UX design
- Implemented responsive CSS
- Designed and implemented treemap visualization for category analysis
- Designed color schemes and typography

## Technical Implementation
- **Bar Chart Race** (Daniel Asfaw Berhane): 
  - D3.js v6 implementation
  - Dynamic ranking updates
  - Smooth transitions
  
- **Interactive Map** (Robel Endashaw, Benjamin Tanowitz): 
  - D3.js v4 with TopoJSON
  - Flubber for state morphing
  - State-specific styling

- **Treemap Visualization** (Jonathan Hale):
  - D3.js v6 hierarchical data visualization
  - Interactive category analysis
  - Dynamic filtering by year and state
  - Zoom and tooltip functionality

- **Data Processing** (Benjamin Tanowitz):
  - Monthly USAspending.gov data updates
  - Custom data transformation scripts
  - Efficient data storage format

## Acknowledgments

### Data Sources
- Primary data from [USAspending.gov API](https://www.usaspending.gov/download_center/custom_award_data)
- Federal contract spending data accessed through public API

### Visualization Inspiration
- Bar Chart Race inspired by Mike Bostock's [Observable Bar Chart Race](https://observablehq.com/@d3/bar-chart-race-explained)
- Map visualization techniques adapted from Noah Veltman's [Centerline Labeling](https://observablehq.com/@veltman/centerline-labeling)
- Treemap visualization implemented using techniques from [Observable Treemap Component](https://observablehq.com/@d3/treemap-component)

### Libraries and Tools
- [D3.js](https://d3js.org/) for data visualization
- [TopoJSON](https://github.com/topojson/topojson) for map data handling
- [Flubber](https://github.com/veltman/flubber) for shape morphing




