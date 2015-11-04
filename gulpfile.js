
var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var merge = require('merge2');
var concat = require('gulp-concat');


var createTsBuild = function (options) {
	var tsProject = ts.createProject('tsconfig.json', options);
	return gulp.src([
			'Source/**/*.ts',
			'typings/**/*.d.ts',
			'node_modules/typescript/lib/lib.es6.d.ts'])
		.pipe(plumber())
        .pipe(ts(tsProject));
};


gulp.task('dev', function () {
	var tsResult = createTsBuild();
	return tsResult.js.pipe(gulp.dest('./'))
});


gulp.task('release', function () {
	var tsResult = createTsBuild({
		declaration: true,
		noExternalResolve: false,
		sourceMap: false,
		removeComments: true
	});

	return merge([
        tsResult.dts.pipe(gulp.dest('./Bin')),
        tsResult.js.pipe(gulp.dest('./Bin'))
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


gulp.task('default', ['dev']);