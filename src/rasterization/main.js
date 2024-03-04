// ----------------------------------------------------------------------------------
// -- Scanline triangle rasterizer.
// ----------------------------------------------------------------------------------

import Common from 'common'
import Textures from 'assets/textures/rasterizer.json'

import TriangleColorScene from 'rasterization/scenes/triangle_color'
import TorusKnotScene from 'rasterization/scenes/torus_knot'
import PlaneColorScene from 'rasterization/scenes/plane_color'
import PlaneTextureScene from 'rasterization/scenes/plane_texture'
import CubeTextureScene from 'rasterization/scenes/cube_texture'
import CubeGouraudScene from 'rasterization/scenes/cube_gouraud'
import AfricanHeadScene from 'rasterization/scenes/african_head'
import MonkeyScene from 'rasterization/scenes/monkey'
import HeadscanScene from 'rasterization/scenes/headscan'
import AlienScene from 'rasterization/scenes/alien'
import CyberpunkCarScene from 'rasterization/scenes/cyberpunk_car'
import DiabloScene from 'rasterization/scenes/diablo'
import AODScene from 'rasterization/scenes/aod'

var WIDTH = 800;
var HEIGHT = 600;

var root = document.getElementById('root');
var screen_console = document.getElementById('console');
var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');

var screen_buffer = screen_ctx.createImageData(WIDTH, HEIGHT);
var depth_buffer = new Array(WIDTH * HEIGHT);

screen.width = WIDTH;
screen.height = HEIGHT;

// ----------------------------------------------------------------------------------

var r_const = {
    ATTR_COUNT: 16,

    FLAG_BACKFACE_CULL: 1,
    FLAG_FILTERING: 2,
    FLAG_POINTS: 4,
    FLAG_LINES: 8,
    FLAG_TRIANGLES: 16,
};

var prev_timestamp = 0;

var console_data = {
    t_start: 0,
    t_draw_triangle_start: 0,
    t_draw_triangle_end: 0,
    t_shader_start: 0,
    t_shader_end: 0
};

var rasterizer = {
    name: 'Scanline rasterizer',

    fov: 45,
    aspect: WIDTH / HEIGHT,

    attrs: 3,
    pixel_color: [0, 0, 0],

    camera: {
        eye: [0, -3, 0],
        target: [0, 0, 0]
    },

    scanline_interp: new Array(r_const.ATTR_COUNT),
    gradient_dx: new Array(r_const.ATTR_COUNT),
    gradient_dy: new Array(r_const.ATTR_COUNT),

    triangle: create_triangle(),

    flags: r_const.FLAG_BACKFACE_CULL | r_const.FLAG_TRIANGLES,

    mesh_pointer: 0,
    mesh: null,
    texture: -1,

    wireframe_color: [56, 87, 122],
    point_color: [83, 157, 198],

    sampler: {
        tex_width: 0,
        tex_height: 0,
        tex_width_shift: 0,
        tex_pointer: 0,
        sample: Common.sample_texture
    },

    attribute_components: 0,

    scene: null,
    program: null,
    animation: null,

    MAT_MODEL: Common.mat4_empty(),
    MAT_NORMAL: Common.mat4_identity(),
    VIEW: Common.mat4_identity(),
    PROJECTION: Common.mat4_empty(),
    COMPOSED: Common.mat4_empty(),
    VIEWPORT: Common.mat4_empty(),
    MAT_FINAL: Common.mat4_empty()
};

var ONE80_OVER_PI = 57.2957795130823208768;
var PI_OVER_ONE80 = 0.01745329251994329577;
var ONE_OVER_255 = 0.00392156862745098039;

function rad2deg(angle) { return angle * ONE80_OVER_PI; };
function deg2rad(angle) { return angle * PI_OVER_ONE80; };
function dot(v1x, v1y, v2x, v2y) { return v1x * v2x + v1y * v2y; }
function len(bx, by) { return Math.sqrt(dot(bx, by, bx, by)); }
function lerp(v1, v2, t) { return v1 + (v2 - v1) * t; }

