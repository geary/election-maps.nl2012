// elections.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

var elections = {
	2008: {
		dem: {
			tableids: 'TODO',
			candidates: [
				{ color: '#20FF1F', id: 'biden', firstName: 'Joe', lastName: 'Biden', fullName: 'Joe Biden' },
				{ color: '#FFFA00', id: 'clinton', firstName: 'Hillary', lastName: 'Clinton', fullName: 'Hillary Clinton' },
				{ color: '#E4Af95', id: 'dodd', firstName: 'Chris', lastName: 'Dodd', fullName: 'Chris Dodd' },
				{ color: '#FF1300', id: 'edwards', firstName: 'John', lastName: 'Edwards', fullName: 'John Edwards' },
				{ color: '#8A5C2E', id: 'gravel', firstName: 'Mike', lastName: 'Gravel', fullName: 'Mike Gravel' },
				{ color: '#EE00B5', id: 'kucinich', firstName: 'Dennis', lastName: 'Kucinich', fullName: 'Dennis Kucinich' },
				{ color: '#1700E8', id: 'obama', firstName: 'Barack', lastName: 'Obama', fullName: 'Barack Obama' },
				{ color: '#336633', id: 'richardson', firstName: 'Bill', lastName: 'Richardson', fullName: 'Bill Richardson' }
			]
		},
		gop: {
			tableids: {
				IA: '2549421'
			},
			candidates: [
				{ color: '#336633', id: 'giuliani', firstName: 'Rudy', lastName: 'Giuliani', fullName: 'Rudy Giuliani' },
				{ color: '#D50F25', id: 'huckabee', firstName: 'Mike', lastName: 'Huckabee', fullName: 'Mike Huckabee' },
				{ color: '#8A5C2E', id: 'hunter', firstName: 'Duncan', lastName: 'Hunter', fullName: 'Duncan Hunter' },
				{ color: '#3369E8', id: 'mcCain', firstName: 'John', lastName: 'McCain', fullName: 'John McCain' },
				{ color: '#009925', id: 'paul', firstName: 'Ron', lastName: 'Paul', fullName: 'Ron Paul' },
				{ color: '#EEB211', id: 'romney', firstName: 'Mitt', lastName: 'Romney', fullName: 'Mitt Romney' },
				{ color: '#EE00B5', id: 'tancredo', firstName: 'Tom', lastName: 'Tancredo', fullName: 'Tom Tancredo' },
				{ color: '#20FF1F', id: 'thompson', firstName: 'Fred', lastName: 'Thompson', fullName: 'Fred Thompson' }
			]
		}
	},
	2012: {
		gop: {
			tableids: {
				IA: '2458834',
				NH: '2568627'
			},
			photos: true,
			candidates: [
				{ color: '#DE6310', id: 'bachmann', firstName: 'Michele', lastName: 'Bachmann', fullName: 'Michele Bachmann' },
				{ color: '#666666', id: 'cain', firstName: 'Herman', lastName: 'Cain', fullName: 'Herman Cain' },
				{ color: '#D50F25', id: 'gingrich', firstName: 'Newt', lastName: 'Gingrich', fullName: 'Newt Gingrich' },
				{ color: '#54F1F1', id: 'huntsman', firstName: 'Jon', lastName: 'Huntsman', fullName: 'Jon Huntsman' },
				{ color: '#009925', id: 'paul', firstName: 'Ron', lastName: 'Paul', fullName: 'Ron Paul' },
				{ color: '#3369E8', id: 'perry', firstName: 'Rick', lastName: 'Perry', fullName: 'Rick Perry' },
				{ color: '#A58DF4', id: 'roemer', firstName: 'Buddy', lastName: 'Roemer', fullName: 'Buddy Roemer', skip: true },
				{ color: '#EEB211', id: 'romney', firstName: 'Mitt', lastName: 'Romney', fullName: 'Mitt Romney' },
				{ color: '#AA0C76', id: 'santorum', firstName: 'Rick', lastName: 'Santorum', fullName: 'Rick Santorum' }
			]
		}
	}
};

