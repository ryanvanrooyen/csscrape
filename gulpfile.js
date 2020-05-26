
const { series, src, dest, watch } = require('gulp');
const { createProject } = require('gulp-typescript');
const mocha = require('gulp-mocha');
const plumber = require('gulp-plumber');
const insert = require('gulp-insert');
const sourcemaps = require('gulp-sourcemaps');


const soureFiles = 'Source/**/*.ts';
const testFiles = 'Tests/**/*.ts';


function dev() {
	var tsProject = createProject('tsconfig.json');
	var tsResult = src([soureFiles, testFiles], {base: './'})
		.pipe(plumber())
		.pipe(sourcemaps.init())
        .pipe(tsProject());

	return tsResult.js
		.pipe(sourcemaps.write('.', {
			includeContent:false,
			sourceRoot:'../'
		}))
		.pipe(dest('./'));
}


function release() {
	var tsProject = createProject('tsconfig.json', {
		sourceMap: false,
		removeComments: true
	});

	var tsResult = src([soureFiles])
		.pipe(plumber())
        .pipe(tsProject());
	return tsResult.js.pipe(dest('./bin'));
}


function copy_def() {
	return src('Source/csscrape.d.ts').pipe(dest('./bin'));
}


function add_env_to_main() {
	return src('bin/csscrape.js')
		.pipe(insert.prepend('#! /usr/bin/env node \n'))
		.pipe(dest('./bin'));
}


function test(cb) {
	return src('Tests/*Spec.js', { read: false })
		// gulp-mocha needs filepaths so no plugins before it
        .pipe(mocha())
		.on('error', function () { process.exitCode = 1; });
}


exports.dev = dev;
exports.test = series(dev, test);
exports.watch = () => watch([soureFiles, testFiles], series(dev, test));
exports.default = series(release, copy_def, add_env_to_main);
