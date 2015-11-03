
var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');


gulp.task('ts', function () {

	var tsProject = ts.createProject('tsconfig.json');
	return tsProject.src() // instead of gulp.src(...)
		.pipe(plumber())
        .pipe(ts(tsProject))
		.pipe(gulp.dest('./'));
});


gulp.task('test', ['ts'], function () {

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


gulp.task('default', ['ts']);