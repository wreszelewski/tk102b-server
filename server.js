const net = require('net');
const moment = require('moment');
const axios = require('axios');

const initLine = /^##,imei:[0-9]+,A;$/
const imeiLine = /^[0-9]+;$/

const endpoint = process.argv[2]

const server = net.createServer(socket => {
	socket.on('data', (data) => {
		decryptedData = data.toString();
		if(decryptedData.match(initLine)) {
			socket.write('LOAD');
		} else if(decryptedData.match(imeiLine)) {
			socket.write('ON');
		} else {
			const preprocessedLine = decryptedData.split(',');
			const msgType = getType(preprocessedLine);
			if(msgType === 'tracker') {
				handleTracker(preprocessedLine);
			}
		}
	});	
});

function getType(preprocessedLine) {
	return preprocessedLine[1];
}

function handleTracker(preprocessedLine) {

	const hasFix = checkFix(preprocessedLine);
	if(hasFix) {
		const time = getTime(preprocessedLine);
		const latitude = getLatitude(preprocessedLine);
		const longitude = getLongitude(preprocessedLine);

		console.log(time);
		axios.post(endpoint, {
			timestamp: time,
			latitude: latitude,
			longitude: longitude,
			elevation: 0
		}).then(res => console.log(res.data));
	}

};

function getTime(preprocessedLine) {
	return moment.utc(preprocessedLine[2], 'YYMMDDHHmmss').toISOString();
	
}

function checkFix(preprocessedLine) {
	return preprocessedLine[6] === 'A';
}


function getLatitude(preprocessedLine) {
	let value = calculateDegrees(parseFloat(preprocessedLine[9]));
	if(preprocessedLine[10] === 'S') {
		value = -value;
	}
	return value;
}

function getLongitude(preprocessedLine) {
	let value = calculateDegrees(parseFloat(preprocessedLine[7]));
	if(preprocessedLine[8] === 'W') {
		value = -value;
	}
	return value;
}

function calculateDegrees(value) {
	const degrees = Math.floor(value / 100);
	const minutes = value - degrees*100;
	return degrees + minutes/60;
}
server.listen(8080, '0.0.0.0');
