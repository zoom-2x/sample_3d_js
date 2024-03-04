import Common from 'common'
import BoxModel from 'wireframe/models/box_model'
import TorusKnotModel from 'wireframe/models/torus_knot_model'
import AfricanHeadModel from 'wireframe/models/african_head_model'
import DiabloModel from 'wireframe/models/diablo_model'

var WIDTH = 800;
var HEIGHT = 800;

var screen_console = document.getElementById('console');
var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');

screen.width = WIDTH;
screen.height = HEIGHT;

var prev_timestamp = 0;
var buffer = screen_ctx.createImageData(WIDTH, HEIGHT);
var buffer_pitch = WIDTH << 2;

var settings = {
    fov: 45,
    aspect: WIDTH / HEIGHT,

    background_color: [0, 0, 0],
    wireframe_color: [56, 87, 122],
    point_color: [83, 157, 198],

    draw_points: false,
    draw_lines: true
};

// Setup matrices.
var VIEW = Common.mat4_lookat([0, -5, 0], [0, 0, 0], [0, 0, 1]);
var PROJECTION = Common.mat4_perspective(settings.aspect, Common.deg2rad(settings.fov), 0.1, 10);
var COMPOSED = Common.mat4_mul(PROJECTION, VIEW);
var VIEWPORT = Common.mat4_viewport(WIDTH, HEIGHT, 0, 0, 1);

// ----------------------------------------------------------------------------------
// -- Models.
// ----------------------------------------------------------------------------------

var Box = {
    model: BoxModel,

    base_scale: 0.8,
    position: [0, 0, 0],
    scale: [0.8, 0.8, 0.8],
    rotation: [0, 0, 0],

    rotation_speed: [Math.PI / 7000, Math.PI / 4000, Math.PI / 14000]
};

var TorusKnot = {
    model: TorusKnotModel,

    base_scale: 2,
    position: [0, 0, 0],
    scale: [2.0, 2.0, 2.0],
    rotation: [0, 0, 0],

    rotation_speed: [Math.PI / 3000, Math.PI / 10000, 0]
};

var AfricanHead = {
    model: AfricanHeadModel,

    base_scale: 1.7,
    position: [0, 0, 0],
    scale: [1.7, 1.7, 1.7],
    rotation: [0, 0, 0],

    rotation_speed: [0, 0, Math.PI / 7000]
};

var Diablo = {
    model: DiabloModel,

    base_scale: 0.8,
    position: [0, 0, 0.25],
    scale: [0.8, 0.8, 0.8],
    rotation: [0, 0, 0],

    rotation_speed: [0, 0, Math.PI / 7000]
};

var models = [Box, TorusKnot, AfricanHead, Diablo];
var obj = Box;

// ----------------------------------------------------------------------------------
// -- Settings panel.
// ----------------------------------------------------------------------------------

$('#draw_points').prop('checked', settings.draw_points);
$('#draw_lines').prop('checked', settings.draw_lines);
$('#scaling input').val(50);

$('#wireframe-panel').on('change', '#model_select', function(e)
{
    var $target = $(e.target);
    var model = $target.val();

    var s = $('#scaling input').val() / 50;

    obj = models[model];

    obj.scale[0] = s * obj.base_scale;
    obj.scale[1] = s * obj.base_scale;
    obj.scale[2] = s * obj.base_scale;
});

$('#wireframe-panel').on('change', '.draw_filter', function(e)
{
    var $target = $(e.target);

    if ($target.attr('id') == 'draw_points')
        settings.draw_points = $target.prop('checked');
    else if ($target.attr('id') == 'draw_lines')
        settings.draw_lines = $target.prop('checked');
});

var active_scaler = false;

$('#wireframe-panel').on('mousedown', '#scaling input', function(e) {
    active_scaler = true;
});

$('#wireframe-panel').on('mouseup', '#scaling input', function(e) {
    active_scaler = false;
});

