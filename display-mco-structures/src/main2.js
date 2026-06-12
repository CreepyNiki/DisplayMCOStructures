
import LatLon from 'geodesy/latlon-ellipsoidal.js';
import * as d3 from "d3";

let map = L.map('map').setView([41.505, 12.49], 3);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri',
    maxZoom: 18,
    minZoom: 3,
}).addTo(map);

Promise.all([
    fetch(new URL("/assets/MCOs.json", import.meta.url)).then(r => r.json()),
    fetch(new URL("/assets/Clubs.json", import.meta.url)).then(r => r.json())
]).then(([mcos, clubs]) => {
    const mcoColorMap = new Map(mcos.map(mco => [mco.MCO, mco.color]));
    const mcoLayers = new Map();

    for (const mco of mcos) {
        const group = L.layerGroup().addTo(map);
        mcoLayers.set(mco.MCO, group);
    }

    for (const club of clubs) {
        const coord = normalizeCoord(club.Koordinaten);
        const point = LatLon.parse(coord);

        const badgeIcon = L.icon({
            iconUrl: club.badge,
            iconSize: [64, 64],
            iconAnchor: [32, 32]
        });

        const circle = createSplitCircleMarker(point.lat, point.lon, club.MCO, mcoColorMap);
        circle.on("click", () => showPopup(map, club, point.lat, point.lon));

        const marker = L.marker([point.lat, point.lon], {
            icon: badgeIcon
        }).on("click", () => showPopup(map, club, point.lat, point.lon));

        const mcos = club.MCO.split(',').map(m => m.trim());
        for (const mco of mcos) {
            const group = mcoLayers.get(mco);
            if (group) {
                group.addLayer(circle);
                group.addLayer(marker);
            }
        }
    }

    createLegend(mcos, mcoLayers);
});

function normalizeCoord(raw) {
    return raw
        .trim()
        .replace(/(\d),(\d)/g, '$1.$2')
        .replace(/\bO\b/g, 'E')
        .replace(/([NS])\s*([EW])/g, '$1, $2')
        .replace(/\s*,\s*/g, ', ');
}

function showPopup(map, d, lat, lon) {
    map.flyTo([lat, lon], 18, {
        duration: 3,
        easeLinearity: 0.25
    });

    const popup = d3.select(".info-popup");
    popup
        .classed("hidden", false)
        .html(`
            <button class="popup-close">×</button>
            <h1 class="header">${d.Verein}</h1>
            <div class="club-content">
                <div class="attributes">
                    ${d.MCO ? `<p class="attr"><strong>MCO:</strong> ${d.MCO}</p>` : ""}
                    ${d.Land ? `<p class="attr"><strong>Land:</strong> ${d.Land}</p>` : ""}
                    ${d.Liga ? `<p class="attr"><strong>Liga:</strong> ${d.Liga}</p>` : ""}
                    ${d.Marktwert ? `<p class="attr"><strong>Marktwert:</strong> ${d.Marktwert}</p>` : ""}
                </div>
                <img class="imagePopup" src="${d.badge}"></img>
            </div>
        `);
    popup.select(".popup-close")
        .on("click", () => popup.classed("hidden", true));
}

function createSplitCircleMarker(lat, lon, mcos, mcoColorMap) {
    const colors = mcos
        .split(',')
        .map(m => mcoColorMap.get(m.trim()) ?? '#3388ff');

    if (colors.length === 1) {
        return L.circleMarker([lat, lon], {
            radius: 45,
            color: colors[0],
            weight: 1,
            fillColor: colors[0],
            fillOpacity: 0.7
        });
    }

    const svg = `
        <svg width="92" height="92" viewBox="0 0 92 92">
            <path d="M46 1 A45 45 0 0 0 46 91 L46 1"
                  fill="${colors[0]}"
                  stroke="black"
                  stroke-width="1"/>
            <path d="M46 1 A45 45 0 0 1 46 91 L46 1"
                  fill="${colors[1]}"
                  stroke="black"
                  stroke-width="1"/>
        </svg>
    `;

    return L.marker([lat, lon], {
        icon: L.divIcon({
            html: svg,
            className: "split-circle-marker",
            iconSize: [92, 92],
            iconAnchor: [46, 46]
        }),
        zIndexOffset: -1000
    });
}



function createLegend(mcos, mcoLayers) {
    const form = d3.select(".legend-form");

    form.html("");

    form.append("label")
        .attr("class", "legend-item")
        .html(`
      <input type="checkbox" class="select-all" checked>
      <span class="legend-color" style="background-color: white"></span>
      <span>Select all</span>
    `);

    for (const mco of mcos) {
        const item = form.append("label")
            .attr("class", "legend-item");

        item.html(`
      <input type="checkbox" class="legendOption" data-mco="${mco.MCO}" checked>
      <span class="legend-color" style="background-color: ${mco.color}"></span>
      <span>${mco.MCO}</span>
    `);
    }

    form.selectAll(".legendOption").on("change", function () {
        const mco = this.dataset.mco;
        const layer = mcoLayers.get(mco);

        if (this.checked) {
            layer.addTo(map);
        } else {
            map.removeLayer(layer);
        }

        updateSelectAllState();
    });

    form.select(".select-all").on("change", function () {
        const checked = this.checked;

        form.selectAll(".legendOption").each(function () {
            this.checked = checked;

            const mco = this.dataset.mco;
            const layer = mcoLayers.get(mco);

            if (checked) {
                layer.addTo(map);
            } else {
                map.removeLayer(layer);
            }
        });
    });

    function updateSelectAllState() {
        const allBoxes = form.selectAll(".legendOption").nodes();
        const allChecked = allBoxes.every(box => box.checked);

        form.select(".select-all").property("checked", allChecked);
    }
}

