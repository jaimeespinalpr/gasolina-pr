// ==========================================
// GasolinaPR - Core Logic & State Management
// ==========================================

// --- State ---
let searchQuery = '';
let selectedMunicipality = '';
let selectedBrand = '';
let stations = [];
let lastActiveSection = 'dashboard';
let selectedPhotoUrl = null; // Track loaded evidence photo URL

// --- Build / Live Refresh ---
const APP_BUILD_VERSION = '2026-06-01T16:04:20Z';
const LIVE_RELOAD_POLL_MS = 15000;
const DEFAULT_DACO_DATA = {
  source_url: 'https://www.daco.pr.gov/',
  official_page_updated_at: '1 de junio de 2026',
  last_scraped_at: APP_BUILD_VERSION,
  prices: {
    regular: { low: 105.7, high: 109.7, mid: 107.7 },
    premium: { low: 115.7, high: 126.7, mid: 121.2 },
    diesel: { low: 117.7, high: 126.7, mid: 122.2 }
  },
  history: []
};
let dacoData = JSON.parse(JSON.stringify(DEFAULT_DACO_DATA));

// --- Conversion Factor ---
const LITERS_PER_GALLON = 3.78541;

// --- DACO Official Maximum Limits (¢/L) ---
const DACO_MAX_LIMITS = {
  regular: 111.7,
  premium: 128.7,
  diesel: 128.7
};

// --- Previous-Day Reference Prices for Trend Arrows ---
const stationPreviousPrices = {
  'st-1': { regular: 109.1, premium: 120.1, diesel: 120.4 },
  'st-2': { regular: 107.9, premium: 117.1, diesel: 120.2 },
  'st-3': { regular: 110.1, premium: 122.2, diesel: 121.0 },
  'st-4': { regular: 108.3, premium: 115.5, diesel: 120.1 },
  'st-5': { regular: 110.2, premium: 124.4, diesel: 123.0 },
  'st-6': { regular: 109.9, premium: 122.4, diesel: 120.9 },
  'st-7': { regular: 107.5, premium: 118.0, diesel: 119.4 },
  'st-8': { regular: 110.3, premium: 124.2, diesel: 122.0 },
  'st-9': { regular: 108.9, premium: 119.0, diesel: 120.5 },
  'st-10': { regular: 108.9, premium: 121.0, diesel: 121.3 },
  'st-11': { regular: 108.0, premium: 118.2, diesel: 120.1 },
  'st-12': { regular: 110.2, premium: 123.9, diesel: 122.5 },
  'st-13': { regular: 112.0, premium: 126.0, diesel: 124.2 },
  'st-14': { regular: 107.5, premium: 121.2, diesel: 120.4 },
  'st-15': { regular: 111.1, premium: 129.1, diesel: 127.0 }
};

const wholesalersPreviousPrices = {
  American: { regular: 108.1, premium: 116.0, diesel: 120.2 },
  '76': { regular: 108.0, premium: 121.3, diesel: 120.0 },
  Gulf: { regular: 109.0, premium: 122.4, diesel: 120.4 },
  Phillips: { regular: 107.4, premium: 121.0, diesel: 122.0 },
  Sunoco: { regular: 110.2, premium: 128.4, diesel: 128.1 },
  Puma: { regular: 109.4, premium: 123.3, diesel: 121.0 },
  Total: { regular: 110.2, premium: 124.5, diesel: 122.3 },
  Ecomaxx: { regular: 109.0, premium: 118.3, diesel: 120.5 }
};

// --- Seed Data: Official Wholesalers (DACO May 29, 2026) ---
const wholesalersData = [
  { name: 'American', regular: 107.7, premium: 115.7, diesel: 120.7 },
  { name: '76', regular: 107.7, premium: 121.7, diesel: 120.7 },
  { name: 'Gulf', regular: 108.7, premium: 122.7, diesel: 120.7 },
  { name: 'Phillips', regular: 107.7, premium: 121.7, diesel: 122.7 },
  { name: 'Sunoco', regular: 110.7, premium: 128.7, diesel: 128.7 },
  { name: 'Puma', regular: 109.7, premium: 123.7, diesel: 121.7 },
  { name: 'Total', regular: 110.7, premium: 124.7, diesel: 122.7 },
  { name: 'Ecomaxx', regular: 108.7, premium: 118.7, diesel: 120.7 }
];

// --- Seed Data: Gas Stations in Puerto Rico (mapped with GPS Coordinates) ---
const defaultStations = [
  {
    id: 'st-1',
    name: 'Puma Ave. Esmeralda',
    brand: 'Puma',
    municipality: 'Guaynabo',
    address: 'Ave. Esmeralda #42',
    prices: { regular: 108.7, premium: 119.7, diesel: 120.7 },
    reportedAt: 'Hace 2 horas',
    isCommunity: false,
    coords: { lat: 18.3789, lon: -66.1112 }
  },
  {
    id: 'st-2',
    name: 'Gulf Los Filtros',
    brand: 'Gulf',
    municipality: 'Bayamón',
    address: 'Carr. 177 Km 3.2',
    prices: { regular: 107.7, premium: 116.7, diesel: 119.7 },
    reportedAt: 'Hace 1 hora',
    isCommunity: false,
    coords: { lat: 18.3812, lon: -66.1287 }
  },
  {
    id: 'st-3',
    name: 'Total San Patricio',
    brand: 'Total',
    municipality: 'Guaynabo',
    address: 'Roosevelt Esq. San Patricio',
    prices: { regular: 109.7, premium: 122.7, diesel: 121.7 },
    reportedAt: 'Hace 3 horas',
    isCommunity: false,
    coords: { lat: 18.4110, lon: -66.0968 }
  },
  {
    id: 'st-4',
    name: 'Ecomaxx Montehiedra',
    brand: 'Ecomaxx',
    municipality: 'San Juan',
    address: 'Carr. 176, Río Piedras',
    prices: { regular: 107.9, premium: 115.9, diesel: 119.9 },
    reportedAt: 'Hace 4 horas',
    isCommunity: false,
    coords: { lat: 18.3615, lon: -66.0792 }
  },
  {
    id: 'st-5',
    name: 'Shell Roosevelt',
    brand: 'Shell',
    municipality: 'San Juan',
    address: 'Ave. Roosevelt #382',
    prices: { regular: 110.7, premium: 124.7, diesel: 122.7 },
    reportedAt: 'Hace 5 horas',
    isCommunity: false,
    coords: { lat: 18.4234, lon: -66.0754 }
  },
  {
    id: 'st-6',
    name: 'Puma Las Cumbres',
    brand: 'Puma',
    municipality: 'San Juan',
    address: 'Ave. Las Cumbres #105',
    prices: { regular: 109.7, premium: 122.7, diesel: 120.7 },
    reportedAt: 'Hace 30 mins',
    isCommunity: false,
    coords: { lat: 18.3712, lon: -66.0888 }
  },
  {
    id: 'st-7',
    name: 'Gulf Ave. Piñero',
    brand: 'Gulf',
    municipality: 'San Juan',
    address: 'Ave. Central Esq. Piñero',
    prices: { regular: 107.7, premium: 117.7, diesel: 119.7 },
    reportedAt: 'Hace 6 horas',
    isCommunity: false,
    coords: { lat: 18.4145, lon: -66.0694 }
  },
  {
    id: 'st-8',
    name: 'Total Rexville',
    brand: 'Total',
    municipality: 'Bayamón',
    address: 'Carr. 167 Km 15.2',
    prices: { regular: 110.7, premium: 124.7, diesel: 122.7 },
    reportedAt: 'Hace 12 horas',
    isCommunity: false,
    coords: { lat: 18.3745, lon: -66.1712 }
  },
  {
    id: 'st-9',
    name: 'Ecomaxx Las Catalinas',
    brand: 'Ecomaxx',
    municipality: 'Caguas',
    address: 'Ave. Luis Muñoz Marín',
    prices: { regular: 108.7, premium: 118.7, diesel: 120.7 },
    reportedAt: 'Hace 7 horas',
    isCommunity: false,
    coords: { lat: 18.2324, lon: -66.0468 }
  },
  {
    id: 'st-10',
    name: 'Puma Ponce ByPass',
    brand: 'Puma',
    municipality: 'Ponce',
    address: 'Ponce ByPass, Ave. Tito Castro',
    prices: { regular: 108.7, premium: 120.7, diesel: 120.7 },
    reportedAt: 'Hace 8 horas',
    isCommunity: false,
    coords: { lat: 18.0124, lon: -66.5987 }
  },
  {
    id: 'st-11',
    name: 'Gulf Carr. 2',
    brand: 'Gulf',
    municipality: 'Mayagüez',
    address: 'Carr. #2 Km 114.5',
    prices: { regular: 107.9, premium: 117.9, diesel: 119.9 },
    reportedAt: 'Hace 9 horas',
    isCommunity: false,
    coords: { lat: 18.2145, lon: -67.1412 }
  },
  {
    id: 'st-12',
    name: 'Total Los Colobos',
    brand: 'Total',
    municipality: 'Carolina',
    address: 'Ave. 65 de Infantería',
    prices: { regular: 110.7, premium: 123.7, diesel: 122.7 },
    reportedAt: 'Hace 10 horas',
    isCommunity: false,
    coords: { lat: 18.3812, lon: -65.9687 }
  },
  {
    id: 'st-13',
    name: 'Shell Dorado Reef',
    brand: 'Shell',
    municipality: 'Dorado',
    address: 'Carr. 693 Km 8.5',
    prices: { regular: 111.7, premium: 126.7, diesel: 123.7 },
    reportedAt: 'Hace 1 hora',
    isCommunity: false,
    coords: { lat: 18.4712, lon: -66.2754 }
  },
  {
    id: 'st-14',
    name: 'Mobil Carr. 129',
    brand: 'Mobil',
    municipality: 'Arecibo',
    address: 'Carr. 129 Km 4.2',
    prices: { regular: 107.7, premium: 121.7, diesel: 120.7 },
    reportedAt: 'Hace 23 horas',
    isCommunity: false,
    coords: { lat: 18.4512, lon: -66.7412 }
  },
  {
    id: 'st-15',
    name: 'Sunoco Humacao Centro',
    brand: 'Sunoco',
    municipality: 'Humacao',
    address: 'Ave. Font Martelo #115',
    prices: { regular: 110.7, premium: 128.7, diesel: 126.7 },
    reportedAt: 'Hace 1 día',
    isCommunity: false,
    coords: { lat: 18.1512, lon: -65.8287 }
  }
];

