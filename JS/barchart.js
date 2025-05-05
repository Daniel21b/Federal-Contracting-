/**
 * Bar Chart Race Visualization
 * 
 * This script creates an animated bar chart race visualization using D3.js
 * to display U.S. federal contract spending data over time for different
 * categories and states, pulling live data from the USAspending API.
 */

// Initialize default settings
const DEFAULT_STATE = 'VA';
const DEFAULT_CATEGORY = 'awarding_agency';
const DEFAULT_TOP_N = 10;
const DEFAULT_DURATION = 2500; // transition duration in ms
const DEBOUNCE_DELAY = 500; // debounce delay for event handlers

// Define award type codes for contracts
const CONTRACT_AWARD_TYPE_CODES = ["A", "B", "C", "D"];

// Define last 5 full fiscal years (updated to most recent)
const FISCAL_YEARS = [
  { year: 2020, label: "FY2020", start_date: "2019-10-01", end_date: "2020-09-30" },
  { year: 2021, label: "FY2021", start_date: "2020-10-01", end_date: "2021-09-30" },
  { year: 2022, label: "FY2022", start_date: "2021-10-01", end_date: "2022-09-30" },
  { year: 2023, label: "FY2023", start_date: "2022-10-01", end_date: "2023-09-30" },
  { year: 2024, label: "FY2024", start_date: "2023-10-01", end_date: "2024-09-30" }
];

// Category options - updated with proper API values
const CATEGORY_OPTIONS = [
  { id: 'awarding_agency', label: 'Top Awarding Agencies', api_value: 'awarding_agency' },
  { id: 'recipient', label: 'Top Recipients', api_value: 'recipient' } // Changed from 'recipient_duns' to 'recipient'
];

// State options
const STATE_OPTIONS = [
  { code: 'VA', name: 'Virginia' },
  { code: 'CA', name: 'California' },
  { code: 'MD', name: 'Maryland' }
];

// USAspending API base URL - ensure no trailing slash
const API_BASE_URL = 'https://api.usaspending.gov';

