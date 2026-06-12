// Each participant: initials, avatar color, teams they own
const COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
  '#3498db','#9b59b6','#e91e63','#00bcd4','#8bc34a',
  '#ff5722','#607d8b','#795548','#ff9800','#673ab7',
  '#009688','#f44336','#2196f3','#4caf50','#ff4081',
  '#00acc1','#ffb300','#6d4c41','#546e7a',
];

const raw = [
  { name: 'Adam',                teams: ['JOR','USA'] },
  { name: 'Ali',                 teams: ['UZB','COL'] },
  { name: 'Blake',               teams: ['SWE','CRO'] },
  { name: 'Charlie',             teams: ['NOR','GER'] },
  { name: 'Chonga',              teams: ['CZE','SKO'] },
  { name: 'Emma',                teams: ['CIV','ENG'] },
  { name: 'J$',                  teams: ['PAN','TUR'] },
  { name: 'Jimmy',               teams: ['ALG','SEN'] },
  { name: 'Kimbo',               teams: ['CPV','MOR'] },
  { name: 'Malou',               teams: ['CUR','URU'] },
  { name: 'Michael',             teams: ['SCO','ECU'] },
  { name: 'Nathanial',           teams: ['HAI','BEL'] },
  { name: 'Pepe',                teams: ['SAF','JPN'] },
  { name: 'Purcy',               teams: ['CAN','NED'] },
  { name: 'Russ',                teams: ['COD','IRN'] },
  { name: 'Rand',                teams: ['TUN','BRA'] },
  { name: 'Rogier',              teams: ['QAT','AUT'] },
  { name: 'Sabo',                teams: ['BOS','MEX'] },
  { name: 'Scotty2Hotty',        teams: ['GHA','POR'] },
  { name: 'Sebastian',           teams: ['PAR','FRA'] },
  { name: 'Sjaak',               teams: ['SAU','ESP'] },
  { name: 'Tim',                 teams: ['NZL','SWI'] },
  { name: 'Tobias',              teams: ['EGY','ARG'] },
  { name: 'Will Hunt',           teams: ['IRQ','AUS'] },
];

// Build lookup maps
export const PARTICIPANTS = raw.map((p, i) => ({
  ...p,
  color: COLORS[i % COLORS.length],
  initials: p.name.split(/\s+/).map(w => w[0].toUpperCase()).join('').slice(0, 2),
  photo: null, // swap to '/avatars/name.jpg' when photos are available
}));

// team code → participant
export const TEAM_OWNER = {};
PARTICIPANTS.forEach(p => {
  p.teams.forEach(t => { TEAM_OWNER[t] = p; });
});
