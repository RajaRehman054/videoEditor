var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var app = express();
var videoshow = require('videoshow');
var { getAudioDurationInSeconds } = require('get-audio-duration');
var fs = require('fs');
var fileUpload = require('express-fileupload');
require('dotenv').config();

app.listen(process.env.PORT || 4000, () => {
	console.log('Running on port 4000.');
});

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.post('/items', async (req, res, next) => {
	try {
		const audio = req.files.audio;
		const img = req.files.img;
		const pathA = __dirname + '/files/' + audio.name;
		const pathI = __dirname + '/files/' + img.name;
		await audio.mv(pathA, err => {
			if (err) throw err;
		});
		await img.mv(pathI, err => {
			if (err) throw err;
		});

		const duration = await getAudioDurationInSeconds(pathA);

		var images = [pathI];
		var videoOptions = {
			fps: 25,
			loop: duration,
			transition: true,
			transitionDuration: 1,
			videoBitrate: 1024,
			videoCodec: 'libx264',
			size: '640x?',
			audioBitrate: '128k',
			audioChannels: 2,
			format: 'mp4',
			pixelFormat: 'yuv420p',
		};

		videoshow(images, videoOptions)
			.audio(pathA)
			.save('video.mp4')
			.on('start', function (command) {})
			.on('error', function (err, stdout, stderr) {})
			.on('end', function (output) {
				res.sendFile(__dirname + '/video.mp4', function (error) {
					if (error) {
						res.status(500).json({ success: false, error });
					}
				});
			});
	} catch (error) {
		res.status(500).json({ success: false, error });
	}
});

app.use(function (req, res, next) {
	next(createError(404));
});

app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.json({ err: err });
});
