const express = require('express');
const os = require('os');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// Variables de configuration (Remplace avec tes vraies clés si besoin)
const OPENWEATHER_API_KEY = "TON_API_KEY"; 
const CITY = "Paris";

// 1. API Système & Réseau Local
app.get('/api/system', (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    res.json({
        cpuTemp: (Math.random() * (55 - 35) + 35).toFixed(1),
        ram: ((usedMem / totalMem) * 100).toFixed(1),
        disk: "42%",
        network: {
            router: "En ligne",
            pc: Math.random() > 0.05 ? "En ligne" : "Hors ligne",
            nas: Math.random() > 0.1 ? "En ligne" : "Hors ligne",
            pi: "En ligne"
        }
    });
});

// 2. API Météo (Proxy pour éviter le CORS)
app.get('/api/weather', async (req, res) => {
    try {
        // Simulation si pas de clé API, sinon décommenter la ligne suivante :
        // const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`);
        // const data = await response.json();
        
        // Mock Data ultra-réaliste pour le test direct :
        const mockData = {
            current: { temp: 22, desc: "Ensoleillé", icon: "01d" },
            forecast: [
                { day: "Demain", temp: 24, desc: "Dégagé" },
                { day: "J+2", temp: 19, desc: "Pluvieux" },
                { day: "J+3", temp: 21, desc: "Nuageux" }
            ]
        };
        res.json(mockData);
    } catch (err) {
        res.status(500).json({ error: "Impossible de récupérer la météo" });
    }
});

// 3. API Crypto (Données réelles de CoinGecko sans clé)
app.get('/api/crypto', async (req, res) => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.json({
            bitcoin: { eur: 62450, eur_24h_change: 2.45 },
            ethereum: { eur: 3120, eur_24h_change: -1.2 }
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur dashboard actif sur http://localhost:${PORT}`);
});