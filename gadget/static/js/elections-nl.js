// elections-fr.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var partiesNL2012 = [
	// "color|id|nameNL|nameEN"
	"#CC33CC|50PLUS|50PLUS|50PLUS",
	"#EE6600|AEP|Anti Euro Partij|Anti Euro Party",
	"#FFFF00|CDA|CDA|CDA",
	"#FFCC00|CU|ChristenUnie|ChristianUnion",
	"#00FFAA|D66|D66|D66",
	"#2299DD|DPK|Democratisch Politiek Keerpunt|Democratic Political Turning Point",
	"#44FF00|GL|GroenLinks|GreenLeft",
	"#1166AA|LP|Libertarische Partij|Libertarian Party ",
	"#223388|LibDem|Liberaal Democratische Partij|Liberal Democratic Party",
	"#0000FF|NedLok|Nederland Lokaal|Nederland Lokaal",
	"#555555|Overige|Overige 2010|Other 2010",
	"#552299|PIRATEN|Piratenpartij|Pirate Party",
	"#44AA44|PVDD|Partij voor de Dieren|Party for the Animals",
	"#AA2266|PVDM|Partij voor Mens en Spirit|Party for Human and Spirit",
	"#BBBBBB|PVV|Partij voor de Vrijheid|Party for Freedom",
	"#FF0000|PvdA|Partij van de Arbeid|Labour Party",
	"#442277|PvdT|Partij van de Toekomst|Party of the Future",
	"#EEAA00|SGP|SGP|Reformed Political Party",
	"#5588AA|SOPN|Soeverein Onafhankelijke Pioniers Nederland|Sovereign Independent Pioneers Netherlands",
	"#CC0000|SP|SP|Socialist Party",
	"#0066EE|VVD|VVD|VVD"
].map( function( s ) {
	s = s.split('|');
	var party = {
		color: s[0],
		id: s[1],
		name: s[2],
		nameEN: s[3]
	};
	if( params.hl == 'en' ) {
		party.name = party.nameEN;
	}
	party.lastName = party.name;
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
