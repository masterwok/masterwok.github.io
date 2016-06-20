'use strict';

module.exports = function(grunt) {

    var config = {
        jsFiles: [
            'lib/wow/dist/wow.min.js'
            , 'lib/gameoflifejs/dist/gameOfLife.min.js'
        ]
        , cssFiles: [
            'css/site.css'
            , 'lib/components-font-awesome/css/font-awesome.min.css'
            , 'lib/bootstrap/dist/css/bootstrap.min.css'
            , 'lib/animate.css/animate.min.css'
        ]
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
        , watch: {
            scripts: {
                files: config.jsFiles
                , tasks: ['uglify']
            }
            , css: {
                files: config.cssFiles
                , tasks: ['csslint', 'cssmin']
            }
        }
        , csslint: {
            options: {
                csslintrc: '.csslintrc'
            }
            , all: {
                src: 'css/site.css'
            }
        }
        , uglify: {
            dist: {
                options: {
                    sourceMap: false
                    , banner: '/*! Resume Minified | Jonathan Trowbridge */'
                }
                , files: {
                    'scripts/site.min.js': config.jsFiles
                }
            }
        }
        , cssmin: {
            dist: {
                options: {
                    keepSpecialComments: '0'
                    , rebase: true
                    , banner: '/*! Resume Minified | Jonathan Trowbridge */'
                    , root: ''
                }
                , files: {
                    'css/style.min.css': config.cssFiles
                }
            }
        }
        , browserSync: {
            bsFiles: {
                src: [
                    'scripts/site.min.js'
                    , 'css/style.min.css'
                ]
            }
            , options: {
                watchTask: true
                , server: './'
                , port: 666
            }
        }

    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');

    // Default task(s).
    grunt.registerTask('lint', ['csslint']);
    grunt.registerTask('minify', ['uglify', 'cssmin']);
    grunt.registerTask('default', ['lint', 'minify', 'browserSync', 'watch']);

};
