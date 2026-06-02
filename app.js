const API_URL = 'https://sihta-api.onrender.com/api';

let jePrijavljen = false;
let odabranaUloga = null;
let modalMod = 'login';

function zatvoriLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

function odjavi() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  jePrijavljen = false;
  const btnLogin = document.getElementById('btn-nav-login');
  btnLogin.textContent = 'Prijavi se';
  btnLogin.disabled = false;
  btnLogin.style.cursor = 'pointer';
  btnLogin.style.opacity = '1';
  document.getElementById('btn-odjava').style.display = 'none';
}

async function apiFetch(url, opcije = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    ...opcije,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...opcije.headers
    }
  });
  if (response.status === 401) {
    odjavi();
    document.getElementById('login-modal').style.display = 'block';
    throw new Error('401');
  }
  return response;
}

function prikaziPrijavljenog(user) {
  const btnLogin = document.getElementById('btn-nav-login');
  btnLogin.textContent = `👤 ${user.ime}`;
  btnLogin.disabled = true;
  btnLogin.style.cursor = 'default';
  btnLogin.style.opacity = '0.8';
  document.getElementById('btn-odjava').style.display = 'block';
}

function postaviMod(mod) {
  modalMod = mod;
  const imePolje = document.getElementById('login-ime');
  const submitBtn = document.getElementById('btn-login');
  const subtitle = document.getElementById('modal-subtitle');
  const toggleTekst = document.getElementById('toggle-tekst');
  const toggleBtn = document.getElementById('btn-toggle-modal');

  if (mod === 'register') {
    imePolje.style.display = 'block';
    submitBtn.textContent = 'Registriraj se';
    subtitle.textContent = 'Registriraj se kao...';
    toggleTekst.textContent = 'Već imaš račun?';
    toggleBtn.textContent = 'Prijavi se';
  } else {
    imePolje.style.display = 'none';
    submitBtn.textContent = 'Prijavi se';
    subtitle.textContent = 'Prijavljuješ se kao...';
    toggleTekst.textContent = 'Nemaš račun?';
    toggleBtn.textContent = 'Registriraj se';
  }
}

document.getElementById('btn-toggle-modal').addEventListener('click', () => {
  postaviMod(modalMod === 'login' ? 'register' : 'login');
});

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

document.getElementById('btn-nav-login').addEventListener('click', () => {
  document.getElementById('login-modal').style.display = 'block';
});

document.getElementById('btn-preskoci').addEventListener('click', zatvoriLoginModal);

