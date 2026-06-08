import * as d3 from "d3";

Promise.all([
    fetch(new URL("/assets/MCOs.json", import.meta.url)).then(r => r.json()),
    fetch(new URL("/assets/Clubs.json", import.meta.url)).then(r => r.json())
]).then(([mcos, clubs]) => {

    const nodes = [
        ...mcos.map(d => ({
            id: d.MCO,
            type: "mco",
            ...d
        })),
        ...clubs.map(d => ({
            id: d.Verein,
            type: "club",
            ...d
        }))
    ];

    const links = clubs.map(d => ({
        source: d.Verein,
        target: d.MCO,
    }));

    drawGraph({ nodes, links });
});

function drawGraph(data) {
    const width = 3000;
    const height = 1500;
    const badgeSize = 24;
    const badgeRadius = badgeSize / 2;

    const svg = d3.select(".graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const link = svg
        .selectAll("line")
        .data(data.links)
        .join("line")
        .style("stroke", "#aaa");

    const mcoNodes = data.nodes.filter(d => d.type === "mco");
    const clubNodes = data.nodes.filter(d => d.type === "club");

    // MCOs bleiben Kreise mit Farbe aus JSON
    const node = svg
        .selectAll("circle.mco-node")
        .data(mcoNodes)
        .join("circle")
        .attr("class", "mco-node")
        .attr("r", 12)
        .style("fill", d => d.color || "orange");

    // Hilfsfunktion für stabile DOM-IDs bei clipPath
    const toSafeId = value => String(value).replace(/[^a-zA-Z0-9_-]/g, "_");

    const clubsWithBadge = clubNodes.filter(d => d.badge);

    const defs = svg.append("defs");

    defs.selectAll("clipPath.club-badge-clip")
        .data(clubsWithBadge)
        .join("clipPath")
        .attr("class", "club-badge-clip")
        .attr("id", d => `badge-clip-${toSafeId(d.id)}`)
        .append("circle")
        .attr("cx", badgeRadius)
        .attr("cy", badgeRadius)
        .attr("r", badgeRadius);

    const clubBadge = svg
        .selectAll("image.club-badge")
        .data(clubsWithBadge)
        .join("image")
        .attr("class", "club-badge")
        .attr("width", badgeSize)
        .attr("height", badgeSize)
        .attr("xlink:href", d => d.badge)

    const label = svg
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .text(d => d.type === "mco" ? d.MCO : d.Verein)
        .attr("font-size", 11)
        .attr("text-anchor", "middle")
        .attr("dy", 25);

    d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(90))
        .force("charge", d3.forceManyBody().strength(-70))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        clubBadge
            .attr("x", d => d.x - badgeRadius)
            .attr("y", d => d.y - badgeRadius);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);

    }
}