$('#wireframe-panel').on('mousemove', '#scaling input', function(e)
{
    var $target = $(e.target);
    var scale = parseInt($target.val());

    scale /= 50;
    var s = obj.base_scale * scale;

    obj.scale[0] = s;
    obj.scale[1] = s;
    obj.scale[2] = s;
});

// ----------------------------------------------------------------------------------

// Triangles or quads.
var vertices_buffer = new Array(3 * 4);
var transformed_buffer = new Array(4 * 4);

function pack_color(color) {
    return 'rgba('+ color.join(',') + ')';
}

// var point_offsets = [0, -1, -1, 0, 0, 0, 1, 0, 0, 1];
var point_offsets = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1];

function draw_point(px, py)
{
    px = px | 0;
    py = py | 0;

    var nx;
    var ny;

    for (var i = 0; i < point_offsets.length; i += 2)
    {
        nx = px + point_offsets[i + 0];
        ny = py + point_offsets[i + 1];

        if (nx < 0 || nx > WIDTH)
            continue;

        if (ny < 0 || ny > HEIGHT)
            continue;

        var pointer = ny * buffer_pitch + (nx << 2);

        buffer.data[pointer + 0] = settings.point_color[0];
        buffer.data[pointer + 1] = settings.point_color[1];
        buffer.data[pointer + 2] = settings.point_color[2];
    }
}

function clamp(v, min, max)
{
    if (v < min)
        return min;

    if (v > max)
        return max;

    return v;
}

function valid_point(x, y) {
    return (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT);
}

function draw_line(p1x, p1y, p2x, p2y)
{
    var dx = Math.abs(p2x - p1x);
    var dy = Math.abs(p2y - p1y);

    if (dx >= dy)
    {
        if (p2x < p1x)
        {
            var tmp = p2x;
            p2x = p1x;
            p1x = tmp;

            var tmp = p2y;
            p2y = p1y;
            p1y = tmp;
        }

        var mx = (p2y - p1y) / (p2x - p1x);

        var start_xi = p1x | 0;
        var end_xi = p2x | 0;

        for (var xi = start_xi, y = p1y; xi <= end_xi; ++xi)
        {
            var yi = y | 0;

            if (valid_point(xi, yi))
            {
                var buffer_index = yi * buffer_pitch + (xi << 2);

                buffer.data[buffer_index + 0] = settings.wireframe_color[0];
                buffer.data[buffer_index + 1] = settings.wireframe_color[1];
                buffer.data[buffer_index + 2] = settings.wireframe_color[2];
            }

            y += mx;
        }
    }
    else
    {
        if (p2y < p1y)
        {
            var tmp = p2y;
            p2y = p1y;
            p1y = tmp;

            var tmp = p2x;
            p2x = p1x;
            p1x = tmp;
        }

        var my = (p2x - p1x) / (p2y - p1y);

        var start_yi = p1y | 0;
        var end_yi = p2y | 0;

        for (var yi = start_yi, x = p1x; yi <= end_yi; ++yi)
        {
            var xi = x | 0;

            if (valid_point(xi, yi))
            {
                var buffer_index = yi * buffer_pitch + (xi << 2);

                buffer.data[buffer_index + 0] = settings.wireframe_color[0];
                buffer.data[buffer_index + 1] = settings.wireframe_color[1];
                buffer.data[buffer_index + 2] = settings.wireframe_color[2];
            }

            x += my;
        }
    }
}

function clear_screen()
{
    var buffer_index = 0;

    for (var y = 0; y < HEIGHT; ++y)
    {
        for (var x = 0; x < WIDTH; ++x)
        {
            buffer.data[buffer_index + 0] = settings.background_color[0];
            buffer.data[buffer_index + 1] = settings.background_color[1];
            buffer.data[buffer_index + 2] = settings.background_color[2];
            buffer.data[buffer_index + 3] = 255;

            buffer_index += 4;
        }
    }
}

