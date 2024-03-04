// Compress when not dev.
var is_dev = false;
// Sourcemaps when debug.
var is_debug = true;

var groups = {
    main: {
        src: 'src/main.js',
        dest: 'tmp/main.js'
    },
    wireframe: {
        src: 'src/wireframe/main.js',
        dest: 'tmp/wireframe.js'
    },
    rasterization: {
        src: 'src/rasterization/main.js',
        dest: 'tmp/rasterization.js'
    },
    voxels: {
        src: 'src/voxels/main.js',
        dest: 'tmp/voxels.js'
    },
    quadtree: {
        src: 'src/quadtree/main.js',
        dest: 'tmp/quadtree.js'
    },
    raycaster: {
        src: 'src/raycaster/main.js',
        dest: 'tmp/raycaster.js'
    },
    raycaster_editor: {
        src: 'src/raycaster/editor.js',
        dest: 'tmp/raycaster_editor.js'
    }
};

var register_tasks = function(grunt)
{
    var tasks = ['clean', 'browserify'];

    if (is_debug)
        tasks.push('exorcise');

    if (!is_dev)
        tasks.push('terser');

    tasks.push('copy');

    grunt.registerTask('build', tasks);

    for (var key in groups)
    {
        var tasks = [];
        tasks.push('browserify:' + key);

        if (is_debug)
            tasks.push('exorcise:' + key);

        if (!is_dev)
            tasks.push('terser:' + key);

        tasks.push('copy:default')
        tasks.push('copy:' + key);
        // console.log('build_' + key, tasks);
        grunt.registerTask('build_' + key, tasks);
    }
};

var copy_files_list = function(name)
{
    var res = [];

    var main_js = name +'.js';
    res.push(main_js);

    if (is_debug)
        res.push(main_js + '.map');

    return res;
};

module.exports = function(grunt)
{
	grunt.initConfig({
        browserify:
		{
            options:
            {
                browserifyOptions:
                {
                    debug: is_debug,
                    paths: ['src/', './']
                },
                transform: [
                    ["babelify", {
                        presets: ["@babel/preset-env"],
                        sourceMaps: is_debug
                    }]
                ]
            },

            main: {
                src: 'src/main.js',
                dest: 'tmp/main.js'
            },

            wireframe: {
				src: 'src/wireframe/main.js',
				dest: 'tmp/wireframe.js'
            },

            rasterization: {
				src: 'src/rasterization/main.js',
				dest: 'tmp/rasterization.js'
            },

            voxels: {
				src: 'src/voxels/main.js',
				dest: 'tmp/voxels.js'
            },

            quadtree: {
				src: 'src/quadtree/main.js',
				dest: 'tmp/quadtree.js'
            },

            raycaster: {
				src: 'src/raycaster/main.js',
				dest: 'tmp/raycaster.js'
            },

            raycaster_editor: {
				src: 'src/raycaster/editor.js',
				dest: 'tmp/raycaster_editor.js'
            }
		},

		exorcise:
		{
            main: {
                files: { 'tmp/main.js.map': ['tmp/main.js'] }
            },

			wireframe: {
				files: { 'tmp/wireframe.js.map': ['tmp/wireframe.js'] }
            },

            rasterization: {
				files: { 'tmp/rasterization.js.map': ['tmp/rasterization.js'] }
            },

            voxels: {
				files: { 'tmp/voxels.js.map': ['tmp/voxels.js'] }
            },

            quadtree: {
				files: { 'tmp/quadtree.js.map': ['tmp/quadtree.js'] }
            },

            raycaster: {
				files: { 'tmp/raycaster.js.map': ['tmp/raycaster.js'] }
            },

            raycaster_editor: {
				files: { 'tmp/raycaster_editor.js.map': ['tmp/raycaster_editor.js'] }
			}
		},

        terser:
        {
            main:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/main.js',
                        content: 'tmp/main.js.map'
                    }
                }
            },

            wireframe:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/wireframe.js',
                        content: 'tmp/wireframe.js.map'
                    }
                }
            },

            rasterization:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/rasterization.js',
                        content: 'tmp/rasterization.js.map'
                    }
                }
            },

            voxels:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/voxels.js',
                        content: 'tmp/voxels.js.map'
                    }
                }
            },

            quadtree:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/quadtree.js',
                        content: 'tmp/quadtree.js.map'
                    }
                }
            },

            raycaster:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/raycaster.js',
                        content: 'tmp/raycaster.js.map'
                    }
                }
            },

            raycaster_editor:
            {
                options: {
                    compress: is_dev ? false : {ecma: 2015},

                    sourceMap: {
                        filename: 'tmp/raycaster_editor.js',
                        content: 'tmp/raycaster_editor.js.map'
                    }
                }
            }
        },

        copy:
        {
            default:
            {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['libs/**/*'],
                        dest: 'build/'
                    },
                ]
            },

            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['index.html', 'style.css', 'common-style.css'],
                        dest: 'build/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('main'),
                        dest: 'build/'
                    },
                ]
            },

            voxels: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/voxels',
                        src: ['index.html'],
                        dest: 'build/voxels/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('voxels'),
                        dest: 'build/voxels/'
                    },
                ]
            },

            quadtree: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/quadtree',
                        src: ['index.html'],
                        dest: 'build/quadtree/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('quadtree'),
                        dest: 'build/quadtree/'
                    }
                ]
            },

            wireframe: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/wireframe',
                        src: ['index.html', 'style.css'],
                        dest: 'build/wireframe/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('wireframe'),
                        dest: 'build/wireframe/'
                    },
                ]
            },

            rasterization: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/rasterization',
                        src: ['index.html', 'style.css'],
                        dest: 'build/rasterization/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('rasterization'),
                        dest: 'build/rasterization/'
                    },
                ]
            },

            quadtree: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/quadtree',
                        src: ['index.html'],
                        dest: 'build/quadtree/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('quadtree'),
                        dest: 'build/quadtree/'
                    },
                ]
            },

            raycaster: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/raycaster',
                        src: ['index.html'],
                        dest: 'build/raycaster/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('raycaster'),
                        dest: 'build/raycaster/'
                    },
                ]
            },

            raycaster_editor: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/raycaster',
                        src: ['editor.html', 'style.css'],
                        dest: 'build/raycaster/'
                    },
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: copy_files_list('raycaster_editor'),
                        dest: 'build/raycaster/'
                    }
                ]
            }
        },

        clean: ['build']
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-terser');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-extract-sourcemap');
    grunt.loadNpmTasks('grunt-exorcise');

    grunt.registerTask('default');
    register_tasks(grunt);
}
