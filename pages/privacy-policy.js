// pages/privacy-policy.js
export default function PrivacyPolicy() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>Privatumo politika</h1>
      <p>
        Sveiki atvykę į BraveStep („mes“, „mūsų“, „mūsų svetainė“). 
        Mums rūpi jūsų privatumą – žemiau aprašome, kokius duomenis renkame 
        ir kaip juos naudojame.
      </p>
      <h2>Kokius duomenis renkame</h2>
      <ul>
        <li>Facebook profilio vardą, el. paštą ir atvaizdą (per NextAuth).</li>
        <li>Sporto planų informaciją (saugoma Neon PostgreSQL duomenų bazėje).</li>
      </ul>
      <h2>Kam naudojame duomenis</h2>
      <p>
        Duomenys reikalingi:
        <ul>
          <li>Autentifikacijai per Facebook;</li>
          <li>Individualių sporto planų kūrimui ir saugojimui;</li>
          <li>Paskyros valdymui bei prisijungimo/atsijungimo srautams.</li>
        </ul>
      </p>
      <h2>Trečiosios šalys</h2>
      <p>
        Duomenis tvarkome per NextAuth ir Neon. Jokių kitų duomenų neperduodame.
      </p>
      <h2>Kontaktai</h2>
      <p>Jei kyla klausimų: cwiexs@gmail.com</p>
    </main>
  )
}
