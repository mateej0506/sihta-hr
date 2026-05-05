const SUPABASE_URL = 'https://iaojenmaykymlbkepkop.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bUVRi3Qh55MsbKMbvDwKbQ_6Sh-Nw5-';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const map = L.map('map').setView([45.8150, 15.9819], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

async function ucitajPonude() {
  const { data, error } = await db
    .from('ponude')
    .select('*');

  if (error) {
    console.error('Greška:', error);
    return;
  }

  data.forEach(p => {
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

ucitajPonude();

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

  const { error } = await db
    .from('ponude')
    .insert([{ 
      naziv, 
      lokacija, 
      vrijeme, 
      satnica, 
      placanje, 
      lat: koordinate.lat, 
      lng: koordinate.lng 
    }]);

  if (error) {
    console.error('Greška:', error);
    return;
  }

  alert('Smjena objavljena!');
  document.getElementById('forma-sef').style.display = 'none';
  ucitajPonude();
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