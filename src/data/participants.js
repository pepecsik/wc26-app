// Each participant: initials, avatar color, teams they own
const COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
  '#3498db','#9b59b6','#e91e63','#00bcd4','#8bc34a',
  '#ff5722','#607d8b','#795548','#ff9800','#673ab7',
  '#009688','#f44336','#2196f3','#4caf50','#ff4081',
  '#00acc1','#ffb300','#6d4c41','#546e7a',
];

const raw = [
  { name: 'Adam',         teams: ['JOR','USA'], photo: '/avatars/Adam.png' },
  { name: 'Ali',          teams: ['UZB','COL'], photo: '/avatars/Ali .png' },
  { name: 'Blake',        teams: ['SWE','CRO'], photo: '/avatars/Blake.png' },
  { name: 'Charlie',      teams: ['NOR','GER'], photo: '/avatars/Charlie.png' },
  { name: 'Chonga',       teams: ['CZE','SKO'], photo: '/avatars/Chonga.png' },
  { name: 'Emma',         teams: ['CIV','ENG'], photo: '/avatars/Emma.png' },
  { name: 'J$',           teams: ['PAN','TUR'], photo: '/avatars/J$.png' },
  { name: 'Jimmy',        teams: ['ALG','SEN'], photo: '/avatars/Jimmy.png' },
  { name: 'Kimbo',        teams: ['CPV','MOR'], photo: '/avatars/Kimbo.png' },
  { name: 'Malou',        teams: ['CUR','URU'], photo: '/avatars/Malou.png' },
  { name: 'Michael',      teams: ['SCO','ECU'], photo: '/avatars/Michael.png' },
  { name: 'Nathanial',    teams: ['HAI','BEL'], photo: '/avatars/Nathanial.png' },
  { name: 'Pepe',         teams: ['SAF','JPN'], photo: '/avatars/Pepe.png' },
  { name: 'Purcy',        teams: ['CAN','NED'], photo: '/avatars/Purcy.png' },
  { name: 'Russ',         teams: ['COD','IRN'], photo: '/avatars/Russ.png' },
  { name: 'Rand',         teams: ['TUN','BRA'], photo: '/avatars/Rand.png' },
  { name: 'Rogier',       teams: ['QAT','AUT'], photo: '/avatars/Rogier.png' },
  { name: 'Sabo',         teams: ['BOS','MEX'], photo: '/avatars/Sabo.png' },
  { name: 'Scotty2Hotty', teams: ['GHA','POR'], photo: '/avatars/Scotty2Hotty.png' },
  { name: 'Sebastian',    teams: ['PAR','FRA'], photo: '/avatars/Sebastian SS Sparenberg.png' },
  { name: 'Sjaak',        teams: ['SAU','ESP'], photo: '/avatars/Sjaak.png' },
  { name: 'Tim',          teams: ['NZL','SWI'], photo: '/avatars/Tim.png' },
  { name: 'Tobias',       teams: ['EGY','ARG'], photo: '/avatars/Tobias.png' },
  { name: 'Will Hunt',    teams: ['IRQ','AUS'], photo: '/avatars/Will Hunt.png' },
];

// Build lookup maps
export const PARTICIPANTS = raw.map((p, i) => ({
  ...p,
  color: COLORS[i % COLORS.length],
  initials: p.name.split(/\s+/).map(w => w[0].toUpperCase()).join('').slice(0, 2),
}));

// team code → participant
export const TEAM_OWNER = {};
PARTICIPANTS.forEach(p => {
  p.teams.forEach(t => { TEAM_OWNER[t] = p; });
});