var states = [
	{
		fips: '00',
		abbr: 'US',
		name: 'United States',
		date: '2012',
		electionid: '2511',
		votesby: 'state',
		done: false
	},
	{
		fips: '02',
		abbr: 'AK',
		name: 'Alaska',
		type: 'Caucus',
		date: 'March 6, 2012',
		electionid: '2524',
		done: false
	},
	{
		fips: '04',
		abbr: 'AZ',
		name: 'Arizona',
		date: 'February 28, 2012',
		electionid: '2522',
		done: false
	},
	{
		fips: '08',
		abbr: 'CO',
		name: 'Colorado',
		type: 'Caucus',
		date: 'February 7, 2012',
		electionid: '2518',
		done: false
	},
	{
		fips: '12',
		abbr: 'FL',
		name: 'Florida',
		date: 'January 31, 2012',
		electionid: '2516',
		done: true
	},
	{
		fips: '13',
		abbr: 'GA',
		name: 'Georgia',
		date: 'March 6, 2012',
		electionid: '2525',
		done: false
	},
	{
		fips: '16',
		abbr: 'ID',
		name: 'Idaho',
		type: 'Caucus',
		date: 'March 6, 2012',
		electionid: '2526',
		done: false
	},
	{
		fips: '19',
		abbr: 'IA',
		name: 'Iowa',
		type: 'Caucus',
		date: 'January 3, 2012',
		electionid: '2512',
		done: true
	},
	{
		fips: '23',
		abbr: 'ME',
		name: 'Maine',
		type: 'Caucus',
		date: 'February 11, 2012',
		electionid: '2521',
		votesby: 'state',
		done: false
	},
	{
		fips: '25',
		abbr: 'MA',
		name: 'Massachussetts',
		date: 'March 6, 2012',
		electionid: '2528',
		votesby: 'town',
		done: false
	},
	{
		fips: '26',
		abbr: 'MI',
		name: 'Michigan',
		date: 'February 28, 2012',
		electionid: '2523',
		done: false
	},
	{
		fips: '27',
		abbr: 'MN',
		name: 'Minnesota',
		type: 'Caucus',
		date: 'February 7, 2012',
		electionid: '2519',
		done: false
	},
	{
		fips: '29',
		abbr: 'MO',
		name: 'Missouri',
		date: 'February 7, 2012',
		electionid: '2520',
		done: false
	},
	{
		fips: '32',
		abbr: 'NV',
		name: 'Nevada',
		type: 'Caucus',
		date: 'February 4, 2012',
		electionid: '2517',
		done: true
	},
	{
		fips: '33',
		abbr: 'NH',
		name: 'New Hampshire',
		votesby: 'town',
		date: 'January 10, 2012',
		electionid: '2513',
		suffixes: {},
		done: true
	},
	{
		fips: '38',
		abbr: 'ND',
		name: 'North Dakota',
		type: 'Caucus',
		date: 'March 6, 2012',
		electionid: '2529',
		votesby: 'state',
		done: false
	},
	{
		fips: '39',
		abbr: 'OH',
		name: 'Ohio',
		date: 'March 6, 2012',
		electionid: '2530',
		done: false
	},
	{
		fips: '40',
		abbr: 'OK',
		name: 'Oklahoma',
		date: 'March 6, 2012',
		electionid: '2531',
		done: false
	},
	{
		fips: '45',
		abbr: 'SC',
		name: 'South Carolina',
		date: 'January 21, 2012',
		electionid: '2515',
		done: true
	},
	{
		fips: '47',
		abbr: 'TN',
		name: 'Tennessee',
		date: 'March 6, 2012',
		electionid: '2532',
		done: false
	},
	{
		fips: '50',
		abbr: 'VT',
		name: 'Vermont',
		date: 'March 6, 2012',
		electionid: '2534',
		done: false
	},
	{
		fips: '51',
		abbr: 'VA',
		name: 'Virginia',
		date: 'March 6, 2012',
		electionid: '2535',
		done: false
	}
];
