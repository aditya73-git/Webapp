const DEFAULT_TRACK_DISTANCE_M = 5;
const BANANA_KCAL = 105;
const GUMMY_BEAR_KCAL = 7;
const PUMA_POWER_W = 360;
const TRON_POWER_W = 450;
const FORREST_POWER_W = 700;
const WARR_CRATER_ROVER_POWER_W = 800;
const PUMA_LABEL = "PUMA";
const TRON_LABEL = "TRON";
const FORREST_LABEL = "FORREST";
const WARR_LABEL = "WARR Crater Rover";
const PUMA_MAX_SPEED_MPS = 18 / 3.6;
const TRON_MAX_SPEED_MPS = 3.5 / 3.6;
const FORREST_MAX_SPEED_MPS = 37 / 3.6;
const WARR_MAX_SPEED_MPS = 0.3;
const PUMA_SPEED_RISE_TAU_S = 0.45;
const TRON_SPEED_RISE_TAU_S = 0.9;
const FORREST_SPEED_RISE_TAU_S = 0.3;
const WARR_SPEED_RISE_TAU_S = 0.5;
const ROBOT_CRUISE_POWER_FRACTION = 0.90;
const ROBOT_STARTUP_DECAY_TAU_S = 0.6;
const raceHistory = [];

function formatBananas(kcalValue) {
    const bananas = kcalValue / BANANA_KCAL;
    const rounded = bananas < 1 ? bananas.toFixed(2) : bananas.toFixed(1);
    return `${rounded} ${parseFloat(rounded) === 1 ? "banana" : "bananas"}`;
}

function formatGummyBears(kcalValue) {
    const gummyBears = kcalValue / GUMMY_BEAR_KCAL;
    const rounded = gummyBears < 1 ? gummyBears.toFixed(2) : gummyBears.toFixed(1);
    return `${rounded} ${parseFloat(rounded) === 1 ? "gummy bear" : "gummy bears"}`;
}

