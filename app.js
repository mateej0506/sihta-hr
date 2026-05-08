const API_URL = 'http://localhost:3000/api';

const map = L.map('map').setView([45.8150, 15.9819], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

async function ucitajPonude() {
  const response = await fetch(`${API_URL}/ponude`);
  const ponude = await response.json();

  ponude.forEach(p => {
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    marker.bindPopup(`
      <div class="popup">
        <h3>${p.naziv}</h3>
        <p>📍 ${p.lokacija}</p>
        <p>🕔 ${p.vrijeme}</p>
        <p>💶 ${p.satnica}</p>
        <p>💵 ${p.placanje}</p>
        <button onclick="alert('Prijava poslana!')">Prijavi se</button>
      </div>
    `);
  });
}

document.querySelector('.btn-sef').addEventListener('click', () => {
  document.getElementById('forma-sef').style.display = 'block';
});

document.getElementById('btn-zatvori').addEventListener('click', () => {
  document.getElementById('forma-sef').style.display = 'none';
});

async function adresaUKoordinate(adresa) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresa)}`);
  const data = await response.json();
  if (data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  }
  return null;
}

document.getElementById('btn-objavi').addEventListener('click', async () => {
  const naziv = document.getElementById('naziv').value;
  const lokacija = document.getElementById('lokacija').value;
  const vrijeme = document.getElementById('vrijeme').value;
  const satnica = document.getElementById('satnica').value;
  const placanje = document.getElementById('placanje').value;

  const koordinate = await adresaUKoordinate(lokacija);

  if (!koordinate) {
    alert('Adresa nije pronađena, pokušaj preciznije!');
    return;
  }

  const response = await fetch(`${API_URL}/ponude`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ponuda: {
        naziv,
        lokacija,
        vrijeme,
        satnica,
        placanje,
        lat: koordinate.lat,
        lng: koordinate.lng
      }
    })
  });

  if (response.ok) {
    alert('Smjena objavljena!');
    document.getElementById('forma-sef').style.display = 'none';
    ucitajPonude();
  } else {
    alert('Greška, pokušaj ponovo!');
  }
});

map.on('click', function(e) {
  document.getElementById('lat').value = e.latlng.lat.toFixed(6);
  document.getElementById('lng').value = e.latlng.lng.toFixed(6);
});

document.querySelector('.btn-konobar').addEventListener('click', () => {
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btn-sef-pitch').addEventListener('click', () => {
  document.getElementById('forma-sef').style.display = 'block';
});

ucitajPonude();