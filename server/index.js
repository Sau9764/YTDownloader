const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fs = require('fs')

// Buildin with nodejs
const cp = require('child_process');
const readline = require('readline');
const ffmpeg = require('ffmpeg-static');

const app = express();

app.use(cors());

app.get('/download', (req,res) => {

    var URL = req.query.URL;
    var format = req.query.quality;
    var default_path = req.query.path;

    var basic_info = ytdl.getInfo(URL).then(info => {

        var file_name = info.player_response.videoDetails.title;

        if(format == 'full_hd_video'){
           
            file_name = file_name.replace(/[^a-zA-Z ]/g,'').replace(/ /g,'_') + '_1080p.mp4';
            console.log('File -> ' + file_name + ' is Downloding...\n');
        
            const tracker = {
                start: Date.now(),
                audio: { downloaded: 0, total: Infinity },
                video: { downloaded: 0, total: Infinity },
                merged: { frame: 0, speed: '0x', fps: 0 },
            };
        
            // Get audio and video streams
            const audio = ytdl(URL, { quality: 'highestaudio' })
            .on('progress', (_, downloaded, total) => {
                tracker.audio = { downloaded, total };
            });
            const video = ytdl(URL, { quality: 'highestvideo' })
            .on('progress', (_, downloaded, total) => {
                tracker.video = { downloaded, total };
            });

            // Prepare the progress bar
            let progressbarHandle = null;
            const progressbarInterval = 1000;
            const showProgress = () => {
                readline.cursorTo(process.stdout, 0);
                const toMB = i => (i / 1024 / 1024).toFixed(2);

                process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
                process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

                process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
                readline.moveCursor(process.stdout, 0, -3);
            };

            // Start the ffmpeg child process
            const ffmpegProcess = cp.spawn(ffmpeg, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:4',
                '-i', 'pipe:5',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Define output file
                `${default_path}/${file_name}.mkv`,
                ], 
                {
                    windowsHide: true,
                    stdio: [
                        /* Standard: stdin, stdout, stderr */
                        'inherit', 'inherit', 'inherit',
                        /* Custom: pipe:3, pipe:4, pipe:5 */
                        'pipe', 'pipe', 'pipe',
                    ],
                }
            );

            ffmpegProcess.on('close', () => {
                clearInterval(progressbarHandle);
                console.log('\n done \n');
            });

            // Link streams
            // FFmpeg creates the transformer streams and we just have to insert / read data
            ffmpegProcess.stdio[3].on('data', chunk => {
                // Start the progress bar
                if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
                // Parse the param=value list returned by ffmpeg
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (const l of lines) {
                    const [key, value] = l.split('=');
                    args[key.trim()] = value.trim();
                }
                tracker.merged = args;
            });

            audio.pipe(ffmpegProcess.stdio[4]);
            video.pipe(ffmpegProcess.stdio[5]);

        }else if(format == '360_video'){

            file_name = file_name.replace(/[^a-zA-Z ]/g,'').replace(/ /g,'_') + '_360p.mp4';
            console.log('File ' + file_name + ' is Downloding...\n');
            res.header('Content-Disposition', 'attachment; filename=' + file_name);
            var stream = ytdl(URL, {quality: '18'}).pipe(fs.createWriteStream(`${default_path}/${file_name}`));
            stream.on('close', () => {
                console.log('\nDone\n');
            })

        }else {

            file_name = file_name.replace(/[^a-zA-Z ]/g,'').replace(/ /g,'_') + '_audioOnly.mp3';
            console.log('File ' + file_name + ' is Downloding...\n');
            res.header('Content-Disposition', 'attachment; filename=' + file_name);
            var stream = ytdl(URL, { filter: 'audioonly'}).pipe(fs.createWriteStream(`${default_path}/${file_name}`));
            stream.on('close', () => {
                console.log('\nDone\n');
                res.send()
            })
        }
    })
});

app.listen(4000, () => {
    console.log('Server Works !!! At port 4000\n');
});