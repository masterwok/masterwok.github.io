'use strict';

module.exports = function(grunt) {

    var config = {
        jsFiles: [
            'scripts/main.js'
        ]
        , cssFiles: [
            'css/site.css'
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
                src: config.cssFiles
            }
        }
        , uglify: {
            dist: {
                options: {
                    sourceMap: false
                    , preserveComments: false
                }
                , files: {
                    'scripts/main.min.js': config.jsFiles
                }
            }
        }
        , cssmin: {
            dist: {
                options: {
                    rebase: true
                    , keepSpecialComments: 0
                }
                , files: {
                    'css/site.min.css': config.cssFiles
                }
            }
        }
        , browserSync: {
            bsFiles: {
                src: [
                    'scripts/main.min.js'
                    , 'css/site.min.css'
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