// --- Historical Prices (Past 4 Weeks) ---
const priceHistory = [
  { week: 'W1', regular: 106.5, premium: 118.5, diesel: 117.5 },
  { week: 'W2', regular: 108.2, premium: 120.2, diesel: 119.2 },
  { week: 'W3', regular: 109.5, premium: 121.5, diesel: 122.5 },
  { week: 'Today', regular: 109.1, premium: 122.2, diesel: 121.2 }
];

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  initTheme(); // Set up light/dark mode preference immediately
  loadStations();
  await loadDacoData();
  renderDashboard();
  renderWholesalers();
  renderStationsGrid();
  populateStationSelects();
  renderSVGChart();
  startLiveReloadWatcher();
  
  // Set up default values in converter
  document.getElementById('calc-liters').value = 40;
  convertLitersToGallons(40);

  // Set up Hash-based routing to support browser/mobile back buttons
  window.addEventListener('hashchange', handleHashRouting);
  
  // Trigger initial routing
  handleHashRouting();
});

// --- Hash-based Routing Handler ---
function handleHashRouting() {
  const hash = window.location.hash || '#/dashboard';
  
  if (hash === '#/directory') {
    lastActiveSection = 'directory';
    closeReportModal(false);
    navigateTo('directory', false);
  } else if (hash === '#/calculators') {
    lastActiveSection = 'calculators';
    closeReportModal(false);
    navigateTo('calculators', false);
  } else if (hash === '#/denuncia') {
    openReportModal(false);
  } else {
    lastActiveSection = 'dashboard';
    closeReportModal(false);
    navigateTo('dashboard', false);
  }
}

// --- Load Stations from LocalStorage or Seed ---
function loadStations() {
  const stored = localStorage.getItem('gasolinapr_stations');
  if (stored) {
    stations = JSON.parse(stored);
  } else {
    stations = [...defaultStations];
    localStorage.setItem('gasolinapr_stations', JSON.stringify(stations));
  }
}

