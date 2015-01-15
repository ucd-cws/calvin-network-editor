/*jshint camelcase: false*/

module.exports = function (grunt) {
  'use strict';

  // load all grunt tasks
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-vulcanize');

  // configurable paths
  /*var config = {
    app: 'app',
    dist: 'dist',
    distMac32: 'dist/MacOS32',
    distMac64: 'dist/MacOS64',
    distLinux32: 'dist/Linux32',
    distLinux64: 'dist/Linux64',
    distWin: 'dist/Win',
    tmp: 'buildTmp',
    resources: 'resources'
  };*/

  grunt.initConfig({
      //config: config,
      nodewebkit: {
        options: {
            version : 'v0.11.5',
            platforms: ['win','osx'],
            buildDir: './webkitbuilds', // Where the build version of my node-webkit app is saved
        },
        src: ['./dist/**/*'] // Your node-webkit app
      },
    // Project settings
        yeoman: {
            // Configurable paths
            app: 'app',
            dist: 'dist',
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Renames files for browser caching purposes
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/{,*/}*.js',
                        //'<%= yeoman.dist %>/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/images/{,*/}*.{gif,jpeg,jpg,png,webp}',
                        //'<%= yeoman.dist %>/styles/fonts/{,*/}*.*'
                    ]
                }
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            options: {
                dest: '<%= yeoman.dist %>',
                verbose : true
            },
            html: '<%= yeoman.app %>/index.html'
        },

        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            options: {
                assetsDirs: ['<%= yeoman.dist %>']
            },
            html: ['<%= yeoman.dist %>/index.html']
            //,css: ['<%= yeoman.dist %>/styles/{,*/}*.css']
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{gif,jpeg,jpg,png}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeCommentsFromCDATA: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: '{,*/}*.html',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        'images/{,*/}*.webp',
                        'index.html',
                        'package.json',
                        'styles/fonts/{,*/}*.*',
                        'styles/*.css',
                        'scripts/*.js',
                        'fonts/{,*/}*.*'
                    ]
                }]
            },
            styles: {
                expand: true,
                dot: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },

        vulcanize: {
            default : {
                options: {
                    inline : true
                },
                files : {
                    '<%= yeoman.dist %>/elements.html': ['<%= yeoman.app %>/elements.html']
                }
            }
        },


        // Run some tasks in parallel to speed up build process
        concurrent: {
            server: [
                //'compass:server',
                'copy:styles'
            ],
            test: [
                'copy:styles'
            ],
            dist: [
                //'compass',
                'copy:styles',
                'imagemin',
                'svgmin'
            ]
        },

        shell: {
            // this should be done prior to running normal dev server, generates the webcomponets base.css file
            // also handles copying bower_components font-awesome /fonts dir
            'generate-deep-css' : {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: 'rm -rf <%= yeoman.app %>/styles/deep.css <%= yeoman.app %>/styles/tmp.* && ' +
                         'cp <%= yeoman.app %>/components/bootstrap/dist/css/bootstrap.css <%= yeoman.app %>/styles/tmp.bootstrap.css && '+
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\}\\(\\n *\\)\\([a-z\\.\\*]\\)/\\}\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\,\\(\\n *\\)\\([a-z\\.\\*]\\)/\\,\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\,\\( *\\)\\([a-z\\.]\\)/\\,\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\(@media[a-z0-9()-\\: ]*{\\n\\)/\\1 html \\/deep\\//g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                         // fix the modal selector
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/html \\/deep\\/ \\.modal-open \\.modal/.modal-open \\/deep\\/ .modal/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +

                         // there is issue where the regex adds html /deep/ to a animate keyframe set, this cleans it
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/  html \\/deep\\/ to {/  to {/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                         'cp <%= yeoman.app %>/components/animate-css/animate.css <%= yeoman.app %>/styles/tmp.animate.css && '+
                         'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\(\\n\\)\\(\\.[a-zA-Z]*\\)/\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.animate.css && ' +
                         'cat '+
                         '<%= yeoman.app %>/styles/tmp.bootstrap.css '+
                         '<%= yeoman.app %>/styles/tmp.animate.css '+
                         '>> <%= yeoman.app %>/styles/deep.css && '+
                         'rm -rf <%= yeoman.app %>/styles/tmp.*'

            },
            // the vulconizer imports all the custom elements everything we need
            // usemin compresses the css and js, makeing the components lib
            // unnecessary except the polymer script, only need to move over the font-awesome fontes
            'clear-bower-components' : {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: 'mv <%= yeoman.dist %>/components/font-awesome/fonts <%= yeoman.dist %>/ && '+
                         'rm -rf <%= yeoman.dist %>/components && '+
                         'rm -rf <%= yeoman.dist %>/elements'

            },
            'server' : {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: 'node server --dev'
            },
            'build-server' : {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: 'node server.js'
            },
            run : {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: 'node_modules/nodewebkit/bin/nodewebkit app/'
            }
        }
  });

  grunt.registerTask('run',[
    'shell:run'
  ]);

  grunt.registerTask('build',[
    'clean:dist',
    'copy:dist',
    'useminPrepare',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'usemin',
    'vulcanize',
    //'shell:clear-bower-components'
    'nodewebkit'
  ]);

 

};
