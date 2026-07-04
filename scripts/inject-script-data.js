// Inject the punched-up script data into demo/advert-script.html placeholders.
const fs = require('fs');
const path = require('path');
const SRC = process.argv[2]; // workflow result json file
const HTML = path.join(__dirname, '..', 'demo', 'advert-script.html');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const r = raw.result || raw;

const EYEBROWS = {
  1: 'Cold open', 2: 'The turn', 3: 'The stakes', 4: 'Feature · the spine',
  5: 'Feature · reader', 6: 'Feature · explain', 7: 'The hero', 8: 'The payoff', 9: 'Close',
};
const beats = r.beats.map(b => ({ ...b, eyebrow: EYEBROWS[b.n] || '' }));

let html = fs.readFileSync(HTML, 'utf8');
const put = (marker, value) => {
  const needle = marker;
  if (!html.includes(needle)) throw new Error('marker not found: ' + marker);
  html = html.replace(needle, JSON.stringify(value));
};
put('/*BEATS_JSON*/[]', beats);
put('/*VO_JSON*/""', r.vo_full);
put('/*SHOTS_JSON*/[]', r.shotlist);
put('/*WINS_JSON*/[]', r.why_it_wins);
put('/*DEMO_JSON*/{}', r.demo_lines);
put('/*NOTES_JSON*/""', r.production_notes);

fs.writeFileSync(HTML, html);
console.log('injected:', beats.length, 'beats,', r.shotlist.length, 'shots,', r.why_it_wins.length, 'wins');
