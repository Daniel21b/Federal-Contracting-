/**
 * Fetches top 500 recipients from USAspending API for selected state and fiscal year
 * Includes business category classification
 */
async function fetchTopRecipients(state = 'VA', fiscalYear = '2023') {
  const API_URL = 'https://api.usaspending.gov/api/v2/search/spending_by_category';
  const PAGE_SIZE = 100;
  const TOTAL_WANTED = 500;
  const MAX_PAGES = Math.ceil(TOTAL_WANTED / PAGE_SIZE);
  const allResults = [];
  let currentPage = 1;

  // Define category mappings
  const categoryMappings = {
    // Defense Contractors
    'LOCKHEED MARTIN': 'Defense',
    'NORTHROP GRUMMAN': 'Defense',
    'GENERAL DYNAMICS': 'Defense',
    'RAYTHEON': 'Defense',
    'BAE SYSTEMS': 'Defense',
    'BOEING': 'Defense',
    'L3HARRIS': 'Defense',
    'BOOZ ALLEN': 'Defense',
    'LEIDOS': 'Defense',
    
    // Technology
    'MICROSOFT': 'Technology',
    'AMAZON': 'Technology',
    'GOOGLE': 'Technology',
    'IBM': 'Technology',
    'ORACLE': 'Technology',
    'DELL': 'Technology',
    'CISCO': 'Technology',
    
    // Healthcare
    'JOHNS HOPKINS': 'Healthcare',
    'KAISER': 'Healthcare',
    'UNITED HEALTH': 'Healthcare',
    'CVS': 'Healthcare',
    'ANTHEM': 'Healthcare',
    
    // Research & Education
    'UNIVERSITY': 'Research & Education',
    'INSTITUTE': 'Research & Education',
    'COLLEGE': 'Research & Education',
    'LABORATORY': 'Research & Education',
    
    // Construction & Infrastructure
    'CONSTRUCTION': 'Construction',
    'ENGINEERING': 'Construction',
    'BUILDERS': 'Construction',
    
    // Energy
    'ENERGY': 'Energy',
    'POWER': 'Energy',
    'ELECTRIC': 'Energy',
    'SOLAR': 'Energy',
    'NUCLEAR': 'Energy'
  };

  function determineCategory(recipientName) {
    const upperName = recipientName.toUpperCase();
    
    // Check against our mapping
    for (const [keyword, category] of Object.entries(categoryMappings)) {
      if (upperName.includes(keyword)) {
        return category;
      }
    }
    
    // Default category if no match is found
    return 'Other';
  }

  // Calculate fiscal year dates
  const fyStartYear = parseInt(fiscalYear) - 1;
  const startDate = `${fyStartYear}-10-01`;
  const endDate = `${fiscalYear}-09-30`;
  
  while (currentPage <= MAX_PAGES) {
    const requestBody = {
      category: "recipient",
      filters: {
        time_period: [
          {
            start_date: startDate,
            end_date: endDate
          }
        ],
        place_of_performance_locations: [
          {
            country: "USA",
            state: state
          }
        ],
        award_type_codes: ["A", "B", "C", "D"]
      },
      limit: PAGE_SIZE,
      page: currentPage
    };

    try {
      console.log(`Fetching page ${currentPage} of ${MAX_PAGES} for ${state} FY${fiscalYear}...`);
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform and add this page's results
      const pageResults = data.results.map(item => {
        const recipientName = item.name || "Unknown";
        return {
          recipient_name: recipientName,
          recipient_id: item.recipient_id || "Unknown",
          amount: Math.round(item.amount),
          fiscal_year: fiscalYear,
          state: state,
          category: determineCategory(recipientName)
        };
      });
      
      // If no results on this page, we've reached the end
      if (pageResults.length === 0) {
        console.log(`No more results available after page ${currentPage - 1}`);
        break;
      }
      
      allResults.push(...pageResults);
      console.log(`Received ${pageResults.length} recipients on page ${currentPage}`);
      
      // If we got fewer results than page size, we've hit the end
      if (pageResults.length < PAGE_SIZE) {
        console.log('Reached end of available results');
        break;
      }
      
      // Move to next page
      currentPage++;
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Failed to fetch page ${currentPage}:`, error);
      break;
    }
  }

  // Sort results by amount in descending order
  allResults.sort((a, b) => b.amount - a.amount);
  
  // Get exactly 500 results or all available if less
  const topResults = allResults.slice(0, TOTAL_WANTED);
  
  // Add rank and formatted amount to each result
  const rankedResults = topResults.map((result, index) => ({
    rank: index + 1,
    ...result,
    amount_formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(result.amount)
  }));
  
  console.log(`Successfully fetched ${rankedResults.length} recipients for ${state} FY${fiscalYear}`);
  return rankedResults;
} 