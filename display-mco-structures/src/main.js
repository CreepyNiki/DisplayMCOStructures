import * as d3 from "d3";

Promise.all([
    fetch(new URL("/assets/MCOs.json", import.meta.url)).then(r => r.json()),
    fetch(new URL("/assets/Clubs.json", import.meta.url)).then(r => r.json())
]).then(([mcos, clubs]) => {

    const mcoNodes = mcos.map(d => ({
        id: d.MCO.trim(),
        type: "mco",
        ...d
    }));

    const clubMap = new Map();

    clubs.forEach(d => {
        if (!clubMap.has(d.Verein)) {
            clubMap.set(d.Verein, {
                id: d.Verein,
                type: "club",
                ...d
            });
        }
    });

    const clubNodes = Array.from(clubMap.values());

    const links = clubs.flatMap(d => {
        const mcoNames = d.MCO
            .split(",")
            .map(name => name.trim())
            .filter(Boolean);

        return mcoNames.map(mco => ({
            source: d.Verein,
            target: mco
        }));
    });

    const nodes = [...mcoNodes, ...clubNodes];

    drawGraph({ nodes, links });
});

function drawGraph(data) {
    const width = 2700;
    const height = 1400;
    const badgeSize = 64;
    const badgeRadius = badgeSize / 2;

    const svg = d3.select(".graph")
        .append("svg")
        .attr("viewBox", [0, 0, width, height])

    const viewport = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0.2, 4])
        .filter(event => {
            if (event.type === "mousedown") return event.button === 0;

            if (event.type === "wheel") return event.button === 0;

        })
        .on("zoom", event => {
            viewport.attr("transform", event.transform);
        });

    svg.call(zoom);
    svg.on("dblclick.zoom", null);

    function focusNode(event, d) {
        event.stopPropagation();

        const scale = 2.5;

        const transform = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-d.x, -d.y);

        svg.transition()
            .duration(750)
            .call(zoom.transform, transform);

        showPopup(d);
    }

    function showPopup(d) {
        const popup = d3.select(".info-popup");
        if(d.type === "mco"){
            popup
                .classed("hidden", false)
                .html(`
                    <button class="popup-close">×</button>
                    <h1 class="MCOHeader">${d.MCO}</h1>
                    ${d.Land ? `<p class="attr"><strong>Land:</strong> ${d.Land}</p>` : ""}
                    ${d.Besitzer ? `<p class="attr"><strong>Besitzer:</strong> ${d.Besitzer}</p>` : ""}
                    ${d.Kapital ? `<p class="attr"><strong>Kapital:</strong> ${d.Kapital}</p>` : ""}
                `);
        }else if(d.type === "club"){
            popup
                .classed("hidden", false)
                .html(`
                    <button class="popup-close">×</button>
                    <h1 class="clubHeader">${d.Verein}</h1>
                    <img class="imagePopup" src="${d.badge}"></img>
                    ${d.MCO ? `<p class="attr"><strong>MCO:</strong> ${d.MCO}</p>` : ""}
                    ${d.Land ? `<p class="attr"><strong>Land:</strong> ${d.Land}</p>` : ""}
                    ${d.Liga ? `<p class="attr"><strong>Liga:</strong> ${d.Liga}</p>` : ""}
                    ${d.Marktwert ? `<p class="attr"><strong>Marktwert:</strong> ${d.Marktwert}</p>` : ""}
                `);
        }

        popup.select(".popup-close")
            .on("click", () => popup.classed("hidden", true));
    }

    const link = viewport
        .selectAll("line")
        .data(data.links)
        .join("line")
        .style("stroke", "#aaa");

    const mcoNodes = data.nodes.filter(d => d.type === "mco");
    const clubNodes = data.nodes.filter(d => d.type === "club");

    const node = viewport
        .selectAll("circle.mco-node")
        .data(mcoNodes)
        .join("circle")
        .attr("class", "mco-node")
        .attr("r", 24)
        .style("fill", d => d.color || "orange")
        .on("dblclick", focusNode);

    const clubsWithBadge = clubNodes.filter(d => d.badge);

    const defs = svg.append("defs");

    defs.selectAll("clipPath.club-badge-clip")
        .data(clubsWithBadge)
        .join("clipPath")
        .attr("class", "club-badge-clip")
        .append("circle")
        .attr("cx", badgeRadius)
        .attr("cy", badgeRadius)
        .attr("r", badgeRadius);

    const clubBadge = viewport
        .selectAll("image.club-badge")
        .data(clubsWithBadge)
        .join("image")
        .attr("class", "club-badge")
        .attr("width", badgeSize)
        .attr("height", badgeSize)
        .attr("xlink:href", d => d.badge)
        .on("dblclick", focusNode);

    const label = viewport
        .selectAll("text.mco-label")
        .data(mcoNodes)
        .join("text")
        .attr("class", "mco-label")
        .text(d => d.MCO)
        .attr("font-size", 16)
        .attr("text-anchor", "middle")
        .attr("dy", 34);

    const padding = 80;

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(d => d.source.type === "club" || d.target.type === "club" ? 50 : 250)
            .strength(1)
        )
        .force("charge", d3.forceManyBody()
            .strength(d => d.type === "mco" ? -600 : -200)
        )
        .force("collide", d3.forceCollide()
            .radius(d => d.type === "club" ? badgeRadius + 25 : 50)
            .strength(1)
            .iterations(4)
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.04))
        .force("y", d3.forceY(height / 2).strength(0.04))
        .on("tick", ticked);

    function ticked() {
        data.nodes.forEach(d => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
        });

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