function render(timestamp)
{
    var t0 = performance.now();

    var delta = timestamp - prev_timestamp;
    prev_timestamp = timestamp;

    clear_screen();

    obj.rotation[0] += obj.rotation_speed[0] * delta;
    obj.rotation[1] += obj.rotation_speed[1] * delta;
    obj.rotation[2] += obj.rotation_speed[2] * delta;

    // Transformation setup (no translation).
    var mrx = Common.mat4_rotation_x(obj.rotation[0]);
    var mry = Common.mat4_rotation_y(obj.rotation[1]);
    var mrz = Common.mat4_rotation_z(obj.rotation[2]);
    var mscale = Common.mat4_scale(obj.scale[0], obj.scale[1], obj.scale[2]);

    var MODEL = Common.mat4_mul(Common.mat4_mul(mrz, Common.mat4_mul(mry, mrx)), mscale);

    MODEL[3] = obj.position[0];
    MODEL[7] = obj.position[1];
    MODEL[11] = obj.position[2];

    var proj = Common.mat4_mul(COMPOSED, MODEL);

    var vertices = obj.model.vertices;
    var faces = obj.model.faces;

    for (var i = 0; i < faces.length; i += obj.model.face_vertices)
    {
        // Process the vertices.
        for (var j = 0, vertex_index = 0; j < obj.model.face_vertices; ++j, vertex_index += 3)
        {
            var ti = (faces[i + j] - 1) * 3;

            vertices_buffer[vertex_index + 0] = vertices[ti + 0];
            vertices_buffer[vertex_index + 1] = vertices[ti + 1];
            vertices_buffer[vertex_index + 2] = vertices[ti + 2];
        }

        // Transform the vertices.
        for (var j = 0, vertex_index = 0, transformed_index = 0; j < obj.model.face_vertices; ++j, vertex_index += 3, transformed_index += 4)
        {
            Common.transform_point_buffer(proj,
                vertices_buffer[vertex_index + 0],
                vertices_buffer[vertex_index + 1],
                vertices_buffer[vertex_index + 2],
                transformed_buffer,
                transformed_index);

            Common.perspective_division_buffer(transformed_buffer, transformed_index);
            Common.viewport_transform_buffer(VIEWPORT, transformed_buffer, transformed_index);
        }

        // Draw lines.
        if (settings.draw_lines)
        {
            for (var k = 0; k < obj.model.face_vertices; ++k)
            {
                var current = k;
                var next = (k + 1) % obj.model.face_vertices;

                var current_index = (current << 2);
                var next_index = (next << 2);

                draw_line(transformed_buffer[current_index + 0], transformed_buffer[current_index + 1],
                    transformed_buffer[next_index + 0], transformed_buffer[next_index + 1]);
            }
        }

        // Draw points.
        if (settings.draw_points)
        {
            for (var k = 0, point_index = 0; k < obj.model.face_vertices; ++k, point_index += 4) {
                draw_point(transformed_buffer[point_index + 0], transformed_buffer[point_index + 1]);
            }
        }
    }

    // ----------------------------------------------------------------------------------
    // -- Console.
    // ----------------------------------------------------------------------------------

    var t1 = performance.now();
    var frame_ms = t1 - t0;
    var fps = 1000 / (frame_ms ? frame_ms : 0.001);
    var resolution = WIDTH + 'x' + HEIGHT;

    var console_html = '&raquo;&nbsp; '+ 'resolution: ' + resolution +' / ms: ' + frame_ms.toFixed(2);
    console_html += ' / ' + 'fps: ' + fps.toFixed(2);
    screen_console.innerHTML = console_html;

    screen_ctx.putImageData(buffer, 0, 0);
    window.requestAnimationFrame(render);
}

// -----------------------------------------------------------
// -- UI events.
// -----------------------------------------------------------

$("#wireframe-panel").on("click", "#back-to-menu-button", function(e) {
    window.location.href = "../index.html";
});

window.requestAnimationFrame(render);