// ----------------------------------------------------------------------------------
// -- Settings panel.
// ----------------------------------------------------------------------------------

var scene_list = [
    TriangleColorScene,
    PlaneColorScene,
    PlaneTextureScene,
    CubeGouraudScene,
    TorusKnotScene,
    MonkeyScene,
    AfricanHeadScene,
    DiabloScene,
    HeadscanScene,
    CyberpunkCarScene,
    AlienScene,
    AODScene
];

$("#back-to-menu-button").click(function(e) {
    window.location.href = "../index.html";
});

$('#scaling input').val(50);
update_settings_flags();

$('#rasterization-panel').on('change', '#scene_select', function(e)
{
    var $target = $(e.target);
    var scene_index = $target.val();
    var scene = scene_list[scene_index];

    init_rasterizer(scene);
    update_settings_flags();

    $('#scaling input').val(50);

    scene.model.scale[0] = scene.model.base_scale;
    scene.model.scale[1] = scene.model.base_scale;
    scene.model.scale[2] = scene.model.base_scale;
});

$('#rasterization-panel').on('change', '.draw_filter', function(e)
{
    var $target = $(e.target);

    if ($target.attr('id') == 'draw_points')
    {
        if ($target.prop('checked'))
        {
            set_flag(r_const.FLAG_POINTS);
            unset_flag(r_const.FLAG_TRIANGLES);
        }
        else
            unset_flag(r_const.FLAG_POINTS);
    }
    else if ($target.attr('id') == 'draw_lines')
    {
        if ($target.prop('checked'))
        {
            set_flag(r_const.FLAG_LINES);
            unset_flag(r_const.FLAG_TRIANGLES);
        }
        else
            unset_flag(r_const.FLAG_LINES);
    }
    else if ($target.attr('id') == 'draw_triangles')
    {
        if ($target.prop('checked'))
        {
            set_flag(r_const.FLAG_TRIANGLES);
            unset_flag(r_const.FLAG_LINES | r_const.FLAG_POINTS);
        }
        else
            unset_flag(r_const.FLAG_TRIANGLES);
    }
    else if ($target.attr('id') == 'texture_filtering')
    {
        if ($target.prop('checked'))
            set_flag(r_const.FLAG_FILTERING);
        else
            unset_flag(r_const.FLAG_FILTERING);

        update_sample_func();
    }

    update_settings_flags();
});

var active_scaler = false;

$('#rasterization-panel').on('mousedown', '#scaling input', function(e) {
    active_scaler = true;
});

$('#rasterization-panel').on('mouseup', '#scaling input', function(e) {
    active_scaler = false;
});

$('#rasterization-panel').on('mousemove', '#scaling input', function(e)
{
    var $target = $(e.target);
    var scale = parseInt($target.val());

    scale /= 50;
    rasterizer.scene.scale_scaling = scale;
    var s = rasterizer.scene.model.base_scale * scale;

    rasterizer.scene.model.scale[0] = s;
    rasterizer.scene.model.scale[1] = s;
    rasterizer.scene.model.scale[2] = s;
});

function update_settings_flags()
{
    $('#draw_points').prop('checked', has_flag(r_const.FLAG_POINTS));
    $('#draw_lines').prop('checked', has_flag(r_const.FLAG_LINES));
    $('#draw_triangles').prop('checked', has_flag(r_const.FLAG_TRIANGLES));
    $('#texture_filtering').prop('checked', has_flag(r_const.FLAG_FILTERING));
}

// ----------------------------------------------------------------------------------

rasterizer.reset_flags = function() {
    rasterizer.flags = r_const.FLAG_BACKFACE_CULL | r_const.FLAG_TRIANGLES;
};

rasterizer.set_flag = set_flag;
rasterizer.unset_flag = unset_flag;

rasterizer.reset_camera = function()
{
    rasterizer.camera.eye = [0, -3, 0];
    rasterizer.camera.target = [0, 0, 0];
};

