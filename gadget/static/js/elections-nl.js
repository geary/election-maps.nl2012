// elections-fr.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var partiesNL2012 = [
	"#CC33CC|50PLUS|50PLUS|50PLUS|50PLUS|50PLUS|50PLUS",
	"#EE6600|AEP|Anti Euro Partij|Anti Euro Party|AEP|Anti Euro Partij|AEP",
	"#FFFF00|CDA|CDA|CDA|CDA|CDA|CDA",
	"#FFCC00|CU|ChristenUnie|ChristianUnion|CU|ChristenUnie|CU",
	"#00FFAA|D66|D66|D66|D66|D66|D66",
	"#2299DD|DPK|Democratisch Politiek Keerpunt|Democratic Political Turning Point|DPK|Democratisch Politiek Keerpunt|DPK",
	"#44FF00|GL|GroenLinks|GreenLeft|GL|GroenLinks|GL",
	"#1166AA|LP|Libertarische Partij|Libertarian Party |LP|Libertarische Partij|LP",
	"#223388|LibDem|Liberaal Democratische Partij|Liberal Democratic Party|LibDem|Liberaal Democratische Partij|LibDem",
	"#0000FF|NedLok|Nederland Lokaal|Nederland Lokaal|NedLok|Nederland Lokaal|NedLok",
	"#555555|Overige|Overige 2010|Other 2010|Other|Overige 2010|Overige",
	"#552299|PIRATEN|Piratenpartij|Pirate Party|PIRATEN|Piratenpartij|PIRATEN",
	"#44AA44|PVDD|Partij voor de Dieren|Party for the Animals|PvdD|Partij voor de Dieren|PvdD",
	"#AA2266|PVDM|Partij voor Mens en Spirit|Party for Human and Spirit|MenS|Partij voor Mens en Spirit|MenS",
	"#BBBBBB|PVV|Partij voor de Vrijheid|Party for Freedom|PVV|Partij voor de Vrijheid|PVV",
	"#FF0000|PvdA|Partij van de Arbeid|Labour Party|PvdA|Partij van de Arbeid|PvdA",
	"#442277|PvdT|Partij van de Toekomst|Party of the Future|PvdT|Partij van de Toekomst|PvdT",
	"#EEAA00|SGP|SGP|Reformed Political Party|SGP|SGP|SGP",
	"#5588AA|SOPN|Soeverein Onafh. Pioniers NL|Soeverein Onafhankelijke Pioniers Nederland|SOPN|Soeverein Onafhankelijke Pioniers Nederland|SOPN",
	"#CC0000|SP|SP|Socialist Party|SP|SP|SP",
	"#0066EE|VVD|Volkspartij voor Vrijheid en Democratie|People's Party for Freedom and Democracy|VVD|Volkspartij voor Vrijheid en Democratie|VVD"
].map( function( s ) {
	s = s.split('|');
	var party = {
		color: s[0],
		id: s[1],
		name: s[2],
		nameEN: s[3],
		abbrEN: s[4],
		nameNL: s[5],
		abbrNL: s[6]
	};
	if( params.hl == 'en' ) {
		party.name = party.nameEN;
	}
	else {
		party.name = party.nameNL;
	}
	return party;
});


var elections = {
	'2012': {
		date: '2012-09-12',
		tzHour: +2,
		photos: false,
		candidates: partiesNL2012,
		parties: partiesNL2012,
		electionids: {
			'NL': 2791
		}
	}
};
