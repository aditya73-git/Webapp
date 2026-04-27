# Robot Race Arena

`Robot Race Arena` is a static browser app that compares a human runner against four robots over a configurable race distance. It calculates finish times, estimated speed, and energy use, then presents the winner, a ranked leaderboard, an energy comparison, and a short race history.

## Preview

The app is built as a plain HTML/CSS/JavaScript project with no build step and no external dependencies.

## Features

- Configurable race distance in meters
- Human runner inputs for name, weight, and finish time
- Optional manual robot finish times
- Automatic robot finish-time estimates when robot inputs are left blank
- Winner summary with fastest speed and first-place gap
- Leaderboard sorted by finish time
- Energy comparison for the human and all robots
- Food-equivalent energy display in bananas and gummy bears
- Short in-memory race history for recent runs

## Project Structure

- [index.html](/home/aditya/Desktop/Webapp/index.html) defines the page layout, form inputs, result cards, leaderboard, and history section.
- [webapp.css](/home/aditya/Desktop/Webapp/webapp.css) contains the poster-style visual design, responsive layout, and component styling.
- [webapp.js](/home/aditya/Desktop/Webapp/webapp.js) handles race calculations, auto-filling robot times, sorting results, and updating the UI.
- `image.png`, `image (1).png`, and `image (2).png` are the local robot/background image assets used by the page.
- `math_breakdown.pdf` appears to be supporting reference material for the calculation model.

## How to Run

Because this is a static site, you can open it directly in a browser:

1. Open [index.html](/home/aditya/Desktop/Webapp/index.html).

If you prefer serving it locally, run a simple static server from the project folder, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## How It Works

### Inputs

The app takes:

- Race distance in meters
- Human runner name
- Human weight in kilograms
- Human finish time in seconds
- Optional finish times for PUMA, TRON, FORREST, and WARR Crater Rover

### Robot time estimation

If a robot time is left blank, the app estimates it from:

- A default max/settling speed for that robot
- A rise-time constant used to model acceleration

The script solves for the time needed to cover the chosen distance using an exponential rise model.

### Energy estimation

- Human energy is estimated from speed-based MET values, runner weight, and elapsed time.
- Robot energy is estimated from power draw over time using a cruise-power fraction plus startup/transient decay model.
- Energy is displayed in joules and kilocalories.

## Default Competitors

- Human Runner
- PUMA
- TRON
- FORREST
- WARR Crater Rover

## Notes and Limitations

- Race history is stored only in memory and resets on page refresh.
- There is no backend, database, or persistent storage.
- Robot defaults are hard-coded in [webapp.js](/home/aditya/Desktop/Webapp/webapp.js).
- Summary and leaderboard sections stay hidden until a race is run.

## Customization

Common places to modify the app:

- Update labels, layout, or sections in [index.html](/home/aditya/Desktop/Webapp/index.html)
- Change theme colors and responsive styling in [webapp.css](/home/aditya/Desktop/Webapp/webapp.css)
- Tune robot speed, power, and energy assumptions in [webapp.js](/home/aditya/Desktop/Webapp/webapp.js)

## Future Improvements

- Persist race history with `localStorage`
- Add chart visualizations for speed and energy comparisons
- Export race results as JSON or CSV
- Add validation hints inline instead of alert dialogs
- Add automated tests for the calculation helpers
