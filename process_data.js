const fs = require('fs');
const path = require('path');

// Function to shorten company names
function shortenCompanyName(name) {
    // First, convert everything to title case
    name = name.split(' ').map(word => 
        word.toLowerCase() === word ? word : word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');

    // Remove common business suffixes - handle both with and without periods, commas
    const suffixesToRemove = [
        /,?\s*LLC\.?$/i,
        /,?\s*L\.?L\.?C\.?$/i,
        /,?\s*INC\.?$/i,
        /,?\s*INCORPORATED\.?$/i,
        /,?\s*CORP\.?$/i,
        /,?\s*CORPORATION\.?$/i,
        /,?\s*LTD\.?$/i,
        /,?\s*LIMITED\.?$/i,
        /,?\s*CO\.?$/i,
        /,?\s*COMPANY\.?$/i,
        /,?\s*USA\.?$/i,
        /,?\s*U\.?S\.?A\.?$/i,
        /,?\s*UNITED STATES$/i,
        /,?\s*OF AMERICA$/i,
        /\s+SYSTEMS?\b/i,
        /\s+TECHNOLOGIES?\b/i,
        /\s+TECHNOLOGY\b/i,
        /\s+INTERNATIONAL\b/i,
        /\s+HOLDINGS?\b/i,
        /\s+GROUP\b/i,
        /\s+SERVICES?\b/i,
        /\s+SOLUTIONS?\b/i,
        /\s+ENTERPRISES?\b/i,
        /\s+INDUSTRIES?\b/i,
        /\s+AERONAUTICAL\b/i,
        /\s+FEDERAL\b/i,
        /\s+NATIONAL\b/i,
        /\s+SECURITY\b/i,
        /\s+AND\b/i,
        /\s+OF\b/i,
        /\s+THE\b/i,
        /\s+PUBLIC SECTOR\b/i,
        /\s+ADVANCED\b/i,
        /\s+-\s*FEDERAL\b/i,
        /\s+ALLIANCE\b/i
    ];

    // Apply all suffix removals
    suffixesToRemove.forEach(suffix => {
        name = name.replace(suffix, '');
    });

    // Special cases for well-known organizations
    const specialCases = {
        // California
        'UNIVERSITY OF CALIFORNIA': 'UC Regents',
        'CALIFORNIA INSTITUTE OF TECHNOLOGY': 'Caltech',
        'THE LELAND STANFORD': 'Stanford',
        'LAWRENCE LIVERMORE': 'Lawrence Livermore',
        'HEALTH NET': 'Health Net',
        'GENERAL ATOMICS': 'General Atomics',
        'SPACE EXPLORATION': 'SpaceX',
        'NORTHROP GRUMMAN': 'Northrop Grumman',
        'LOCKHEED MARTIN': 'Lockheed Martin',
        'BOOZ ALLEN': 'Booz Allen',
        'NATIONAL STEEL AND SHIPBUILDING': 'NASSCO',
        'THE AEROSPACE': 'Aerospace',
        'THE BOEING': 'Boeing',
        'QTC MEDICAL': 'QTC Medical',
        'RAYTHEON': 'Raytheon',
        
        // Maryland
        'JOHNS HOPKINS': 'Johns Hopkins',
        'UNIVERSITY OF MARYLAND': 'UMD',
        'LEIDOS': 'Leidos',
        'NAVAL SYSTEMS': 'Naval Systems',
        
        // Virginia
        'OPTUM PUBLIC SECTOR': 'Optum',
        'TRIWEST HEALTHCARE': 'TriWest',
        'ATLANTIC DIVING SUPPLY': 'ADS',
        'HUNTINGTON INGALLS': 'Huntington Ingalls',
        'GENERAL DYNAMICS INFORMATION': 'GDIT',
        'SCIENCE APPLICATIONS INTERNATIONAL': 'SAIC',
        'ACCENTURE': 'Accenture Federal',
        'DELOITTE': 'Deloitte',
        'CACI': 'CACI',
        'THE MITRE': 'MITRE',
        'CARAHSOFT': 'Carahsoft',
        'MAXIMUS': 'Maximus',
        'AMENTUM': 'Amentum',
        'MANTECH': 'ManTech',
        'PERATON': 'Peraton',
        'CGI FEDERAL': 'CGI Federal',
        'MINBURN': 'Minburn'
    };

    // Check for special cases
    for (const [key, value] of Object.entries(specialCases)) {
        if (name.toUpperCase().includes(key)) {
            return value;
        }
    }

    // Clean up any remaining multiple spaces and trim
    name = name.replace(/\s+/g, ' ').trim();
    
    // Remove any trailing commas or periods
    name = name.replace(/[,.]$/, '');

    return name;
}

// Function to process state data
async function processStateData(stateCode, stateName) {
    const data = [];
    const years = ['2020', '2021', '2022', '2023', '2024'];
    
    years.forEach(year => {
        const filePath = path.join(__dirname, 'data', `BarChart${stateName}Data`, 
            `${stateCode.toLowerCase()}_recipients_fy${year}_2025-05-05.json`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const yearData = JSON.parse(fileContent);
        
        yearData.forEach(recipient => {
            data.push({
                date: `${year}-01-01`,
                name: shortenCompanyName(recipient.recipient_name),
                value: recipient.amount,
                category: 'Federal Contracting'
            });
        });
    });

    return data;
}

// Ensure processed_data directory exists
const processedDataDir = path.join(__dirname, 'processed_data');
if (!fs.existsSync(processedDataDir)) {
    fs.mkdirSync(processedDataDir);
}

// Get current date for filename
const currentDate = new Date().toISOString().split('T')[0];

// Process all states
async function processAllStates() {
    // Process California data
    console.log('Processing California data...');
    const caData = await processStateData('ca', 'California');
    const caOutputFile = path.join(processedDataDir, `california_contracts_${currentDate}.csv`);
    fs.writeFileSync(caOutputFile, 'date,name,category,value\n');
    caData.forEach(row => {
        fs.appendFileSync(
            caOutputFile,
            `${row.date},${row.name.replace(/,/g, '')},${row.category},${row.value}\n`
        );
    });
    console.log(`California data saved to: ${caOutputFile}`);

    // Process Maryland data
    console.log('Processing Maryland data...');
    const mdData = await processStateData('md', 'Maryland');
    const mdOutputFile = path.join(processedDataDir, `maryland_contracts_${currentDate}.csv`);
    fs.writeFileSync(mdOutputFile, 'date,name,category,value\n');
    mdData.forEach(row => {
        fs.appendFileSync(
            mdOutputFile,
            `${row.date},${row.name.replace(/,/g, '')},${row.category},${row.value}\n`
        );
    });
    console.log(`Maryland data saved to: ${mdOutputFile}`);

    // Process Virginia data
    console.log('Processing Virginia data...');
    const vaData = await processStateData('va', 'Virginia');
    const vaOutputFile = path.join(processedDataDir, `virginia_contracts_${currentDate}.csv`);
    fs.writeFileSync(vaOutputFile, 'date,name,category,value\n');
    vaData.forEach(row => {
        fs.appendFileSync(
            vaOutputFile,
            `${row.date},${row.name.replace(/,/g, '')},${row.category},${row.value}\n`
        );
    });
    console.log(`Virginia data saved to: ${vaOutputFile}`);
}

// Run the processing
processAllStates().catch(error => {
    console.error('Error processing data:', error);
}); 