(function () {
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const color = d3.scaleOrdinal([
        "#B71C1C", "#D32F2F", "#C2185B",
        "#388E3C", "#2C6B2F", "#1B5E20",
        "#0D47A1", "#1976D2", "#1565C0"
    ]);

    let selectedYear = "2021";
    let selectedState = "CA";
    const countThreshold = 9000;

    const stateFiles = {
        "CA": "processed_data/california_contracts_2025-05-18.csv",
        "MD": "processed_data/maryland_contracts_2025-05-18.csv",
        "VA": "processed_data/virginia_contracts_2025-05-18.csv"
    };

    const tree_tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#1a1a1a")
        .style("color", "white")
        .style("padding", "10px")
        .style("border", "1px solid #444")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "14px")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.3)");

    const tree_svg = d3.select('#treemap')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const contentGroup = tree_svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let currentZoomScale = 1;
    const baseFontSize = 12;

    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom]])
        .on("zoom", (event) => {
            currentZoomScale = event.transform.k;
            contentGroup.attr("transform", event.transform);

            contentGroup.selectAll("text")
                .style("display", d => {
                    const boxWidth = (d.x1 - d.x0) * currentZoomScale;
                    const boxHeight = (d.y1 - d.y0) * currentZoomScale;
                    return (currentZoomScale > 2 || (boxWidth > 80 && boxHeight > 30)) ? "block" : "none";
                })
                .style("font-size", () => `${baseFontSize / currentZoomScale}px`);
        });

    tree_svg.call(zoom);

    let data;

    function processDataForYear(year) {
        if (!data) return;

        const filteredData = data.filter(d => d.date.startsWith(year));
        const aggregated = Array.from(
            d3.rollup(filteredData,
                v => d3.sum(v, d => +d.value),
                d => d.name
            ),
            ([Type, totalValue]) => ({ Type, totalValue })
        );

        aggregated.sort((a, b) => b.totalValue - a.totalValue);
        const filteredAggregated = aggregated.filter(d => d.totalValue >= countThreshold);

        contentGroup.selectAll("*").remove();

        if (filteredAggregated.length === 0) {
            contentGroup.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("No data available")
                .style("fill", "black");
            return;
        }

        const hierarchyData = [
            { id: "root", parent: "" },
            ...filteredAggregated.map(d => ({
                id: d.Type,
                parent: "root",
                value: d.totalValue
            }))
        ];

        const rootNode = d3.stratify()
            .id(d => d.id)
            .parentId(d => d.parent)(hierarchyData)
            .sum(d => d.value || 0);

        d3.treemap()
            .size([width, height])
            .padding(4)(rootNode);

        const rects = contentGroup.selectAll("rect")
            .data(rootNode.leaves(), d => d.data.id);
            
        // Enter
        const rectEnter = rects.enter().append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", 0)
            .attr("height", 0)
            .style("fill", d => color(d.data.id))
            .style("stroke", "#fff")
            .on("mouseover", (event, d) => {
                tree_tooltip.transition().duration(200).style("opacity", 0.9);
                tree_tooltip.html(`
                    <strong style="font-size: 16px; color: #4ECDC4;">${d.data.id}</strong><br>
                    <span style="color: #ccc;">Contract Value:</span> <span style="color: white; font-weight: bold;">$${d.value.toLocaleString()}</span>
                `);
            })
            .on("mousemove", event => {
                tree_tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", () => {
                tree_tooltip.transition().duration(500).style("opacity", 0);
            });
            
        rectEnter.transition()
            .duration(800)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);
            
        // Update
        rects.transition()
            .duration(800)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);
            
        // Exit
        rects.exit().remove();

        const texts = contentGroup.selectAll("text")
            .data(rootNode.leaves(), d => d.data.id);
            
        // Enter
        const textEnter = texts.enter().append("text")
            .classed("treemap-label", true)
            .attr("x", d => d.x0 + 5)
            .attr("y", d => d.y0 + 20)
            .style("opacity", 0)
            .style("fill", "white")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .text(d => d.data.id)
            .style("display", d => {
                const boxWidth = d.x1 - d.x0;
                const boxHeight = d.y1 - d.y0;
                return (boxWidth > 80 && boxHeight > 30) ? "block" : "none";
            });
            
        textEnter.transition()
            .duration(800)
            .style("opacity", 1);
            
        // Update
        texts.transition()
            .duration(800)
            .attr("x", d => d.x0 + 5)
            .attr("y", d => d.y0 + 20)
            .style("opacity", 1)
            .style("display", d => {
                const boxWidth = d.x1 - d.x0;
                const boxHeight = d.y1 - d.y0;
                return (boxWidth > 80 && boxHeight > 30) ? "block" : "none";
            });
            
        // Exit
        texts.exit().remove();
    }

    function loadDataAndProcess(state) {
        // Use correctPaths if defined in the parent HTML file
        const filePath = (typeof correctPaths !== 'undefined' && correctPaths[state]) 
            ? correctPaths[state] 
            : stateFiles[state];
            
        console.log("Actual file path being used:", filePath);

        d3.csv(filePath).then(loadedData => {
            data = loadedData;
            console.log("Successfully loaded data from:", filePath);
            processDataForYear(selectedYear);
        }).catch(err => {
            console.error("Error loading CSV data:", err);
            console.error("Failed to load:", filePath);
            contentGroup.selectAll("*").remove();
            contentGroup.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("Failed to load data")
                .style("fill", "red");
        });
    }

    const yearSlider = d3.select("#yearSlider");
    const yearLabel = d3.select("#yearLabel");

    const minYear = +yearSlider.attr("min");
    const maxYear = +yearSlider.attr("max");

    let autoplay = true;
    let autoplayDirection = 1;
    let autoplayInterval = null;
    let autoplayTimeout = null;

    function updateYear(year) {
        yearSlider.property("value", year);
        yearLabel.text("Year: " + year);
        selectedYear = year.toString();
        processDataForYear(selectedYear);
    }

    function startAutoplay() {
        if (autoplayInterval) clearInterval(autoplayInterval);

        autoplayInterval = setInterval(() => {
            if (!autoplay) return;

            let currentYear = +yearSlider.property("value");

            currentYear += autoplayDirection;

            if (currentYear >= maxYear) {
                currentYear = maxYear;
                autoplayDirection = -1;
            } else if (currentYear <= minYear) {
                currentYear = minYear;
                autoplayDirection = 1;
            }

            updateYear(currentYear);

        }, 5000);
    }

    function pauseAutoplay() {
        autoplay = false;
        if (autoplayTimeout) clearTimeout(autoplayTimeout);

        autoplayTimeout = setTimeout(() => {
            autoplay = true;
        }, 120000);
    }

    yearSlider.on("input", function () {
        pauseAutoplay();

        const year = +this.value;
        updateYear(year);
    });

    yearLabel.text("Year: " + selectedYear);
    startAutoplay();
    loadDataAndProcess(selectedState);


    d3.select("#stateSelect").on("change", function () {
        pauseAutoplay();
        selectedState = this.value;
        loadDataAndProcess(selectedState);
    });

    
})();