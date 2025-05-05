// DOM Elements
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav ul li a');
const tabButtons = document.querySelectorAll('.tab-btn');
const vizPanels = document.querySelectorAll('.viz-panel');
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.querySelector('nav');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupTabs();
    setupMobileMenu();
    setupVisualizationPlaceholders();
});

/**
 * Setup navigation functionality
 */
function setupNavigation() {
    // Handle navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // Update active section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
            
            // Update active navigation link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // Close mobile menu if open
            if (mainNav.classList.contains('mobile-active')) {
                mainNav.classList.remove('mobile-active');
            }
            
            // Smooth scroll to section
            document.getElementById(targetId).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
}

/**
 * Setup tabs functionality for visualizations
 */
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding panel
            const targetPanel = this.getAttribute('data-tab');
            
            vizPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === targetPanel) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

/**
 * Setup mobile menu toggle
 */
function setupMobileMenu() {
    menuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('mobile-active');
    });
    
    // Close menu when window is resized to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mainNav.classList.contains('mobile-active')) {
            mainNav.classList.remove('mobile-active');
        }
    });
}

function setupVisualizationPlaceholders() {
    // Placeholder loader animations
    const placeholders = document.querySelectorAll('.visualization-placeholder');
    
    placeholders.forEach(placeholder => {
        // Add pulsating effect to placeholders
        const icon = placeholder.querySelector('i');
        if (icon) {
            setInterval(() => {
                icon.style.opacity = (parseFloat(icon.style.opacity) || 0.5) === 0.5 ? '0.8' : '0.5';
            }, 1000);
        }
    });
    
    // Add links to external visualizations
    if (document.getElementById('timeline-viz')) {
        const timelineViz = document.getElementById('timeline-viz');
        timelineViz.innerHTML = `
            <div class="viz-redirect">
                <p>The animated bar chart visualization is available on a separate page.</p>
                <a href="barchart.html" class="btn primary">View Bar Chart</a>
            </div>
        `;
    }
}

// Placeholder functions for actual visualizations
// These will be implemented later with D3.js or other libraries

/**
 * Create state comparison visualization
 * @param {string} containerId - The ID of the container element
 * @param {Object} data - The data to visualize
 */
function createStateComparisonViz(containerId, data) {
    console.log(`Creating state comparison visualization in ${containerId}`);
    // This will be implemented with actual visualization code
}

/**
 * Create single state visualization
 * @param {string} containerId - The ID of the container element
 * @param {string} state - The state to visualize
 * @param {Object} data - The data to visualize
 */
function createStateViz(containerId, state, data) {
    console.log(`Creating ${state} visualization in ${containerId}`);
    // This will be implemented with actual visualization code
}

/**
 * Create agency distribution visualization
 * @param {string} containerId - The ID of the container element
 * @param {Object} data - The data to visualize
 */
function createAgencyViz(containerId, data) {
    console.log(`Creating agency distribution visualization in ${containerId}`);
    // This will be implemented with actual visualization code
}

/**
 * Create industry sector visualization
 * @param {string} containerId - The ID of the container element
 * @param {Object} data - The data to visualize
 */
function createIndustryViz(containerId, data) {
    console.log(`Creating industry sector visualization in ${containerId}`);
    // This will be implemented with actual visualization code
}

/**
 * Create timeline/trends visualization
 * @param {string} containerId - The ID of the container element
 * @param {Object} data - The data to visualize
 */
function createTimelineViz(containerId, data) {
    console.log(`Creating timeline visualization in ${containerId}`);
    // This will be implemented with actual visualization code
}

/**
 * Load data from remote source
 * @param {string} url - The URL to load data from
 * @returns {Promise} - A promise that resolves with the data
 */
function loadData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            return null;
        });
} 