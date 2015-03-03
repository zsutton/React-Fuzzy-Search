var gulp = require('gulp');
var browserify = require('browserify');
var del = require('del');
var source = require('vinyl-source-stream');


var paths = {
    entry: ['./src/index.js'],
    js: ['src/**/*.js']
};

gulp.task('clean', function(done) {
    del(['build'], done);
});

gulp.task('js', ['clean'], function() {
    return browserify({
                entries: './src/index.js',
                standalone: "FuzzySearch",
                external: ["react"]
            })
    		.external("react")
            .bundle()
            .pipe(source('fuzzysearch.js'))
            .pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
    gulp.watch(paths.js, ['js']);
});

gulp.task('default', ['watch', 'js']);