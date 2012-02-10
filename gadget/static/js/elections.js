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
		fips: '08',
		abbr: 'CO',
		name: 'Colorado',
		type: 'Caucus',
		date: 'February 7, 2012',
		electionid: '2105',
		done: false
	},
	{
		fips: '12',
		abbr: 'FL',
		name: 'Florida',
		date: 'January 31, 2012',
		electionid: '2102',
		done: true
	},
	{
		fips: '19',
		abbr: 'IA',
		name: 'Iowa',
		type: 'Caucus',
		date: 'January 3, 2012',
		electionid: 'random',
		done: true
	},
	{
		fips: '23',
		abbr: 'ME',
		name: 'Maine',
		type: 'Caucus',
		date: 'February 11, 2012',
		electionid: '2108',
		votesby: 'state',
		done: false
	},
	{
		fips: '27',
		abbr: 'MN',
		name: 'Minnesota',
		type: 'Caucus',
		date: 'February 7, 2012',
		electionid: '2106',
		done: false
	},
	{
		fips: '29',
		abbr: 'MO',
		name: 'Missouri',
		date: 'February 7, 2012',
		electionid: '2107',
		done: false
	},
	{
		fips: '32',
		abbr: 'NV',
		name: 'Nevada',
		type: 'Caucus',
		date: 'February 4, 2012',
		electionid: '2104|2103',
		done: true
	},
	{
		fips: '33',
		abbr: 'NH',
		name: 'New Hampshire',
		district: 'town',
		date: 'January 10, 2012',
		electionid: 'random',
		suffixes: {},
		done: true
	},
	{
		fips: '45',
		abbr: 'SC',
		name: 'South Carolina',
		date: 'January 21, 2012',
		electionid: '2502',
		done: true
	}
];
