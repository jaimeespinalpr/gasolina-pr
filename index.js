// ==========================================
// GasolinaPR - Core Logic & State Management
// ==========================================

// --- State ---
let globalUnit = 'L'; // 'L' = Liters, 'G' = Gallons
let searchQuery = '';
let selectedMunicipality = '';
let selectedBrand = '';
let stations = [];
let updatingStationId = null; // Track if we are editing an existing station
let selectedPhotoUrl = null; // Track loaded evidence photo URL

// --- Conversion Factor ---
const LITERS_PER_GALLON = 3.78541;

// --- DACO Official Maximum Limits (¢/L) ---
const DACO_MAX_LIMITS = {
  regular: 111.7,
  premium: 128.7,
  diesel: 128.7
};

// --- Seed Data: Official Wholesalers (DACO May 29, 2026) ---
const wholesalersData = [
  { name: 'American Gas', regular: 107.7, premium: 115.7, diesel: 120.7 },
  { name: '76', regular: 107.7, premium: 121.7, diesel: 120.7 },
  { name: 'Gulf', regular: 108.7, premium: 122.7, diesel: 120.7 },
  { name: 'Phillips', regular: 107.7, premium: 121.7, diesel: 122.7 },
  { name: 'Sunoco', regular: 110.7, premium: 128.7, diesel: 128.7 },
  { name: 'Puma', regular: 109.7, premium: 123.7, diesel: 121.7 },
  { name: 'TotalEnergies', regular: 110.7, premium: 124.7, diesel: 122.7 },
  { name: 'Ecomaxx', regular: 108.7, premium: 118.7, diesel: 120.7 }
];

