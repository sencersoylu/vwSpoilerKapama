const Sequelize = require('sequelize');
const snap7 = require('node-snap7');
const { SerialPort } = require('serialport');
const pad = require('pad');
const { DelimiterParser } = require('@serialport/parser-delimiter');

const port = new SerialPort({
	path: 'COM3',
	baudRate: 9600,
});

const parser = port.pipe(new DelimiterParser({ delimiter: '$' }));

const typeDetect = (data) => {
	if (data.includes('3J0827933.1')) {
		return 'SPDES';
	} else if (data.includes('3J0827939.2')) {
		return 'SLFNDES';
	} else if (data.includes('3J0827939.1')) {
		return 'SLFNEST';
	} else if (data.includes('3J0827940.2')) {
		return 'SGFNDES';
	} else if (data.includes('3J0827940.1')) {
		return 'SGFNEST';
	} else if (data.includes('VW S1A')) {
		return 'SPEST';
	} else if (data.includes('3J0971171')) {
		return 'SPKABLO';
	} else if (data.includes('X2027')) {
		return 'SPLAMBA';
	}
};

port.on('open', () => console.log('Port open'));
port.on('close', () => {
	console.log('Port close');
	setTimeout(() => {
		port.open();
	}, 5000);
});
port.on('error', (err) => {
	console.error(err);
	setTimeout(() => {
		port.open();
	}, 5000);
});

parser.on('data', (data) => {
	data = data.toString('ascii');
	data = data
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$');
	console.log(data);

	var s7client = new snap7.S7Client();
	var buf = Buffer.from(pad(data, 100), 'ascii');
	var ok_buf = Buffer.from('1', 'utf-8');

	console.log(buf);

	const transfer = {
		OKUNAN_BARKOD: data,
		RENK: 'RED',
		TIP: 'TIP',
		OK: '1',
	};

	s7client.ConnectTo('192.168.1.10', 0, 0, function (err) {
		if (err)
			return console.log(
				' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err)
			);

		// console.log("read data");
		// s7client.DBRead(200, 0,buf.length, function(err, res) {
		//     if(err)
		//         return console.log(' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));

		//     console.log(res.toString('ascii'));
		// });

		console.log('write data');
		s7client.DBWrite(200, 0, buf.length, buf, function (err, res) {
			if (err) {
				return console.log(
					' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err)
				);
			}

			s7client.MBWrite(170, ok_buf.length, ok_buf, function (err, res) {
				if (err) {
					return console.log(
						' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err)
					);
					s7client.Disconnect();
				}

				s7client.Disconnect();
			});
		});
	});
});
