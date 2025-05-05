# Tracing Federal Dollars

A State-by-State Exploration of U.S. Government Contracting

## Project Overview

This project visualizes federal contract spending data for Virginia (VA), California (CA), and Maryland (MD) over fiscal years 2021-2025. It uses the USAspending API to fetch real contract data and displays the information using an animated bar chart race visualization built with D3.js.

## Features

- Fetches real contract data from the USAspending.gov API
- Visualizes spending by state, awarding agency, and recipient
- Interactive animated visualization showing how spending changes over time
- Responsive design that works on various screen sizes
- Ability to download data as JSON and CSV files

## Technical Implementation

### Data Source
The application fetches data from the following USAspending API endpoints:
- `/api/v2/search/spending_by_geography/`: Provides geographic distribution of spending
- `/api/v2/search/spending_by_category/`: Provides spending breakdowns by agency and recipient
- `/api/v2/download/awards/`: Used for bulk CSV downloads of award data

### Data Downloads
The application provides two methods for downloading data:
1. **Automatic JSON downloads**: When data is fetched from the API, it is automatically saved as JSON files
2. **Manual CSV downloads**: Users can click download buttons to save data as CSV files
3. **Bulk CSV downloads**: The application initiates a bulk download request from the USAspending API

All downloaded files can be moved to the `Data` folder for storage and further analysis.

### Visualization
The visualization is implemented as a bar chart race using D3.js. Key components:
- Smooth transitions between data points for engaging animations
- Color-coding by category for easy distinction between different entities
- Time-based progression showing changes in spending patterns

## Project Structure

- `index.html`: Main HTML file for the application
- `JS/usaspending-api.js`: Functions for fetching and processing API data
- `JS/sunburst.js`: D3.js visualization code for the bar chart race
- `Data/`: Folder for storing downloaded data files

## Getting Started

1. Clone this repository
2. Open `index.html` in a modern web browser
3. The visualization will automatically fetch data and begin displaying
4. Use the download buttons to save data as CSV files for further analysis

## Browser Compatibility

This application works best in modern browsers that support ES6 JavaScript features and the Fetch API:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Data Downloads

### Downloading Data as CSV
1. Click one of the download buttons in the control panel:
   - "Download All Data (CSV)" for data from all three states
   - "Download VA Data" for Virginia data only
   - "Download CA Data" for California data only
   - "Download MD Data" for Maryland data only
2. The file will be saved to your browser's default download location
3. Move the file to the `Data` folder for organization

### Using the Downloaded Data
The CSV files can be opened in:
- Microsoft Excel
- Google Sheets
- Any text editor
- Data analysis tools like R, Python (pandas), etc.

## Future Enhancements

Potential improvements for future versions:
- Add additional states beyond VA, CA, and MD
- Implement filtering by specific agencies or contract types
- Add year-by-year comparison views
- Create downloadable reports of the data

## Credits

- Data provided by [USAspending.gov](https://www.usaspending.gov/)
- Visualization implemented using [D3.js](https://d3js.org/)

## License

This project is open source and available under the [MIT License](LICENSE). 