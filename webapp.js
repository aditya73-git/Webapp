const TRACK_DISTANCE_M = 0.5;
const BANANA_KCAL = 105;
const PUMA_POWER_W = 360;
const TRON_POWER_W = 450;
const raceHistory = [];

function formatBananas(kcalValue) {
    const bananas = kcalValue / BANANA_KCAL;
    const rounded = bananas < 1 ? bananas.toFixed(2) : bananas.toFixed(1);
    return `${rounded} ${parseFloat(rounded) === 1 ? "banana" : "bananas"}`;
}

function estimateMetFromSpeed(speedMps) {
    const speedKmh = speedMps * 3.6;

    if (speedKmh < 4) return 2.8;
    if (speedKmh < 5.5) return 3.5;
    if (speedKmh < 8) return 8.3;
    if (speedKmh < 9.7) return 9.8;
    if (speedKmh < 11.3) return 11.0;
    if (speedKmh < 12.9) return 11.8;
    if (speedKmh < 14.5) return 12.8;
    if (speedKmh < 16.1) return 14.5;
    if (speedKmh < 17.7) return 16.0;
    return 18.0;
}

function formatSeconds(value) {
    return `${value.toFixed(2)} s`;
}

function formatSpeed(value) {
    return `${value.toFixed(2)} m/s`;
}

function formatEnergyJoules(value) {
    return `${Math.round(value)} J`;
}

function setText(id, value) {
    document.getElementById(id).innerText = value;
}

function calculateRace() {
    const name = document.getElementById("name").value.trim();
    const weight = parseFloat(document.getElementById("weight").value);
    const humanTime = parseFloat(document.getElementById("human-time").value);
    const pumaTime = parseFloat(document.getElementById("puma-time").value);
    const tronTime = parseFloat(document.getElementById("tron-time").value);

    if (!name || !weight || !humanTime || !pumaTime || !tronTime) {
        alert("Fill in the name, weight, and all three finish times.");
        return;
    }

    if (weight <= 0 || humanTime <= 0 || pumaTime <= 0 || tronTime <= 0) {
        alert("Please enter values greater than zero.");
        return;
    }

    const humanSpeed = TRACK_DISTANCE_M / humanTime;
    const pumaSpeed = TRACK_DISTANCE_M / pumaTime;
    const tronSpeed = TRACK_DISTANCE_M / tronTime;

    const humanMet = estimateMetFromSpeed(humanSpeed);
    const humanKcal = (humanMet * 3.5 * weight / 200) * (humanTime / 60);
    const humanJoules = humanKcal * 4184;

    const pumaJoules = PUMA_POWER_W * pumaTime;
    const pumaKcal = pumaJoules / 4184;

    const tronJoules = TRON_POWER_W * tronTime;
    const tronKcal = tronJoules / 4184;

    const competitors = [
        { key: "human", label: name, role: "Human Runner", time: humanTime, speed: humanSpeed },
        { key: "puma", label: "PUMA 4-Leg Bot", role: "Quadruped Bot", time: pumaTime, speed: pumaSpeed },
        { key: "tron", label: "TRON 2-Leg Bot", role: "Biped Bot", time: tronTime, speed: tronSpeed }
    ].sort((a, b) => a.time - b.time);

    const winner = competitors[0];
    const second = competitors[1];
    const gap = second.time - winner.time;

    setText("human-name-label", name);
    setText("human-time-out", formatSeconds(humanTime));
    setText("human-speed", formatSpeed(humanSpeed));
    setText("human-joules", formatEnergyJoules(humanJoules));
    setText("human-kcal", `${humanKcal.toFixed(2)} kcal`);
    setText("human-food", `Consumed energy worth of ${formatBananas(humanKcal)}.`);

    setText("puma-time-out", formatSeconds(pumaTime));
    setText("puma-speed", formatSpeed(pumaSpeed));
    setText("puma-joules", formatEnergyJoules(pumaJoules));
    setText("puma-kcal", `${pumaKcal.toFixed(2)} kcal`);
    setText("puma-food", `Equivalent to the energy in ${formatBananas(pumaKcal)}.`);

    setText("tron-time-out", formatSeconds(tronTime));
    setText("tron-speed", formatSpeed(tronSpeed));
    setText("tron-joules", formatEnergyJoules(tronJoules));
    setText("tron-kcal", `${tronKcal.toFixed(2)} kcal`);
    setText("tron-food", `Equivalent to the energy in ${formatBananas(tronKcal)}.`);

    setText("winner-name", winner.label);
    setText("winner-time", `${winner.role} finished first in ${formatSeconds(winner.time)}.`);
    setText("winner-note", `${winner.label} led the field by ${gap.toFixed(2)} s over ${second.label} on the ${TRACK_DISTANCE_M.toFixed(1)} m track.`);
    setText("fastest-speed", formatSpeed(winner.speed));
    setText("winner-gap", formatSeconds(gap));

    document.getElementById("summary").style.display = "block";
    document.getElementById("results").style.display = "grid";

    raceHistory.unshift({
        name,
        winner: winner.label,
        humanTime,
        pumaTime,
        tronTime
    });

    updateHistory();
}

function updateHistory() {
    const list = document.getElementById("history-list");

    if (!raceHistory.length) {
        list.innerHTML = '<li class="empty-state">No races yet. Enter all three finish times to compare the lanes.</li>';
        return;
    }

    list.innerHTML = raceHistory.slice(0, 6).map((race, index) =>
        `<li>
            <div>
                <div class="history-winner">Race ${index + 1}: ${race.winner}</div>
                <div class="mini-label">${race.name} vs PUMA vs TRON</div>
            </div>
            <div class="history-times">
                Human: ${race.humanTime.toFixed(2)} s<br>
                PUMA: ${race.pumaTime.toFixed(2)} s<br>
                TRON: ${race.tronTime.toFixed(2)} s
            </div>
        </li>`
    ).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("run-race-button").addEventListener("click", calculateRace);
    updateHistory();
});