// Main visualization class
class BarChartRace {
  constructor(containerId) {
    // Store DOM element references
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID ${containerId} not found.`);
      return;
    }

    // Initialize properties
    this.state = DEFAULT_STATE;
    this.category = DEFAULT_CATEGORY;
    this.topN = DEFAULT_TOP_N;
    this.duration = DEFAULT_DURATION;
    this.keyframes = [];
    this.currentKeyframeIndex = 0;
    this.isPlaying = false;
    this.timer = null;
    
    // Initialize the visualization
    this.init();
  }

  /**
   * Initialize the visualization components
   */
  init() {
    // Create container structure if it doesn't exist
    this.setupContainerStructure();
    
    // Initialize UI components and controls
    this.setupControls();
    
    // Initialize SVG and chart elements
    this.setupChart();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial data
    this.loadData();
  }

  /**
   * Set up the container structure for the visualization
   */
  setupContainerStructure() {
    // Clear container content
    this.container.innerHTML = '';
    this.container.classList.add('barchart-container');
    
    // Create chart container first (so it appears above controls)
    const chartDiv = document.createElement('div');
    chartDiv.className = 'barchart-chart';
    this.container.appendChild(chartDiv);
    this.chartContainer = chartDiv;
    
    // Create controls container second (so it appears below chart)
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'barchart-controls';
    this.container.appendChild(controlsDiv);
    this.controlsContainer = controlsDiv;
    
    // Create loading indicator (initially hidden)
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'barchart-loading';
    loadingDiv.style.display = 'none';
    
    const spinner = document.createElement('div');
    spinner.className = 'barchart-loading-spinner';
    loadingDiv.appendChild(spinner);
    
    const loadingText = document.createElement('div');
    loadingText.className = 'barchart-loading-text';
    loadingText.textContent = 'Loading data...';
    loadingDiv.appendChild(loadingText);
    
    this.container.appendChild(loadingDiv);
    this.loadingIndicator = loadingDiv;
    
    // Create error message container (initially hidden)
    const errorDiv = document.createElement('div');
    errorDiv.className = 'barchart-error';
    errorDiv.style.display = 'none';
    
    const errorIcon = document.createElement('div');
    errorIcon.className = 'barchart-error-icon';
    errorIcon.innerHTML = '&#9888;'; // warning symbol
    errorDiv.appendChild(errorIcon);
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'barchart-error-message';
    errorDiv.appendChild(errorMessage);
    
    this.container.appendChild(errorDiv);
    this.errorContainer = errorDiv;
    this.errorMessage = errorMessage;
  }

  /**
   * Set up the chart controls
   */
  setupControls() {
    // State selector
    const stateLabel = document.createElement('label');
    stateLabel.textContent = 'State: ';
    stateLabel.htmlFor = 'barchart-state-select';
    
    const stateSelect = document.createElement('select');
    stateSelect.id = 'barchart-state-select';
    stateSelect.className = 'barchart-select';
    
    STATE_OPTIONS.forEach(state => {
      const option = document.createElement('option');
      option.value = state.code;
      option.textContent = state.name;
      stateSelect.appendChild(option);
    });
    
    stateSelect.value = this.state;
    this.controlsContainer.appendChild(stateLabel);
    this.controlsContainer.appendChild(stateSelect);
    this.stateSelect = stateSelect;
    
    // Category selector
    const categoryLabel = document.createElement('label');
    categoryLabel.textContent = 'Category: ';
    categoryLabel.htmlFor = 'barchart-category-select';
    
    const categorySelect = document.createElement('select');
    categorySelect.id = 'barchart-category-select';
    categorySelect.className = 'barchart-select';
    
    CATEGORY_OPTIONS.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.label;
      categorySelect.appendChild(option);
    });
    
    categorySelect.value = this.category;
    this.controlsContainer.appendChild(categoryLabel);
    this.controlsContainer.appendChild(categorySelect);
    this.categorySelect = categorySelect;
    
    // Control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'barchart-button-container';
    
    // Play/Pause button
    const playButton = document.createElement('button');
    playButton.className = 'barchart-button barchart-button-play';
    playButton.textContent = 'Play';
    buttonContainer.appendChild(playButton);
    this.playButton = playButton;
    
    // Replay button
    const replayButton = document.createElement('button');
    replayButton.className = 'barchart-button barchart-button-replay';
    replayButton.textContent = 'Replay';
    buttonContainer.appendChild(replayButton);
    this.replayButton = replayButton;
    
    this.controlsContainer.appendChild(buttonContainer);
  }

  /**
   * Set up the SVG chart and its components
   */
  setupChart() {
    // Set up dimensions with larger size and extra space for labels
    const margin = { top: 80, right: 350, bottom: 70, left: 150 };
    const width = this.chartContainer.clientWidth || 900;
    const height = 600; // Increased height
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('class', 'barchart-svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height);
    
    // Add title
    svg.append('text')
      .attr('class', 'barchart-title')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .text('Federal Contract Spending by Agency');
    
    // Add ticker (year/period display)
    const ticker = svg.append('text')
      .attr('class', 'barchart-ticker')
      .attr('x', width - margin.right)
      .attr('y', margin.top / 2)
      .style('text-anchor', 'end')
      .text('');
    
    // Create scales
    const x = d3.scaleLinear().range([margin.left, width - margin.right]);
    const y = d3.scaleBand().range([margin.top, height - margin.bottom]).padding(0.2); // Increased padding
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Create axes
    const xAxis = svg.append('g')
      .attr('class', 'barchart-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`);
    
    // Append SVG to container
    this.chartContainer.appendChild(svg.node());
    
