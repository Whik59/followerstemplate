export interface Sale {
  username: string;
  quantity: number;
  product: string;
}

const quantities = [100, 250, 500, 1000, 2500, 5000, 10000];
const productNames = [
  "Instagram Followers",
  "TikTok Followers"
];
const usernames = [
  "nadia.digitalcm", "marcmdigital", "digitalstudio.arg", "areasocialvsr", "communitygui", "cm.ampi",
  "erre_stores", "click.grafico", "zharajoyas", "tuapoyodigital_", "fmvillasantarosa", "merygrameable",
  "maruganame", "laestepaferia", "esmeraldavega", "ilevaralda", "danzasjessicacorzo", "arcoiriscrochet.vm",
  "cookielenceria", "augusto_lecler", "rochi.s.e", "jaz_vayra", "noelandya", "mavic.sgo", "maticanavesio8",
  "valenr.cm", "disenarsinculpa", "tux_stickers", "by.stephii", "jazmar.accesorios", "sergiodreossi",
  "gguid_", "titina_comunity", "impulsa.mktt", "communitymanager_yuliana2024", "conectacondaniela",
  "nomadic.estudio", "amordivinoacc", "keivillyduarte", "anaaliaga", "axellautaro_s", "raj__boy__25251",
  "alber_canavesiooo", "cer.spa", "mili_makeupart", "aixa.glitterbar", "pandoranailsnqn", "fraktal.dg",
  "00st.arboy00", "joako.71", "valedom.cm", "darkheartsmakeup", "cursosencasa2025", "iohana_olivera",
  "pri_gauna18", "mareestrategadigital", "karen_luquue", "magentaa.vsr", "marianabaigorria07",
  "coaching.meraki", "dental_paniagua", "tapicerluu.20", "velasarom_", "rochi.artesanias", "anabellacatalinau",
  "marciabrochero", "yhwh_todo_poderoso", "marta.arevalo.7587", "mil_deseos1", "mlgestiondigital",
  "clubdechicaspc", "puntonativocomunidad", "wwwchavdakirit.85333", "guada_castro_8706", "nico.camp47",
  "sre_ya7747", "micieloweb", "mirettimelania_", "danu923", "cielitoorc18", "islo_m8017", "eelianafrezza",
  "hadi_l1643", "xiomaramariel6", "elina9382024", "leyla.agzade2024", "juli.lopezluna"
];

function maskUsername(username: string): string {
  if (username.length <= 3) return 'xxx';
  return username.slice(0, -3) + 'xxx';
}

export const recentSales: Sale[] = usernames.map(username => {
  const randomProduct = productNames[Math.floor(Math.random() * productNames.length)];
  const randomQuantity = quantities[Math.floor(Math.random() * quantities.length)];
  return {
    username: maskUsername(username),
    quantity: randomQuantity,
    product: randomProduct,
  };
}); 