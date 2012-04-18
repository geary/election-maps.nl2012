// elections-fr.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var elections = {
	2012: {
		fr: {
			tzHour: +2,
			photos: true,
			candidates: [
				{ color: '#FF0000', id: 'arthaud', firstName: 'Nathalie', lastName: 'Arthaud', fullName: 'Nathalie Arthaud' },
				{ color: '#00FF00', id: 'bayrou', firstName: 'Fran&ccedil;ois', lastName: 'Bayrou', fullName: 'Fran&ccedil;ois Bayrou' },
				{ color: '#0000FF', id: 'cheminade', firstName: 'Jacques', lastName: 'Cheminade', fullName: 'Jacques Cheminade' },
				{ color: '#FFFF00', id: 'aignan', firstName: 'Nicolas', lastName: 'Dupont-Aignan', fullName: 'Nicolas Dupont-Aignan' },
				{ color: '#FF00FF', id: 'hollande', firstName: 'Fran&ccedil;ois', lastName: 'Hollande', fullName: 'Fran&ccedil;ois Hollande' },
				{ color: '#00FFFF', id: 'joly', firstName: 'Eva', lastName: 'Joly', fullName: 'Eva Joly' },
				{ color: '#FF7700', id: 'lepen', firstName: 'Marine', lastName: 'Le Pen', fullName: 'Marine Le Pen' },
				{ color: '#7700FF', id: 'melenchon', firstName: 'Jean-Luc', lastName: 'M&eacute;lenchon', fullName: 'Jean-Luc M&eacute;lenchon' },
				{ color: '#00FF77', id: 'poutou', firstName: 'Philippe', lastName: 'Poutou', fullName: 'Philippe Poutou' },
				{ color: '#77FF00', id: 'sarkozy', firstName: 'Nicolas', lastName: 'Sarkozy', fullName: 'Nicolas Sarkozy' }
			]
		}
	}
};