document.getElementById('btn-odjava').addEventListener('click', odjavi);

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const lozinka = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login');

  if (!odabranaUloga) {
    alert('Odaberi prijavuješ li se kao radnik ili vlasnik objekta.');
    return;
  }
  if (!email || !lozinka) {
    alert('Upiši email i lozinku.');
    return;
  }

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = '...';

  try {
    if (modalMod === 'register') {
      const ime = document.getElementById('login-ime').value.trim();
      if (!ime) {
        alert('Upiši ime i prezime.');
        btn.disabled = false;
        btn.textContent = originalText;
        return;
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ime, email, password: lozinka, uloga: odabranaUloga })
      });

      if (res.ok) {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: lozinka })
        });
        const data = await loginRes.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        jePrijavljen = true;
        prikaziPrijavljenog(data.user);
        zatvoriLoginModal();
      } else {
        const err = await res.json();
        alert(err.errors ? err.errors.join('\n') : 'Greška pri registraciji.');
      }
    } else {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: lozinka })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        jePrijavljen = true;
        prikaziPrijavljenog(data.user);
        zatvoriLoginModal();
      } else {
        alert('Pogrešan email ili lozinka.');
      }
    }
  } catch (e) {
    if (e.message !== '401') alert('Server nije dostupan, pokušaj ponovo.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

const map = L.map('map').setView([45.8150, 15.9819], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

async function ucitajPonude() {
  try {
    const response = await fetch(`${API_URL}/ponude`);
    if (!response.ok) throw new Error();
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
          <button onclick="prijaviSeNaSmjenu(this)">Prijavi se</button>
        </div>
      `);
    });
  } catch {
    document.getElementById('mapa-uputa').textContent = 'Ponude trenutno nisu dostupne.';
  }
}

async function adresaUKoordinate(adresa) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresa)}`);
  const data = await response.json();
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

async function prijaviSeNaSmjenu(btn) {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    map.closePopup();
    document.getElementById('login-modal').style.display = 'block';
    return;
  }
  if (user.uloga === 'sef') {
    alert('Samo radnici se mogu prijaviti na smjenu.');
    return;
  }

  btn.disabled = true;
  btn.textContent = '...';

  await new Promise(r => setTimeout(r, 600));

  btn.textContent = 'Prijavljeno ✓';
  btn.style.background = '#27ae60';
  setTimeout(() => map.closePopup(), 1000);
}

function otvoriFormuSef() {
  if (!jePrijavljen) {
    document.getElementById('login-modal').style.display = 'block';
    return;
  }
  document.getElementById('forma-sef').style.display = 'block';
}

function resetirajFormu() {
  document.getElementById('naziv').value = '';
  document.getElementById('lokacija').value = '';
  document.getElementById('satnica').value = '';
  document.getElementById('placanje').value = '';
  document.getElementById('sat-od-h').value = '08';
  document.getElementById('sat-od-m').value = '00';
  document.getElementById('sat-do-h').value = '16';
  document.getElementById('sat-do-m').value = '00';
}

document.getElementById('btn-zatvori').addEventListener('click', () => {
  document.getElementById('forma-sef').style.display = 'none';
});

document.getElementById('btn-objavi').addEventListener('click', async () => {
  const naziv = document.getElementById('naziv').value;
  const lokacija = document.getElementById('lokacija').value;
  const vrijemeOd = `${document.getElementById('sat-od-h').value}:${document.getElementById('sat-od-m').value}`;
  const vrijemeDo = `${document.getElementById('sat-do-h').value}:${document.getElementById('sat-do-m').value}`;
  const satnicaBroj = document.getElementById('satnica').value;
  const placanje = document.getElementById('placanje').value;
  const btn = document.getElementById('btn-objavi');

  if (!naziv || !lokacija || !satnicaBroj || !placanje) {
    alert('Popuni sva polja!');
    return;
  }
  if (vrijemeOd >= vrijemeDo) {
    alert('Kraj smjene mora biti nakon početka!');
    return;
  }

  btn.disabled = true;
  btn.textContent = '...';

  try {
    const koordinate = await adresaUKoordinate(lokacija);
    if (!koordinate) {
      alert('Adresa nije pronađena, pokušaj preciznije!');
      return;
    }

    const response = await apiFetch(`${API_URL}/ponude`, {
      method: 'POST',
      body: JSON.stringify({
        ponuda: {
          naziv,
          lokacija,
          vrijeme: `${vrijemeOd} - ${vrijemeDo}`,
          satnica: `${satnicaBroj}€/sat`,
          placanje,
          lat: koordinate.lat,
          lng: koordinate.lng
        }
      })
    });

    if (response.ok) {
      document.getElementById('forma-sef').style.display = 'none';
      resetirajFormu();
      ucitajPonude();
    } else {
      alert('Greška, pokušaj ponovo!');
    }
  } catch (e) {
    if (e.message !== '401') alert('Server nije dostupan, pokušaj ponovo.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Objavi smjenu';
  }
});

document.getElementById('btn-sef-pitch').addEventListener('click', otvoriFormuSef);

document.querySelector('.btn-konobar').addEventListener('click', () => {
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
});

function popuniSatove(el, defaultVal) {
  for (let i = 0; i < 24; i++) {
    const opt = document.createElement('option');
    opt.value = opt.textContent = String(i).padStart(2, '0');
    if (i === defaultVal) opt.selected = true;
    el.appendChild(opt);
  }
}

function popuniMinute(el, defaultVal) {
  ['00', '15', '30', '45'].forEach(m => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = m;
    if (m === defaultVal) opt.selected = true;
    el.appendChild(opt);
  });
}

popuniSatove(document.getElementById('sat-od-h'), 8);
popuniMinute(document.getElementById('sat-od-m'), '00');
popuniSatove(document.getElementById('sat-do-h'), 16);
popuniMinute(document.getElementById('sat-do-m'), '00');

document.querySelectorAll('.faq-pitanje').forEach(btn => {
  btn.addEventListener('click', () => {
    const stavka = btn.closest('.faq-stavka');
    const jeOtvoren = stavka.classList.contains('otvoren');
    document.querySelectorAll('.faq-stavka').forEach(s => s.classList.remove('otvoren'));
    if (!jeOtvoren) stavka.classList.add('otvoren');
  });
});

ucitajPonude();
