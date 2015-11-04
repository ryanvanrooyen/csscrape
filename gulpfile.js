
/* global process */
var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var merge = require('merge2');
var sourcemaps = require('gulp-sourcemaps');


gulp.task('dev', function () {
	var tsProject = ts.createProject('tsconfig.json');
	var tsResult = gulp.src([
			'Source/**/*.ts',
			'Tests/**/*.ts',
			'typings/**/*.d.ts',
		], {base: './'})
		.pipe(plumber())
		.pipe(sourcemaps.init())
        .pipe(ts(tsProject));

	return tsResult.js
		.pipe(sourcemaps.write('.', {
			includeContent:false,
			sourceRoot:'../'
		}))
		.pipe(gulp.dest('./'));
});


gulp.task('release', function () {

	var tsProject = ts.createProject('tsconfig.json', {
		declaration: true,
		noExternalResolve: false,
		sourceMap: false,
		removeComments: true
	});

	var tsResult = gulp.src([
			'Source/**/*.ts',
			'typings/**/*.d.ts'
		])
		.pipe(plumber())
        .pipe(ts(tsProject));

	return merge([
        tsResult.js.pipe(gulp.dest('./Bin')),
        tsResult.dts.pipe(gulp.dest('./Bin'))
    ]);
});


gulp.task('test', ['dev'], function () {

	return gulp.src('Tests/*Spec.js', { read: false })
	// gulp-mocha needs filepaths so no plugins before it
        .pipe(mocha())
		.once('error', function () { process.exit(1); })
        .once('end', function () { process.exit(); });
});


gulp.task('watch', function () {
	gulp.watch(['./*.ts',
		'./Tests/*.ts',
		'./Tests/Files/**/*'], ['test']);
});


gulp.task('default', ['release']);