// --- Navigation Management ---
function navigateTo(sectionId, updateHash = true) {
  if (updateHash) {
    window.location.hash = `#/${sectionId}`;
    return;
  }
  
  // Hide all sections
  document.querySelectorAll('.app-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show target section
  const target = document.getElementById(`${sectionId}-section`);
  if (target) {
    target.classList.add('active');
  }
  
  // Update desktop sidebar highlighting
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.getElementById(`nav-${sectionId}`);
  if (activeLink) activeLink.classList.add('active');

  // Update mobile bottom nav highlighting
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeMobileLink = document.getElementById(`m-nav-${sectionId}`);
  if (activeMobileLink) activeMobileLink.classList.add('active');

  // Update header title based on section
  const titleText = document.getElementById('page-title-text');
  const subtitleText = document.getElementById('page-subtitle-text');
  
  if (sectionId === 'dashboard') {
    titleText.textContent = 'Precios de Combustible';
    subtitleText.textContent = 'Monitoreo oficial y comunitario en Puerto Rico · Se actualiza 3 veces al día';
  } else if (sectionId === 'directory') {
    titleText.textContent = 'Precios en Bomba';
    subtitleText.textContent = 'Visualiza los precios and actualiza la bomba en tiempo real · Se actualiza 3 veces al día';
    
    // Automatically trigger proximity scan on navigation
    autoSortStationsByProximity();
  } else if (sectionId === 'calculators') {
    titleText.textContent = 'Herramientas de Ahorro';
    subtitleText.textContent = 'Calcula costos de llenado y convierte medidas al instante';
  }

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Formatting Helpers (Always in Liters) ---
function formatPrice(priceInCentsL) {
  return `$${(priceInCentsL / 100).toFixed(3)}`;
}

function getUnitLabel() {
  return '/L';
}

function getTrendMeta(current, previous) {
  if (typeof current !== 'number' || typeof previous !== 'number') {
    return {
      direction: 'stable',
      icon: '→',
      label: 'Sin cambio',
      title: 'Sin referencia previa'
    };
  }

  const delta = current - previous;
  const deltaAbsVal = Math.abs(delta) / 100;
  const formattedDelta = `$${deltaAbsVal.toFixed(2)}`;

  if (delta > 0) {
    return {
      direction: 'up',
      icon: '↗',
      label: `Subió ${formattedDelta}`,
      title: `Subió ${formattedDelta} vs. ayer`
    };
  }

  if (delta < 0) {
    return {
      direction: 'down',
      icon: '↘',
      label: `Bajó ${formattedDelta}`,
      title: `Bajó ${formattedDelta} vs. ayer`
    };
  }

  return {
    direction: 'stable',
    icon: '→',
    label: 'Sin cambio',
    title: 'Sin cambio vs. ayer'
  };
}

function renderTrendChip(current, previous) {
  const trend = getTrendMeta(current, previous);
  return `<span class="price-trend-chip ${trend.direction}" title="${trend.title}"><span class="trend-arrow">${trend.icon}</span><span>${trend.label}</span></span>`;
}

function getStationPreviousPrice(stationId, fuelKey) {
  return stationPreviousPrices[stationId]?.[fuelKey];
}

function getWholesalerPreviousPrice(brand, fuelKey) {
  return wholesalersPreviousPrices[brand]?.[fuelKey];
}

function updateTrendIndicator(prefix, current, previous) {
  const trend = getTrendMeta(current, previous);
  const indicator = document.getElementById(`trend-${prefix}-indicator`);
  const icon = document.getElementById(`trend-${prefix}-icon`);
  const text = document.getElementById(`trend-${prefix}-text`);

  if (indicator) {
    indicator.classList.remove('trend-up', 'trend-down', 'trend-stable');
    indicator.classList.add(`trend-${trend.direction}`);
    indicator.title = trend.title;
  }
  if (icon) icon.textContent = trend.icon;
  if (text) text.textContent = trend.label;
}

function normalizeDacoData(raw) {
  if (!raw || typeof raw !== 'object') return JSON.parse(JSON.stringify(DEFAULT_DACO_DATA));
  const merged = JSON.parse(JSON.stringify(DEFAULT_DACO_DATA));
  merged.source_url = raw.source_url || merged.source_url;
  merged.official_page_updated_at = raw.official_page_updated_at || merged.official_page_updated_at;
  merged.last_scraped_at = raw.last_scraped_at || raw.updated_at || merged.last_scraped_at;
  merged.prices = raw.prices || merged.prices;
  merged.history = Array.isArray(raw.history) ? raw.history : merged.history;
  return merged;
}

async function loadDacoData() {
  try {
    const response = await fetch(`daco-data.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return dacoData;
    dacoData = normalizeDacoData(await response.json());
  } catch (error) {
    dacoData = JSON.parse(JSON.stringify(DEFAULT_DACO_DATA));
  }
  return dacoData;
}

function getTrendSeries() {
  if (Array.isArray(dacoData?.history) && dacoData.history.length >= 2) {
    return dacoData.history.map(entry => ({
      regular: entry.mid?.regular,
      premium: entry.mid?.premium,
      diesel: entry.mid?.diesel
    }));
  }
  return priceHistory;
}

async function checkForRemoteBuildUpdate() {
  try {
    const [jsResponse, dataResponse] = await Promise.all([
      fetch(`index.js?ts=${Date.now()}`, { cache: 'no-store' }),
      fetch(`daco-data.json?ts=${Date.now()}`, { cache: 'no-store' })
    ]);

    let shouldReload = false;

    if (jsResponse.ok) {
      const remoteJs = await jsResponse.text();
      const match = remoteJs.match(/const APP_BUILD_VERSION = ['\"]([^'\"]+)['\"]/);
      const remoteVersion = match && match[1];
      if (remoteVersion && remoteVersion !== APP_BUILD_VERSION) {
        shouldReload = true;
      }
    }

    if (dataResponse.ok) {
      const remoteData = await dataResponse.json();
      const remoteDataVersion = remoteData.last_scraped_at || remoteData.updated_at;
      if (remoteDataVersion && remoteDataVersion !== dacoData.last_scraped_at) {
        shouldReload = true;
      }
    }

    if (shouldReload) {
      window.location.reload();
    }
  } catch (error) {
    // Silent by design: if the check fails, the app still works normally.
  }
}

function startLiveReloadWatcher() {
  if (window.__gasolinaPrLiveReloadStarted) return;
  window.__gasolinaPrLiveReloadStarted = true;
  setInterval(checkForRemoteBuildUpdate, LIVE_RELOAD_POLL_MS);
}

// --- Calculate Average Fuel Prices ---
function getAverages() {
  if (stations.length === 0) return { regular: 0, premium: 0, diesel: 0 };
  
  const sums = stations.reduce((acc, station) => {
    acc.regular += station.prices.regular;
    acc.premium += station.prices.premium;
    acc.diesel += station.prices.diesel;
    return acc;
  }, { regular: 0, premium: 0, diesel: 0 });
  
  return {
    regular: sums.regular / stations.length,
    premium: sums.premium / stations.length,
    diesel: sums.diesel / stations.length
  };
}

// --- Render Dashboard UI ---
function renderDashboard() {
  // Render DACO Ranges (Litro) in Dollars
  const currentPrices = dacoData?.prices || DEFAULT_DACO_DATA.prices;
  
  const regLow = (currentPrices.regular.low / 100).toFixed(3);
  const regHigh = (currentPrices.regular.high / 100).toFixed(3);
  const premLow = (currentPrices.premium.low / 100).toFixed(3);
  const premHigh = (currentPrices.premium.high / 100).toFixed(3);
  const dslLow = (currentPrices.diesel.low / 100).toFixed(3);
  const dslHigh = (currentPrices.diesel.high / 100).toFixed(3);

  document.getElementById('range-regular-display').textContent = `$${regLow} - $${regHigh}`;
  document.getElementById('range-premium-display').textContent = `$${premLow} - $${premHigh}`;
  document.getElementById('range-diesel-display').textContent = `$${dslLow} - $${dslHigh}`;

  const badgeStatus = document.getElementById('daco-badge-status');
  if (badgeStatus) {
    badgeStatus.textContent = `Actualizado: ${dacoData?.official_page_updated_at || DEFAULT_DACO_DATA.official_page_updated_at}`;
  }

  const trendSeries = getTrendSeries();
  const latestHistory = trendSeries[trendSeries.length - 1];
  const previousHistory = trendSeries[trendSeries.length - 2] || latestHistory;

  updateTrendIndicator('regular', latestHistory.regular, previousHistory.regular);
  updateTrendIndicator('premium', latestHistory.premium, previousHistory.premium);
  updateTrendIndicator('diesel', latestHistory.diesel, previousHistory.diesel);
}

// --- Render Wholesalers List (Vertical Cards) ---
function renderWholesalers() {
  const container = document.getElementById('wholesalers-vertical-container');
  if (!container) return;
  container.innerHTML = '';
  
  wholesalersData.forEach(row => {
    const card = document.createElement('div');
    card.className = 'wholesaler-vertical-card';
    
    // Get color indicator
    const colorHash = stringToHsl(row.name);
    
    card.innerHTML = `
      <div class="wholesaler-brand-info">
        <div class="brand-dot" style="background-color: ${colorHash};"></div>
        <strong>${row.name}</strong>
      </div>
      <div class="wholesaler-prices-group">
        <div class="wholesaler-price-item">
          <span>Reg</span>
          <div class="price-value-stack">
            <strong class="price-value">${formatPrice(row.regular)}</strong>
            ${renderTrendChip(row.regular, getWholesalerPreviousPrice(row.name, 'regular'))}
          </div>
        </div>
        <div class="wholesaler-price-item">
          <span>Prem</span>
          <div class="price-value-stack">
            <strong class="price-value">${formatPrice(row.premium)}</strong>
            ${renderTrendChip(row.premium, getWholesalerPreviousPrice(row.name, 'premium'))}
          </div>
        </div>
        <div class="wholesaler-price-item">
          <span>Dsl</span>
          <div class="price-value-stack">
            <strong class="price-value">${formatPrice(row.diesel)}</strong>
            ${renderTrendChip(row.diesel, getWholesalerPreviousPrice(row.name, 'diesel'))}
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Helper to generate distinct harmonious colors for brands
function stringToHsl(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 55%)`;
}

// --- Render Stations Grid ---
function renderStationsGrid() {
  const container = document.getElementById('stations-grid-container');
  container.innerHTML = '';
  
  const filtered = getFilteredStations();
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 48px; height: 48px; margin: 0 auto 1rem auto; stroke: var(--text-muted);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; font-family: var(--font-title);">No se encontraron gasolineras</h3>
        <p style="font-size: 0.85rem;">Prueba cambiando los términos de búsqueda o filtros seleccionados.</p>
      </div>
    `;
    return;
  }
  
  // Find cheapest station for regular to highlight
  const cheapestReg = Math.min(...filtered.map(s => s.prices.regular));

  filtered.forEach(station => {
    const card = document.createElement('div');
    card.className = 'station-card';
    card.id = `card-${station.id}`;
    
    const isCheapest = station.prices.regular === cheapestReg;
    const cheapestBadge = isCheapest ? `<span class="fuel-badge" style="background-color: var(--color-regular-glow); color: var(--color-regular); font-size: 0.65rem; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">Más Barata</span>` : '';
    
    const distanceBadge = (station.distanceMeters && station.distanceMeters !== Infinity) ? 
      `<span class="fuel-badge" style="background-color: rgba(99, 102, 241, 0.15); color: #a5b4fc; font-size: 0.65rem; padding: 0.25rem 0.5rem; margin-left: 0.25rem;">📍 a ${(station.distanceMeters / 1000).toFixed(1)} km</span>` : '';
    
    // Check if any price exceeds DACO Maximum limits
    const violatesRegular = station.prices.regular > DACO_MAX_LIMITS.regular;
    const violatesPremium = station.prices.premium > DACO_MAX_LIMITS.premium;
    const violatesDiesel = station.prices.diesel > DACO_MAX_LIMITS.diesel;
    const hasViolation = violatesRegular || violatesPremium || violatesDiesel;

    let violationAlertHtml = '';
    if (hasViolation) {
      let infractions = [];
      if (violatesRegular) infractions.push(`Regular excede por ${(station.prices.regular - DACO_MAX_LIMITS.regular).toFixed(1)}¢ (Límite: ${DACO_MAX_LIMITS.regular}¢)`);
      if (violatesPremium) infractions.push(`Premium excede por ${(station.prices.premium - DACO_MAX_LIMITS.premium).toFixed(1)}¢ (Límite: ${DACO_MAX_LIMITS.premium}¢)`);
      if (violatesDiesel) infractions.push(`Diésel excede por ${(station.prices.diesel - DACO_MAX_LIMITS.diesel).toFixed(1)}¢ (Límite: ${DACO_MAX_LIMITS.diesel}¢)`);
      
      violationAlertHtml = `
        <div class="station-violation-alert">
          <div class="violation-title">
            <svg style="width:14px; height:14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            LÍMITE EXCEDIDO (DACO)
          </div>
          <div class="violation-desc">${infractions.join('<br>')}</div>
        </div>
      `;
    }

    const brandClass = station.brand.toLowerCase().replace(/\s/g, '');
    const firstLetter = station.brand.charAt(0).toUpperCase();

    card.innerHTML = `
      <div class="station-header">
        <div class="station-brand-group">
          <div class="station-brand-icon ${brandClass}">${firstLetter}</div>
          <div>
            <div class="station-title" style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem;">${station.name} ${cheapestBadge} ${distanceBadge}</div>
            <div class="station-meta" style="margin-bottom: 0;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span>${station.municipality} ${station.address ? `• ${station.address}` : ''}</span>
            </div>
            <!-- ACTUALIZAR BUTTON RIGHT BELOW THE NAME/METADATA -->
            <button class="btn-card-action" onclick="toggleInlineEditor('${station.id}')" style="margin-top: 0.5rem; padding: 0.35rem 0.75rem; font-size: 0.7rem; border: none; color: white; background: #111111; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.25rem; transition: var(--transition-fast);">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="width:10px; height:10px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>
      
      ${violationAlertHtml}
      
      <!-- HIDDEN CAMERA INPUT AND SCANNER OVERLAY -->
      <input type="file" id="camera-${station.id}" accept="image/*" capture="environment" style="display: none;" onchange="processPumpPhoto('${station.id}', event)">
      <div id="scanner-${station.id}" class="station-violation-alert" style="display: none; background: rgba(99, 102, 241, 0.1); border-color: var(--color-accent); color: var(--color-accent); animation: pulse 1.5s infinite; text-align: center; margin-top: 0.75rem; border-radius: 12px; padding: 0.75rem;">
        <div class="violation-title" style="justify-content: center; color: var(--color-accent); font-weight: 800; font-size: 0.65rem;">
          🤖 ESCANEANDO LETRERO/PANTALLA CON IA...
        </div>
        <div class="violation-desc" style="font-size: 0.6rem; font-weight: bold; margin-top: 0.2rem; color: var(--text-secondary);">
          Analizando foto y ubicación GPS en tiempo real para calibrar bomba
        </div>
      </div>
      
      <table class="station-prices-table" style="margin-top: 1rem;">
        <tbody>
          <tr>
            <td>
              <div class="price-type">
                <div class="price-type-dot regular"></div> Regular
              </div>
            </td>
            <td>
              <div class="price-value-stack">
                <strong class="price-value ${isCheapest ? 'cheap' : ''} ${violatesRegular ? 'danger' : ''}">${formatPrice(station.prices.regular)}</strong>
                ${renderTrendChip(station.prices.regular, getStationPreviousPrice(station.id, 'regular'))}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="price-type">
                <div class="price-type-dot premium"></div> Premium
              </div>
            </td>
            <td>
              <div class="price-value-stack">
                <strong class="price-value ${violatesPremium ? 'danger' : ''}">${formatPrice(station.prices.premium)}</strong>
                ${renderTrendChip(station.prices.premium, getStationPreviousPrice(station.id, 'premium'))}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="price-type">
                <div class="price-type-dot diesel"></div> Diésel
              </div>
            </td>
            <td>
              <div class="price-value-stack">
                <strong class="price-value ${violatesDiesel ? 'danger' : ''}">${formatPrice(station.prices.diesel)}</strong>
                ${renderTrendChip(station.prices.diesel, getStationPreviousPrice(station.id, 'diesel'))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="station-footer" style="padding-bottom: 1rem;">
        <div class="station-reported-badge">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${station.reportedAt}</span>
        </div>
        ${station.isCommunity ? `<span style="color: var(--color-accent); font-weight: 600; font-size: 0.7rem;">Comunidad</span>` : `<span style="color: var(--text-muted); font-size: 0.7rem;">Verificado</span>`}
      </div>

      <!-- COLLAPSIBLE RAPID INLINE PRICE EDITOR -->
      <div class="inline-price-editor" id="editor-${station.id}" style="display:none; margin-top: 0.5rem; border-top: 1px dashed var(--border-color); padding-top: 1rem; margin-bottom: 1rem;">
        <h4 style="font-size:0.75rem; font-family:var(--font-title); color:var(--text-secondary); margin-bottom:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Actualización Rápida ($/Litro)</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem; margin-bottom:0.75rem;">
          <div>
            <label style="font-size:0.6rem; color:var(--color-regular); font-weight:700; display:block; margin-bottom:0.25rem; text-transform:uppercase;">Regular</label>
            <input type="number" step="0.01" class="form-control" id="inline-reg-${station.id}" value="${(station.prices.regular / 100).toFixed(3)}" onblur="sanitizeInlinePriceInput(this)" style="padding:0.4rem 0.5rem; padding-left:0.5rem; font-size:0.85rem; text-align:center;">
          </div>
          <div>
            <label style="font-size:0.6rem; color:var(--color-premium); font-weight:700; display:block; margin-bottom:0.25rem; text-transform:uppercase;">Premium</label>
            <input type="number" step="0.01" class="form-control" id="inline-prem-${station.id}" value="${(station.prices.premium / 100).toFixed(3)}" onblur="sanitizeInlinePriceInput(this)" style="padding:0.4rem 0.5rem; padding-left:0.5rem; font-size:0.85rem; text-align:center;">
          </div>
          <div>
            <label style="font-size:0.6rem; color:var(--color-diesel); font-weight:700; display:block; margin-bottom:0.25rem; text-transform:uppercase;">Diésel</label>
            <input type="number" step="0.01" class="form-control" id="inline-dsl-${station.id}" value="${(station.prices.diesel / 100).toFixed(3)}" onblur="sanitizeInlinePriceInput(this)" style="padding:0.4rem 0.5rem; padding-left:0.5rem; font-size:0.85rem; text-align:center;">
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-card-action" onclick="toggleInlineEditor('${station.id}')" style="flex:1; padding:0.4rem 0.5rem;">Cancelar</button>
          <button class="btn-primary" onclick="saveInlinePrices('${station.id}')" style="flex:2; padding:0.4rem 0.75rem; font-size:0.75rem; justify-content:center;">Guardar</button>
        </div>
      </div>

      <!-- BOTTOM CARD ACTIONS WRAPPER (TOMAR FOTO AT THE BOTTOM) -->
      <div class="card-actions-wrapper ${hasViolation ? 'double' : 'single'}" id="actions-container-${station.id}" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
        ${hasViolation ? `<button class="btn-card-action danger" onclick="openComplaintModal('${station.id}')">Radicar Querella</button>` : ''}
        <button class="btn-card-action" onclick="triggerCamera('${station.id}')" id="btn-camera-${station.id}" style="background: rgba(16, 185, 129, 0.08); border-color: var(--color-regular); color: var(--color-regular); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.35rem; transition: var(--transition-fast);">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="width:14px; height:14px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Tomar Foto
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// --- Toggle Collapsible Price Editor ---
function toggleInlineEditor(stationId) {
  const editor = document.getElementById(`editor-${stationId}`);
  const actions = document.getElementById(`actions-container-${stationId}`);
  
  if (editor.style.display === 'none') {
    // Hide all other active editors first to keep layout clean
    document.querySelectorAll('.inline-price-editor').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.card-actions-wrapper').forEach(el => {
      el.style.display = 'grid';
    });
    
    editor.style.display = 'block';
    actions.style.display = 'none'; // Temporarily hide the card actions
    
    // Focus the first input (regular)
    document.getElementById(`inline-reg-${stationId}`).focus();
  } else {
    editor.style.display = 'none';
    actions.style.display = 'grid';
  }
}

// --- Save Prices from Inline Card Editor ---
function saveInlinePrices(stationId) {
  let valReg = parseFloat(document.getElementById(`inline-reg-${stationId}`).value);
  let valPrem = parseFloat(document.getElementById(`inline-prem-${stationId}`).value);
  let valDsl = parseFloat(document.getElementById(`inline-dsl-${stationId}`).value);
  
  if (isNaN(valReg) || isNaN(valPrem) || isNaN(valDsl)) {
    showToast('Por favor, ingresa precios numéricos válidos en bomba.', 'error');
    return;
  }
  
  // Convert using the robust sanitization function to cents
  const priceReg = sanitizePriceToCents(valReg);
  const pricePrem = sanitizePriceToCents(valPrem);
  const priceDsl = sanitizePriceToCents(valDsl);
  
  const index = stations.findIndex(s => s.id === stationId);
  if (index !== -1) {
    stations[index].prices = { regular: priceReg, premium: pricePrem, diesel: priceDsl };
    stations[index].reportedAt = 'Actualizado hace unos instantes';
    stations[index].isCommunity = true;
    
    localStorage.setItem('gasolinapr_stations', JSON.stringify(stations));
    
    // Refresh GUI
    renderDashboard();
    renderStationsGrid();
    populateStationSelects();
    
    showToast(`¡Bomba de ${stations[index].name} actualizada en vivo!`, 'success');
  }
}

// --- Get Filtered Stations List ---
function getFilteredStations() {
  return stations.filter(station => {
    const matchesSearch = searchQuery === '' || 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesMuni = selectedMunicipality === '' || 
      station.municipality.toLowerCase() === selectedMunicipality.toLowerCase();
      
    const matchesBrand = selectedBrand === '' || 
      station.brand.toLowerCase().startsWith(selectedBrand.toLowerCase().substring(0, 4));
      
    return matchesSearch && matchesMuni && matchesBrand;
  });
}

// --- Filter Event Handlers ---
function filterStations() {
  searchQuery = document.getElementById('search-query').value;
  selectedMunicipality = document.getElementById('filter-municipality').value;
  selectedBrand = document.getElementById('filter-brand').value;
  renderStationsGrid();
}

// --- Populate Calculator Selects ---
function populateStationSelects() {
  const select = document.getElementById('calc-station-select');
  if (!select) return;
  select.innerHTML = '';
  
  stations.forEach(station => {
    const opt = document.createElement('option');
    opt.value = station.id;
    opt.textContent = `${station.name} (${station.municipality})`;
    select.appendChild(opt);
  });
  
  calculateTankFill();
}

// --- Interactive Conversions ---
function convertLitersToGallons(val) {
  const liters = parseFloat(val) || 0;
  const gallons = liters / LITERS_PER_GALLON;
  
  // Update gallons input (but avoid loop trigger if focused)
  if (document.activeElement !== document.getElementById('calc-gallons')) {
    document.getElementById('calc-gallons').value = gallons > 0 ? gallons.toFixed(2) : '';
  }
  
  // Calculate average cost
  const avgs = getAverages();
  const cost = (liters * avgs.regular) / 100;
  
  document.getElementById('calc-conversion-summary').textContent = `$${cost.toFixed(2)}`;
}

function convertGallonsToLiters(val) {
  const gallons = parseFloat(val) || 0;
  const liters = gallons * LITERS_PER_GALLON;
  
  // Update liters input
  if (document.activeElement !== document.getElementById('calc-liters')) {
    document.getElementById('calc-liters').value = liters > 0 ? liters.toFixed(2) : '';
  }
  
  // Calculate average cost
  const avgs = getAverages();
  const cost = (liters * avgs.regular) / 100;
  
  document.getElementById('calc-conversion-summary').textContent = `$${cost.toFixed(2)}`;
}

// --- Fill Up Calculator Logic ---
function applyVehiclePreset(preset) {
  const input = document.getElementById('calc-tank-size');
  if (preset === 'small') {
    input.value = 11.5;
  } else if (preset === 'medium') {
    input.value = 14.5;
  } else if (preset === 'large') {
    input.value = 24.0;
  }
  calculateTankFill();
}

function calculateTankFill() {
  const tankSizeGal = parseFloat(document.getElementById('calc-tank-size').value) || 0;
  const fuelType = document.getElementById('calc-fuel-select').value;
  const stationId = document.getElementById('calc-station-select').value;
  
  if (tankSizeGal <= 0 || !stationId) return;
  
  // Convert tank size to liters since stations are stored in cents/L
  const tankSizeL = tankSizeGal * LITERS_PER_GALLON;
  
  const station = stations.find(s => s.id === stationId);
  if (!station) return;
  
  const stationPriceCents = station.prices[fuelType];
  const totalCost = (tankSizeL * stationPriceCents) / 100;
  
  // Calculate Savings vs. Island Average
  const avgs = getAverages();
  const avgPriceCents = avgs[fuelType];
  const averageCost = (tankSizeL * avgPriceCents) / 100;
  const totalSavings = averageCost - totalCost;
  
  // Render values
  document.getElementById('fill-cost-estimate').textContent = `$${totalCost.toFixed(2)}`;
  
  const savingsDisplay = document.getElementById('fill-savings-estimate');
  if (totalSavings > 0) {
    savingsDisplay.textContent = `$${totalSavings.toFixed(2)}`;
    savingsDisplay.style.color = 'var(--color-regular)';
  } else if (totalSavings < 0) {
    savingsDisplay.textContent = `+$${Math.abs(totalSavings).toFixed(2)}`;
    savingsDisplay.style.color = 'var(--color-danger)';
  } else {
    savingsDisplay.textContent = `$0.00`;
    savingsDisplay.style.color = 'var(--text-secondary)';
  }
}

// ==========================================
// GPS Geolocation Auto-Detection
// ==========================================
function detectGPSLocation() {
  const btn = document.getElementById('btn-gps-detect');
  const text = document.getElementById('gps-btn-text');
  const statusDiv = document.getElementById('gps-detection-status');
  
  btn.disabled = true;
  text.textContent = '📍 Escaneando satélites GPS...';
  statusDiv.style.display = 'none';
  
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        processCoordinates(lat, lon);
      },
      (error) => {
        // Fallback simulation if permission blocked or local context restrict
        console.warn(`Geolocation error: ${error.message}. Running robust mock GPS fallback...`);
        setTimeout(() => {
          // Simulate San Juan coordinate: 18.3750, -66.0850 (close to Puma Las Cumbres)
          processCoordinates(18.3720, -66.0890);
        }, 1200);
      },
      options
    );
  } else {
    // Geolocation not supported, fall back
    setTimeout(() => {
      processCoordinates(18.3720, -66.0890);
    }, 1000);
  }
}

// Process GPS Coordinates to find the closest seed station
function processCoordinates(lat, lon) {
  const btn = document.getElementById('btn-gps-detect');
  const text = document.getElementById('gps-btn-text');
  const statusDiv = document.getElementById('gps-detection-status');
  
  // Find station with minimum distance
  let minDistance = Infinity;
  let closestStation = null;
  
  stations.forEach(station => {
    if (station.coords) {
      // Euclidean distance mapping
      const distance = Math.sqrt(Math.pow(station.coords.lat - lat, 2) + Math.pow(station.coords.lon - lon, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = station;
      }
    }
  });
  
  // Restore button state
  btn.disabled = false;
  text.textContent = '📍 Auto-detectar Gasolinera por GPS';
  
  if (closestStation) {
    // Euclidean to approximate meters: 1 deg ~ 111.3 km
    const meters = Math.round(minDistance * 111.3 * 1000);
    
    // Auto fill form fields!
    document.getElementById('rep-station-name').value = closestStation.name;
    document.getElementById('rep-brand').value = closestStation.brand;
    document.getElementById('rep-municipality').value = closestStation.municipality;
    document.getElementById('rep-address').value = closestStation.address || '';
    
    // Pre-fill prices to make updates extremely fast!
    document.getElementById('rep-price-regular').value = closestStation.prices.regular;
    document.getElementById('rep-price-premium').value = closestStation.prices.premium;
    document.getElementById('rep-price-diesel').value = closestStation.prices.diesel;
    
    // Render status box
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = `
      📍 Estación Detectada: <strong>${closestStation.name}</strong><br>
      Municipio: ${closestStation.municipality} • Distancia: ~${meters} metros.<br>
      <span style="font-size:0.65rem; color:var(--text-muted);">¡Campos del formulario pre-seleccionados! Solo edita el precio si cambió.</span>
    `;
    
    showToast(`📍 Detectada: ${closestStation.name} (${meters}m)`, 'success');
  } else {
    // If no stations mapped, pick standard fallback
    showToast('No se encontraron gasolineras mapeadas cerca de ti.', 'error');
  }
}

// --- Modal Controls ---
let repSelectedPhotoUrl = null;

function previewEvidencePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showToast('Por favor, selecciona una imagen de evidencia válida.', 'error');
    return;
  }
  
  repSelectedPhotoUrl = URL.createObjectURL(file);
  document.getElementById('rep-photo-preview-img').src = repSelectedPhotoUrl;
  document.getElementById('rep-photo-preview-container').style.display = 'block';
  showToast('📷 Evidencia de bomba cargada correctamente.', 'success');
}

function openReportModal(updateHash = true) {
  if (updateHash) {
    window.location.hash = '#/denuncia';
    return;
  }
  document.querySelector('#report-modal .modal-title').textContent = 'Radicar Denuncia / Reporte';
  const modal = document.getElementById('report-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Clear form and photo previews
  document.getElementById('report-form').reset();
  repSelectedPhotoUrl = null;
  document.getElementById('rep-photo-preview-container').style.display = 'none';
  document.getElementById('rep-photo-preview-img').src = '';
  document.getElementById('gps-detection-status').style.display = 'none';
  
  // Auto-detect closest station using Geolocation
  if (navigator.geolocation) {
    document.getElementById('gps-detection-status').style.display = 'block';
    document.getElementById('gps-detection-status').style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
    document.getElementById('gps-detection-status').style.color = 'var(--text-secondary)';
    document.getElementById('gps-detection-status').textContent = '📍 Detectando ubicación actual por GPS...';
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Calculate distances to all stations and find closest
        let closestStation = null;
        let minDistance = Infinity;
        
        stations.forEach(station => {
          // Seed coordinates if missing
          let lat = station.latitude;
          let lng = station.longitude;
          if (!lat || !lng) {
            // Mock coordinates if not defined
            lat = 18.42;
            lng = -66.12;
          }
          
          // Distance calculation (Haversine)
          const R = 6371; // Earth radius in km
          const dLat = (lat - userLat) * Math.PI / 180;
          const dLng = (lng - userLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          if (distance < minDistance) {
            minDistance = distance;
            closestStation = station;
          }
        });
        
        if (closestStation) {
          document.getElementById('rep-station-name').value = closestStation.name;
          document.getElementById('rep-brand').value = closestStation.brand;
          document.getElementById('rep-municipality').value = closestStation.municipality;
          document.getElementById('rep-address').value = closestStation.address || '';
          document.getElementById('rep-price-regular').value = closestStation.prices.regular;
          document.getElementById('rep-price-premium').value = closestStation.prices.premium;
          document.getElementById('rep-price-diesel').value = closestStation.prices.diesel;
          
          document.getElementById('gps-detection-status').style.backgroundColor = 'var(--color-regular-glow)';
          document.getElementById('gps-detection-status').style.color = 'var(--color-regular)';
          document.getElementById('gps-detection-status').textContent = `📍 Ubicado en ${closestStation.name} (a ${minDistance.toFixed(2)} km) de forma automática por GPS.`;
        } else {
          document.getElementById('gps-detection-status').textContent = '⚠️ Ubicación obtenida, pero no se encontraron gasolineras mapeadas cerca.';
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        document.getElementById('gps-detection-status').style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
        document.getElementById('gps-detection-status').style.color = 'var(--color-danger)';
        document.getElementById('gps-detection-status').textContent = '⚠️ Permiso de GPS denegado. Por favor, selecciona tu gasolinera manualmente.';
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }
}

function closeReportModal(updateHash = true) {
  if (updateHash) {
    window.location.hash = `#/${lastActiveSection}`;
    return;
  }
  const modal = document.getElementById('report-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('report-form').reset();
  repSelectedPhotoUrl = null;
  document.getElementById('rep-photo-preview-container').style.display = 'none';
  document.getElementById('rep-photo-preview-img').src = '';
}

function handleReportSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('rep-station-name').value;
  const brand = document.getElementById('rep-brand').value;
  const municipality = document.getElementById('rep-municipality').value;
  const address = document.getElementById('rep-address').value;
  const rawPriceReg = parseFloat(document.getElementById('rep-price-regular').value);
  const rawPricePrem = parseFloat(document.getElementById('rep-price-premium').value);
  const rawPriceDsl = parseFloat(document.getElementById('rep-price-diesel').value);
  const violationDesc = document.getElementById('rep-violation-desc').value;
  
  // Basic validation
  if (!name || isNaN(rawPriceReg) || isNaN(rawPricePrem) || isNaN(rawPriceDsl)) {
    showToast('Por favor, llena todos los campos obligatorios correctamente.', 'error');
    return;
  }
  
  // Convert using the robust sanitization function to cents (ending in .7)
  const priceReg = sanitizePriceToCents(rawPriceReg);
  const pricePrem = sanitizePriceToCents(rawPricePrem);
  const priceDsl = sanitizePriceToCents(rawPriceDsl);
  
  // Try to find if station exists to update it, or add new one
  let station = stations.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (station) {
    station.prices.regular = priceReg;
    station.prices.premium = pricePrem;
    station.prices.diesel = priceDsl;
    station.reportedAt = 'Hace unos instantes';
    station.isCommunity = true;
  } else {
    station = {
      id: `custom-${Date.now()}`,
      name,
      brand,
      municipality,
      address,
      prices: {
        regular: priceReg,
        premium: pricePrem,
        diesel: priceDsl
      },
      reportedAt: 'Hace unos instantes',
      isCommunity: true
    };
    stations.unshift(station);
  }
  
  // Save updated stations to local storage
  localStorage.setItem('gasolinapr_stations', JSON.stringify(stations));
  
  // If they uploaded a photo and wrote a description, trigger DACO Querella/Receipt!
  if (repSelectedPhotoUrl && violationDesc.trim()) {
    const caseId = `Q-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Render details inside receipt modal
    document.getElementById('receipt-case-id').textContent = caseId;
    document.getElementById('receipt-date-field').textContent = `Fecha: ${new Date().toLocaleDateString('es-PR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    document.getElementById('receipt-stamp-time').textContent = `${new Date().toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} AST`;
    
    // Querellado
    document.getElementById('receipt-station-name').textContent = station.name;
    document.getElementById('receipt-station-brand').textContent = station.brand;
    document.getElementById('receipt-station-location').textContent = `${station.municipality}, ${station.address || 'Carretera Estatal'}`;
    
    // Infractions Table
    const tableBody = document.getElementById('receipt-infraction-table');
    tableBody.innerHTML = '';
    
    ['regular', 'premium', 'diesel'].forEach(fuel => {
      const price = station.prices[fuel];
      const limit = DACO_MAX_LIMITS[fuel];
      const exceeds = price > limit;
      
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #e2e8f0';
      tr.innerHTML = `
        <td style="padding: 0.6rem; font-weight: bold; text-transform: capitalize;">${fuel}</td>
        <td style="padding: 0.6rem; text-align: right;">${price.toFixed(1)}¢</td>
        <td style="padding: 0.6rem; text-align: right;">${limit.toFixed(1)}¢</td>
        <td style="padding: 0.6rem; text-align: right; font-weight: bold; color: ${exceeds ? '#ef4444' : '#64748b'};">
          ${exceeds ? `+${(price - limit).toFixed(1)}¢` : 'Estable'}
        </td>
      `;
      tableBody.appendChild(tr);
    });
    
    // Querellante info
    document.getElementById('receipt-user-name').textContent = 'Radicación Digital (GasolinaPR)';
    document.getElementById('receipt-user-contact').textContent = 'Anónimo • Reporte Comunitario GPS';
    
    // Comments / Description
    document.getElementById('receipt-comments-row').style.display = 'table-row';
    document.getElementById('receipt-user-comments').textContent = violationDesc;
    
    // Evidence image preview
    document.getElementById('receipt-photo-preview').src = repSelectedPhotoUrl;
    
    // Close report modal and open receipt modal
    closeReportModal();
    document.getElementById('complaint-receipt-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    showToast(`¡Denuncia ${caseId} radicada y enviada a DACO con éxito!`, 'success');
  } else {
    showToast('¡Precio en bomba actualizado con éxito! Gracias por tu colaboración.', 'success');
    closeReportModal();
  }
  
  // Re-sync UI state
  renderDashboard();
  renderStationsGrid();
  populateStationSelects();
}

// ========================================================
// FAse 2 - DACO Synchronization & Complaints logic
// ========================================================

// --- Radicar Querella Form Actions ---
function openComplaintModal(stationId) {
  const station = stations.find(s => s.id === stationId);
  if (!station) return;
  
  // Pre-fill hidden input and detail text
  document.getElementById('comp-station-id').value = stationId;
  
  let infractions = [];
  if (station.prices.regular > DACO_MAX_LIMITS.regular) {
    infractions.push(`Regular: ${station.prices.regular}¢/L (Excede por ${(station.prices.regular - DACO_MAX_LIMITS.regular).toFixed(1)}¢ el límite de ${DACO_MAX_LIMITS.regular}¢)`);
  }
  if (station.prices.premium > DACO_MAX_LIMITS.premium) {
    infractions.push(`Premium: ${station.prices.premium}¢/L (Excede por ${(station.prices.premium - DACO_MAX_LIMITS.premium).toFixed(1)}¢ el límite de ${DACO_MAX_LIMITS.premium}¢)`);
  }
  if (station.prices.diesel > DACO_MAX_LIMITS.diesel) {
    infractions.push(`Diésel: ${station.prices.diesel}¢/L (Excede por ${(station.prices.diesel - DACO_MAX_LIMITS.diesel).toFixed(1)}¢ el límite de ${DACO_MAX_LIMITS.diesel}¢)`);
  }
  
  document.getElementById('comp-infraction-desc').innerHTML = `
    La estación <strong>${station.name}</strong> (${station.municipality}) registra precios que violan los parámetros oficiales de razonabilidad fijados por el DACO:<br>
    <span style="color:#ef4444; font-weight:600; display:block; margin-top:0.4rem;">${infractions.join('<br>')}</span>
  `;
  
  // Clean uploader and fields
  document.getElementById('complaint-form').reset();
  removeSelectedPhoto();
  
  // Open Modal
  const modal = document.getElementById('complaint-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeComplaintModal() {
  const modal = document.getElementById('complaint-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// File/Photo Uploader Triggers
function triggerFileInput() {
  document.getElementById('comp-photo').click();
}

function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file is image
  if (!file.type.startsWith('image/')) {
    showToast('Por favor, selecciona una imagen válida.', 'error');
    return;
  }
  
  // Save URL preview
  selectedPhotoUrl = URL.createObjectURL(file);
  
  // Show in form preview
  document.getElementById('form-photo-preview').src = selectedPhotoUrl;
  document.getElementById('form-photo-preview-container').style.display = 'block';
  
  // Update Dropzone styling
  const dropzone = document.getElementById('upload-dropzone');
  dropzone.classList.add('has-file');
  document.getElementById('upload-instruction').innerHTML = `<strong>¡Foto de bomba cargada!</strong><br><span style="font-size:0.7rem; color:var(--color-success);">${file.name}</span>`;
}

function removeSelectedPhoto() {
  selectedPhotoUrl = null;
  document.getElementById('comp-photo').value = '';
  document.getElementById('form-photo-preview-container').style.display = 'none';
  document.getElementById('form-photo-preview').src = '';
  
  const dropzone = document.getElementById('upload-dropzone');
  if (dropzone) {
    dropzone.classList.remove('has-file');
    document.getElementById('upload-instruction').textContent = 'Arrastra o selecciona la foto de la bomba de gasolina';
  }
}

// Submit complaint form
function handleComplaintSubmit(e) {
  e.preventDefault();
  
  const stationId = document.getElementById('comp-station-id').value;
  const userName = document.getElementById('comp-user-name').value;
  const userEmail = document.getElementById('comp-user-email').value;
  const userPhone = document.getElementById('comp-user-phone').value;
  const comments = document.getElementById('comp-comments').value;
  
  const station = stations.find(s => s.id === stationId);
  if (!station || !userName || !selectedPhotoUrl) {
    showToast('Por favor, ingresa todos los campos obligatorios y adjunta la evidencia.', 'error');
    return;
  }
  
  // Generate random case ID
  const caseId = `Q-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Render details inside receipt modal
  document.getElementById('receipt-case-id').textContent = caseId;
  document.getElementById('receipt-date-field').textContent = `Fecha: ${new Date().toLocaleDateString('es-PR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  document.getElementById('receipt-stamp-time').textContent = `${new Date().toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} AST`;
  
  // Querellado
  document.getElementById('receipt-station-name').textContent = station.name;
  document.getElementById('receipt-station-brand').textContent = station.brand;
  document.getElementById('receipt-station-location').textContent = `${station.municipality}, ${station.address || 'Carretera Estatal'}`;
  
  // Infractions Table
  const tableBody = document.getElementById('receipt-infraction-table');
  tableBody.innerHTML = '';
  
  ['regular', 'premium', 'diesel'].forEach(fuel => {
    const price = station.prices[fuel];
    const limit = DACO_MAX_LIMITS[fuel];
    const exceeds = price > limit;
    
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #e2e8f0';
    tr.innerHTML = `
      <td style="padding: 0.6rem; font-weight: bold; text-transform: capitalize;">${fuel}</td>
      <td style="padding: 0.6rem; text-align: right;">${price.toFixed(1)}¢</td>
      <td style="padding: 0.6rem; text-align: right;">${limit.toFixed(1)}¢</td>
      <td style="padding: 0.6rem; text-align: right; font-weight: bold; color: ${exceeds ? '#ef4444' : '#64748b'};">
        ${exceeds ? `+${(price - limit).toFixed(1)}¢` : 'Estable'}
      </td>
    `;
    tableBody.appendChild(tr);
  });
  
  // Querellante
  document.getElementById('receipt-user-name').textContent = userName;
  document.getElementById('receipt-user-contact').textContent = `${userEmail} • ${userPhone}`;
  
  if (comments.trim()) {
    document.getElementById('receipt-comments-row').style.display = 'table-row';
    document.getElementById('receipt-user-comments').textContent = comments;
  } else {
    document.getElementById('receipt-comments-row').style.display = 'none';
  }
  
  // Evidence image preview
  document.getElementById('receipt-photo-preview').src = selectedPhotoUrl;
  
  // Hide complaint, open receipt
  closeComplaintModal();
  document.getElementById('complaint-receipt-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  
  showToast(`¡Querella ${caseId} radicada exitosamente en DACO!`, 'success');
}

function closeComplaintReceipt() {
  document.getElementById('complaint-receipt-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function printComplaintReceipt() {
  window.print();
}

// --- Toast System ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Different icon based on type
  const icon = type === 'success' ? 
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; stroke: var(--color-success);"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` :
    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; stroke: var(--color-danger);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    
  toast.innerHTML = `
    ${icon}
    <span style="font-size: 0.85rem; font-weight: 500; line-height: 1.4;">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto dismiss
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease-out reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- SVG Interactive Trend Chart Builder ---
function renderSVGChart() {
  const container = document.getElementById('svg-chart-container');
  if (!container) return;
  
  const width = container.clientWidth || 500;
  const height = container.clientHeight || 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  
  // Find min and max price values in history to scale Y axes
  const allPrices = priceHistory.flatMap(h => [h.regular, h.premium, h.diesel]);
  const minVal = Math.min(...allPrices) - 1.5;
  const maxVal = Math.max(...allPrices) + 1.5;
  
  const getX = (index) => {
    return padding.left + (index * (width - padding.left - padding.right) / (priceHistory.length - 1));
  };
  
  const getY = (val) => {
    return height - padding.bottom - ((val - minVal) * (height - padding.top - padding.bottom) / (maxVal - minVal));
  };

  // Generate paths
  let regPath = '';
  let premPath = '';
  let dslPath = '';
  
  priceHistory.forEach((pt, i) => {
    const x = getX(i);
    const yReg = getY(pt.regular);
    const yPrem = getY(pt.premium);
    const yDsl = getY(pt.diesel);
    
    if (i === 0) {
      regPath = `M ${x} ${yReg}`;
      premPath = `M ${x} ${yPrem}`;
      dslPath = `M ${x} ${yDsl}`;
    } else {
      regPath += ` L ${x} ${yReg}`;
      premPath += ` L ${x} ${yPrem}`;
      dslPath += ` L ${x} ${yDsl}`;
    }
  });

  // Render complete SVG
  let svgContent = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <!-- Gradients for fill areas -->
        <linearGradient id="grad-reg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-regular)" stop-opacity="0.15" />
          <stop offset="100%" stop-color="var(--color-regular)" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="grad-prem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-premium)" stop-opacity="0.15" />
          <stop offset="100%" stop-color="var(--color-premium)" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="grad-dsl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-diesel)" stop-opacity="0.15" />
          <stop offset="100%" stop-color="var(--color-diesel)" stop-opacity="0" />
        </linearGradient>
      </defs>
      
      <!-- Grid lines -->
      <line x1="${padding.left}" y1="${getY(minVal + 1.5)}" x2="${width - padding.right}" y2="${getY(minVal + 1.5)}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4" />
      <line x1="${padding.left}" y1="${getY((minVal + maxVal) / 2)}" x2="${width - padding.right}" y2="${getY((minVal + maxVal) / 2)}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4" />
      <line x1="${padding.left}" y1="${getY(maxVal - 1.5)}" x2="${width - padding.right}" y2="${getY(maxVal - 1.5)}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4" />
      
      <!-- Chart Fills -->
      <path d="${regPath} L ${getX(priceHistory.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z" fill="url(#grad-reg)" />
      <path d="${premPath} L ${getX(priceHistory.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z" fill="url(#grad-prem)" />
      <path d="${dslPath} L ${getX(priceHistory.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z" fill="url(#grad-dsl)" />
      
      <!-- Chart Lines -->
      <path d="${regPath}" fill="none" stroke="var(--color-regular)" stroke-width="3" stroke-linecap="round" />
      <path d="${premPath}" fill="none" stroke="var(--color-premium)" stroke-width="3" stroke-linecap="round" />
      <path d="${dslPath}" fill="none" stroke="var(--color-diesel)" stroke-width="3" stroke-linecap="round" />
      
      <!-- Axes labels -->
      <!-- Y axis labels -->
      <text x="${padding.left - 10}" y="${getY(minVal + 1.5)}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-weight="600">$${((minVal + 1.5) / 100).toFixed(2)}</text>
      <text x="${padding.left - 10}" y="${getY((minVal + maxVal) / 2)}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-weight="600">$${(((minVal + maxVal) / 2) / 100).toFixed(2)}</text>
      <text x="${padding.left - 10}" y="${getY(maxVal - 1.5)}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-weight="600">$${((maxVal - 1.5) / 100).toFixed(2)}</text>
  `;
  
  // X axis labels and active interactive points
  priceHistory.forEach((pt, i) => {
    const x = getX(i);
    svgContent += `
      <text x="${x}" y="${height - 10}" fill="var(--text-muted)" font-size="10" text-anchor="middle" font-weight="600">${pt.week === 'W1' ? 'Hace 3 semanas' : pt.week === 'W2' ? 'Hace 2 semanas' : pt.week === 'W3' ? 'Hace 1 semana' : 'Hoy'}</text>
      
      <!-- Interactive Points -->
      <circle cx="${x}" cy="${getY(pt.regular)}" r="5" fill="var(--bg-secondary)" stroke="var(--color-regular)" stroke-width="3" cursor="pointer" />
      <circle cx="${x}" cy="${getY(pt.premium)}" r="5" fill="var(--bg-secondary)" stroke="var(--color-premium)" stroke-width="3" cursor="pointer" />
      <circle cx="${x}" cy="${getY(pt.diesel)}" r="5" fill="var(--bg-secondary)" stroke="var(--color-diesel)" stroke-width="3" cursor="pointer" />
    `;
  });
  
  svgContent += `</svg>`;
  container.innerHTML = svgContent;
}

// Redraw chart on resize
window.addEventListener('resize', () => {
  renderSVGChart();
});

// --- Collapsible Panel Toggle ---
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  panel.classList.toggle('collapsed');
  
  // If we open the trends chart, redraw it once the transition ends to scale beautifully
  if (panelId === 'panel-price-trends' && !panel.classList.contains('collapsed')) {
    setTimeout(() => {
      renderSVGChart();
    }, 400);
  }
}

// --- Auto GPS Proximity Distance Sorting ---
function autoSortStationsByProximity() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        sortAndRenderStations(lat, lon);
      },
      (error) => {
        console.warn("Proximity Geolocation error: " + error.message + ". Running mock GPS fallback...");
        // Mock fallback to San Juan close coordinates (e.g. Puma Las Cumbres)
        sortAndRenderStations(18.3720, -66.0890);
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  } else {
    renderStationsGrid();
  }
}

// Calculate distance and sort stations in vivo
function sortAndRenderStations(userLat, userLon) {
  stations = stations.map(station => {
    if (station.coords) {
      const distance = Math.sqrt(Math.pow(station.coords.lat - userLat, 2) + Math.pow(station.coords.lon - userLon, 2));
      station.distanceMeters = Math.round(distance * 111.3 * 1000);
    } else {
      station.distanceMeters = Infinity;
    }
    return station;
  });
  
  // Sort stations: closest distance first!
  stations.sort((a, b) => a.distanceMeters - b.distanceMeters);
  
  // Re-render the grid!
  renderStationsGrid();
  
  showToast("📍 Gasolineras ordenadas por cercanía a tu ubicación.", "success");
}

// --- Trigger native camera capture input ---
function triggerCamera(stationId) {
  const input = document.getElementById(`camera-${stationId}`);
  if (input) input.click();
}

// --- Process Captured Pump Photo with Simulated AI OCR ---
function processPumpPhoto(stationId, event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Show scanner overlay inside card
  const scanner = document.getElementById(`scanner-${stationId}`);
  if (scanner) {
    scanner.style.display = 'block';
  }
  
  showToast("🤖 Analizando foto y calibrando con GPS...", "info");
  
  setTimeout(() => {
    // Hide scanner
    if (scanner) scanner.style.display = 'none';
    
    const index = stations.findIndex(s => s.id === stationId);
    if (index !== -1) {
      const station = stations[index];
      
      // Simulated AI OCR: read numbers on the sign or pump screen (OCR calibration)
      // Generates minor updates (+/- 1.0¢) to represent actual scanned values
      const rawRegular = station.prices.regular + (Math.random() > 0.5 ? 1.0 : -1.0);
      const rawPremium = station.prices.premium + (Math.random() > 0.5 ? 1.0 : -1.0);
      const rawDiesel = station.prices.diesel + (Math.random() > 0.5 ? 1.0 : -1.0);
      
      const simulatedRegular = sanitizePriceToCents(rawRegular);
      const simulatedPremium = sanitizePriceToCents(rawPremium);
      const simulatedDiesel = sanitizePriceToCents(rawDiesel);
      
      stations[index].prices = {
        regular: simulatedRegular,
        premium: simulatedPremium,
        diesel: simulatedDiesel
      };
      stations[index].reportedAt = 'Escaneado por IA en bomba hace unos instantes';
      stations[index].isCommunity = true;
      
      localStorage.setItem('gasolinapr_stations', JSON.stringify(stations));
      
      // Refresh GUI
      renderDashboard();
      renderStationsGrid();
      populateStationSelects();
      
      showToast(`🤖 ¡Precios de ${station.name} calibrados por IA!`, "success");
      
      setTimeout(() => {
        showToast(`Regular: ${simulatedRegular}¢ | Premium: ${simulatedPremium}¢ | Diésel: ${simulatedDiesel}¢`, "success");
      }, 1000);
    }
  }, 2200);
}

// --- Sanitize and format price input to always end in '7' thousandths ---
function sanitizeInlinePriceInput(input) {
  let val = parseFloat(input.value);
  if (isNaN(val)) return;
  
  if (val >= 10) {
    // If they typed in cents (e.g. 112.7), convert to dollars (1.127)
    val = val / 100;
  }
  
  // Enforce 3 decimal places and replace the thousandth digit with '7'
  let str = val.toFixed(3);
  let adjustedStr = str.substring(0, str.length - 1) + '7';
  input.value = adjustedStr;
}

// --- Sanitize any user-entered price to cents ending in .7 (e.g., dollar price ending in 7 thousandths) ---
function sanitizePriceToCents(value) {
  if (isNaN(value) || value <= 0) return 0;
  
  // If the user entered the price in dollars (e.g. 1.12 or 1.127)
  if (value < 10) {
    let str = value.toFixed(3);
    let adjustedStr = str.substring(0, str.length - 1) + '7';
    let valDollar = parseFloat(adjustedStr);
    return parseFloat((valDollar * 100).toFixed(1));
  } else {
    // If the user entered in cents (e.g. 112 or 112.7)
    let valDollar = value / 100;
    let str = valDollar.toFixed(3);
    let adjustedStr = str.substring(0, str.length - 1) + '7';
    let valSanitizedDollar = parseFloat(adjustedStr);
    return parseFloat((valSanitizedDollar * 100).toFixed(1));
  }
}

// --- Sanitize and format report price input to always end in '.7' cents ---
function sanitizeReportPriceInput(input) {
  let val = parseFloat(input.value);
  if (isNaN(val)) return;
  
  // Convert using the robust sanitization function
  let centsVal = sanitizePriceToCents(val);
  input.value = centsVal.toFixed(1);
}

// --- Theme Toggle Logic ---
function initTheme() {
  const savedTheme = localStorage.getItem('gasolinapr_theme') || 'dark'; // Default to dark mode
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  updateThemeButton(savedTheme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  const newTheme = isLight ? 'dark' : 'light';
  
  if (newTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  
  localStorage.setItem('gasolinapr_theme', newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  const icon = document.getElementById('theme-toggle-icon');
  const text = document.getElementById('theme-toggle-text');
  
  if (!btn) return;
  
  if (theme === 'light') {
    // Under light mode, the button should look black with white letters to switch to dark mode
    btn.style.backgroundColor = '#0f172a'; // Black/Slate
    btn.style.color = '#ffffff';
    icon.textContent = '🌙';
    text.textContent = 'Oscuro';
  } else {
    // Under dark mode, the button should look white with black letters to switch to light mode
    btn.style.backgroundColor = '#ffffff'; // White
    btn.style.color = '#0f172a'; // Black/Slate
    icon.textContent = '☀️';
    text.textContent = 'Claro';
  }
}


