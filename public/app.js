// --- INITIALISATION & CONFIGURATION DU SYSTEME MODULAIRE ---
const grid = document.getElementById('dashboard-grid');
const cards = document.querySelectorAll('.card');
const profileSelect = document.getElementById('profile-select');

// 1. Génération dynamique de la liste des modules dans la sidebar
const toggleContainer = document.getElementById('module-toggles');
cards.forEach(card => {
    const title = card.querySelector('h3').innerText;
    const div = document.createElement('div');
    div.innerHTML = `
        <label style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span>${title}</span>
            <input type="checkbox" checked onchange="toggleModule('${card.id}', this.checked)">
        </label>
    `;
    toggleContainer.appendChild(div);
});

function toggleModule(id, isChecked) {
    document.getElementById(id).style.display = isChecked ? 'block' : 'none';
    saveLayout();
}

// 2. Gestion des Profils (Affiche les cartes selon la catégorie)
profileSelect.addEventListener('change', (e) => {
    const activeProfile = e.target.value;
    document.getElementById('welcome-title').innerText = `Tableau de Bord — Mode ${activeProfile.toUpperCase()}`;
    
    cards.forEach(card => {
        if (activeProfile === 'maison' || card.getAttribute('data-category') === activeProfile) {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        } else {
            card.style.opacity = '0.15'; // Assombrit les widgets hors profil
        }
    });
});

// 3. Mode Smart Mirror Alternatif
document.getElementById('mirror-toggle').addEventListener('click', () => {
    const currentLayout = document.documentElement.getAttribute('data-layout');
    document.documentElement.setAttribute('data-layout', currentLayout === 'mirror' ? 'default' : 'mirror');
});

// 4. Horloge Globale
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('fr-FR');
}, 1000);

// --- DRAG AND DROP AVEC SAUVEGARDE DE L'ORDRE ---
let draggingElement = null;

grid.addEventListener('dragstart', (e) => {
    if(e.target.classList.contains('card')) {
        draggingElement = e.target;
        e.target.classList.add('dragging');
    }
});

grid.addEventListener('dragend', (e) => {
    if(draggingElement) {
        draggingElement.classList.remove('dragging');
        draggingElement = null;
        saveLayout();
    }
});

grid.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(grid, e.clientY);
    if (afterElement == null) {
        grid.appendChild(draggingElement);
    } else {
        grid.insertBefore(draggingElement, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveLayout() {
    const currentOrder = [...grid.querySelectorAll('.card')].map(card => card.id);
    localStorage.setItem('dash-layout-order', JSON.stringify(currentOrder));
}

// Restauration de l'ordre au chargement
(function restoreLayout() {
    const savedOrder = JSON.parse(localStorage.getItem('dash-layout-order'));
    if (savedOrder) {
        savedOrder.forEach(id => {
            const card = document.getElementById(id);
            if (card) grid.appendChild(card);
        });
    }
})();

// --- LOGIQUE DES WIDGETS INTERNES ---

// A. Calculatrice
const calcScreen = document.getElementById('calc-screen');
window.pressCalc = (val) => calcScreen.value += val;
window.clearCalc = () => calcScreen.value = '';
window.evalCalc = () => { try { calcScreen.value = eval(calcScreen.value); } catch { calcScreen.value = 'Erreur'; } };

// B. Mini Player Audio Local
const audio = document.getElementById('local-audio');
const playBtn = document.getElementById('audio-play');
const progress = document.getElementById('audio-progress');

playBtn.addEventListener('click', () => {
    if(audio.paused) { audio.play(); playBtn.innerText = "⏸️ Pause"; }
    else { audio.pause(); playBtn.innerText = "▶️ Play"; }
});
audio.addEventListener('timeupdate', () => {
    progress.value = (audio.currentTime / audio.duration) * 100 || 0;
});

// C. Chargement YouTube Dynamique
document.getElementById('yt-url').addEventListener('change', (e) => {
    const val = e.target.value;
    document.getElementById('yt-player').src = `https://www.youtube.com/embed/${val}`;
});

// D. Recupération Données API du Serveur Node (Météo, Crypto, Sys)
async function refreshData() {
    try {
        // Stats Système & Ping Réseau
        const sysRes = await fetch('/api/system');
        const sysData = await sysRes.json();
        document.getElementById('cpu-temp').innerText = sysData.cpuTemp;
        document.getElementById('ram-usage').innerText = sysData.ram;
        document.getElementById('net-pc').className = `status ${sysData.network.pc === 'En ligne' ? 'green' : 'red'}`;
        document.getElementById('net-nas').className = `status ${sysData.network.nas === 'En ligne' ? 'green' : 'red'}`;

        // Données Météo Proxy
        const weatherRes = await fetch('/api/weather');
        const weatherData = await weatherRes.json();
        document.getElementById('weather-temp').innerText = `${weatherData.current.temp}°C`;
        document.getElementById('weather-desc').innerText = weatherData.current.desc;
        
        let forecastHtml = "";
        weatherData.forecast.forEach(f => {
            forecastHtml += `<div style="font-size:0.8rem; margin-top:5px;">📅 ${f.day} : <b>${f.temp}°C</b> - ${f.desc}</div>`;
        });
        document.getElementById('weather-forecast').innerHTML = forecastHtml;

        // Données Crypto Réelles
        const cryptoRes = await fetch('/api/crypto');
        const cryptoData = await cryptoRes.json();
        document.getElementById('btc-price').innerText = `${cryptoData.bitcoin.eur.toLocaleString()} €`;
        document.getElementById('eth-price').innerText = `${cryptoData.ethereum.eur.toLocaleString()} €`;
    } catch (e) {
        console.log("Erreur lors de la synchronisation des données API.");
    }
}

setInterval(refreshData, 10000); // Mise à jour toutes les 10 secondes
refreshData();

// E. Sauvegarde Notes locales
const noteArea = document.getElementById('note-area');
noteArea.value = localStorage.getItem('dash-notes') || "";
noteArea.addEventListener('input', () => localStorage.setItem('dash-notes', noteArea.value));

// F. Changement de Thème Classique Dark/Light
document.getElementById('theme-toggle').addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
});