    // Store references
    this.svg = svg;
    this.margin = margin;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = color;
    this.xAxis = xAxis;
    this.ticker = ticker;
  }

  /**
   * Set up event listeners for controls
   */
  setupEventListeners() {
    // State select change
    this.stateSelect.addEventListener('change', () => {
      this.state = this.stateSelect.value;
      this.loadData();
    });
    
    // Category select change
    this.categorySelect.addEventListener('change', () => {
      this.category = this.categorySelect.value;
      this.loadData();
    });
    
    // Play/Pause button
    this.playButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });
    
    // Replay button
    this.replayButton.addEventListener('click', () => {
      this.currentKeyframeIndex = 0;
      this.play();
    });
    
    // Window resize event (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.resize();
      }, DEBOUNCE_DELAY);
    });
  }

  /**
   * Handle window resize
   */
  resize() {
    // Update dimensions
    const width = this.chartContainer.clientWidth || 800;
    
    // Update SVG size
    this.svg
      .attr('width', width)
      .attr('viewBox', [0, 0, width, this.height + this.margin.top + this.margin.bottom]);
    
    // Update scales
    this.x.range([this.margin.left, width - this.margin.right]);
    
    // Update title position
    this.svg.select('.barchart-title')
      .attr('x', width / 2);
    
    // Update ticker position
    this.ticker
      .attr('x', width - this.margin.right);
    
    // Redraw current frame
    if (this.keyframes.length > 0) {
      this.drawFrame(this.currentKeyframeIndex);
    }
  }

  /**
   * Load data from the USAspending API
   */
  loadData() {
    // Clear any existing animation
    this.pause();
    this.currentKeyframeIndex = 0;
    
    // Show loading indicator
    this.showLoading(true);
    this.showError(false);
    
    // Update chart title based on selections
    const stateName = STATE_OPTIONS.find(s => s.code === this.state)?.name || this.state;
    const categoryLabel = CATEGORY_OPTIONS.find(c => c.id === this.category)?.label || 'Categories';
    this.svg.select('.barchart-title')
      .text(`${categoryLabel} in ${stateName} - Federal Contract Spending`);
    
    // Fetch data for each fiscal year
    Promise.all(FISCAL_YEARS.map(fy => this.fetchFiscalYearData(fy)))
      .then(results => {
        // Check if we had any successful responses
        const hasData = results.some(result => 
          result.data && 
          result.data.results && 
          result.data.results.length > 0
        );
        
        if (!hasData) {
          throw new Error('No data available for the selected criteria');
        }
        
        // Process the results into keyframes
        this.processData(results);
        
        // Draw the first frame
        if (this.keyframes.length > 0) {
          this.drawFrame(0);
        } else {
          this.showError(true, 'No data available for the selected criteria.');
        }
        
        // Hide loading indicator
        this.showLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        this.showLoading(false);
        this.showError(true, `Failed to load data from USAspending API: ${error.message}. Please try again later.`);
      });
  }

  /**
   * Fetch data for a specific fiscal year from the USAspending API
   * @param {Object} fiscalYear - Fiscal year object with start_date and end_date
   * @returns {Promise} - Promise that resolves with the API response
   */
  fetchFiscalYearData(fiscalYear) {
    // Get the API-specific category value
    const categoryOption = CATEGORY_OPTIONS.find(c => c.id === this.category);
    const apiCategory = categoryOption ? categoryOption.api_value : 'awarding_agency';
    
    // Build the request body
    const requestBody = {
      category: apiCategory,
      filters: {
        time_period: [
          {
            start_date: fiscalYear.start_date,
            end_date: fiscalYear.end_date
          }
        ],
        place_of_performance_locations: [
          {
            country: "USA",
            state: this.state
          }
        ],
        award_type_codes: CONTRACT_AWARD_TYPE_CODES
      },
      limit: 10
    };
    
    // API endpoint must not have trailing slash
    const endpoint = 'api/v2/search/spending_by_category';
    
    // Construct the full URL properly (ensure it's exactly correct)
    const fullUrl = `https://api.usaspending.gov/${endpoint}`;
    
    // Create fetch options
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };
    
    // Debug logging
    console.log(`Fetching data for ${fiscalYear.label} from URL:`, fullUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Make the API request
    return fetch(fullUrl, fetchOptions)
    .then(response => {
      console.log(`Response for ${fiscalYear.label}:`, response.status, response.statusText);
      
      if (!response.ok) {
        console.error(`API request failed for ${fiscalYear.label} with status ${response.status}`);
        throw new Error(`API request failed with status ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Received data for ${fiscalYear.label}:`, data);
      // Add fiscal year info to the data
      return {
        fiscalYear: fiscalYear,
        data: data
      };
    })
    .catch(error => {
      console.error(`Error fetching data for ${fiscalYear.label}:`, error);
      // Return empty data rather than rejecting completely
      return {
        fiscalYear: fiscalYear,
        data: { results: [] },
        error: error.message
      };
    });
  }

  /**
   * Process the raw API data into keyframes for animation
   * @param {Array} results - Array of API responses for each fiscal year
   */
  processData(results) {
    // Clear existing keyframes
    this.keyframes = [];
    
    // Process each fiscal year's data
    results.forEach(result => {
      const { fiscalYear, data, error } = result;
      
      // Skip if error or no results
      if (error || !data || !data.results || data.results.length === 0) {
        console.log(`Skipping ${fiscalYear.label}: ${error || 'No data'}`);
        return;
      }
      
      // Process the results
      const items = data.results.map(item => {
        let name = '';
        let value = 0;
        
        // Handle different API response formats based on category
        if (this.category === 'awarding_agency') {
          name = item.name || item.agency_name || 'Unknown Agency';
          value = parseFloat(item.amount) || 0;
        } else if (this.category === 'recipient') {
          name = item.name || item.recipient_name || 'Unknown Recipient';
          value = parseFloat(item.amount) || 0;
        }
        
        // Only include items with positive values
        if (value <= 0) return null;
        
        return {
          name,
          value,
          year: fiscalYear.year,
          label: fiscalYear.label
        };
      }).filter(item => item !== null); // Remove null items
      
      // Skip if no valid items after filtering
      if (items.length === 0) {
        console.log(`No valid items for ${fiscalYear.label} after filtering`);
        return;
      }
      
      // Sort by value (descending) and limit to top N
      const topItems = items
        .sort((a, b) => b.value - a.value)
        .slice(0, this.topN);
      
      // Assign ranks
      topItems.forEach((item, i) => {
        item.rank = i;
      });
      
      // Add to keyframes
      this.keyframes.push({
        year: fiscalYear.year,
        label: fiscalYear.label,
        items: topItems
      });
    });
    
    // Sort keyframes by year
    this.keyframes.sort((a, b) => a.year - b.year);
    
    console.log(`Processed ${this.keyframes.length} keyframes with data`);
  }

  /**
   * Draw a specific keyframe
   * @param {number} index - Index of the keyframe to draw
   */
  drawFrame(index) {
    // Handle missing or invalid keyframe
    if (!this.keyframes || !this.keyframes[index] || !this.keyframes[index].items) {
      console.error('No valid keyframe data for index:', index);
      this.showError(true, 'No valid data to display');
      return;
    }
    
    const keyframe = this.keyframes[index];
    const items = keyframe.items;
    
    if (items.length === 0) {
      console.error('Keyframe has no items:', keyframe);
      this.showError(true, `No data available for ${keyframe.label}`);
      return;
    }
    
    // Hide any previous error
    this.showError(false);
    
    // Update ticker
    this.ticker.text(keyframe.label);
    
    try {
      // Update x scale domain
      const maxValue = d3.max(items, d => d.value) * 1.1; // Add 10% padding
      this.x.domain([0, maxValue || 100]); // Fallback if no valid max
      
      // Update y scale domain - ensure all items have a name property
      this.y.domain(items.map(d => d.name || 'Unknown'));
      
      // Format numbers for display (adding commas)
      const formatNumber = d3.format(',d');
      
      // Helper function to truncate text
      const truncateText = (text, maxLength = 25) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      };
      
      // Improved x-axis with better formatting
      this.xAxis.call(
        d3.axisBottom(this.x)
          .ticks(5)
          .tickSize(-5) // Negative tick size for better visibility
          .tickFormat(d => {
            if (d >= 1e9) {
              return `$${(d / 1e9).toFixed(1)}B`; // Convert to billions
            } else if (d >= 1e6) {
              return `$${(d / 1e6).toFixed(1)}M`; // Convert to millions
            } else {
              return `$${formatNumber(d)}`;
            }
          })
      );
      
      // Style the axis for better visibility
      this.xAxis.selectAll('.tick text')
        .attr('dy', '1em') // Move text down a bit
        .style('font-size', '12px')
        .style('font-weight', '500');
      
      // Join data for bars
      const bars = this.svg.selectAll('.barchart-bar')
        .data(items, d => d.name);
      
      // Remove exiting bars
      bars.exit()
        .transition()
        .duration(this.duration / 2)
        .attr('width', 0)
        .remove();
      
      // Update existing bars
      bars
        .transition()
        .duration(this.duration)
        .attr('y', d => this.y(d.name))
        .attr('width', d => Math.max(0, this.x(d.value) - this.margin.left))
        .attr('height', this.y.bandwidth());
      
      // Enter new bars
      bars.enter()
        .append('rect')
        .attr('class', 'barchart-bar')
        .attr('x', this.margin.left)
        .attr('y', d => this.y(d.name))
        .attr('width', 0)
        .attr('height', this.y.bandwidth())
        .attr('fill', d => this.color(d.name))
        .attr('opacity', 0)
        .transition()
        .duration(this.duration / 2)
        .attr('width', d => Math.max(0, this.x(d.value) - this.margin.left))
        .attr('opacity', 1);
      
      // Calculate appropriate space for labels
      const barHeight = this.y.bandwidth();
      const labelYOffset = barHeight / 2 + 1;
      
      // Fixed position for name labels (on the far right, moved further right)
      const nameLabelsX = this.width - this.margin.right + 70; // Increased from 20 to 70
      
      // Join data for name labels
      const labels = this.svg.selectAll('.barchart-label')
        .data(items, d => d.name);
      
      // Remove exiting labels
      labels.exit()
        .transition()
        .duration(this.duration / 2)
        .attr('opacity', 0)
        .remove();
      
      // Update existing name labels - only animate y position
      labels
        .transition()
        .duration(this.duration)
        .attr('y', d => this.y(d.name) + labelYOffset)
        .attr('x', nameLabelsX) // Update x position for existing labels too
        .text(d => truncateText(d.name));
      
      // Enter new name labels - at fixed x position
      labels.enter()
        .append('text')
        .attr('class', 'barchart-label')
        .attr('x', nameLabelsX)
        .attr('y', d => this.y(d.name) + labelYOffset)
        .attr('text-anchor', 'start')
        .text(d => truncateText(d.name))
        .attr('opacity', 0)
        .transition()
        .duration(this.duration / 2)
        .attr('opacity', 1);
      
      // Join data for values
      const values = this.svg.selectAll('.barchart-value')
        .data(items, d => d.name);
      
      // Remove exiting values
      values.exit()
        .transition()
        .duration(this.duration / 2)
        .attr('opacity', 0)
        .remove();
        
      // Function to calculate value label position - just outside the bar's right edge
      const calculateValueX = d => {
        return this.x(d.value) + 10; // Increased from 5 to 10 for more spacing
      };
      
      // Update existing values - animate both x and y
      values
        .transition()
        .duration(this.duration)
        .attr('x', calculateValueX)
        .attr('y', d => this.y(d.name) + labelYOffset)
        .attr('text-anchor', 'start')
        .tween('text', function(d) {
          const i = d3.interpolate(this._oldValue || 0, d.value);
          this._oldValue = d.value;
          return t => d3.select(this).text(`$${formatNumber(Math.round(i(t)))}`);
        });
      
      // Enter new values - positioned just outside the bar
      values.enter()
        .append('text')
        .attr('class', 'barchart-value')
        .attr('x', calculateValueX)
        .attr('y', d => this.y(d.name) + labelYOffset)
        .attr('text-anchor', 'start')
        .text(d => `$${formatNumber(d.value)}`)
        .attr('opacity', 0)
        .transition()
        .duration(this.duration / 2)
        .attr('opacity', 1);
      
      // Store current index
      this.currentKeyframeIndex = index;
    } catch (error) {
      console.error('Error drawing frame:', error);
      this.showError(true, 'Error displaying data visualization');
    }
  }

  /**
   * Start the animation
   */
  play() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.playButton.textContent = 'Pause';
    this.playButton.classList.remove('barchart-button-play');
    this.playButton.classList.add('barchart-button-pause');
    
    // If at the end, start over
    if (this.currentKeyframeIndex >= this.keyframes.length - 1) {
      this.currentKeyframeIndex = 0;
    }
    
    this.animate();
  }

  /**
   * Pause the animation
   */
  pause() {
    this.isPlaying = false;
    this.playButton.textContent = 'Play';
    this.playButton.classList.remove('barchart-button-pause');
    this.playButton.classList.add('barchart-button-play');
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Animate through the keyframes
   */
  animate() {
    if (!this.isPlaying) return;
    
    // Draw the current frame
    this.drawFrame(this.currentKeyframeIndex);
    
    // Advance to the next frame
    this.currentKeyframeIndex++;
    
    // If there are more frames, continue animation
    if (this.currentKeyframeIndex < this.keyframes.length) {
      this.timer = setTimeout(() => {
        this.animate();
      }, this.duration);
    } else {
      // Reached the end
      this.pause();
    }
  }

  /**
   * Show or hide the loading indicator
   * @param {boolean} show - Whether to show the loading indicator
   */
  showLoading(show) {
    this.loadingIndicator.style.display = show ? 'flex' : 'none';
  }

  /**
   * Show or hide the error message
   * @param {boolean} show - Whether to show the error message
   * @param {string} message - The error message to display
   */
  showError(show, message = '') {
    this.errorContainer.style.display = show ? 'flex' : 'none';
    if (show) {
      this.errorMessage.textContent = message;
    }
  }
}

// Initialize the barchart visualization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the main barchart visualization on the barchart.html page
  const barchartViz = document.getElementById('barchart-viz');
  if (barchartViz) {
    new BarChartRace('barchart-viz');
    console.log('Bar chart visualization initialized');
  }
});