function formatFoodComparison(kcalValue) {
    return `${formatBananas(kcalValue)} or ${formatGummyBears(kcalValue)}`;
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

function getTrackDistance() {
    const input = document.getElementById("track-distance-input");

    if (!input) {
        return DEFAULT_TRACK_DISTANCE_M;
    }

    const parsedValue = parseFloat(input.value);
    return parsedValue > 0 ? parsedValue : DEFAULT_TRACK_DISTANCE_M;
}

function formatTrackDistanceValue(distanceMeters) {
    return Number.isInteger(distanceMeters) ? distanceMeters.toString() : distanceMeters.toFixed(1);
}

function formatTrackDistanceCompact(distanceMeters = getTrackDistance()) {
    return `${formatTrackDistanceValue(distanceMeters)} m`;
}

function formatTrackDistanceSentence(distanceMeters = getTrackDistance()) {
    const formattedValue = formatTrackDistanceValue(distanceMeters);
    const unitLabel = Number(distanceMeters) === 1 ? "meter" : "meters";

    return `${formattedValue} ${unitLabel}`;
}

function formatTrackDistanceTrackLabel(distanceMeters = getTrackDistance()) {
    return formatTrackDistanceCompact(distanceMeters);
}

function setText(id, value) {
    document.getElementById(id).innerText = value;
}

function syncTrackDistanceText() {
    const trackDistance = getTrackDistance();

    setText("track-distance-sentence", formatTrackDistanceSentence(trackDistance));
    setText("track-distance-note", formatTrackDistanceCompact(trackDistance));
}

function calculateExponentialRiseDistance(settlingSpeedMps, riseTauSeconds, runtimeSeconds) {
    return settlingSpeedMps * (runtimeSeconds - riseTauSeconds * (1 - Math.exp(-runtimeSeconds / riseTauSeconds)));
}

function getDefaultRobotTime(trackDistance, settlingSpeedMps, riseTauSeconds) {
    if (trackDistance <= 0 || settlingSpeedMps <= 0) {
        return 0;
    }

    if (riseTauSeconds <= 0) {
        return trackDistance / settlingSpeedMps;
    }

    let low = 0;
    let high = Math.max(trackDistance / settlingSpeedMps, riseTauSeconds);

    while (calculateExponentialRiseDistance(settlingSpeedMps, riseTauSeconds, high) < trackDistance) {
        high *= 2;
    }

    for (let iteration = 0; iteration < 40; iteration += 1) {
        const mid = (low + high) / 2;

        if (calculateExponentialRiseDistance(settlingSpeedMps, riseTauSeconds, mid) < trackDistance) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return high;
}

function calculateExponentialDecayEnergy(peakPowerWatts, runtimeSeconds, cruisePowerFraction = ROBOT_CRUISE_POWER_FRACTION, tauSeconds = ROBOT_STARTUP_DECAY_TAU_S) {
    const cruisePowerWatts = peakPowerWatts * cruisePowerFraction;
    const transientEnergyJoules = (peakPowerWatts - cruisePowerWatts) * tauSeconds * (1 - Math.exp(-runtimeSeconds / tauSeconds));
    return (cruisePowerWatts * runtimeSeconds) + transientEnergyJoules;
}

function resolveRobotTime(inputId, settlingSpeedMps, riseTauSeconds) {
    const input = document.getElementById(inputId);
    const rawValue = input.value.trim();
    const trackDistance = getTrackDistance();

    if (!rawValue) {
        const calculatedTime = getDefaultRobotTime(trackDistance, settlingSpeedMps, riseTauSeconds);
        input.value = calculatedTime.toFixed(2);
        input.dataset.autoFilled = "true";
        return calculatedTime;
    }

    return parseFloat(rawValue);
}

function updateRobotTimeIfAutofilled(inputId, settlingSpeedMps, riseTauSeconds) {
    const input = document.getElementById(inputId);
    const isAutoFilled = input.dataset.autoFilled !== "false";

    if (!input.value.trim() || isAutoFilled) {
        const calculatedTime = getDefaultRobotTime(getTrackDistance(), settlingSpeedMps, riseTauSeconds);
        input.value = calculatedTime.toFixed(2);
        input.dataset.autoFilled = "true";
    }
}

function prefillDefaultRobotTimes() {
    updateRobotTimeIfAutofilled("puma-time", PUMA_MAX_SPEED_MPS, PUMA_SPEED_RISE_TAU_S);
    updateRobotTimeIfAutofilled("tron-time", TRON_MAX_SPEED_MPS, TRON_SPEED_RISE_TAU_S);
    updateRobotTimeIfAutofilled("forrest-time", FORREST_MAX_SPEED_MPS, FORREST_SPEED_RISE_TAU_S);
    updateRobotTimeIfAutofilled("warr-time", WARR_MAX_SPEED_MPS, WARR_SPEED_RISE_TAU_S);
}

function updateTrackDistance() {
    syncTrackDistanceText();
    prefillDefaultRobotTimes();
}

function normalizeTrackDistanceInput() {
    const input = document.getElementById("track-distance-input");
    const parsedValue = parseFloat(input.value);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
        input.value = formatTrackDistanceValue(DEFAULT_TRACK_DISTANCE_M);
    }

    updateTrackDistance();
}

function updateLeaderboard(competitorsByTime) {
    const leaderboard = document.getElementById("leaderboard-list");

    leaderboard.innerHTML = competitorsByTime.map((competitor, index) =>
        `<li>
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-name">
                <div class="leaderboard-label">${competitor.label}</div>
                <div class="leaderboard-role">${competitor.role}</div>
            </div>
            <div class="leaderboard-time">${formatSeconds(competitor.time)}</div>
            <div class="leaderboard-speed">${formatSpeed(competitor.speed)}</div>
        </li>`
    ).join("");
}

function sortEnergyCards(competitorsByEnergy) {
    const resultsGrid = document.getElementById("results");

    competitorsByEnergy.forEach((competitor) => {
        const card = resultsGrid.querySelector(`[data-competitor="${competitor.key}"]`);

        if (card) {
            resultsGrid.appendChild(card);
        }
    });
}

function calculateRace() {
    const name = document.getElementById("name").value.trim();
    const weight = parseFloat(document.getElementById("weight").value);
    const humanTime = parseFloat(document.getElementById("human-time").value);
    const trackDistance = getTrackDistance();
    const pumaTime = resolveRobotTime("puma-time", PUMA_MAX_SPEED_MPS, PUMA_SPEED_RISE_TAU_S);
    const tronTime = resolveRobotTime("tron-time", TRON_MAX_SPEED_MPS, TRON_SPEED_RISE_TAU_S);
    const forrestTime = resolveRobotTime("forrest-time", FORREST_MAX_SPEED_MPS, FORREST_SPEED_RISE_TAU_S);
    const warrTime = resolveRobotTime("warr-time", WARR_MAX_SPEED_MPS, WARR_SPEED_RISE_TAU_S);

    if (!name || !weight || !humanTime || !trackDistance) {
        alert("Fill in the race distance, runner name, weight, and human finish time.");
        return;
    }

    if (
        trackDistance <= 0 ||
        weight <= 0 ||
        humanTime <= 0 ||
        pumaTime <= 0 ||
        tronTime <= 0 ||
        forrestTime <= 0 ||
        warrTime <= 0 ||
        Number.isNaN(pumaTime) ||
        Number.isNaN(tronTime) ||
        Number.isNaN(forrestTime) ||
        Number.isNaN(warrTime)
    ) {
        alert("Please enter values greater than zero.");
        return;
    }

    const humanSpeed = trackDistance / humanTime;
    const pumaSpeed = trackDistance / pumaTime;
    const tronSpeed = trackDistance / tronTime;
    const forrestSpeed = trackDistance / forrestTime;
    const warrSpeed = trackDistance / warrTime;

    const humanMet = estimateMetFromSpeed(humanSpeed);
    const humanKcal = (humanMet * 3.5 * weight / 200) * (humanTime / 60);
    const humanJoules = humanKcal * 4184;

    const pumaJoules = calculateExponentialDecayEnergy(PUMA_POWER_W, pumaTime);
    const pumaKcal = pumaJoules / 4184;

    const tronJoules = calculateExponentialDecayEnergy(TRON_POWER_W, tronTime);
    const tronKcal = tronJoules / 4184;

    const forrestJoules = calculateExponentialDecayEnergy(FORREST_POWER_W, forrestTime);
    const forrestKcal = forrestJoules / 4184;

    const warrJoules = calculateExponentialDecayEnergy(WARR_CRATER_ROVER_POWER_W, warrTime);
    const warrKcal = warrJoules / 4184;

    const competitors = [
        { key: "human", label: name, role: "Human Runner", time: humanTime, speed: humanSpeed, energyJoules: humanJoules },
        { key: "puma", label: PUMA_LABEL, role: "Quadruped Bot", time: pumaTime, speed: pumaSpeed, energyJoules: pumaJoules },
        { key: "tron", label: TRON_LABEL, role: "Biped Bot", time: tronTime, speed: tronSpeed, energyJoules: tronJoules },
        { key: "forrest", label: FORREST_LABEL, role: "Walking Bot", time: forrestTime, speed: forrestSpeed, energyJoules: forrestJoules },
        { key: "warr", label: WARR_LABEL, role: "Rover Bot", time: warrTime, speed: warrSpeed, energyJoules: warrJoules }
    ];

    const competitorsByTime = [...competitors].sort((a, b) => a.time - b.time);
    const competitorsByEnergy = [...competitors].sort((a, b) => a.energyJoules - b.energyJoules);

    const winner = competitorsByTime[0];
    const second = competitorsByTime[1];
    const gap = second.time - winner.time;

    setText("human-name-label", name);
    setText("human-time-out", formatSeconds(humanTime));
    setText("human-speed", formatSpeed(humanSpeed));
    setText("human-joules", formatEnergyJoules(humanJoules));
    setText("human-kcal", `${humanKcal.toFixed(2)} kcal`);
    setText("human-food", `Consumed energy worth of ${formatFoodComparison(humanKcal)}.`);

    setText("puma-time-out", formatSeconds(pumaTime));
    setText("puma-speed", formatSpeed(pumaSpeed));
    setText("puma-joules", formatEnergyJoules(pumaJoules));
    setText("puma-kcal", `${pumaKcal.toFixed(2)} kcal`);
    setText("puma-food", `Equivalent to the energy in ${formatFoodComparison(pumaKcal)}.`);

    setText("tron-time-out", formatSeconds(tronTime));
    setText("tron-speed", formatSpeed(tronSpeed));
    setText("tron-joules", formatEnergyJoules(tronJoules));
    setText("tron-kcal", `${tronKcal.toFixed(2)} kcal`);
    setText("tron-food", `Equivalent to the energy in ${formatFoodComparison(tronKcal)}.`);

    setText("forrest-time-out", formatSeconds(forrestTime));
    setText("forrest-speed", formatSpeed(forrestSpeed));
    setText("forrest-joules", formatEnergyJoules(forrestJoules));
    setText("forrest-kcal", `${forrestKcal.toFixed(2)} kcal`);
    setText("forrest-food", `Equivalent to the energy in ${formatFoodComparison(forrestKcal)}.`);

    setText("warr-time-out", formatSeconds(warrTime));
    setText("warr-speed", formatSpeed(warrSpeed));
    setText("warr-joules", formatEnergyJoules(warrJoules));
    setText("warr-kcal", `${warrKcal.toFixed(2)} kcal`);
    setText("warr-food", `Equivalent to the energy in ${formatFoodComparison(warrKcal)}.`);

    setText("winner-name", winner.label);
    setText("winner-time", `${winner.role} finished first in ${formatSeconds(winner.time)}.`);
    setText("winner-note", `${winner.label} led the field by ${gap.toFixed(2)} s over ${second.label} on the ${formatTrackDistanceTrackLabel(trackDistance)} track.`);
    setText("fastest-speed", formatSpeed(winner.speed));
    setText("winner-gap", formatSeconds(gap));

    document.getElementById("summary").style.display = "block";
    document.getElementById("results").style.display = "grid";
    updateLeaderboard(competitorsByTime);
    sortEnergyCards(competitorsByEnergy);

    raceHistory.unshift({
        name,
        winner: winner.label,
        humanTime,
        pumaTime,
        tronTime,
        forrestTime,
        warrTime
    });

    updateHistory();
}

function updateHistory() {
    const list = document.getElementById("history-list");

    if (!raceHistory.length) {
        list.innerHTML = '<li class="empty-state">No races yet. Enter the human finish time and compare it against the default or custom robot times.</li>';
        return;
    }

    list.innerHTML = raceHistory.slice(0, 6).map((race, index) =>
        `<li>
            <div>
                <div class="history-winner">Race ${index + 1}: ${race.winner}</div>
                <div class="mini-label">${race.name} vs ${PUMA_LABEL} vs ${TRON_LABEL} vs ${FORREST_LABEL} vs ${WARR_LABEL}</div>
            </div>
            <div class="history-times">
                Human: ${race.humanTime.toFixed(2)} s<br>
                ${PUMA_LABEL}: ${race.pumaTime.toFixed(2)} s<br>
                ${TRON_LABEL}: ${race.tronTime.toFixed(2)} s<br>
                ${FORREST_LABEL}: ${race.forrestTime.toFixed(2)} s<br>
                ${WARR_LABEL}: ${race.warrTime.toFixed(2)} s
            </div>
        </li>`
    ).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    const trackDistanceInput = document.getElementById("track-distance-input");

    trackDistanceInput.value = formatTrackDistanceValue(DEFAULT_TRACK_DISTANCE_M);
    syncTrackDistanceText();
    prefillDefaultRobotTimes();
    trackDistanceInput.addEventListener("input", updateTrackDistance);
    trackDistanceInput.addEventListener("change", normalizeTrackDistanceInput);
    trackDistanceInput.addEventListener("blur", normalizeTrackDistanceInput);
    ["puma-time", "tron-time", "forrest-time", "warr-time"].forEach((inputId) => {
        const input = document.getElementById(inputId);
        input.addEventListener("input", () => {
            input.dataset.autoFilled = input.value.trim() ? "false" : "true";
        });
    });
    document.getElementById("run-race-button").addEventListener("click", calculateRace);
    updateHistory();
});