// --- Seed Data: Gas Stations in Puerto Rico ---
const defaultStations = [
  {
    id: 'st-1',
    name: 'Puma Ave. Esmeralda',
    brand: 'Puma',
    municipality: 'Guaynabo',
    address: 'Ave. Esmeralda #42',
    prices: { regular: 108.7, premium: 119.7, diesel: 120.7 },
    reportedAt: 'Hace 2 horas',
    isCommunity: false
  },
  {
    id: 'st-2',
    name: 'Gulf Los Filtros',
    brand: 'Gulf',
    municipality: 'Bayamón',
    address: 'Carr. 177 Km 3.2',
    prices: { regular: 107.7, premium: 116.7, diesel: 119.7 },
    reportedAt: 'Hace 1 hora',
    isCommunity: false
  },
  {
    id: 'st-3',
    name: 'TotalEnergies San Patricio',
    brand: 'Total',
    municipality: 'Guaynabo',
    address: 'Ave. Roosevelt Esq. San Patricio',
    prices: { regular: 109.7, premium: 122.7, diesel: 121.7 },
    reportedAt: 'Hace 3 horas',
    isCommunity: false
  },
  {
    id: 'st-4',
    name: 'Ecomaxx Montehiedra',
    brand: 'Ecomaxx',
    municipality: 'San Juan',
    address: 'Carr. 176, Río Piedras',
    prices: { regular: 107.9, premium: 115.9, diesel: 119.9 },
    reportedAt: 'Hace 4 horas',
    isCommunity: false
  },
  {
    id: 'st-5',
    name: 'Shell Roosevelt',
    brand: 'Shell',
    municipality: 'San Juan',
    address: 'Ave. Franklin D. Roosevelt #382',
    prices: { regular: 110.7, premium: 124.7, diesel: 122.7 },
    reportedAt: 'Hace 5 horas',
    isCommunity: false
  },
  {
    id: 'st-6',
    name: 'Puma Las Cumbres',
    brand: 'Puma',
    municipality: 'San Juan',
    address: 'Ave. Las Cumbres #105',
    prices: { regular: 109.7, premium: 122.7, diesel: 120.7 },
    reportedAt: 'Hace 30 mins',
    isCommunity: false
  },
  {
    id: 'st-7',
    name: 'Gulf Ave. Piñero',
    brand: 'Gulf',
    municipality: 'San Juan',
    address: 'Ave. Central Esq. Piñero',
    prices: { regular: 107.7, premium: 117.7, diesel: 119.7 },
    reportedAt: 'Hace 6 horas',
    isCommunity: false
  },
  {
    id: 'st-8',
    name: 'TotalEnergies Rexville',
    brand: 'Total',
    municipality: 'Bayamón',
    address: 'Carr. 167 Km 15.2',
    prices: { regular: 110.7, premium: 124.7, diesel: 122.7 },
    reportedAt: 'Hace 12 horas',
    isCommunity: false
  },
  {
    id: 'st-9',
    name: 'Ecomaxx Las Catalinas',
    brand: 'Ecomaxx',
    municipality: 'Caguas',
    address: 'Ave. Luis Muñoz Marín',
    prices: { regular: 108.7, premium: 118.7, diesel: 120.7 },
    reportedAt: 'Hace 7 horas',
    isCommunity: false
  },
  {
    id: 'st-10',
    name: 'Puma Ponce ByPass',
    brand: 'Puma',
    municipality: 'Ponce',
    address: 'Ponce ByPass, Ave. Tito Castro',
    prices: { regular: 108.7, premium: 120.7, diesel: 120.7 },
    reportedAt: 'Hace 8 horas',
    isCommunity: false
  },
  {
    id: 'st-11',
    name: 'Gulf Carr. 2',
    brand: 'Gulf',
    municipality: 'Mayagüez',
    address: 'Carr. #2 Km 114.5',
    prices: { regular: 107.9, premium: 117.9, diesel: 119.9 },
    reportedAt: 'Hace 9 horas',
    isCommunity: false
  },
  {
    id: 'st-12',
    name: 'TotalEnergies Los Colobos',
    brand: 'Total',
    municipality: 'Carolina',
    address: 'Ave. 65 de Infantería',
    prices: { regular: 110.7, premium: 123.7, diesel: 122.7 },
    reportedAt: 'Hace 10 horas',
    isCommunity: false
  },
  {
    id: 'st-13',
    name: 'Shell Dorado Reef',
    brand: 'Shell',
    municipality: 'Dorado',
    address: 'Carr. 693 Km 8.5',
    prices: { regular: 111.7, premium: 126.7, diesel: 123.7 },
    reportedAt: 'Hace 1 hora',
    isCommunity: false
  },
  {
    id: 'st-14',
    name: 'Mobil Carr. 129',
    brand: 'Mobil',
    municipality: 'Arecibo',
    address: 'Carr. 129 Km 4.2',
    prices: { regular: 107.7, premium: 121.7, diesel: 120.7 },
    reportedAt: 'Hace 23 horas',
    isCommunity: false
  },
  {
    id: 'st-15',
    name: 'Sunoco Humacao Centro',
    brand: 'Sunoco',
    municipality: 'Humacao',
    address: 'Ave. Font Martelo #115',
    prices: { regular: 110.7, premium: 128.7, diesel: 126.7 },
    reportedAt: 'Hace 1 día',
    isCommunity: false
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
document.addEventListener('DOMContentLoaded', () => {
  loadStations();
  renderDashboard();
  renderWholesalers();
  renderStationsGrid();
  populateStationSelects();
  renderSVGChart();
  
  // Set up default values in converter
  document.getElementById('calc-liters').value = 40;
  convertLitersToGallons(40);
});

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
function navigateTo(sectionId) {
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
    subtitleText.textContent = 'Monitoreo oficial y comunitario en Puerto Rico';
  } else if (sectionId === 'directory') {
    titleText.textContent = 'Directorio de Gasolineras';
    subtitleText.textContent = 'Compara los precios actualizados cerca de ti';
  } else if (sectionId === 'calculators') {
    titleText.textContent = 'Herramientas de Ahorro';
    subtitleText.textContent = 'Calcula costos de llenado y convierte medidas al instante';
  }

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Unit Management (Liters vs Gallons) ---
function setGlobalUnit(unit) {
  globalUnit = unit;
  
  // Toggle active class on unit buttons
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (unit === 'L') {
    document.getElementById('unit-l').classList.add('active');
  } else {
    document.getElementById('unit-g').classList.add('active');
  }
  
  // Re-render everything with new units
  renderDashboard();
  renderWholesalers();
  renderStationsGrid();
  calculateTankFill();
  
  // Re-calculate the converter summary
  const currentLitersVal = document.getElementById('calc-liters').value;
  if (currentLitersVal) {
    convertLitersToGallons(currentLitersVal);
  }
}

// --- Formatting Helpers ---
function formatPrice(priceInCentsL) {
  if (globalUnit === 'L') {
    // Return dollars per Liter: $1.097
    return `$${(priceInCentsL / 100).toFixed(3)}`;
  } else {
    // Return dollars per Gallon: $4.152
    const pricePerGallon = (priceInCentsL * LITERS_PER_GALLON) / 100;
    return `$${pricePerGallon.toFixed(3)}`;
  }
}

function getUnitLabel() {
  return globalUnit === 'L' ? '/L' : '/Gal';
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
  const avgs = getAverages();
  
  // Render Averages
  document.getElementById('avg-regular-display').innerHTML = `${formatPrice(avgs.regular)} <span class="unit">${getUnitLabel()}</span>`;
  document.getElementById('avg-premium-display').innerHTML = `${formatPrice(avgs.premium)} <span class="unit">${getUnitLabel()}</span>`;
  document.getElementById('avg-diesel-display').innerHTML = `${formatPrice(avgs.diesel)} <span class="unit">${getUnitLabel()}</span>`;

  // Render DACO Ranges
  if (globalUnit === 'L') {
    document.getElementById('range-regular-display').textContent = '107.7¢ - 111.7¢';
    document.getElementById('range-premium-display').textContent = '115.7¢ - 128.7¢';
    document.getElementById('range-diesel-display').textContent = '119.7¢ - 128.7¢';
  } else {
    const minRegG = (107.7 * LITERS_PER_GALLON) / 100;
    const maxRegG = (111.7 * LITERS_PER_GALLON) / 100;
    const minPremG = (115.7 * LITERS_PER_GALLON) / 100;
    const maxPremG = (128.7 * LITERS_PER_GALLON) / 100;
    const minDslG = (119.7 * LITERS_PER_GALLON) / 100;
    const maxDslG = (128.7 * LITERS_PER_GALLON) / 100;

    document.getElementById('range-regular-display').textContent = `$${minRegG.toFixed(2)} - $${maxRegG.toFixed(2)}`;
    document.getElementById('range-premium-display').textContent = `$${minPremG.toFixed(2)} - $${maxPremG.toFixed(2)}`;
    document.getElementById('range-diesel-display').textContent = `$${minDslG.toFixed(2)} - $${maxDslG.toFixed(2)}`;
  }
}

// --- Render Wholesalers Table ---
function renderWholesalers() {
  const tbody = document.getElementById('wholesalers-table-body');
  tbody.innerHTML = '';
  
  wholesalersData.forEach(row => {
    const tr = document.createElement('tr');
    
    // Get color indicator
    const colorHash = stringToHsl(row.name);
    
    tr.innerHTML = `
      <td>
        <div class="brand-tag">
          <div class="brand-dot" style="background-color: ${colorHash};"></div>
          <strong>${row.name}</strong>
        </div>
      </td>
      <td>${formatPrice(row.regular)}</td>
      <td>${formatPrice(row.premium)}</td>
      <td>${formatPrice(row.diesel)}</td>
    `;
    
    tbody.appendChild(tr);
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
    
    const isCheapest = station.prices.regular === cheapestReg;
    const cheapestBadge = isCheapest ? `<span class="fuel-badge" style="background-color: var(--color-regular-glow); color: var(--color-regular); font-size: 0.65rem; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">Más Barata</span>` : '';
    
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
            <div class="station-title">${station.name} ${cheapestBadge}</div>
            <div class="station-meta" style="margin-bottom: 0;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span>${station.municipality} ${station.address ? `• ${station.address}` : ''}</span>
            </div>
          </div>
        </div>
      </div>
      
      ${violationAlertHtml}
      
      <table class="station-prices-table" style="margin-top: 1rem;">
        <tbody>
          <tr>
            <td>
              <div class="price-type">
                <div class="price-type-dot regular"></div> Regular
              </div>
            </td>
            <td class="price-val ${isCheapest ? 'cheap' : ''} ${violatesRegular ? 'style="color:#f87171;"' : ''}">${formatPrice(station.prices.regular)}</td>
          </tr>
          <tr>
            <td>
              <div class="price-type">
                <div class="price-type-dot premium"></div> Premium
              </div>
            </td>
            <td class="price-val ${violatesPremium ? 'style="color:#f87171;"' : ''}">${formatPrice(station.prices.premium)}</td>
          </tr>
          <tr>
            <td>
              <div class="price-type">
                <div class="price-type-dot diesel"></div> Diésel
              </div>
            </td>
            <td class="price-val ${violatesDiesel ? 'style="color:#f87171;"' : ''}">${formatPrice(station.prices.diesel)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="station-footer" style="padding-bottom: 1rem;">
        <div class="station-reported-badge">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${station.reportedAt}</span>
        </div>
        ${station.isCommunity ? `<span style="color: var(--color-accent); font-weight: 600; font-size: 0.7rem;">Reporte de Usuario</span>` : `<span style="color: var(--text-muted); font-size: 0.7rem;">Verificado</span>`}
      </div>

      <div class="card-actions-wrapper ${hasViolation ? '' : 'single'}">
        ${hasViolation ? `<button class="btn-card-action danger" onclick="openComplaintModal('${station.id}')">Radicar Querella</button>` : ''}
        <button class="btn-card-action" onclick="openQuickUpdate('${station.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Actualizar Bomba
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
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

// --- Modal Controls ---
function openReportModal() {
  updatingStationId = null; // Clear edit track
  document.querySelector('#report-modal .modal-title').textContent = 'Reportar Precios en Bomba';
  const modal = document.getElementById('report-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  const modal = document.getElementById('report-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('report-form').reset();
  updatingStationId = null;
}

// --- Open Quick Station Update ---
function openQuickUpdate(stationId) {
  const station = stations.find(s => s.id === stationId);
  if (!station) return;
  
  updatingStationId = stationId; // Track updating ID
  
  // Pre-fill form values
  document.getElementById('rep-station-name').value = station.name;
  document.getElementById('rep-brand').value = station.brand;
  document.getElementById('rep-municipality').value = station.municipality;
  document.getElementById('rep-address').value = station.address || '';
  document.getElementById('rep-price-regular').value = station.prices.regular;
  document.getElementById('rep-price-premium').value = station.prices.premium;
  document.getElementById('rep-price-diesel').value = station.prices.diesel;
  
  document.querySelector('#report-modal .modal-title').textContent = `Actualizar Bomba: ${station.name}`;
  
  const modal = document.getElementById('report-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function handleReportSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('rep-station-name').value;
  const brand = document.getElementById('rep-brand').value;
  const municipality = document.getElementById('rep-municipality').value;
  const address = document.getElementById('rep-address').value;
  const priceReg = parseFloat(document.getElementById('rep-price-regular').value);
  const pricePrem = parseFloat(document.getElementById('rep-price-premium').value);
  const priceDsl = parseFloat(document.getElementById('rep-price-diesel').value);
  
  // Basic validation
  if (!name || isNaN(priceReg) || isNaN(pricePrem) || isNaN(priceDsl)) {
    showToast('Por favor, llena todos los campos obligatorios correctamente.', 'error');
    return;
  }
  
  if (updatingStationId) {
    // Edit existing station
    const index = stations.findIndex(s => s.id === updatingStationId);
    if (index !== -1) {
      stations[index].name = name;
      stations[index].brand = brand;
      stations[index].municipality = municipality;
      stations[index].address = address;
      stations[index].prices = { regular: priceReg, premium: pricePrem, diesel: priceDsl };
      stations[index].reportedAt = 'Actualizado hace unos instantes';
      stations[index].isCommunity = true;
      
      showToast('¡Bomba de gasolina actualizada con éxito!', 'success');
    }
  } else {
    // Add new station to top of list
    const newStation = {
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
    stations.unshift(newStation);
    showToast('¡Reporte guardado con éxito! Gracias por colaborar con la comunidad.', 'success');
  }
  
  localStorage.setItem('gasolinapr_stations', JSON.stringify(stations));
  
  // Re-sync UI state
  closeReportModal();
  renderDashboard();
  renderStationsGrid();
  populateStationSelects();
}

// ========================================================
// FAse 2 - DACO Synchronization & Complaints logic
// ========================================================

// --- Simulate sync with DACO ---
function syncWithDACO() {
  const btn = document.getElementById('sync-daco-btn');
  const text = document.getElementById('sync-btn-text');
  const svg = document.getElementById('sync-icon-svg');
  
  if (btn.disabled) return;
  
  btn.disabled = true;
  text.textContent = 'Sincronizando...';
  svg.style.transform = 'rotate(720deg)';
  svg.style.animation = 'spin 1.5s linear infinite';
  
  setTimeout(() => {
    // Restore state
    btn.disabled = false;
    text.textContent = 'Sincronizar DACO';
    svg.style.transform = 'none';
    svg.style.animation = 'none';
    
    // Simulate real updates (reloads default data and aligns averages)
    stations = stations.map(s => {
      // Return Community inputs, but slightly update verified stations to show synched state
      if (!s.isCommunity) {
        // Mock minor daily adjustments within DACO limits
        const devReg = (Math.random() * 0.8 - 0.4);
        s.prices.regular = parseFloat((s.prices.regular + devReg).toFixed(1));
        s.reportedAt = 'Sincronizado con daco.pr.gov hace unos instantes';
      }
      return s;
    });
    
    localStorage.setItem('gasolinapr_stations', JSON.stringify(stations));
    
    // Refresh GUI
    renderDashboard();
    renderStationsGrid();
    populateStationSelects();
    
    showToast('¡Datos en bomba sincronizados con daco.pr.gov exitosamente!', 'success');
  }, 1500);
}

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