function has_flag(flag) {
    return (rasterizer.flags & flag) > 0;
}

function set_flag(flag) {
    rasterizer.flags |= flag;
};

function unset_flag(flag) {
    rasterizer.flags &= ~flag;
};

function set_texture(texture_index)
{
    var size_offset = texture_index << 1;

    rasterizer.sampler.tex_width = Textures.size[size_offset + 0];
    rasterizer.sampler.tex_height = Textures.size[size_offset + 1];
    rasterizer.sampler.tex_width_shift = Textures.shift[texture_index];
    rasterizer.sampler.tex_pointer = Textures.offset[texture_index];
}

function clear_screen()
{
    var buffer_index = 0;

    for (var y = 0; y < HEIGHT; ++y)
    {
        for (var x = 0; x < WIDTH; ++x)
        {
            screen_buffer.data[buffer_index + 0] = 0;
            screen_buffer.data[buffer_index + 1] = 0;
            screen_buffer.data[buffer_index + 2] = 0;
            screen_buffer.data[buffer_index + 3] = 255;

            buffer_index += 4;
        }
    }
}

function clear_depth()
{
    var buffer_index = 0;

    for (var i = 0; i < depth_buffer.length; ++i) {
        depth_buffer[i] = 1;
    }
}

function update_model_matrix()
{
    var mrx = Common.mat4_rotation_x(rasterizer.model.rotation[0]);
    var mry = Common.mat4_rotation_y(rasterizer.model.rotation[1]);
    var mrz = Common.mat4_rotation_z(rasterizer.model.rotation[2]);
    var mscale = Common.mat4_scale(rasterizer.model.scale[0], rasterizer.model.scale[1], rasterizer.model.scale[2]);

    Common.mat4_mul_dest(Common.mat4_mul(mrz, Common.mat4_mul(mry, mrx)), mscale, rasterizer.MAT_MODEL);
    Common.mat4_mul_dest(mrz, Common.mat4_mul(mry, mrx), rasterizer.MAT_NORMAL);

    rasterizer.MAT_MODEL[3] = rasterizer.model.position[0];
    rasterizer.MAT_MODEL[7] = rasterizer.model.position[1];
    rasterizer.MAT_MODEL[11] = rasterizer.model.position[2];
}

function create_vertex()
{
    var vertex = new Array(r_const.ATTR_COUNT);

    // Vertex format: [x, y, z, w, attr...]
    for (var i = 0; i < r_const.ATTR_COUNT; ++i) {
        vertex[i] = 0;
    }

    return vertex;
}

function create_edge()
{
    var edge = {
        v0: null,
        v1: null,

        startyi: 0,
        endyi: 0,

        x: 0,
        dxdy: 0,
        interp: new Array(r_const.ATTR_COUNT),
        steps: new Array(r_const.ATTR_COUNT)
    };

    return edge;
}

function create_triangle()
{
    var triangle = {
        vertices: [
            create_vertex(),
            create_vertex(),
            create_vertex()
        ],

        area: 0,

        e_bottom_top: create_edge(),
        e_bottom_middle: create_edge(),
        e_middle_top: create_edge(),

        reversed: false
    };

    return triangle;
}

function triangle_area2(v0, v1, v2) {
    return (v1[0] - v0[0]) * (v2[1] - v0[1]) - (v1[1] - v0[1]) * (v2[0] - v0[0]);
}

// var point_offsets = [0, -1, -1, 0, 0, 0, 1, 0, 0, 1];
var point_offsets = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1];

