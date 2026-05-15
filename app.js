const API_URL = 'https://sihta-api.onrender.com/api';

// --- Login modal ---
let jePrijavljen = false;
let odabranaUloga = null;

function zatvoriLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

function prikaziPrijavljenog(user) {
  const btn = document.getElementById('btn-nav-login');
  btn.textContent = `👤 ${user.ime}`;
  btn.disabled = true;
  btn.style.cursor = 'default';
  btn.style.opacity = '0.8';
}

// Odabir uloge
document.getElementById('uloga-radnik').addEventListener('click', () => {
  odabranaUloga = 'konobar';
  document.getElementById('uloga-radnik').classList.add('aktivan');
  document.getElementById('uloga-vlasnik').classList.remove('aktivan');
});

document.getElementById('uloga-vlasnik').addEventListener('click', () => {
  odabranaUloga = 'sef';
  document.getElementById('uloga-vlasnik').classList.add('aktivan');
  document.getElementById('uloga-radnik').classList.remove('aktivan');
});

// Otvori modal iz nava
document.getElementById('btn-nav-login').addEventListener('click', () => {
  document.getElementById('login-modal').style.display = 'block';
});

// Preskoči
document.getElementById('btn-preskoci').addEventListener('click', () => {
  zatvoriLoginModal();
});

// Prijava
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const lozinka = document.getElementById('login-password').value;

  if (!odabranaUloga) {
    alert('Odaberi prijavljuješ li se kao radnik ili vlasnik objekta.');
    return;
  }

  if (!email || !lozinka) {
    alert('Upiši email i lozinku.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: lozinka })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      jePrijavljen = true;
      prikaziPrijavljenog(data.user);
      zatvoriLoginModal();
    } else {
      alert('Pogrešan email ili lozinka.');
    }
  } catch {
    // API nije dostupan — za demo svrhe samo zatvori modal
    jePrijavljen = true;
    zatvoriLoginModal();
  }
});
// --- Kraj login modala ---


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
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
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
  document.getElementById('lat') && (document.getElementById('lat').value = e.latlng.lat.toFixed(6));
  document.getElementById('lng') && (document.getElementById('lng').value = e.latlng.lng.toFixed(6));
});

function otvoriFormuSef() {
  if (!jePrijavljen) {
    document.getElementById('login-modal').style.display = 'block';
    return;
  }
  document.getElementById('forma-sef').style.display = 'block';
}

document.getElementById('btn-sef-pitch').addEventListener('click', otvoriFormuSef);

document.querySelector('.btn-konobar').addEventListener('click', () => {
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
});

ucitajPonude();

// FAQ accordion
document.querySelectorAll('.faq-pitanje').forEach(btn => {
  btn.addEventListener('click', () => {
    const stavka = btn.closest('.faq-stavka');
    const jeOtvoren = stavka.classList.contains('otvoren');
    document.querySelectorAll('.faq-stavka').forEach(s => s.classList.remove('otvoren'));
    if (!jeOtvoren) stavka.classList.add('otvoren');
  });
});
