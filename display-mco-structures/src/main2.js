
import LatLon from 'geodesy/latlon-ellipsoidal.js';
import * as d3 from "d3";

let map = L.map('map').setView([41.505, 12.49], 3);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

Promise.all([
    fetch(new URL("/assets/MCOs.json", import.meta.url)).then(r => r.json()),
    fetch(new URL("/assets/Clubs.json", import.meta.url)).then(r => r.json())
]).then(([mcos, clubs]) => {
    const mcoColorMap = new Map(mcos.map(mco => [mco.MCO, mco.color]));

    for (const club of clubs) {
        const badgeIcon = L.icon({
            iconUrl: club.badge,
            iconSize: [64, 64],
            iconAnchor: [32, 32]
        });

        const coord = normalizeCoord(club.Koordinaten);
        const point = LatLon.parse(coord);
        const color = mcoColorMap.get(club.MCO) ?? '#3388ff';

        L.circleMarker([point.lat, point.lon], {
            radius: 45,
            color: color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.7
        }).addTo(map).on('click', () => showPopup(club))

        L.marker([point.lat, point.lon], {
            icon: badgeIcon
        }).addTo(map).on('click', () => showPopup(club))
    }
});

function normalizeCoord(raw) {
    return raw
        .trim()
        .replace(/(\d),(\d)/g, '$1.$2')
        .replace(/\bO\b/g, 'E')
        .replace(/([NS])\s*([EW])/g, '$1, $2')
        .replace(/\s*,\s*/g, ', ');
}

function showPopup(d) {
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


