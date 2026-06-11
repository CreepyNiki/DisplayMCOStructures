
import LatLon from 'geodesy/latlon-ellipsoidal.js';

let map = L.map('map').setView([41.505, 12.49], 3);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

Promise.all([
    fetch(new URL("/assets/MCOs.json", import.meta.url)).then(r => r.json()),
    fetch(new URL("/assets/Clubs.json", import.meta.url)).then(r => r.json())
]).then(([mcos, clubs]) => {

    for (const club of clubs) {

        let badgeIcon = L.icon({
            iconUrl: club.badge,
            iconSize: [64, 64, 64],
        });

        const coord = normalizeCoord(club.Koordinaten);
        const point = LatLon.parse(coord);
        L.marker([point.lat, point.lon], {
            icon: badgeIcon,
        }).addTo(map);
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
    if (d.type === "mco") {
        popup
            .classed("hidden", false)
            .html(`
                <button class="popup-close">×</button>
                <h1 class="header">${d.MCO}</h1>
                ${d.Land ? `<p class="attr"><strong>Land:</strong> ${d.Land}</p>` : ""}
                ${d.Besitzer ? `<p class="attr"><strong>Besitzer:</strong> ${d.Besitzer}</p>` : ""}
                ${d.Kapital ? `<p class="attr"><strong>Kapital:</strong> ${d.Kapital}</p>` : ""}
            `);
    } else if (d.type === "club") {
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
    }
}