function draw_point(px, py)
{
    px = Math.ceil(px) | 0;
    py = Math.ceil(py) | 0;

    var nx;
    var ny;

    for (var i = 0; i < point_offsets.length; i += 2)
    {
        nx = px + point_offsets[i + 0];
        ny = py + point_offsets[i + 1];

        if (!valid_point(nx, ny))
            continue;

        var buffer_index = (ny * WIDTH + nx) << 2;

        screen_buffer.data[buffer_index + 0] = rasterizer.point_color[0];
        screen_buffer.data[buffer_index + 1] = rasterizer.point_color[1];
        screen_buffer.data[buffer_index + 2] = rasterizer.point_color[2];
    }
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

        var start_xi = Math.ceil(p1x) | 0;
        var end_xi = Math.ceil(p2x) | 0;

        for (var xi = start_xi, y = p1y; xi <= end_xi; ++xi)
        {
            var yi = Math.ceil(y) | 0;

            if (valid_point(xi, yi))
            {
                var buffer_index = (yi * WIDTH + xi) << 2;

                screen_buffer.data[buffer_index + 0] = rasterizer.wireframe_color[0];
                screen_buffer.data[buffer_index + 1] = rasterizer.wireframe_color[1];
                screen_buffer.data[buffer_index + 2] = rasterizer.wireframe_color[2];
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

        var start_yi = Math.ceil(p1y) | 0;
        var end_yi = Math.ceil(p2y) | 0;

        for (var yi = start_yi, x = p1x; yi <= end_yi; ++yi)
        {
            var xi = Math.ceil(x) | 0;

            if (valid_point(xi, yi))
            {
                var buffer_index = (yi * WIDTH + xi) << 2;

                screen_buffer.data[buffer_index + 0] = rasterizer.wireframe_color[0];
                screen_buffer.data[buffer_index + 1] = rasterizer.wireframe_color[1];
                screen_buffer.data[buffer_index + 2] = rasterizer.wireframe_color[2];
            }

            x += my;
        }
    }
}

function triangle_setup(triangle)
{
    var bottom_vertex = 0;
    var middle_vertex = 1;
    var top_vertex = 2;

    // Bubble sort the vertices by y.
    if (triangle.vertices[top_vertex][1] < triangle.vertices[middle_vertex][1])
    {
        var tmp = middle_vertex;
        middle_vertex = top_vertex;
        top_vertex = tmp;
    }

    if (triangle.vertices[middle_vertex][1] < triangle.vertices[bottom_vertex][1])
    {
        var tmp = bottom_vertex;
        bottom_vertex = middle_vertex;
        middle_vertex = tmp;
    }

    if (triangle.vertices[top_vertex][1] < triangle.vertices[middle_vertex][1])
    {
        var tmp = middle_vertex;
        middle_vertex = top_vertex;
        top_vertex = tmp;
    }

    // Direction of scanline, left to right or right to left.
    var area = triangle_area2(triangle.vertices[bottom_vertex],
                              triangle.vertices[top_vertex],
                              triangle.vertices[middle_vertex]);

    triangle.reversed = area > 0;

    // Gradient setup [z, w, attr...].
    // Vertex format: [x, y, z, w, attr...]
    var one_over_area = 1.0 / triangle.area;

    var dy01 = triangle.vertices[0][1] - triangle.vertices[1][1];
    var dy20 = triangle.vertices[2][1] - triangle.vertices[0][1];
    var dx10 = triangle.vertices[1][0] - triangle.vertices[0][0];
    var dx02 = triangle.vertices[0][0] - triangle.vertices[2][0];

    // depth
    rasterizer.gradient_dx[0] = (dy01 * (triangle.vertices[2][2] - triangle.vertices[0][2]) +
                                 dy20 * (triangle.vertices[1][2] - triangle.vertices[0][2])) * triangle.one_over_area;

    rasterizer.gradient_dy[0] = (dx10 * (triangle.vertices[2][2] - triangle.vertices[0][2]) +
                                 dx02 * (triangle.vertices[1][2] - triangle.vertices[0][2])) * triangle.one_over_area;

    // w
    rasterizer.gradient_dx[1] = (dy01 * (triangle.vertices[2][3] - triangle.vertices[0][3]) +
                                 dy20 * (triangle.vertices[1][3] - triangle.vertices[0][3])) * triangle.one_over_area;

    rasterizer.gradient_dy[1] = (dx10 * (triangle.vertices[2][3] - triangle.vertices[0][3]) +
                                 dx02 * (triangle.vertices[1][3] - triangle.vertices[0][3])) * triangle.one_over_area;

    // Attributes.
    for (var i = 2, k = 4; i < 2 + rasterizer.program.attrs; ++i, ++k)
    {
        rasterizer.gradient_dx[i] = (dy01 * (triangle.vertices[2][k] - triangle.vertices[0][k]) +
                                     dy20 * (triangle.vertices[1][k] - triangle.vertices[0][k])) * triangle.one_over_area;

        rasterizer.gradient_dy[i] = (dx10 * (triangle.vertices[2][k] - triangle.vertices[0][k]) +
                                     dx02 * (triangle.vertices[1][k] - triangle.vertices[0][k])) * triangle.one_over_area;
    }

    edge_setup(triangle.e_bottom_top, triangle.vertices[bottom_vertex], triangle.vertices[top_vertex]);
    edge_setup(triangle.e_bottom_middle, triangle.vertices[bottom_vertex], triangle.vertices[middle_vertex]);
    edge_setup(triangle.e_middle_top, triangle.vertices[middle_vertex], triangle.vertices[top_vertex], triangle.gradients);
}

function edge_setup(edge, v0, v1)
{
    edge.v0 = v0;
    edge.v1 = v1;

    edge.startyi = Math.ceil(edge.v0[1]);
    edge.endyi = Math.ceil(edge.v1[1]);

    var yoffset = edge.startyi - edge.v0[1];

    edge.dxdy = (edge.v1[0] - edge.v0[0]) / (edge.v1[1] - edge.v0[1]);
    edge.x = edge.v0[0] + edge.dxdy * yoffset;

    var xoffset = edge.x - edge.v0[0];

    // Format: [z, w, attr...]
    // Vertex format: [x, y, z, w, attr...]
    edge.interp[0] = edge.v0[2] + rasterizer.gradient_dy[0] * yoffset + rasterizer.gradient_dx[0] * xoffset;
    edge.interp[1] = edge.v0[3] + rasterizer.gradient_dy[1] * yoffset + rasterizer.gradient_dx[1] * xoffset;

    edge.steps[0] = rasterizer.gradient_dy[0] + rasterizer.gradient_dx[0] * edge.dxdy;
    edge.steps[1] = rasterizer.gradient_dy[1] + rasterizer.gradient_dx[1] * edge.dxdy;

    for (var i = 2, k = 4; i < 2 + rasterizer.program.attrs; ++i, ++k)
    {
        edge.interp[i] = edge.v0[k] + rasterizer.gradient_dy[i] * yoffset + rasterizer.gradient_dx[i] * xoffset;
        edge.steps[i] = rasterizer.gradient_dy[i] + rasterizer.gradient_dx[i] * edge.dxdy;
    }
}

function edge_step(edge)
{
    edge.x += edge.dxdy;

    for (var i = 0; i < 2 + rasterizer.program.attrs; ++i) {
        edge.interp[i] += edge.steps[i];
    }
}

function draw_triangle(triangle)
{
    // console_data.t_draw_triangle_start = performance.now();

    scan_edges(triangle.e_bottom_top, triangle.e_bottom_middle, triangle.reversed);
    scan_edges(triangle.e_bottom_top, triangle.e_middle_top, triangle.reversed);

    // console_data.t_draw_triangle_end = performance.now();
}

function scan_edges(left_edge, right_edge, reversed)
{
    var left = left_edge;
    var right = right_edge;

    if (reversed)
    {
        var tmp = left;
        left = right;
        right = tmp;
    }

    var sy = right_edge.startyi;
    var ey = right_edge.endyi;

    for (var y = sy; y < ey; ++y)
    {
        if (y >= 0 && y < HEIGHT)
            draw_scanline(y, left, right);

        edge_step(left);
        edge_step(right);
    }
}

function draw_scanline(y, left_edge, right_edge)
{
    var sx = Math.ceil(left_edge.x);
    var ex = Math.ceil(right_edge.x);
    var xoffset = sx - left_edge.x;

    var depth_pointer = (y * WIDTH + sx);
    var pixel = depth_pointer << 2;

    // Attribute setup.
    for (var i = 0; i < 2 + rasterizer.program.attrs; ++i) {
        rasterizer.scanline_interp[i] = left_edge.interp[i] + xoffset * rasterizer.gradient_dx[i];
    }

    for (var x = sx; x < ex; ++x)
    {
        if (x >= 0 && x < WIDTH)
        {
            var depth = rasterizer.scanline_interp[0];

            if (depth < depth_buffer[depth_pointer])
            {
                depth_buffer[depth_pointer] = depth;

                var one_over_w = 1.0 / rasterizer.scanline_interp[1];
                rasterizer.program.shader(rasterizer.scanline_interp, one_over_w, depth, rasterizer);

                Common.color_clamp(rasterizer.pixel_color);
                // Common.color_reinhard(rasterizer.pixel_color);

                screen_buffer.data[pixel + 0] = rasterizer.pixel_color[0];
                screen_buffer.data[pixel + 1] = rasterizer.pixel_color[1];
                screen_buffer.data[pixel + 2] = rasterizer.pixel_color[2];
                screen_buffer.data[pixel + 3] = 255;
            }
        }

        // Advance the attributes.
        for (var i = 0; i < 2 + rasterizer.program.attrs; ++i) {
            rasterizer.scanline_interp[i] += rasterizer.gradient_dx[i];
        }

        pixel += 4;
        depth_pointer++;
    }
}

function draw_model()
{
    var is_wireframe = has_flag(r_const.FLAG_LINES) || has_flag(r_const.FLAG_POINTS);
    rasterizer.mesh_pointer = 0;

    update_model_matrix();

    Common.mat4_lookat_dest(rasterizer.camera.eye, rasterizer.camera.target, [0, 0, 1], rasterizer.VIEW);
    Common.mat4_mul_dest(rasterizer.PROJECTION, rasterizer.VIEW, rasterizer.COMPOSED);
    Common.mat4_mul_dest(rasterizer.COMPOSED, rasterizer.MAT_MODEL, rasterizer.MAT_FINAL);

    set_texture(rasterizer.texture);

    while (rasterizer.mesh_pointer < rasterizer.mesh.face.length)
    {
        rasterizer.program.reader(rasterizer);

        Common.triangle_project(rasterizer.MAT_FINAL, rasterizer.triangle.vertices);
        Common.triangle_viewport_transform(rasterizer.VIEWPORT, rasterizer.triangle.vertices);

        // Attribute division.
        for (var i = 4; i < 4 + rasterizer.program.attrs; ++i)
        {
            rasterizer.triangle.vertices[0][i] *= rasterizer.triangle.vertices[0][3];
            rasterizer.triangle.vertices[1][i] *= rasterizer.triangle.vertices[1][3];
            rasterizer.triangle.vertices[2][i] *= rasterizer.triangle.vertices[2][3];
        }

        rasterizer.triangle.area = triangle_area2(rasterizer.triangle.vertices[0],
                                                  rasterizer.triangle.vertices[1],
                                                  rasterizer.triangle.vertices[2]);

        if (!is_wireframe && (rasterizer.flags & r_const.FLAG_BACKFACE_CULL) && rasterizer.triangle.area > 0)
            continue;

        rasterizer.triangle.one_over_area = 1.0 / rasterizer.triangle.area;

        if (has_flag(r_const.FLAG_TRIANGLES))
        {
            triangle_setup(rasterizer.triangle);
            draw_triangle(rasterizer.triangle);
        }
        else
        {
            if (has_flag(r_const.FLAG_LINES))
            {
                draw_line(rasterizer.triangle.vertices[0][0], rasterizer.triangle.vertices[0][1],
                        rasterizer.triangle.vertices[1][0], rasterizer.triangle.vertices[1][1]);

                draw_line(rasterizer.triangle.vertices[1][0], rasterizer.triangle.vertices[1][1],
                        rasterizer.triangle.vertices[2][0], rasterizer.triangle.vertices[2][1]);

                draw_line(rasterizer.triangle.vertices[2][0], rasterizer.triangle.vertices[2][1],
                        rasterizer.triangle.vertices[0][0], rasterizer.triangle.vertices[0][1]);
            }

            if (has_flag(r_const.FLAG_POINTS))
            {
                draw_point(rasterizer.triangle.vertices[0][0], rasterizer.triangle.vertices[0][1]);
                draw_point(rasterizer.triangle.vertices[1][0], rasterizer.triangle.vertices[1][1]);
                draw_point(rasterizer.triangle.vertices[2][0], rasterizer.triangle.vertices[2][1]);
            }
        }
    }
}

function update_console()
{
    var end = performance.now();

    var draw_triangle_ms = console_data.t_draw_triangle_end - console_data.t_draw_triangle_start;
    var frame_ms = end - console_data.start;

    var fps = 1000 / (frame_ms ? frame_ms : 0.001);
    var resolution = WIDTH + 'x' + HEIGHT + ' (x' + 1 +')';

    var console_html = '&raquo;&nbsp; '+ rasterizer.name;
    console_html += ' / resolution: ' + resolution;
    console_html += ' / frame ms: ' + frame_ms.toFixed(2);
    // console_html += ' / draw_triangle ms: ' + draw_triangle_ms.toFixed(2);
    console_html += ' / fps: ' + fps.toFixed(2);
    // console_html += ' / angle: ' + rad2deg(rasterizer.model.rotation[2]).toFixed(2);

    screen_console.innerHTML = console_html;
}

// ----------------------------------------------------------------------------------
// -- Rasterizer setup.
// ----------------------------------------------------------------------------------

function update_sample_func()
{
    rasterizer.sampler.sample = Common.sample_texture;

    if (rasterizer.flags & 2)
        rasterizer.sampler.sample = Common.sample_texture_filtering;
}

function init_rasterizer(scene)
{
    rasterizer.scene = scene;
    scene.init(rasterizer);
    update_sample_func();

    $('#texture_filtering').prop('checked', (rasterizer.flags & 2) > 0);
}

init_rasterizer(TriangleColorScene);

Common.mat4_perspective_dest(rasterizer.aspect, Common.deg2rad(rasterizer.fov), 0.1, 10, rasterizer.PROJECTION);
Common.mat4_viewport_dest(WIDTH, HEIGHT, 0, 0, 1, rasterizer.VIEWPORT);

function draw_rect(x1, y1, x2, y2, r, g, b)
{
    var pointer = (y1 * WIDTH) << 2;
    var stride = WIDTH << 2;

    for (var y = y1; y < y2; ++y)
    {
        var pixel = pointer;

        for (var x = x1; x < x2; ++x)
        {
            screen_buffer.data[pixel + 0] = r;
            screen_buffer.data[pixel + 1] = g;
            screen_buffer.data[pixel + 2] = b;

            pixel += 4;
        }

        pointer += stride;
    }
}

// ----------------------------------------------------------------------------------
// -- Run.
// ----------------------------------------------------------------------------------

function render(timestamp)
{
    console_data.start = performance.now();

    var delta = timestamp - prev_timestamp;
    prev_timestamp = timestamp;

    if (!rasterizer.program)
        return;

    if (rasterizer.scene)
        rasterizer.scene.update(delta);

    clear_screen();
    clear_depth();
    // draw_rect(0, 0, WIDTH, HEIGHT, 0xff, 0, 0);
    draw_model();
    update_console();

    screen_ctx.putImageData(screen_buffer, 0, 0);
    window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);
