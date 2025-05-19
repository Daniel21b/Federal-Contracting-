# Federal Contracting Visualization

## Team Information
- Team Members: 
  - Daniel Asfaw Berhane: Bar chart race implementation, data visualization
  - Robel Endashaw: Map visualization, state transitions
  - Benjamin Tanowitz: Data processing, API integration
  - Jonathan Hale: UI/UX design, CSS styling
- Canvas Group: Final Project Group 8

## Project Overview
An interactive visualization system exploring federal contract spending across Virginia, California, and Maryland (2020-2024). The project features dynamic visualizations including an animated bar chart race and an interactive state map, making complex federal spending data accessible to the public.

## Running Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari recommended)
- Node.js and npm
- Local web server capability

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Daniel21b/Federal-Contracting-.git
   cd Federal-Contracting-
   ```

2. Install dependencies:
   ```bash
   npm install d3@4
   npm install d3@6
   npm install topojson@3
   npm install flubber@0.4.2
   ```

3. Start the local server:
   ```bash
   # Option 1: Using Python 3
   python -m http.server 8000
   
   # Option 2: Using Node.js
   npx http-server
   ```

4. Access the visualization:
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
- Handled data updates and storage

### Jonathan Hale
- Developed UI/UX design
- Implemented responsive CSS
- Created visualization layouts
- Designed color schemes and typography

## Technical Implementation
- **Bar Chart Race**: 
  - D3.js v6 implementation
  - Dynamic ranking updates
  - Smooth transitions
  
- **Interactive Map**: 
  - D3.js v4 with TopoJSON
  - Flubber for state morphing
  - State-specific styling

- **Data Processing**:
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

### Libraries and Tools
- [D3.js](https://d3js.org/) for data visualization
- [TopoJSON](https://github.com/topojson/topojson) for map data handling
- [Flubber](https://github.com/veltman/flubber) for shape morphing




