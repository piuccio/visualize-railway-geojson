/* globals L */
const LINES = '/node_modules/add-open-data-railway-lines/output/lines.json';
const MISSING = '/node_modules/add-open-data-railway-lines/output/missing.json';
const CONNECT_ENDPOINT = (lineId, odpt) => `http://localhost:3000/connect?lineId=${encodeURIComponent(lineId)}&odpt=${encodeURIComponent(odpt)}`;

window.onload = init;

function init() {
  const map = L.map('leaflet').setView([35.68, 139.69], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  loadGeojson(map);
}

async function loadGeojson(map) {
  const lines = await (await fetch(LINES)).json();
  const missing = await (await fetch(MISSING)).json();
  render(lines);
  let layer = null;

  function changeSelectedLine() {
    const lineId = document.location.hash.slice(1);
    if (!lineId || !lines[lineId]) return;

    const geojson = lines[lineId].geojson;
    if (layer) {
      layer.remove();
    }
    layer = L.geoJSON(geojson, {
      style: (feature) => ({
        color: feature.properties.stationId ? '#B90452' : '#1A2930',
      }),
    }).addTo(map);
    map.fitBounds(layer.getBounds(), { padding: [10, 10]});
  }

  window.addEventListener('popstate', changeSelectedLine);
  map.invalidateSize();
  changeSelectedLine();
  setupToggle(lines, missing);
}

function render(lines) {
  const list = document.querySelector('.list');
  list.innerHTML = '';
  list.appendChild(createListOfLines(lines));
}

function createListOfLines(lines) {
  const list = document.createDocumentFragment();
  Object.keys(lines).forEach((lineId) => {
    const option = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${lineId}`;
    link.textContent = lines[lineId].name.en || lines[lineId].name.ja;
    option.appendChild(link);
    list.appendChild(option);
  });
  return list;
}

function setupToggle(lines, missing) {
  const all = document.querySelector('.btn-all');
  const odpt = document.querySelector('.btn-odpt');
  all.addEventListener('click', () => {
    render(lines);
  });
  odpt.addEventListener('click', () => {
    renderMissing(lines, missing);
  });
  renderMissing(lines, missing);
}

function renderMissing(lines, missing) {
  const list = document.querySelector('.list');
  const frag = document.createDocumentFragment();
  const template = document.querySelector('#link-lines');
  
  missing.forEach((line) => {
    const clone = document.importNode(template.content, true);
    const name = clone.querySelector('.link-lines-name');
    const filter = clone.querySelector('.link-lines-filter');
    const results = clone.querySelector('.link-lines-results');
    const { en, ja } = line['odpt:railwayTitle'];
    filter.value = ja;
    connectSearch(filter, lines, results, line);
    name.textContent = `${en} - ${ja}`;
    frag.appendChild(clone);
  });
  list.innerHTML = '';
  list.appendChild(frag);
}

function connectSearch(filter, lines, results, missing) {
  const template = document.querySelector('#link-action');
  filter.addEventListener('input', (evt) => {
    const frag = document.createDocumentFragment();
    const search = evt.target.value;
    Object.entries(lines).filter(
      ([,line]) => line.name.ja.includes(search)
    ).forEach(([lineId, line]) => {
      const clone = document.importNode(template.content, true);
      clone.querySelector('.link-action-name').textContent = line.name.ja;
      clone.querySelector('.link-action-btn').addEventListener('click', linkListener(lineId, missing));
      frag.appendChild(clone);
    });
    results.innerHTML = '';
    results.appendChild(frag);
  });
}

function linkListener(lineId, missing) {
  return async () => {
    await fetch(CONNECT_ENDPOINT(lineId, missing['@id']), {
      method: 'PUT',
    });
  };
}