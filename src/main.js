/* globals L */
const LINES = '/node_modules/import-railway-stations/output/lines.json';

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
  const selectors = document.querySelector('#selectors');
  const list = createListOfLines(lines);
  selectors.appendChild(list);
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
}

function createListOfLines(lines) {
  const list = document.createElement('ul');
  Object.keys(lines).forEach((lineId) => {
    const option = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${lineId}`;
    link.textContent = lines[lineId].name.ja;
    option.appendChild(link);
    list.appendChild(option);
  });
  return list;
}
