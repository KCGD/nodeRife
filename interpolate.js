/*
    RIFE model downloaded from here: https://github.com/nihui/rife-ncnn-vulkan
    make sure executable (and all other files) are extracted into the same folder as this .js file
*/

'use strict';
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const progress = require('cli-progress');
const ffmpegPath = require('ffmpeg-static');

//globals
var framerate = 0;
var inputFrameLength = 0;
var cliProgressBar = null;
var cliProgressUpdateLoop = null;

//verify args
const input = process.argv[2];
if(typeof input === "undefined") {
    console.error("[ERROR]: no input!");
    console.log("Usage: [video file]");
    process.exit(1);
} else {

    console.log("[INFO]: getting video info for [" + input + "]");
    let _c = require('child_process').exec(`${ffmpegPath} -i ${input} 2>&1 | sed -n "s/.*, \\(.*\\) fp.*/\\1/p"`, (err, stdout) => {

        framerate = stdout;
        console.log(`[INFO]: input video is ${framerate.replace("/\n/g", "").replace("/\r/g", "")}fps, set to interpolate to ${framerate*2}fps`);
        _cleanOutputs();
    })
}

//delete temporary folders
function _cleanOutputs(){
    //remove input_frames
    console.log('[INFO]: clearing input and output directories...');

    try{
        //console.log("[REMOVE]: removing input_frames");
        rimraf.sync(path.join(process.cwd(), "./input_frames"));
    } catch (e) {
        console.log("[WARN]: input_frames does not exist");
    }

    //console.log("[REMOVE]: created input_frames");
    fs.mkdirSync(path.join(process.cwd(), "./input_frames"));

    //remove output_frames
    try{
        //console.log("[REMOVE]: removing output_frames");
        rimraf.sync(path.join(process.cwd(), "./output_frames"));
    } catch (e) {
        console.log("[WARN]: output_frames does not exist");
    }

    //console.log("[REMOVE]: created output_frames");
    fs.mkdirSync(path.join(process.cwd(), "./output_frames"));

    _extractAudio();
}

//audio extraction
function _extractAudio(){
    console.log(`[INFO]: extracting audio to audio.m4a`);
    let _c = require('child_process').exec(`${ffmpegPath} -y -i ${input} -vn -acodec copy audio.m4a`);

    _c.stdout.on('data', (data) => {
        console.log(`[FFMPEG]: ${data.toString()}`);
    })

    _c.on('error', (e) => {
        console.error(`[ERROR]: FATAL: ffmpeg threw error during audio extraction!\n${e}`);
        process.exit(1);
    })

    _c.on('close', () => {
        _extractFrames();
    })
}

//frame extraction
function _extractFrames() {
    console.log(`[INFO]: extracting frames from ${input}`);
    let _c = require('child_process').exec(`${ffmpegPath} -i ${input} input_frames/frame_%08d.png`);

    _c.stdout.on('data', (data) => {
        console.log(`[FFMPEG]: ${data.toString()}`);
    })

    _c.on('error', (e) => {
        console.error(`[ERROR]: FATAL: ffmpeg threw error during frame extraction!\n${e}`);
        process.exit(1);
    })

    _c.on('close', () => {
        _interpolate();
    })
}

//interpolation
function _interpolate() {
    console.log(`[INFO]: Starting interpolation! (this may take a while)`);
    let _c = require('child_process').spawn(`./rife-ncnn-vulkan/build/rife-ncnn-vulkan`, ["-i", path.join(process.cwd(), "./input_frames"), "-o", path.join(process.cwd(), "./input_frames")], {cwd: path.join(process.cwd()), stdio: "inherit"});

    //get frame stats for progress bar
    inputFrameLength = fs.readdirSync(path.join(process.cwd(), "./input_frames")).length;

    //init progress bar
    cliProgressBar = new progress.SingleBar({
        format: 'Interpolation |' + '{bar}' + '| {percentage}% || {value}/{total} Frames',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    })

    cliProgressBar.start(inputFrameLength * 2, 0);

    //make update loop
    cliProgressUpdateLoop = setInterval(function() {
        cliProgressBar.update(fs.readdirSync(path.join(process.cwd(), "./output_frames")).length);
    }, 500);

    _c.on('error', (e) => {
        console.error(`[ERROR]: FATAL: Error in interpolation!\n${e}`);
        process.exit(1);
    })

    //compile video, disable progress bar and associated loop
    _c.on('close', () => {
        clearInterval(cliProgressUpdateLoop);
        cliProgressBar.stop();
        _toVideo();
    })
}

//encode back into video
function _toVideo() {
    console.log(`[INFO]: building final video...`);
    var _c;

    //check if audio file exists (it might not if video has no audio)
    if(fs.existsSync(path.join(process.cwd(), "./audio.m4a"))){
        _c = require('child_process').exec(`${ffmpegPath} -y -framerate ${Math.floor(framerate * 2)} -i output_frames/%08d.png -i audio.m4a -c:a copy -crf 20 -c:v libx264 -pix_fmt yuv420p output.mp4`);
    } else {
        console.log(`[WARN]: No audio file found! Output video wont have an audio track!`);
        _c = require('child_process').exec(`${ffmpegPath} -y -framerate ${Math.floor(framerate * 2)} -i output_frames/%08d.png -c:a copy -crf 20 -c:v libx264 -pix_fmt yuv420p output.mp4`);
    }

    _c.stdout.on('data', (data) => {
        console.log(`[FFMPEG]: ${data.toString()}`);
    })

    _c.on('error', (e) => {
        console.error(`[ERROR]: FATAL: ffmpeg threw error during video building!\n${e}`);
        process.exit(1);
    })

    _c.on('close', () => {
        _cleanUp();
    })
}

function _cleanUp() {
    console.log(`[INFO]: Cleaning up...`);

    console.log(`[CLEANUP]: Removing temporaries...`);
    rimraf.sync(path.join(process.cwd(), "./input_frames"));
    rimraf.sync(path.join(process.cwd(), "./output_frames"));
    rimraf.sync(path.join(process.cwd(), "./audio.m4a"));

    _done();
}

function _done() {
    console.log(`[INFO]: Process completed!`);
    process.exit(0);
}