//var states = [
//	{
//		abbr: 'FR',
//		name: 'France',
//		bounds: {
//			bbox: [ -13885233, 2819924, -7452828, 6340332 ],
//			centerLL: [ -95.841534, 38.004972 ]
//		},
//		type: 'Primaries',
//		date: '2012',
//		electionid: '2511',
//		electionidCounties: '2508',
//		electionidDelegates: '2510',
//		votesby: 'state',
//		done: false
//	},
//	{
//		fips: '01',
//		abbr: 'AL',
//		name: 'Alabama',
//		date: '2012-03-13',
//		electionid: '2540',
//		done: false
//	},
//	{
//		fips: '02',
//		abbr: 'AK',
//		name: 'Alaska',
//		type: 'Caucus',
//		date: '2012-03-06',
//		electionid: '2524',
//		done: false
//	},
//	{
//		fips: '04',
//		abbr: 'AZ',
//		name: 'Arizona',
//		date: '2012-02-28',
//		electionid: '2522',
//		done: false
//	},
//	{
//		fips: '05',
//		abbr: 'AR',
//		name: 'Arkansas',
//		date: '2012-05-22',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '06',
//		abbr: 'CA',
//		name: 'California',
//		date: '2012-06-05',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '08',
//		abbr: 'CO',
//		name: 'Colorado',
//		type: 'Caucus',
//		date: '2012-02-07',
//		electionid: '2518',
//		done: false
//	},
//	{
//		fips: '09',
//		abbr: 'CT',
//		name: 'Connecticut',
//		votesby: 'town',
//		date: '2012-04-24',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '10',
//		abbr: 'DE',
//		name: 'Delaware',
//		date: '2012-04-24',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '11',
//		abbr: 'DC',
//		name: 'District of Columbia',
//		date: '2012-04-03',
//		electionid: '2545',
//		done: false
//	},
//	{
//		fips: '12',
//		abbr: 'FL',
//		name: 'Florida',
//		date: '2012-01-31',
//		electionid: '2516',
//		done: true
//	},
//	{
//		fips: '13',
//		abbr: 'GA',
//		name: 'Georgia',
//		date: '2012-03-06',
//		electionid: '2525',
//		done: false
//	},
//	{
//		fips: '15',
//		abbr: 'HI',
//		name: 'Hawaii',
//		bounds: {
//			bbox: [ -17838905, 2145221, -17233301, 2539543 ],
//			centerLL: [ -157.529494, 20.575318 ]
//		},
//		type: 'Caucus',
//		date: '2012-03-13',
//		electionid: '2541',
//		done: false
//	},
//	{
//		fips: '16',
//		abbr: 'ID',
//		name: 'Idaho',
//		type: 'Caucus',
//		date: '2012-03-06',
//		electionid: '2526',
//		done: false
//	},
//	{
//		fips: '17',
//		abbr: 'IL',
//		name: 'Illinois',
//		date: '2012-03-20',
//		electionid: '2543',
//		done: false
//	},
//	{
//		fips: '18',
//		abbr: 'IN',
//		name: 'Indiana',
//		date: '2012-05-08',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '19',
//		abbr: 'IA',
//		name: 'Iowa',
//		type: 'Caucus',
//		date: '2012-01-03',
//		electionid: '2512',
//		done: true
//	},
//	{
//		fips: '20',
//		abbr: 'KS',
//		name: 'Kansas',
//		type: 'Caucus',
//		date: '2012-03-10',
//		electionid: '2539',
//		done: false
//	},
//	{
//		fips: '21',
//		abbr: 'KY',
//		name: 'Kentucky',
//		date: '2012-05-22',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '22',
//		abbr: 'LA',
//		name: 'Louisiana',
//		date: '2012-03-24',
//		electionid: '2544',
//		done: false
//	},
//	{
//		fips: '23',
//		abbr: 'ME',
//		name: 'Maine',
//		type: 'Caucus',
//		date: '2012-02-11',
//		electionid: '2521',
//		votesby: 'state',
//		done: false
//	},
//	{
//		fips: '24',
//		abbr: 'MD',
//		name: 'Maryland',
//		date: '2012-04-03',
//		electionid: '2546',
//		done: false
//	},
//	{
//		fips: '25',
//		abbr: 'MA',
//		name: 'Massachusetts',
//		date: '2012-03-06',
//		electionid: '2528',
//		votesby: 'town',
//		fix: {
//			"Agawam": "Agawam Town",
//			"Amesbury": "Amesbury Town",
//			"Barnstable": "Barnstable Town",
//			"Braintree": "Braintree Town",
//			"Easthampton": "Easthampton Town",
//			"Franklin": "Franklin Town",
//			"Greenfield": "Greenfield Town",
//			"Manchester": "Manchester-by-the-Sea",
//			"Methuen": "Methuen Town",
//			"Palmer": "Palmer Town",
//			"Southbridge": "Southbridge Town",
//			"Watertown": "Watertown Town",
//			"West Springfield": "West Springfield Town",
//			"Weymouth": "Weymouth Town",
//			"Winthrop": "Winthrop Town"
//		},
//		done: false
//	},
//	{
//		fips: '26',
//		abbr: 'MI',
//		name: 'Michigan',
//		date: '2012-02-28',
//		electionid: '2523',
//		done: false
//	},
//	{
//		fips: '27',
//		abbr: 'MN',
//		name: 'Minnesota',
//		type: 'Caucus',
//		date: '2012-02-07',
//		electionid: '2519',
//		done: false
//	},
//	{
//		fips: '28',
//		abbr: 'MS',
//		name: 'Mississippi',
//		date: '2012-03-13',
//		electionid: '2542',
//		done: false
//	},
//	{
//		fips: '29',
//		abbr: 'MO',
//		name: 'Missouri',
//		date: '2012-02-07',
//		electionid: '2520',
//		done: false
//	},
//	{
//		fips: '30',
//		abbr: 'MT',
//		name: 'Montana',
//		type: 'Caucus',
//		date: '2012-06-16',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '31',
//		abbr: 'NE',
//		name: 'Nebraska',
//		type: 'Caucus',
//		date: '2012-06-10',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '32',
//		abbr: 'NV',
//		name: 'Nevada',
//		type: 'Caucus',
//		date: '2012-02-04',
//		electionid: '2517',
//		done: true
//	},
//	{
//		fips: '33',
//		abbr: 'NH',
//		name: 'New Hampshire',
//		fix: {
//			"Harts Location": "Hart's Location",
//			"Waterville": "Waterville Valley",
//			"Wentworth's Location": "3300780740"
//		},
//		votesby: 'town',
//		date: '2012-01-10',
//		electionid: '2513',
//		suffixes: {},
//		done: true
//	},
//	{
//		fips: '34',
//		abbr: 'NJ',
//		name: 'New Jersey',
//		date: '2012-06-05',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '35',
//		abbr: 'NM',
//		name: 'New Mexico',
//		date: '2012-06-05',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '36',
//		abbr: 'NY',
//		name: 'New York',
//		date: '2012-04-24',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '37',
//		abbr: 'NC',
//		name: 'North Carolina',
//		date: '2012-05-08',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '38',
//		abbr: 'ND',
//		name: 'North Dakota',
//		type: 'Caucus',
//		date: '2012-03-06',
//		electionid: '2538',
//		votesby: 'district',
//		done: false
//	},
//	{
//		fips: '39',
//		abbr: 'OH',
//		name: 'Ohio',
//		date: '2012-03-06',
//		electionid: '2530',
//		done: false
//	},
//	{
//		fips: '40',
//		abbr: 'OK',
//		name: 'Oklahoma',
//		date: '2012-03-06',
//		electionid: '2531',
//		done: false
//	},
//	{
//		fips: '41',
//		abbr: 'OR',
//		name: 'Oregon',
//		date: '2012-05-15',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '42',
//		abbr: 'PA',
//		name: 'Pennsylvania',
//		date: '2012-04-24',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '44',
//		abbr: 'RI',
//		name: 'Rhode Island',
//		date: '2012-04-24',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '45',
//		abbr: 'SC',
//		name: 'South Carolina',
//		date: '2012-01-21',
//		electionid: '2515',
//		done: true
//	},
//	{
//		fips: '46',
//		abbr: 'SD',
//		name: 'South Dakota',
//		date: '2012-06-05',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '47',
//		abbr: 'TN',
//		name: 'Tennessee',
//		date: '2012-03-06',
//		electionid: '2532',
//		done: false
//	},
//	{
//		fips: '48',
//		abbr: 'TX',
//		name: 'Texas',
//		date: '2012-05-29',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '49',
//		abbr: 'UT',
//		name: 'Utah',
//		date: '2012-06-26',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '50',
//		abbr: 'VT',
//		name: 'Vermont',
//		fix: {
//			"Barre Town": "5002303250",
//			"Enosburgh": "Enosburg",
//			"Ferrisburg": "Ferrisburgh",
//			"Newport Town": "5001948925",
//			"Rutland Town": "5002161300",
//			"St. Albans Town": "5001161750"
//		},
//		date: '2012-03-06',
//		electionid: '2534',
//		done: false
//	},
//	{
//		fips: '51',
//		abbr: 'VA',
//		name: 'Virginia',
//		date: '2012-03-06',
//		electionid: '2535',
//		done: false
//	},
//	{
//		fips: '53',
//		abbr: 'WA',
//		name: 'Washington',
//		type: 'Caucus',
//		date: '2012-03-03',
//		electionid: '2536',
//		done: false
//	},
//	{
//		fips: '54',
//		abbr: 'WV',
//		name: 'West Virginia',
//		date: '2012-05-08',
//		electionid: '',
//		done: false
//	},
//	{
//		fips: '55',
//		abbr: 'WI',
//		name: 'Wisconsin',
//		date: '2012-04-03',
//		electionid: '2547',
//		done: false
//	},
//	{
//		fips: '56',
//		abbr: 'WY',
//		name: 'Wyoming',
//		type: 'Caucus',
//		date: '2012-03-10',
//		electionid: '2537',
//		votesby: 'state',
//		done: false
//	}/*,
//	{
//		fips: '72',
//		abbr: 'PR',
//		name: 'Puerto Rico',
//		date: '2012-03-18',
//		electionid: '',
//		done: false
//	}*/
//];
