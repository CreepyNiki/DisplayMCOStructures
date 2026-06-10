
function showPopup(d) {
    const popup = d3.select(".info-popup");
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


