const webpackConfig = require('./webpack.config.js');

module.exports = function (grunt) {

    grunt.initConfig({

        webpack:
            {
                options:
                    {
                        stats: !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
                    },
                prod: webpackConfig,
                dev: Object.assign({watch: true}, webpackConfig)
            },

        copy: {
            js: {
                expand: true,
                src: 'js/*',
                dest: 'build/',
            },
            config: {
                src: 'igvwebConfig.js',
                dest: 'dist/',
            },
            resources: {
                expand: true,
                src: 'resources/*',
                dest: 'dist/'
            }
        },

        'string-replace': {
            dist: {
                files: {
                    'dist/index.html': 'index.html'
                },
                options: {
                    replacements: [
                        {
                            pattern: '<script type="module" src="js/app.js"></script>',
                            replacement: ''
                        },
                        {
                            pattern: '<!--bundle-->',
                            replacement: '<script src="bundle.js"></script>'
                        }]
                }
            }
        },

        clean: ['build']
    });




    //load the copy module
    grunt.loadNpmTasks('grunt-contrib-copy');

    //register the build task


    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['copy', 'inject-apikeys', 'webpack:prod', 'string-replace:dist', 'clean']);


    grunt.task.registerTask('inject-apikeys', 'Inject API keys', function () {

        var bitlyToken = grunt.option('bitlyToken');
        var apiKey = grunt.option('apiKey');
        var clientId = grunt.option('clientId');

        var contents;

        contents = grunt.file.read('dist/igvwebConfig.js');

        if(bitlyToken || apiKey || clientId) {
            if (bitlyToken) {
                contents = contents.replace('BITLY_TOKEN', bitlyToken);
            }
            if (apiKey) {
                contents = contents.replace('API_KEY', apiKey);
            }
            if (clientId) {
                contents = contents.replace("CLIENT_ID", clientId);
            }

            grunt.file.write('dist/igvwebConfig.js', contents);
        }
    });

};


