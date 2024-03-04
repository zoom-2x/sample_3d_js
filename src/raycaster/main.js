import Common from 'common';

import TextureAtlas from 'assets/textures/raycaster.json';

import rc_enums from 'raycaster/rc_enums';
import rc_procs from 'raycaster/rc_procs';
import MazeLevel from 'raycaster/assets/maze/func';
import WorldLevel from 'raycaster/assets/world/func';

var current_level = WorldLevel;

var root = document.getElementById('root');
var div3dbase = document.getElementById('div3dbase');
var screen_console = document.getElementById('console');
var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');

var buffer = null;
var prev_timestamp = 0;

var rc_buffers = {
    screen: null,
    depth: null,
    screen_pitch: 0,
    depth_pitch: 0
};

var RayCaster = {
    settings: {
        name: 'Raycaster',

        background_color: [0, 0, 0],
        ceiling_color: [45, 82, 123],
        floor_color: [24, 18, 18],
        wall_color: [220, 220, 220],

        texture_filtering: false,
        lightmap_filtering: false,
        use_lightmaps: true,
        use_blank_color: false,
        // blank_color: [150, 150, 150],
        blank_color: [255, 255, 255],

        ambient_color: [55, 50, 50],

        light_fade: true,
        fade_c: 0.4,
        fade_ramp_steps: 40,

        // Clipping (distance fade).
        near_plane: 0.1,
        far_plane: 10,

        // left (y) / right (-y) / front (-x) / back (+x)
        // 0 = -x / 1 = x / 2 = -y / 3 = y
        uv_coord_map: [0, 1, 2, 3],
        lights: [.7, .65, .95, .95],

        texture_size: 32,
        texture_size_half: 16,
        texture_size_r: 0,
        texture_pitch_shift: 5,

        lightmaps: [],

        lightmap_size: 16,
        lightmap_pitch_shift: 4
    },

    sampler: {
        tex_width: 0,
        tex_height: 0,
        tex_width_shift: 0,
        tex_pointer: 0,
        sample: Common.sample_texture
    },

    lightmap_sampler: {
        tex_width: 0,
        tex_height: 0,
        tex_width_shift: 0,
        tex_pointer: 0,
        sample: Common.sample_texture
    },

    resolution: {
        width: 1024,
        height: 600,
        pixels: 0,
        half_width: 0,
        half_height: 0,
        ystep: 0,
        scale: 2,
        height_scale: 1
    },

    camera: {
        fov: 90,
        half_fov: 0,
        angle_step: 0,
        aspect: 1,
        fov_scale: 1
    },

    // row, col
    directions: [
        // right,
        [0, 1],
        // down
        [-1, 0],
        // left
        [0, -1],
        // up
        [1, 0]
    ],

    rotations: [0, 270, 180, 90],

    player: {

        tile: [0, 0],
        tile_dir: 0,

        position: [0, 0, 0.5],
        rotation: 0,

        offset_x: 0,
        offset_y: 0,

        forward: [1, 0],
        side: [0, 1],

        sin_theta: 0,
        cos_theta: 0,

        speed_ms: 400,
        headbob: true,
        headbob_max: 0.05
    },

    max_queue_commands: 3,
    command_expire_ms: 5,
    current_command: null,
    command_queue: [],

    level: null,
    lightmaps: null,
    fade_ramp: null
};

// ----------------------------------------------------------------------------------

var ONE80_OVER_PI = 57.2957795130823208768;
var PI_OVER_ONE80 = 0.01745329251994329577;
var ONE_OVER_255 = 0.00392156862745098039;

function rad2deg(angle) { return angle * ONE80_OVER_PI; };
function deg2rad(angle) { return angle * PI_OVER_ONE80; };
function dot(v1x, v1y, v2x, v2y) { return v1x * v2x + v1y * v2y; }
function len(bx, by) { return Math.sqrt(dot(bx, by, bx, by)); }

function color_blend(color, lightmap, ambient, multiplier)
{
    color[0] = (color[0] * lightmap[0] + ambient[0]) * multiplier;
    color[1] = (color[1] * lightmap[1] + ambient[1]) * multiplier;
    color[2] = (color[2] * lightmap[2] + ambient[2]) * multiplier;
}

function color_int_to_float(c)
{
    c[0] *= ONE_OVER_255;
    c[1] *= ONE_OVER_255;
    c[2] *= ONE_OVER_255;

    // c[0] *= c[0];
    // c[1] *= c[1];
    // c[2] *= c[2];
}

function color_float_to_int(c)
{
    // c[0] = Math.sqrt(c[0]);
    // c[1] = Math.sqrt(c[1]);
    // c[2] = Math.sqrt(c[2]);

    c[0] = (c[0] * 255) | 0;
    c[1] = (c[1] * 255) | 0;
    c[2] = (c[2] * 255) | 0;
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function reinhard(c) { c[0] = c[0] / (c[0] + 1); c[1] = c[1] / (c[1] + 1); c[2] = c[2] / (c[2] + 1)}

// ----------------------------------------------------------------------------------

RayCaster.choose_spawn_point = function(map)
{
    var spawn_points = [];

    for (var i = 0; i < map.data.length; ++i)
    {
        var tile = map.data[i];

        if (tile.type == rc_enums.BLOCK_EMPTY && tile_has_flag(tile, rc_enums.FLAG_SPAWN_POINT))
            spawn_points.push([tile.row, tile.col]);
    }

    var spawn_index = Math.floor(Math.random() * spawn_points.length);

    return spawn_points[spawn_index];
};

RayCaster.set_player_start = function(tile, dir)
{
    RayCaster.player.position[0] = tile[1] + 0.5;
    RayCaster.player.position[1] = tile[0] + 0.5;
    RayCaster.player.position[2] = 0.5;
    RayCaster.player.rotation = RayCaster.rotations[dir];

    RayCaster.player.tile[0] = tile[0];
    RayCaster.player.tile[1] = tile[1];
    RayCaster.player.tile_dir = dir;
};

var transparency_queue = null;

var rc_ray = {
    rx: 0,
    ry: 0,

    step_x: 1,
    step_y: 1,

    step_interceptx: 0,
    step_intercepty: 0,

    start_interceptx: 0,
    start_intercepty: 0,

    start_x: 0,
    start_y: 0,

    ix: 0,
    iy: 0,

    bx: 0,
    by: 0
};

current_level.init(RayCaster);
color_int_to_float(RayCaster.level.ambient_color);

// ----------------------------------------------------------------------------------

function raycaster_setup()
{
    if (RayCaster.settings.texture_filtering)
        RayCaster.sampler.sample = Common.sample_texture_filtering;
    else
        RayCaster.sampler.sample = Common.sample_texture;

    if (RayCaster.settings.lightmap_filtering)
        RayCaster.lightmap_sampler.sample = Common.sample_texture_filtering;
    else
        RayCaster.lightmap_sampler.sample = Common.sample_texture;

    RayCaster.sampler.tex_width = RayCaster.settings.texture_size;
    RayCaster.sampler.tex_height = RayCaster.settings.texture_size;
    RayCaster.sampler.tex_width_shift = RayCaster.settings.texture_pitch_shift;
    RayCaster.sampler.tex_pointer = 0;

    RayCaster.lightmap_sampler.tex_width = RayCaster.settings.lightmap_size;
    RayCaster.lightmap_sampler.tex_height = RayCaster.settings.lightmap_size;
    RayCaster.lightmap_sampler.tex_width_shift = RayCaster.settings.lightmap_pitch_shift;
    RayCaster.lightmap_sampler.tex_pointer = 0;

    RayCaster.settings.texture_size_r = 1.0 / RayCaster.settings.texture_size;
    RayCaster.settings.lightmap_size_r = 1.0 / RayCaster.settings.lightmap_size;

    // ----------------------------------------------------------------------------------
    // -- Resolution setup.
    // ----------------------------------------------------------------------------------

    if (RayCaster.resolution.scale > 1)
    {
        RayCaster.resolution.width = (RayCaster.resolution.width / RayCaster.resolution.scale) | 0;
        RayCaster.resolution.height = (RayCaster.resolution.height / RayCaster.resolution.scale) | 0;

        screen.style.transformOrigin = "0 0";
        screen.style.transform = `scale(${RayCaster.resolution.scale})`;
    }

    RayCaster.resolution.pixels = RayCaster.resolution.width * RayCaster.resolution.height;
    RayCaster.resolution.half_width = (RayCaster.resolution.width * 0.5) | 0;
    RayCaster.resolution.half_height = (RayCaster.resolution.height * 0.5) | 0;
    RayCaster.resolution.ystep = 1.0 / RayCaster.resolution.half_height;
    RayCaster.resolution.height_scale = RayCaster.resolution.height / RayCaster.resolution.width;
    RayCaster.resolution.one_over_width = 1.0 / RayCaster.resolution.width;

    screen.width = RayCaster.resolution.width;
    screen.height = RayCaster.resolution.height;

    // ----------------------------------------------------------------------------------
    // -- Buffers setup.
    // ----------------------------------------------------------------------------------

    rc_buffers.screen = screen_ctx.createImageData(RayCaster.resolution.width, RayCaster.resolution.height);
    rc_buffers.screen_pitch = RayCaster.resolution.width << 2;
    rc_buffers.depth = new Array(RayCaster.resolution.width * RayCaster.resolution.height);
    rc_buffers.depth_pitch = RayCaster.resolution.width;

    // ----------------------------------------------------------------------------------
    // -- Camera setup.
    // ----------------------------------------------------------------------------------

    RayCaster.camera.half_fov = RayCaster.camera.fov * 0.5;
    RayCaster.camera.angle_step = RayCaster.camera.fov / RayCaster.resolution.width;
    RayCaster.camera.fov_scale = Math.tan(deg2rad(RayCaster.camera.fov * 0.5));
    RayCaster.camera.aspect = RayCaster.resolution.width / RayCaster.resolution.height;
    RayCaster.camera.raspect = 1.0 / RayCaster.camera.aspect;
    // RayCaster.camera.fov_scale = 1;

    RayCaster.resolution.sdx = 2.0 / RayCaster.resolution.width;

    // ----------------------------------------------------------------------------------
    // -- Fade ramp.
    // ----------------------------------------------------------------------------------

    RayCaster.settings.fade_ramp = new Array(RayCaster.settings.fade_ramp_steps);
    RayCaster.settings.fade_c = RayCaster.settings.fade_ramp_steps / RayCaster.settings.far_plane;
    var incr = 1.0 / RayCaster.settings.fade_ramp_steps;

    for (var i = 0, step = 0; i <= RayCaster.settings.fade_ramp_steps; ++i)
    {
        if (i == RayCaster.settings.fade_ramp_steps)
            RayCaster.settings.fade_ramp[i] = 0;
        else
            RayCaster.settings.fade_ramp[i] = 1 - Math.pow(step, 2);

        step += incr;
    }

    // ----------------------------------------------------------------------------------
    // -- Command queue init.
    // ----------------------------------------------------------------------------------

    for (var i = 0; i < RayCaster.max_queue_commands; ++i) {
        RayCaster.command_queue.push({
            action: "none",
            free: true,
            time_ms: 0,
            t: 0,
            values: [0, 0, 0, 0, 0]
        });
    }
}

// ----------------------------------------------------------------------------------
// -- Debugging.
// ----------------------------------------------------------------------------------

function draw_rectangular_border(sx, sy, ex, ey)
{
    if (ex < sx)
    {
        var tmp = sx;
        sx = ex;
        ex = tmp;
    }

    if (ey < sy)
    {
        var tmp = sy;
        sy = ey;
        ey = tmp;
    }

    var width = ex - sx;
    var height = ey - sy;

    var dest = sy * rc_buffers.screen_pitch + (sx << 2);

    for (var x = sx; x <= ex; ++x)
    {
        rc_buffers.screen.data[dest + 0] = 255;
        rc_buffers.screen.data[dest + 1] = 255;
        rc_buffers.screen.data[dest + 2] = 255;
        rc_buffers.screen.data[dest + 3] = 255;

        dest += 4;
    }

    dest = ey * rc_buffers.screen_pitch + (sx << 2);

    for (var x = sx; x <= ex; ++x)
    {
        rc_buffers.screen.data[dest + 0] = 255;
        rc_buffers.screen.data[dest + 1] = 255;
        rc_buffers.screen.data[dest + 2] = 255;
        rc_buffers.screen.data[dest + 3] = 255;

        dest += 4;
    }

    dest = sy * rc_buffers.screen_pitch + (sx << 2)

    for (var y = sy; y <= ey; ++y)
    {
        rc_buffers.screen.data[dest + 0] = 255;
        rc_buffers.screen.data[dest + 1] = 255;
        rc_buffers.screen.data[dest + 2] = 255;
        rc_buffers.screen.data[dest + 3] = 255;

        dest += rc_buffers.screen_pitch;
    }

    dest = sy * rc_buffers.screen_pitch + (ex << 2)

    for (var y = sy; y <= ey; ++y)
    {
        rc_buffers.screen.data[dest + 0] = 255;
        rc_buffers.screen.data[dest + 1] = 255;
        rc_buffers.screen.data[dest + 2] = 255;
        rc_buffers.screen.data[dest + 3] = 255;

        dest += rc_buffers.screen_pitch;
    }
}

function debug_lightmap(row, col, face, slot, is_ceiling_floor)
{
    slot = slot != void(0) ? slot : 0;

    var block = rc_procs.get_block(RayCaster.level, row, col);
    var lightmap_pointer = block.lightmaps[face];

    if (is_ceiling_floor && face == rc_enums.FACE_BOTTOM)
        lightmap_pointer = block.floor_lightmap;
    else if (is_ceiling_floor && face == rc_enums.FACE_TOP)
        lightmap_pointer = block.ceiling_lightmap;

    if (lightmap_pointer >= 0)
    {
        var debug_x = 10 + slot * (RayCaster.settings.lightmap_size + 1);
        var debug_y = 10;

        var src = lightmap_pointer;
        var dest = debug_y * rc_buffers.screen_pitch + (debug_x << 2);

        for (var y = 0; y < RayCaster.settings.lightmap_size; ++y)
        {
            var pixel = dest;

            for (var x = 0; x < RayCaster.settings.lightmap_size; ++x)
            {
                rc_buffers.screen.data[pixel + 0] = RayCaster.lightmaps[src + 0];
                rc_buffers.screen.data[pixel + 1] = RayCaster.lightmaps[src + 1];
                rc_buffers.screen.data[pixel + 2] = RayCaster.lightmaps[src + 2];
                rc_buffers.screen.data[pixel + 3] = 255;

                src += 4;
                pixel += 4;
            }

            dest += rc_buffers.screen_pitch;
        }

        var sx = debug_x - 1;
        var sy = debug_y - 1;
        var ex = sx + RayCaster.settings.lightmap_size + 1;
        var ey = sy + RayCaster.settings.lightmap_size + 1;

        draw_rectangular_border(sx, sy, ex, ey);
    }
}

// ----------------------------------------------------------------------------------
// --- Object generators (needs to be rewritten).
// ----------------------------------------------------------------------------------

function generate_door(duration, delay, direction, position, texture)
{
    delay = delay != void(0) ? delay : 0;
    direction = direction != void(0) ? direction : 1;
    position = position != void(0) ? position : 0;
    texture = texture != void(0) ? texture : 0;

    var object = {
        type: RayCaster.BLOCK_DOOR,
        state: RayCaster.STATE_CLOSED,
        moving: false,
        offset: 0.0,
        duration_ms: duration,
        duration_step_ms: 0,
        delay: delay,
        direction: direction,
        position: position,
        texture: texture,
        update: update_door
    };

    object.duration_step_ms = 1 / object.duration_ms;
    var index = RayCaster.objects.push(object);

    return index - 1;
}

function update_door(door, delta)
{
    if (door.state == RayCaster.STATE_OPENED || door.state == RayCaster.STATE_CLOSED)
        return;

    if (door.moving)
    {
        door.offset += door.direction * door.duration_step_ms * delta;

        if (door.direction > 0)
        {
            if (door.offset > 1)
                door.offset = 1;

            if (door.offset == 1)
            {
                door.state = (door.state == RayCaster.STATE_OPENED) ?
                    RayCaster.STATE_CLOSED :
                    RayCaster.STATE_OPENED;

                door.direction *= -1;
                door.moving = false;
            }
        }
        else
        {
            if (door.offset < 0)
                door.offset = 0;

            if (door.offset == 0)
            {
                door.state = (door.state == RayCaster.STATE_OPENED) ?
                    RayCaster.STATE_CLOSED :
                    RayCaster.STATE_OPENED;

                door.direction *= -1;
                door.moving = false;
            }
        }
    }

    // if (!door.moving)
    // {
    //     if (door.delay > 5000)
    //     {
    //         door.delay = 0;
    //         door.moving = true;
    //     }
    //     else
    //         door.delay += delta;
    // }
}

// ----------------------------------------------------------------------------------
// --- Object updater.
// ----------------------------------------------------------------------------------

function update(delta)
{
    for (var i = 0; i < RayCaster.level.objects.length; ++i)
    {
        var object = RayCaster.level.objects[i];
        object.update(object, delta);
    }
}

// ----------------------------------------------------------------------------------

function wrap_angle(angle)
{
    var res = angle;

    if (res <= -360)
        res += 360;
    else if (res >= 360)
        res -= 360;

    return res;
}

function get_u(ix, iy, face)
{
    var u = 0;
    var u_coord = RayCaster.settings.uv_coord_map[face];

    if (u_coord == 0)
        u = 1 - (ix % 1);
    else if (u_coord == 1)
        u = ix % 1;
    else if (u_coord == 2)
        u = 1 - (iy % 1);
    else if (u_coord == 3)
        u = iy % 1;

    u = u == 1 ? 0.999999 : u;

    return u;
}

function valid_lightmap_face(row, col)
{
    if (valid_block(col, row))
    {
        var index = get_block_index(row, col);
        return RayCaster.map.data[index + BLOCK_STRUCT_TYPE] == RayCaster.BLOCK_INSIDE;
    }

    return false;
}

function clear_screen()
{
    var buffer_index = 0;

    for (var y = 0; y < RayCaster.resolution.height; ++y)
    {
        for (var x = 0; x < RayCaster.resolution.width; ++x)
        {
            rc_buffers.screen.data[buffer_index + 0] = 0;
            rc_buffers.screen.data[buffer_index + 1] = 0;
            rc_buffers.screen.data[buffer_index + 2] = 0;
            rc_buffers.screen.data[buffer_index + 3] = 255;

            buffer_index += 4;
        }
    }
}

function clear_depth_buffer()
{
    for (var i = 0; i < RayCaster.resolution.pixels; ++i) {
        rc_buffers.depth[i] = Infinity;
    }
}

function clear_map(deftype)
{
    deftype = deftype != void(0) ? deftype : RayCaster.BLOCK_EMPTY;

    for (var row = 0; row < RayCaster.map.rows; ++row)
    {
        for (var col = 0; col < RayCaster.map.cols; ++col)
        {
            var index = get_block_index(row, col);

            RayCaster.map.data[index + RayCaster.BLOCK_STRUCT_TYPE] = deftype;
            RayCaster.map.data[index + RayCaster.BLOCK_STRUCT_VALUE] = -1;
            RayCaster.map.data[index + RayCaster.BLOCK_STRUCT_CEILING_TEXTURE] = -1;
            RayCaster.map.data[index + RayCaster.BLOCK_STRUCT_FLOOR_TEXTURE] = -1;
        }
    }
}

function rotate_vector(v)
{
    var tx = v[0];
    var ty = v[1];

    v[0] = RayCaster.player.cos_theta * tx - RayCaster.player.sin_theta * ty;
    v[1] = RayCaster.player.sin_theta * tx + RayCaster.player.cos_theta * ty;
}

function update_player()
{
    RayCaster.player.cos_theta = Math.cos(deg2rad(RayCaster.player.rotation));
    RayCaster.player.sin_theta = Math.sin(deg2rad(RayCaster.player.rotation));

    // Base forward vector [1, 0]
    RayCaster.player.forward[0] = RayCaster.player.cos_theta;
    RayCaster.player.forward[1] = RayCaster.player.sin_theta;

    // Base side vector [0, 1]
    RayCaster.player.side[0] = -RayCaster.player.sin_theta;
    RayCaster.player.side[1] = RayCaster.player.cos_theta;
}

function tile_has_flag(tile, flag) {
    return (tile.flags & flag) > 0;
}

function tile_set_flag(tile, flag) {
    tile.flags |= flag;
};

function tile_unset_flag(tile, flag) {
    tile.flags &= ~flag;
};

// ----------------------------------------------------------------------------------
// -- Draw routines.
// ----------------------------------------------------------------------------------

// col, row.
function valid_block(x, y) {
    return x >= 0 && x < RayCaster.level.cols && y >= 0 && y < RayCaster.level.rows;
}

function get_fade_multiplier(distance)
{
    var multiplier = 1;

    if (RayCaster.settings.light_fade)
    {
        var ramp_index = (RayCaster.settings.fade_c * distance) | 0;

        if (ramp_index < RayCaster.settings.fade_ramp.length)
            multiplier = RayCaster.settings.fade_ramp[ramp_index];
        else
            multiplier = 0;
    }

    return multiplier;
}

function camera_to_screen(z, one_over_distance) {
    return (1 - (z * one_over_distance + 1) * 0.5) * RayCaster.resolution.height;
}

function depth_check(x, y, distance) {
    return distance < rc_buffers.depth[y * rc_buffers.depth_pitch + x];
}

function set_depth(x, y, distance) {
    rc_buffers.depth[y * rc_buffers.depth_pitch + x] = distance;
}

function draw_line_block2(x, intersection_data)
{
    if (intersection_data.entry_distance >= RayCaster.settings.far_plane)
        return;

    // Camera space coordinates.
    var line_high_z = intersection_data.block.high_z - RayCaster.player.position[2];
    var line_low_z = intersection_data.block.low_z - RayCaster.player.position[2];
    var c = RayCaster.resolution.height_scale * RayCaster.camera.fov_scale;

    var one_over_entry_distance = 1.0 / (c * intersection_data.entry_distance);
    var one_over_exit_distance = 1.0 / (c * intersection_data.exit_distance);

    var line_start_float = camera_to_screen(line_high_z, one_over_entry_distance);
    var line_end_float = camera_to_screen(line_low_z, one_over_entry_distance);

    var line_height = line_end_float - line_start_float;
    var step = 1.0 / line_height;

    var sy = Math.ceil(line_start_float);
    var ey = Math.ceil(line_end_float);
    var line_heighti = ey - sy;

    var current_v = (sy - line_start_float) * step;

    var buffer_index = (x << 2) + (sy < 0 ? 0 : sy) * rc_buffers.screen_pitch;
    var texture_id = intersection_data.block.textures[intersection_data.face];

    var u = get_u(intersection_data.entry_x, intersection_data.entry_y, intersection_data.face) - intersection_data.u_offset;
    var tex_x = (u * RayCaster.settings.texture_size) | 0;

    var texture_pointer = TextureAtlas.offset[texture_id] + (tex_x << 2);
    var lightmap_pointer = intersection_data.block.lightmaps[intersection_data.face];

    var wall_depth_index = (sy < 0 ? 0 : sy) * rc_buffers.depth_pitch + x;

    var color = [0, 0, 0];
    var lightmap_color = [0, 0, 0];
    var ambient_color = [0, 0, 0];

    RayCaster.sampler.tex_pointer = texture_id >= 0 ? TextureAtlas.offset[texture_id] : -1;

    var render_top_bottom_plane = false;
    var plane_start_yi, plane_end_yi, plane_face, plane_height;
    var top_bottom_start = [];
    var top_bottom_interp = [0, 0, 0]; // dudy, dvdy, dddy

    var light_multiplier = get_fade_multiplier(intersection_data.entry_distance);
    // var light_multiplier = 1;

    // Visible bottom plane.
    if (intersection_data.block.type == rc_enums.BLOCK_HALFWALL_TOP &&
        RayCaster.player.position[2] < RayCaster.level.half_height)
    {
        render_top_bottom_plane = true;
        plane_face = rc_enums.FACE_BOTTOM;

        var plane_y = camera_to_screen(line_low_z, one_over_exit_distance);

        plane_start_yi = ey;
        plane_height = Math.ceil(plane_y) - plane_start_yi;
        plane_end_yi = plane_start_yi + plane_height;

        var plane_step = 1.0 / (plane_y - line_end_float);
        var yoffset = plane_start_yi - line_end_float;

        var plane_start_u = (intersection_data.entry_x - intersection_data.bx) * one_over_entry_distance;
        var plane_start_v = (intersection_data.entry_y - intersection_data.by) * one_over_entry_distance;

        var plane_end_u = (intersection_data.exit_x - intersection_data.bx) * one_over_exit_distance;
        var plane_end_v = (intersection_data.exit_y - intersection_data.by) * one_over_exit_distance;

        top_bottom_interp[0] = (plane_end_u - plane_start_u) * plane_step;
        top_bottom_interp[1] = (plane_end_v - plane_start_v) * plane_step;
        top_bottom_interp[2] = (one_over_exit_distance - one_over_entry_distance) * plane_step;

        top_bottom_start[0] = plane_start_u + top_bottom_interp[0] * yoffset;
        top_bottom_start[1] = plane_start_v + top_bottom_interp[1] * yoffset;
        top_bottom_start[2] = one_over_entry_distance + top_bottom_interp[2] * yoffset;
    }

    // Visible top plane.
    else if (intersection_data.block.type == rc_enums.BLOCK_HALFWALL_BOTTOM &&
             RayCaster.player.position[2] > RayCaster.level.half_height)
    {
        render_top_bottom_plane = true;
        plane_face = rc_enums.FACE_TOP;

        var plane_y = camera_to_screen(line_high_z, one_over_exit_distance);

        plane_start_yi = Math.ceil(plane_y);
        plane_height = Math.ceil(line_start_float) - plane_start_yi;
        plane_end_yi = plane_start_yi + plane_height;

        var plane_step = 1.0 / (line_start_float - plane_y);
        var yoffset = plane_start_yi - plane_y;

        var plane_start_u = (intersection_data.exit_x - intersection_data.bx) * one_over_exit_distance;
        var plane_start_v = (intersection_data.exit_y - intersection_data.by) * one_over_exit_distance;

        var plane_end_u = (intersection_data.entry_x - intersection_data.bx) * one_over_entry_distance;
        var plane_end_v = (intersection_data.entry_y - intersection_data.by) * one_over_entry_distance;

        top_bottom_interp[0] = (plane_end_u - plane_start_u) * plane_step;
        top_bottom_interp[1] = (plane_end_v - plane_start_v) * plane_step;
        top_bottom_interp[2] = (one_over_entry_distance - one_over_exit_distance) * plane_step;

        top_bottom_start[0] = plane_start_u + top_bottom_interp[0] * yoffset;
        top_bottom_start[1] = plane_start_v + top_bottom_interp[1] * yoffset;
        top_bottom_start[2] = one_over_exit_distance + top_bottom_interp[2] * yoffset;
    }

    // ----------------------------------------------------------------------------------
    // -- Vertical plane.
    // ----------------------------------------------------------------------------------

    var lu = u;

    // if (intersection_data.block.u_offset)
    //     u += intersection_data.block.u_offset;
    // else
    //     u += RayCaster.level.wall_u_offset;

    // if (u < 0) u *= -1;

    // if ((intersection_data.block.flags & rc_enums.FLAG_MIRROR))
    //     u = u >= 1 ? 2 - u : u;
    // else
    //     u = u >= 1 ? u - 1 : u;

    for (var y = sy; y < ey; ++y)
    {
        if (y >= 0 && y < RayCaster.resolution.height)
        {
            if (rc_buffers.depth[wall_depth_index] > intersection_data.entry_distance)
            {
                var v = current_v;
                var lv = 1 - current_v;
                var tex_v_scale = RayCaster.level.height;

                if (intersection_data.block.type == rc_enums.BLOCK_WALL)
                {
                    v = (v * tex_v_scale) % 2;

                    // if ((intersection_data.block.flags & rc_enums.FLAG_MIRROR))
                    //     v = v >= 1 ? 2 - v : v;
                    // else
                        v = v >= 1 ? v - 1 : v;
                }

                if (intersection_data.block.v_offset)
                    v += intersection_data.block.v_offset;
                else
                    v += RayCaster.level.wall_v_offset;

                v += 0.00000001;

                if (v < 0)
                    v += 1;
                else if (v > 1)
                    v -= 1;

                if (RayCaster.settings.use_blank_color || texture_id < 0)
                {
                    color[0] = RayCaster.settings.blank_color[0];
                    color[1] = RayCaster.settings.blank_color[1];
                    color[2] = RayCaster.settings.blank_color[2];
                }
                else
                    RayCaster.sampler.sample(TextureAtlas.data, RayCaster.sampler, u, 1 - v, color);

                color_int_to_float(color);

                lightmap_color[0] = 1;
                lightmap_color[1] = 1;
                lightmap_color[2] = 1;

                ambient_color[0] = color[0] * RayCaster.level.ambient_color[0];
                ambient_color[1] = color[1] * RayCaster.level.ambient_color[1];
                ambient_color[2] = color[2] * RayCaster.level.ambient_color[2];

                if (RayCaster.settings.use_lightmaps && lightmap_pointer >= 0)
                {
                    RayCaster.lightmap_sampler.tex_pointer = lightmap_pointer;
                    RayCaster.lightmap_sampler.sample(RayCaster.lightmaps, RayCaster.lightmap_sampler, lu, lv, lightmap_color);
                    color_int_to_float(lightmap_color);
                }

                color_blend(color, lightmap_color, ambient_color, light_multiplier);

                color[0] = clamp(color[0], 0, 1);
                color[1] = clamp(color[1], 0, 1);
                color[2] = clamp(color[2], 0, 1);

                // reinhard(color);
                color_float_to_int(color);

                rc_buffers.screen.data[buffer_index + 0] = color[0];
                rc_buffers.screen.data[buffer_index + 1] = color[1];
                rc_buffers.screen.data[buffer_index + 2] = color[2];

                rc_buffers.depth[wall_depth_index] = intersection_data.entry_distance;
            }

            buffer_index += rc_buffers.screen_pitch;
            wall_depth_index += rc_buffers.depth_pitch;
        }

        current_v += step;
    }

    // ----------------------------------------------------------------------------------
    // -- Top bottom plane.
    // ----------------------------------------------------------------------------------

    if (render_top_bottom_plane)
    {
        var buffer_index = (x << 2) + (plane_start_yi < 0 ? 0 : plane_start_yi) * rc_buffers.screen_pitch;
        var plane_depth_index = (plane_start_yi < 0 ? 0 : plane_start_yi) * rc_buffers.depth_pitch + x;

        for (var y = plane_start_yi; y < plane_end_yi; ++y)
        {
            if (y >= 0 && y < RayCaster.resolution.height)
            {
                if (rc_buffers.depth[plane_depth_index] > intersection_data.exit_distance)
                {
                    var lightmap_pointer = intersection_data.block.lightmaps[plane_face];
                    var top_texture_pointer = TextureAtlas.offset[texture_id];

                    var distance = 1.0 / top_bottom_start[2];
                    var u = top_bottom_start[0] * distance;
                    var v = top_bottom_start[1] * distance;

                    u = u >= 1 ? 0.9999999 : u;
                    v = v >= 1 ? 0.9999999 : v;

                    u = u < 0 ? 0 : u;
                    v = v < 0 ? 0 : v;

                    if (RayCaster.settings.use_blank_color || texture_id < 0)
                    {
                        color[0] = RayCaster.settings.blank_color[0];
                        color[1] = RayCaster.settings.blank_color[1];
                        color[2] = RayCaster.settings.blank_color[2];
                    }
                    else
                    {
                        var tex_x = (u * RayCaster.settings.texture_size) | 0;
                        var tex_y = (v * RayCaster.settings.texture_size) | 0;

                        var offset = ((tex_y << RayCaster.settings.texture_pitch_shift) | tex_x) << 2;
                        var tex_pointer = top_texture_pointer + offset;

                        color[0] = TextureAtlas.data[tex_pointer + 0];
                        color[1] = TextureAtlas.data[tex_pointer + 1];
                        color[2] = TextureAtlas.data[tex_pointer + 2];
                    }

                    color_int_to_float(color);

                    lightmap_color[0] = 1;
                    lightmap_color[1] = 1;
                    lightmap_color[2] = 1;

                    ambient_color[0] = color[0] * RayCaster.level.ambient_color[0];
                    ambient_color[1] = color[1] * RayCaster.level.ambient_color[1];
                    ambient_color[2] = color[2] * RayCaster.level.ambient_color[2];

                    if (RayCaster.settings.use_lightmaps && lightmap_pointer >= 0)
                    {
                        RayCaster.lightmap_sampler.tex_pointer = lightmap_pointer;
                        RayCaster.lightmap_sampler.sample(RayCaster.lightmaps, RayCaster.lightmap_sampler, u, v, lightmap_color);
                        color_int_to_float(lightmap_color);
                    }

                    color[0] *= lightmap_color[0];
                    color[1] *= lightmap_color[1];
                    color[2] *= lightmap_color[2];

                    color[0] = clamp((color[0] + ambient_color[0]), 0, 1);
                    color[1] = clamp((color[1] + ambient_color[1]), 0, 1);
                    color[2] = clamp((color[2] + ambient_color[2]), 0, 1);

                    color_float_to_int(color);

                    rc_buffers.screen.data[buffer_index + 0] = color[0];
                    rc_buffers.screen.data[buffer_index + 1] = color[1];
                    rc_buffers.screen.data[buffer_index + 2] = color[2];

                    rc_buffers.depth[plane_depth_index] = intersection_data.exit_distance;
                }

                buffer_index += rc_buffers.screen_pitch;
                plane_depth_index += rc_buffers.depth_pitch;
            }

            top_bottom_start[0] += top_bottom_interp[0];
            top_bottom_start[1] += top_bottom_interp[1];
            top_bottom_start[2] += top_bottom_interp[2];
        }
    }
}

function draw_line_block(x, intersection_data)
{
    if (intersection_data.entry_distance >= RayCaster.settings.far_plane)
        return;

    // Camera space coordinates.
    var line_high_z = intersection_data.block.high_z - RayCaster.player.position[2];
    var line_low_z = intersection_data.block.low_z - RayCaster.player.position[2];
    var c = RayCaster.resolution.height_scale * RayCaster.camera.fov_scale;

    var one_over_entry_distance = 1.0 / (c * intersection_data.entry_distance);
    var one_over_exit_distance = 1.0 / (c * intersection_data.exit_distance);

    var line_start_float = camera_to_screen(line_high_z, one_over_entry_distance);
    var line_end_float = camera_to_screen(line_low_z, one_over_entry_distance);

    var line_height = line_end_float - line_start_float;
    var line_heighti = line_height | 0;

    var start_y = line_start_float | 0;
    var end_y = line_end_float | 0;

    var render_top_bottom_plane = false;

    var plane_y,
        plane_start_yi,
        plane_end_yi,
        plane_height,
        plane_step,
        plane_current_step,
        plane_start_u,
        plane_start_v,
        plane_end_u,
        plane_end_v,
        plane_start_distance,
        plane_delta_distance;

    var tex_scale_v = RayCaster.level.height;
    var plane_face;

    if (intersection_data.block.type == rc_enums.BLOCK_HALFWALL_TOP ||
        intersection_data.block.type == rc_enums.BLOCK_HALFWALL_BOTTOM)
        tex_scale_v = RayCaster.level.half_height;

    // Visible bottom plane.
    if (intersection_data.block.type == rc_enums.BLOCK_HALFWALL_TOP &&
        RayCaster.player.position[2] < RayCaster.level.half_height)
    {
        render_top_bottom_plane = true;
        plane_face = rc_enums.FACE_BOTTOM;

        plane_y = camera_to_screen(line_low_z, one_over_exit_distance);
        plane_start_yi = end_y;
        plane_end_yi = plane_y | 0;
        plane_step = 1.0 / (plane_y - line_end_float);
        plane_current_step = -plane_step * (line_end_float % 1);

        plane_start_u = (intersection_data.entry_x - intersection_data.bx) * one_over_entry_distance;
        plane_start_v = (intersection_data.entry_y - intersection_data.by) * one_over_entry_distance;

        plane_end_u = (intersection_data.exit_x - intersection_data.bx) * one_over_exit_distance;
        plane_end_v = (intersection_data.exit_y - intersection_data.by) * one_over_exit_distance;

        plane_start_distance = one_over_entry_distance;
        plane_delta_distance = one_over_exit_distance - one_over_entry_distance;
    }

    // Visible top plane.
    else if (intersection_data.block.type == rc_enums.BLOCK_HALFWALL_BOTTOM &&
             RayCaster.player.position[2] > RayCaster.level.half_height)
    {
        render_top_bottom_plane = true;
        plane_face = rc_enums.FACE_TOP;

        plane_y = camera_to_screen(line_high_z, one_over_exit_distance);
        plane_start_yi = plane_y | 0;
        plane_end_yi = start_y;
        plane_step = 1.0 / (line_start_float - plane_y);
        plane_current_step = -plane_step * (plane_y % 1);

        plane_start_u = (intersection_data.exit_x - intersection_data.bx) * one_over_exit_distance;
        plane_start_v = (intersection_data.exit_y - intersection_data.by) * one_over_exit_distance;

        plane_end_u = (intersection_data.entry_x - intersection_data.bx) * one_over_entry_distance;
        plane_end_v = (intersection_data.entry_y - intersection_data.by) * one_over_entry_distance;

        plane_start_distance = one_over_exit_distance;
        plane_delta_distance = one_over_entry_distance - one_over_exit_distance;
    }

    var start_yf = line_start_float % 1;
    var wall_buffer_index = x << 1;

    // texel per pixel.
    var r_line_height = 1.0 / line_height;

    var stepf = RayCaster.settings.texture_size * tex_scale_v * r_line_height;
    var stepi = stepf | 0;

    var light_stepf = RayCaster.settings.lightmap_size * r_line_height;
    var light_stepi = light_stepf | 0;

    stepi = stepi == 0 ? 1 : stepi + 1;
    light_stepi = light_stepi == 0 ? 1 : light_stepi + 1;

    var buffer_index = (x << 2) + (start_y < 0 ? 0 : start_y) * rc_buffers.screen_pitch;
    var texture_id = intersection_data.block.textures[intersection_data.face];

    var color = [0, 0, 0];
    var ambient_color = [0, 0, 0];
    var lightmap_color = [0, 0, 0];

    // if (intersection_data.bx == 3 && intersection_data.by == 2)
    //     texture_id = 6;
    // else
        texture_id = 0;

    var u = get_u(intersection_data.entry_x, intersection_data.entry_y, intersection_data.face) - intersection_data.u_offset;
    var tex_x = (u * RayCaster.settings.texture_size) | 0;
    var light_tex_x = (u * RayCaster.settings.lightmap_size) | 0;

    var tex_y = 0;
    var texf = -stepf * start_yf;

    var light_tex_y = 0;
    var light_texf = -light_stepf * start_yf;

    var texture_pointer = TextureAtlas.offset[texture_id] + (tex_x << 2);
    var lightmap_pointer = intersection_data.block.lightmaps[intersection_data.face];
    var wall_depth_index = (start_y < 0 ? 0 : start_y) * rc_buffers.depth_pitch + x;

    // light_multiplier = 1;
    var light_multiplier = get_fade_multiplier(intersection_data.entry_distance);

    // ----------------------------------------------------------------------------------
    // -- Wall line.
    // ----------------------------------------------------------------------------------

    for (var y = start_y; y < end_y; ++y)
    {
        if (y >= 0 && y < RayCaster.resolution.height)
        {
            if (rc_buffers.depth[wall_depth_index] > intersection_data.entry_distance)
            {
                var tc = (tex_y * RayCaster.settings.texture_size_r) | 0;
                var ty = tex_y % RayCaster.settings.texture_size;

                if ((intersection_data.block.flags & rc_enums.FLAG_MIRROR) && tc % 2)
                    ty = RayCaster.settings.texture_size - ty - 1;

                var offset_y = (ty << RayCaster.settings.texture_pitch_shift) << 2;
                // var v = (y - start_y) / (end_y - start_y);

                if (RayCaster.settings.use_blank_color || texture_id < 0)
                {
                    color[0] = RayCaster.settings.blank_color[0];
                    color[1] = RayCaster.settings.blank_color[1];
                    color[2] = RayCaster.settings.blank_color[2];
                }
                else
                {
                    color[0] = TextureAtlas.data[texture_pointer + offset_y + 0];
                    color[1] = TextureAtlas.data[texture_pointer + offset_y + 1];
                    color[2] = TextureAtlas.data[texture_pointer + offset_y + 2];
                }

                color_int_to_float(color);

                lightmap_color[0] = 0;
                lightmap_color[1] = 0;
                lightmap_color[2] = 0;

                ambient_color[0] = color[0] * RayCaster.level.ambient_color[0];
                ambient_color[1] = color[1] * RayCaster.level.ambient_color[1];
                ambient_color[2] = color[2] * RayCaster.level.ambient_color[2];

                if (RayCaster.settings.use_lightmaps && lightmap_pointer >= 0)
                {
                    light_tex_y %= RayCaster.settings.lightmap_size;

                    var light_offset = ((light_tex_y << RayCaster.settings.lightmap_pitch_shift) | light_tex_x) << 2;
                    var lp = lightmap_pointer + light_offset;

                    lightmap_color[0] = RayCaster.lightmaps[lp + 0];
                    lightmap_color[1] = RayCaster.lightmaps[lp + 1];
                    lightmap_color[2] = RayCaster.lightmaps[lp + 2];

                    color_int_to_float(lightmap_color);
                }

                // lightmap_color[0] = 1;
                // lightmap_color[1] = 1;
                // lightmap_color[2] = 1;

                color[0] *= lightmap_color[0];
                color[1] *= lightmap_color[1];
                color[2] *= lightmap_color[2];

                color[0] = clamp((color[0] + ambient_color[0]) * light_multiplier, 0, 1);
                color[1] = clamp((color[1] + ambient_color[1]) * light_multiplier, 0, 1);
                color[2] = clamp((color[2] + ambient_color[2]) * light_multiplier, 0, 1);

                // color[0] = (color[0] + ambient_color[0]) * light_multiplier;
                // color[1] = (color[1] + ambient_color[1]) * light_multiplier;
                // color[2] = (color[2] + ambient_color[2]) * light_multiplier;

                // reinhard(color);

                color_float_to_int(color);

                rc_buffers.screen.data[buffer_index + 0] = color[0];
                rc_buffers.screen.data[buffer_index + 1] = color[1];
                rc_buffers.screen.data[buffer_index + 2] = color[2];

                rc_buffers.depth[wall_depth_index] = intersection_data.entry_distance;
            }

            buffer_index += rc_buffers.screen_pitch;
            wall_depth_index += rc_buffers.depth_pitch;
        }

        texf += stepf;
        light_texf += light_stepf;

        var correction = texf - 0.999999;
        var light_correction = light_texf - 0.999999;

        if (correction > 0 && correction < rc_enums.EPSILON)
            texf = 1;

        if (light_correction > 0 && light_correction < rc_enums.EPSILON)
            light_texf = 1;

        if (texf >= stepi)
        {
            texf -= stepi;
            tex_y += stepi;
        }

        if (light_texf >= light_stepi)
        {
            light_texf -= light_stepi;
            light_tex_y += light_stepi;
        }
    }

    // ----------------------------------------------------------------------------------
    // Top-bottom plane line.
    // ----------------------------------------------------------------------------------

    if (render_top_bottom_plane)
    {
        var buffer_index = (x << 2) + (plane_start_yi < 0 ? 0 : plane_start_yi) * rc_buffers.screen_pitch;
        var plane_depth_index = (plane_start_yi < 0 ? 0 : plane_start_yi) * rc_buffers.depth_pitch + x;

        for (var y = plane_start_yi; y < plane_end_yi; ++y)
        {
            if (y >= 0 && y < RayCaster.resolution.height)
            {
                if (rc_buffers.depth[plane_depth_index] > intersection_data.exit_distance)
                {
                    var lightmap_pointer = intersection_data.block.lightmaps[plane_face];
                    var top_texture_pointer = TextureAtlas.offset[3];

                    var distance = 1.0 / (plane_start_distance + plane_delta_distance * plane_current_step);
                    var u = (plane_start_u + (plane_end_u - plane_start_u) * plane_current_step) * distance;
                    var v = (plane_start_v + (plane_end_v - plane_start_v) * plane_current_step) * distance;

                    u = u >= 1 ? 0.9999999 : u;
                    v = v >= 1 ? 0.9999999 : v;

                    u = u < 0 ? 0 : u;
                    v = v < 0 ? 0 : v;

                    if (RayCaster.settings.use_blank_color || texture_id < 0)
                    {
                        color[0] = RayCaster.settings.blank_color[0];
                        color[1] = RayCaster.settings.blank_color[1];
                        color[2] = RayCaster.settings.blank_color[2];
                    }
                    else
                    {
                        var tex_x = (u * RayCaster.settings.texture_size) | 0;
                        var tex_y = (v * RayCaster.settings.texture_size) | 0;

                        var offset = ((tex_y << RayCaster.settings.texture_pitch_shift) | tex_x) << 2;
                        var tex_pointer = top_texture_pointer + offset;

                        color[0] = TextureAtlas.data[tex_pointer + 0];
                        color[1] = TextureAtlas.data[tex_pointer + 1];
                        color[2] = TextureAtlas.data[tex_pointer + 2];
                    }

                    color_int_to_float(color);

                    lightmap_color[0] = 1;
                    lightmap_color[1] = 1;
                    lightmap_color[2] = 1;

                    ambient_color[0] = color[0] * RayCaster.level.ambient_color[0];
                    ambient_color[1] = color[1] * RayCaster.level.ambient_color[1];
                    ambient_color[2] = color[2] * RayCaster.level.ambient_color[2];

                    if (RayCaster.settings.use_lightmaps && lightmap_pointer >= 0)
                    {
                        var light_tex_x = (v * RayCaster.settings.lightmap_size) | 0;
                        var light_tex_y = (u * RayCaster.settings.lightmap_size) | 0;

                        var light_offset = (light_tex_y << RayCaster.settings.lightmap_pitch_shift | light_tex_x) << 2;
                        var lp = lightmap_pointer + light_offset;

                        lightmap_color[0] = RayCaster.lightmaps[lp + 0];
                        lightmap_color[1] = RayCaster.lightmaps[lp + 1];
                        lightmap_color[2] = RayCaster.lightmaps[lp + 2];

                        color_int_to_float(lightmap_color);
                    }

                    color[0] *= lightmap_color[0];
                    color[1] *= lightmap_color[1];
                    color[2] *= lightmap_color[2];

                    color[0] = clamp((color[0] + ambient_color[0]), 0, 1);
                    color[1] = clamp((color[1] + ambient_color[1]), 0, 1);
                    color[2] = clamp((color[2] + ambient_color[2]), 0, 1);

                    color_float_to_int(color);

                    rc_buffers.screen.data[buffer_index + 0] = color[0];
                    rc_buffers.screen.data[buffer_index + 1] = color[1];
                    rc_buffers.screen.data[buffer_index + 2] = color[2];

                    rc_buffers.depth[plane_depth_index] = intersection_data.exit_distance;
                }

                buffer_index += rc_buffers.screen_pitch;
                plane_depth_index += rc_buffers.depth_pitch;
            }

            plane_current_step += plane_step;
        }
    }
}

// ----------------------------------------------------------------------------------

function draw_ceiling()
{
    var vector = [0, 0];
    var step_vector = [0, 0];

    var ray_left = [0, 0];
    var ray_right = [0, 0];

    var top_height = Math.abs(RayCaster.player.position[2] - RayCaster.level.height);
    var screen_height = RayCaster.camera.raspect / RayCaster.camera.fov_scale;
    var current_screen_height = screen_height;

    var cz = 0;
    var screen_height_step = screen_height / RayCaster.resolution.half_height;

    var buffer_index = 0;
    var depth_index = 0;

    var offset_left = [1, 1 * RayCaster.camera.fov_scale];
    var offset_right = [1, -1 * RayCaster.camera.fov_scale];

    rotate_vector(offset_left);
    rotate_vector(offset_right);

    var color = [0, 0, 0];
    var ambient_color = [0, 0, 0];
    var lightmap_color = [0, 0, 0];

    for (var y = 0; y < RayCaster.resolution.half_height; ++y)
    {
        var intersection_distance = top_height / current_screen_height;
        intersection_distance = intersection_distance == Infinity ? 9999999 : intersection_distance;

        if (intersection_distance > RayCaster.settings.near_plane)
        {
            var offset_left_x = offset_left[0] * intersection_distance;
            var offset_left_y = offset_left[1] * intersection_distance;
            var offset_right_x = offset_right[0] * intersection_distance;
            var offset_right_y = offset_right[1] * intersection_distance;

            ray_left[0] = RayCaster.player.position[0] + offset_left_x;
            ray_left[1] = RayCaster.player.position[1] + offset_left_y;

            ray_right[0] = RayCaster.player.position[0] + offset_right_x;
            ray_right[1] = RayCaster.player.position[1] + offset_right_y;

            step_vector[0] = (ray_right[0] - ray_left[0]) * RayCaster.resolution.one_over_width;
            step_vector[1] = (ray_right[1] - ray_left[1]) * RayCaster.resolution.one_over_width;

            vector[0] = ray_left[0];
            vector[1] = ray_left[1];

            // TODO(gabic): Aproximarea cu epsilon ?
            var distance = dot(offset_left_x, offset_left_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);

            if (distance < RayCaster.settings.far_plane)
            {
                var light_multiplier = get_fade_multiplier(distance);

                var dest_pixel = buffer_index;
                var row_depth = depth_index;

                for (var x = 0; x < RayCaster.resolution.width; ++x)
                {
                    if (distance < rc_buffers.depth[row_depth++])
                    {
                        var block_row = Math.floor(vector[1]);
                        var block_col = Math.floor(vector[0]);
                        var block = rc_procs.get_block(RayCaster.level, block_row, block_col);

                        if (block)
                        {
                            var lightmap_pointer = block.ceiling_lightmap;

                            if (RayCaster.settings.use_blank_color)
                            {
                                color[0] = RayCaster.settings.blank_color[0];
                                color[1] = RayCaster.settings.blank_color[1];
                                color[2] = RayCaster.settings.blank_color[2];
                            }
                            else
                            {
                                var scaled_x = 0.001 + vector[0] * RayCaster.level.ceiling_floor_texture_scale[0];
                                var scaled_y = 0.001 + vector[1] * RayCaster.level.ceiling_floor_texture_scale[1];

                                var scaled_xi = scaled_x | 0;
                                var scaled_yi = scaled_y | 0;

                                var u = scaled_y % 1;
                                var v = scaled_x % 1;

                                u = u >= 1 ? 0.9999999 : u;
                                v = v >= 1 ? 0.9999999 : v;

                                u = u < 0 ? 1 + u : u;
                                v = v < 0 ? 1 + v : v;

                                var texture_index = RayCaster.level.ceiling_texture;

                                if (block.textures[rc_enums.FACE_TOP] >= 0)
                                    texture_index = block.textures[rc_enums.FACE_TOP];

                                RayCaster.sampler.tex_pointer = texture_index >= 0 ? TextureAtlas.offset[texture_index] : -1;
                                RayCaster.sampler.sample(TextureAtlas.data, RayCaster.sampler, u, v, color);
                            }

                            color_int_to_float(color);

                            lightmap_color[0] = 1;
                            lightmap_color[1] = 1;
                            lightmap_color[2] = 1;

                            ambient_color[0] = color[0] * RayCaster.level.ambient_color[0];
                            ambient_color[1] = color[1] * RayCaster.level.ambient_color[1];
                            ambient_color[2] = color[2] * RayCaster.level.ambient_color[2];

                            if (RayCaster.settings.use_lightmaps && lightmap_pointer >= 0)
                            {
                                var light_u = vector[1] % 1;
                                var light_v = vector[0] % 1;

                                light_u = light_u >= 1 ? 0.9999999 : light_u;
                                light_v = light_v >= 1 ? 0.9999999 : light_v;

                                light_u = light_u < 0 ? 1 + light_u : light_u;
                                light_v = light_v < 0 ? 1 + light_v : light_v;

                                RayCaster.lightmap_sampler.tex_pointer = lightmap_pointer;
                                RayCaster.lightmap_sampler.sample(RayCaster.lightmaps, RayCaster.lightmap_sampler, light_u, 1 - light_v, lightmap_color);

                                color_int_to_float(lightmap_color);
                            }

                            color_blend(color, lightmap_color, ambient_color, light_multiplier);

                            color[0] = clamp(color[0], 0, 1);
                            color[1] = clamp(color[1], 0, 1);
                            color[2] = clamp(color[2], 0, 1);

                            color_float_to_int(color);

                            rc_buffers.screen.data[dest_pixel + 0] = color[0];
                            rc_buffers.screen.data[dest_pixel + 1] = color[1];
                            rc_buffers.screen.data[dest_pixel + 2] = color[2];
                        }
                    }

                    vector[0] += step_vector[0];
                    vector[1] += step_vector[1];

                    dest_pixel += 4;
                }
            }
        }

        current_screen_height -= screen_height_step;
        buffer_index += rc_buffers.screen_pitch;
        depth_index += rc_buffers.depth_pitch;
    }
}

function draw_floor()
{
    var vector = [0, 0];
    var step_vector = [0, 0];

    var ray_left = [0, 0];
    var ray_right = [0, 0];

    var bottom_height = RayCaster.player.position[2];
    var screen_height = RayCaster.camera.raspect / RayCaster.camera.fov_scale;
    var current_screen_height = screen_height;

    var screen_height_step = screen_height / RayCaster.resolution.half_height;

    var buffer_index = (RayCaster.resolution.height - 1) * rc_buffers.screen_pitch;
    var depth_index = (RayCaster.resolution.height - 1) * rc_buffers.depth_pitch;

    var offset_left = [1, 1 * RayCaster.camera.fov_scale];
    var offset_right = [1, -1 * RayCaster.camera.fov_scale];

    rotate_vector(offset_left);
    rotate_vector(offset_right);

    var color = [0, 0, 0];
    var lightmap_color = [0, 0, 0];
    var ambient_color = [0, 0, 0];

    for (var y = RayCaster.resolution.height - 1; y >= RayCaster.resolution.half_height; --y)
    {
        var intersection_distance = bottom_height / current_screen_height;
        intersection_distance = intersection_distance == Infinity ? 9999999 : intersection_distance;

        if (intersection_distance > RayCaster.settings.near_plane)
        {
            var offset_left_x = offset_left[0] * intersection_distance;
            var offset_left_y = offset_left[1] * intersection_distance;
            var offset_right_x = offset_right[0] * intersection_distance;
            var offset_right_y = offset_right[1] * intersection_distance;

            ray_left[0] = RayCaster.player.position[0] + offset_left_x;
            ray_left[1] = RayCaster.player.position[1] + offset_left_y;

            ray_right[0] = RayCaster.player.position[0] + offset_right_x;
            ray_right[1] = RayCaster.player.position[1] + offset_right_y;

            step_vector[0] = (ray_right[0] - ray_left[0]) * RayCaster.resolution.one_over_width;
            step_vector[1] = (ray_right[1] - ray_left[1]) * RayCaster.resolution.one_over_width;

            vector[0] = ray_left[0];
            vector[1] = ray_left[1];

            var distance = dot(offset_left_x, offset_left_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);

            if (distance < RayCaster.settings.far_plane)
            {
                var light_multiplier = get_fade_multiplier(distance);

                var dest_pixel = buffer_index;
                var row_depth = depth_index;

                for (var x = 0; x < RayCaster.resolution.width; ++x)
                {
                    if (distance < rc_buffers.depth[row_depth++])
                    {
                        var block_row = Math.floor(vector[1]);
                        var block_col = Math.floor(vector[0]);
                        var block = rc_procs.get_block(RayCaster.level, block_row, block_col);

                        if (block)
                        {
                            var lightmap_pointer = block.floor_lightmap;

                            if (RayCaster.settings.use_blank_color)
                            {
                                color[0] = RayCaster.settings.blank_color[0];
                                color[1] = RayCaster.settings.blank_color[1];
                                color[2] = RayCaster.settings.blank_color[2];
                            }
                            else
                            {
                                var scaled_x = 0.0001 + vector[0] * RayCaster.level.ceiling_floor_texture_scale[0];
                                var scaled_y = 0.0001 + vector[1] * RayCaster.level.ceiling_floor_texture_scale[1];

                                var u = scaled_y % 1;
                                var v = scaled_x % 1;

                                u = u >= 1 ? 0.9999999 : u;
                                v = v >= 1 ? 0.9999999 : v;

                                u = u < 0 ? 1 + u : u;
                                v = v < 0 ? 1 + v : v;

                                var texture_index = RayCaster.level.floor_texture;

                                if (block.type != rc_enums.BLOCK_WALL && block.textures[rc_enums.FACE_BOTTOM] >= 0)
                                    texture_index = block.textures[rc_enums.FACE_BOTTOM];

                                RayCaster.sampler.tex_pointer = texture_index >= 0 ? TextureAtlas.offset[texture_index] : -1;
                                RayCaster.sampler.sample(TextureAtlas.data, RayCaster.sampler, u, v, color);
                            }

                            color_int_to_float(color);

                            lightmap_color[0] = 1;
                            lightmap_color[1] = 1;
                            lightmap_color[2] = 1;

                            ambient_color[0] = color[0] * RayCaster.level.ambient_color[0];
                            ambient_color[1] = color[1] * RayCaster.level.ambient_color[1];
                            ambient_color[2] = color[2] * RayCaster.level.ambient_color[2];

                            if (RayCaster.settings.use_lightmaps && lightmap_pointer >= 0)
                            {
                                var light_u = vector[1] % 1;
                                var light_v = vector[0] % 1;

                                light_u = light_u >= 1 ? 0.9999999 : light_u;
                                light_v = light_v >= 1 ? 0.9999999 : light_v;

                                light_u = light_u < 0 ? 1 + light_u : light_u;
                                light_v = light_v < 0 ? 1 + light_v : light_v;

                                RayCaster.lightmap_sampler.tex_pointer = lightmap_pointer;
                                RayCaster.lightmap_sampler.sample(RayCaster.lightmaps, RayCaster.lightmap_sampler, light_u, 1 - light_v, lightmap_color);

                                color_int_to_float(lightmap_color);
                            }

                            color_blend(color, lightmap_color, ambient_color, light_multiplier);

                            color[0] = clamp(color[0], 0, 1);
                            color[1] = clamp(color[1], 0, 1);
                            color[2] = clamp(color[2], 0, 1);

                            color_float_to_int(color);

                            rc_buffers.screen.data[dest_pixel + 0] = color[0];
                            rc_buffers.screen.data[dest_pixel + 1] = color[1];
                            rc_buffers.screen.data[dest_pixel + 2] = color[2];
                        }
                    }

                    vector[0] += step_vector[0];
                    vector[1] += step_vector[1];

                    dest_pixel += 4;
                }
            }
        }

        current_screen_height -= screen_height_step;
        buffer_index -= rc_buffers.screen_pitch;
        depth_index -= rc_buffers.depth_pitch;
    }
}

function draw_ceiling_floor()
{
    var top_vector = [0, 0];
    var bottom_vector = [0, 0];

    var top_step_vector = [0, 0];
    var bottom_step_vector = [0, 0];

    var top_ray_left = [0, 0];
    var top_ray_right = [0, 0];

    var bottom_ray_left = [0, 0];
    var bottom_ray_right = [0, 0];

    var world_step_z = 1 / RayCaster.resolution.half_height;
    var cz = 0;
    var top_z = 0;
    var bottom_z = 0;

    var floor_buffer_index = RayCaster.resolution.half_height * rc_buffers.screen_pitch;
    var ceil_buffer_index = floor_buffer_index - rc_buffers.screen_pitch;

    // var offset_left = [
    //     RayCaster.player.forward[0] - RayCaster.player.side[0],
    //     RayCaster.player.forward[1] - RayCaster.player.side[1]
    // ];

    // var offset_right = [
    //     RayCaster.player.forward[0] + RayCaster.player.side[0],
    //     RayCaster.player.forward[1] + RayCaster.player.side[1]
    // ];

    var offset_left = [1, 1 * RayCaster.camera.fov_scale];
    var offset_right = [1, -1 * RayCaster.camera.fov_scale];

    rotate_vector(offset_left);
    rotate_vector(offset_right);

    var ceil_y = RayCaster.resolution.half_height - 1;
    var floor_y = RayCaster.resolution.half_height;

    // Determine the world space row vectors.
    // for (var y = RayCaster.resolution.half_height; y < RayCaster.resolution.height; ++y)
    for (var y = 0; y < RayCaster.resolution.half_height; ++y, --ceil_y, ++floor_y)
    {
        var intersection_top_scale = 0.995 / (top_z * RayCaster.camera.raspect * RayCaster.camera.fov_scale);
        var intersection_bottom_scale = 0.995 / (bottom_z * RayCaster.camera.raspect * RayCaster.camera.fov_scale)

        // var intersection_scale = 0.995 / (cz * RayCaster.camera.fov_scale);
        intersection_top_scale = intersection_top_scale == Infinity ? 9999999 : intersection_top_scale;
        intersection_bottom_scale = intersection_bottom_scale == Infinity ? 9999999 : intersection_bottom_scale;
        // var intersection_scale = 1 / (cz * RayCaster.camera.fov_scale);

        var top_offset_left_x = offset_left[0] * intersection_top_scale;
        var top_offset_left_y = offset_left[1] * intersection_top_scale;
        var top_offset_right_x = offset_right[0] * intersection_top_scale;
        var top_offset_right_y = offset_right[1] * intersection_top_scale;

        var bottom_offset_left_x = offset_left[0] * intersection_bottom_scale;
        var bottom_offset_left_y = offset_left[1] * intersection_bottom_scale;
        var bottom_offset_right_x = offset_right[0] * intersection_bottom_scale;
        var bottom_offset_right_y = offset_right[1] * intersection_bottom_scale;

        top_ray_left[0] = RayCaster.player.position[0] + top_offset_left_x;
        top_ray_left[1] = RayCaster.player.position[1] + top_offset_left_y;

        top_ray_right[0] = RayCaster.player.position[0] + top_offset_right_x;
        top_ray_right[1] = RayCaster.player.position[1] + top_offset_right_y;

        bottom_ray_left[0] = RayCaster.player.position[0] + bottom_offset_left_x;
        bottom_ray_left[1] = RayCaster.player.position[1] + bottom_offset_left_y;

        bottom_ray_right[0] = RayCaster.player.position[0] + bottom_offset_right_x;
        bottom_ray_right[1] = RayCaster.player.position[1] + bottom_offset_right_y;

        top_step_vector[0] = (top_ray_right[0] - top_ray_left[0]) * RayCaster.resolution.one_over_width;
        top_step_vector[1] = (top_ray_right[1] - top_ray_left[1]) * RayCaster.resolution.one_over_width;

        bottom_step_vector[0] = (bottom_ray_right[0] - bottom_ray_left[0]) * RayCaster.resolution.one_over_width;
        bottom_step_vector[1] = (bottom_ray_right[1] - bottom_ray_left[1]) * RayCaster.resolution.one_over_width;

        top_vector[0] = top_ray_left[0];
        top_vector[1] = top_ray_left[1];

        bottom_vector[0] = bottom_ray_left[0];
        bottom_vector[1] = bottom_ray_left[1];

        var ceil_dest_pixel = ceil_buffer_index;
        var floor_dest_pixel = floor_buffer_index;

        var light_multiplier = 1;
        var top_distance = dot(top_offset_left_x, top_offset_left_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);

        if (top_distance < RayCaster.settings.far_plane)
        {
            if (RayCaster.settings.light_fade)
            {
                var ramp_index = (RayCaster.settings.fade_c * top_distance) | 0;

                if (ramp_index < RayCaster.settings.fade_ramp.length)
                    light_multiplier *= RayCaster.settings.fade_ramp[ramp_index];
                else
                    light_multiplier = 0;
            }

            var ceil_depth_index = ceil_y * rc_buffers.depth_pitch;
            var floor_depth_index = floor_y * rc_buffers.depth_pitch;

            for (var x = 0; x < RayCaster.resolution.width; ++x)
            {
                var ceil_check = top_distance < rc_buffers.depth[ceil_depth_index++];
                // var floor_check = top_distance > rc_buffers.depth[floor_depth_index++];

                if (ceil_check)
                {
                    var block_row = top_vector[1] | 0;
                    var block_col = top_vector[0] | 0;
                    var block = rc_procs.get_block(RayCaster.level, block_row, block_col);

                    if (block)
                    {
                        var scaled_x = 0.001 + top_vector[0] * RayCaster.level.ceiling_floor_texture_scale;
                        var scaled_y = 0.001 + top_vector[1] * RayCaster.level.ceiling_floor_texture_scale;

                        var scaled_xi = scaled_x | 0;
                        var scaled_yi = scaled_y | 0;

                        var u = scaled_y % 1;
                        var v = scaled_x % 1;

                        u = u < 0 ? 1 + u : u;
                        v = v < 0 ? 1 + v : v;

                        // if (RayCaster.settings.ceiling_floor_texture_mirror[0] && scaled_yi % 2)
                        //     u = 1 - u;

                        // if (RayCaster.settings.ceiling_floor_texture_mirror[1] && scaled_xi % 2)
                        //     v = 1 - v;

                        var tex_x = (u * RayCaster.settings.texture_size) | 0;
                        var tex_y = (v * RayCaster.settings.texture_size) | 0;
                        var texture_offset = ((tex_y << RayCaster.settings.texture_pitch_shift) | tex_x) << 2;

                        var ceiling_texture_pointer = TextureAtlas.offset[RayCaster.level.ceiling_texture];
                        // var floor_texture_pointer = TextureAtlas.offset[RayCaster.level.floor_texture];

                        // var block = rc_procs.get_block(RayCaster.level, block_row, block_col);

                        if (block.textures[rc_enums.FACE_TOP] >= 0)
                        {
                            var texture_index = block.textures[rc_enums.FACE_TOP];
                            ceiling_texture_pointer = TextureAtlas.offset[texture_index];
                        }

                        // if (block.textures[rc_enums.FACE_BOTTOM] >= 0)
                        // {
                        //     var texture_index = block.textures[rc_enums.FACE_BOTTOM];
                        //     floor_texture_pointer = TextureAtlas.offset[texture_index];
                        // }

                        var ceiling_tex = ceiling_texture_pointer + texture_offset;
                        // var floor_tex = floor_texture_pointer + texture_offset;

                        if (ceil_check)
                        {
                            rc_buffers.screen.data[ceil_dest_pixel + 0] = TextureAtlas.data[ceiling_tex + 0] * light_multiplier;
                            rc_buffers.screen.data[ceil_dest_pixel + 1] = TextureAtlas.data[ceiling_tex + 1] * light_multiplier;
                            rc_buffers.screen.data[ceil_dest_pixel + 2] = TextureAtlas.data[ceiling_tex + 2] * light_multiplier;
                        }

                        // if (floor_check)
                        // {
                        //     rc_buffers.screen.data[floor_dest_pixel + 0] = TextureAtlas.data[floor_tex + 0] * light_multiplier;
                        //     rc_buffers.screen.data[floor_dest_pixel + 1] = TextureAtlas.data[floor_tex + 1] * light_multiplier;
                        //     rc_buffers.screen.data[floor_dest_pixel + 2] = TextureAtlas.data[floor_tex + 2] * light_multiplier;
                        // }
                    }
                }

                top_vector[0] += top_step_vector[0];
                top_vector[1] += top_step_vector[1];

                ceil_dest_pixel += 4;
                // floor_dest_pixel += 4;
            }
        }

        // cz += world_step_z;
        top_z += world_step_z;
        // bottom_z -= world_step_z;

        ceil_buffer_index -= rc_buffers.screen_pitch;
        // floor_buffer_index += rc_buffers.screen_pitch;
    }
}

function rasterize()
{
    var dx = 0;

    var intersection_data = {
        found: false,
        block: null,
        entry_x: 0,
        entry_y: 0,
        exit_x: 0,
        exit_y: 0,
        face: rc_enums.FACE_NONE, // left = 0, right = 1, front = 2, back = 3
        u_offset: 0,
        entry_distance: 1,
        exit_distance: 1
    };

    // Ray casting.
    for (var x = 0; x < RayCaster.resolution.width; ++x)
    {
        // Ray setup.
        var base_ray = [1, -RayCaster.camera.fov_scale * (dx - 1)];
        rotate_vector(base_ray);

        var bx = RayCaster.player.position[0] | 0;
        var by = RayCaster.player.position[1] | 0;

        var offset_x = RayCaster.player.position[0] - (RayCaster.player.position[0] | 0);
        var offset_y = RayCaster.player.position[1] - (RayCaster.player.position[1] | 0);

        var step_x = 1;
        var step_y = 1;

        var step_tx = base_ray[0] == 0 ? 9999999999 : Math.abs(1.0 / base_ray[0]);
        var step_ty = base_ray[1] == 0 ? 9999999999 : Math.abs(1.0 / base_ray[1]);

        if (base_ray[0] < 0)
        {
            step_x = -1;

            if (offset_x == 0)
            {
                offset_x = 1;
                bx--;
            }
        }
        else {
            offset_x = 1 - offset_x;
        }

        if (base_ray[1] < 0)
        {
            step_y = -1;

            if (offset_y == 0)
            {
                offset_y = 1;
                by--;
            }
        }
        else {
            offset_y = 1 - offset_y;
        }

        var current_tx = offset_x * step_tx;
        var current_ty = offset_y * step_ty;

        intersection_data.found = false;
        intersection_data.distance = -1;

        var face = 0;

        // Block traversal.
        while (!intersection_data.found)
        {
            var current_t = current_tx;
            var is_x_dir = true;

            if (current_tx < current_ty)
            {
                bx += step_x;
                current_tx += step_tx;
                face = base_ray[0] < 0 ? rc_enums.FACE_BACK : rc_enums.FACE_FRONT;
            }
            else
            {
                current_t = current_ty;
                is_x_dir = false;

                by += step_y;
                current_ty += step_ty;
                face = base_ray[1] < 0 ? rc_enums.FACE_LEFT : rc_enums.FACE_RIGHT;
            }

            var next_t = current_ty;

            if (current_tx < current_ty)
                next_t = current_tx;

            // if (!valid_block(bx, by))
            //     break;

            var current_block = rc_procs.get_block(RayCaster.level, by, bx);

            if (!current_block || current_block.type == rc_enums.BLOCK_VOID)
                break;

            if (current_block.type == rc_enums.BLOCK_WALL)
            {
                var entry_ray_x = current_t * base_ray[0];
                var entry_ray_y = current_t * base_ray[1];

                var exit_ray_x = next_t * base_ray[0];
                var exit_ray_y = next_t * base_ray[1];

                intersection_data.entry_x = RayCaster.player.position[0] + entry_ray_x;
                intersection_data.entry_y = RayCaster.player.position[1] + entry_ray_y;

                intersection_data.exit_x = RayCaster.player.position[0] + exit_ray_x;
                intersection_data.exit_y = RayCaster.player.position[1] + exit_ray_y;

                var entry_distance = dot(entry_ray_x, entry_ray_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);
                var exit_distance = dot(exit_ray_x, exit_ray_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);

                if (entry_distance > RayCaster.settings.near_plane)
                {
                    intersection_data.found = true;
                    intersection_data.block = current_block;
                    intersection_data.face = face;
                    intersection_data.u_offset = 0;
                    intersection_data.entry_distance = entry_distance;
                    intersection_data.exit_distance = exit_distance;
                    intersection_data.bx = bx;
                    intersection_data.by = by;

                    draw_line_block2(x, intersection_data);
                }
            }

            else if (current_block.type == rc_enums.BLOCK_HALFWALL_TOP || current_block.type == rc_enums.BLOCK_HALFWALL_BOTTOM)
            {
                var entry_ray_x = current_t * base_ray[0];
                var entry_ray_y = current_t * base_ray[1];

                var exit_ray_x = next_t * base_ray[0];
                var exit_ray_y = next_t * base_ray[1];

                intersection_data.entry_x = RayCaster.player.position[0] + entry_ray_x;
                intersection_data.entry_y = RayCaster.player.position[1] + entry_ray_y;

                intersection_data.exit_x = RayCaster.player.position[0] + exit_ray_x;
                intersection_data.exit_y = RayCaster.player.position[1] + exit_ray_y;

                var entry_distance = dot(entry_ray_x, entry_ray_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);
                var exit_distance = dot(exit_ray_x, exit_ray_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);

                if (entry_distance > RayCaster.settings.near_plane)
                {
                    // intersection_data.found = true;
                    intersection_data.block = current_block;
                    intersection_data.face = face;
                    intersection_data.u_offset = 0;
                    intersection_data.entry_distance = entry_distance;
                    intersection_data.exit_distance = exit_distance;
                    intersection_data.bx = bx;
                    intersection_data.by = by;

                    draw_line_block2(x, intersection_data);
                }
            }

            // else if (RayCaster.map.data[block_index + RayCaster.BLOCK_STRUCT_TYPE] == RayCaster.BLOCK_DOOR)
            // {
            //     var object_index = RayCaster.map.data[block_index + RayCaster.BLOCK_STRUCT_VALUE];
            //     var object = RayCaster.objects[object_index];

            //     var interp_t = current_t + object.position;

            //     // The ray intersects the door.
            //     if (interp_t < next_t)
            //     {
            //         // Find the intersection point.
            //         var ray_x = interp_t * base_ray[0];
            //         var ray_y = interp_t * base_ray[1];

            //         intersection_data.ix = RayCaster.player.position[0] + ray_x;
            //         intersection_data.iy = RayCaster.player.position[1] + ray_y;

            //         // Check if the ray intersects the opened part of the door.
            //         var u = get_u(intersection_data.ix, intersection_data.iy, face);
            //         var distance = dot(ray_x, ray_y, RayCaster.player.forward[0], RayCaster.player.forward[1]);

            //         if (distance > RayCaster.settings.near_plane && u >= object.offset)
            //         {
            //             intersection_data.found = true;
            //             intersection_data.texture_index = object.texture;
            //             intersection_data.face = face;
            //             intersection_data.u_offset = object.offset;
            //             intersection_data.distance = distance;
            //         }
            //     }
            // }

            // TODO(gabic): desenarea unei linii trebuie facuta aici si pentru block si pentru object

            // else if (RayCaster.map.data[block_index + RayCaster.BLOCK_STRUCT_TYPE] == RayCaster.BLOCK_SECRET_WALL)
            // {}
        }

        // if (intersection_data.found)
            // draw_wall(x, intersection_data);
            // draw_wall_v2(x, intersection_data);

        dx += RayCaster.resolution.sdx;
    }

    draw_ceiling();
    draw_floor();

    // draw_transparency();
}

// ----------------------------------------------------------------------------------
// -- Event listeners.
// ----------------------------------------------------------------------------------

function tile_index(row, col) {
    return row * RayCaster.level.rows + col;
}

function get_tile(row, col)
{
    var index = tile_index(row, col);

    if (index >= 0 && index < RayCaster.level.data.length)
        return RayCaster.level.data[index];

    return null;
}

function push_command(action)
{
    var command = null;

    // Select an available command slot.
    for (var i = 0; i < RayCaster.max_queue_commands; ++i)
    {
        command = RayCaster.command_queue[i];

        if (!command.free)
            continue;

        // Command is free so it can be used.
        command.free = false;
        command.action = action;
        command.t = 0;
        command.time_ms = 0;

        break;
    }
}

function setup_command(command)
{
    if (!command)
        return;

    switch (command.action)
    {
        case 'rotate_left':
        case 'rotate_right': {
            command.values[0] = RayCaster.player.rotation;
        }
        break;

        case 'forward':
        {
            var end_row = RayCaster.player.tile[0] + RayCaster.directions[RayCaster.player.tile_dir][0];
            var end_col = RayCaster.player.tile[1] + RayCaster.directions[RayCaster.player.tile_dir][1];

            var tile = get_tile(end_row, end_col);

            // Invalid movement.
            if (tile && tile.type != rc_enums.BLOCK_EMPTY)
            {
                RayCaster.current_command.free = true;
                RayCaster.current_command = null;
            }
            else
            {
                command.values[0] = RayCaster.player.tile[0];
                command.values[1] = RayCaster.player.tile[1];
                command.values[2] = end_row;
                command.values[3] = end_col;
                command.values[4] = RayCaster.player.position[2];
            }
        }
        break;

        case 'backward':
        {
            var tile_dir = (RayCaster.player.tile_dir + 2) % 4;

            var end_row = RayCaster.player.tile[0] + RayCaster.directions[tile_dir][0];
            var end_col = RayCaster.player.tile[1] + RayCaster.directions[tile_dir][1];

            var tile = get_tile(end_row, end_col);

            // Invalid movement.
            if (tile && tile.type != rc_enums.BLOCK_EMPTY)
            {
                RayCaster.current_command.free = true;
                RayCaster.current_command = null;
            }
            else
            {
                command.values[0] = RayCaster.player.tile[0];
                command.values[1] = RayCaster.player.tile[1];
                command.values[2] = end_row;
                command.values[3] = end_col;
                command.values[4] = RayCaster.player.position[2];
            }
        }
        break;

        case 'left':
        {
            var tile_dir = (RayCaster.player.tile_dir + 3) % 4;

            var end_row = RayCaster.player.tile[0] + RayCaster.directions[tile_dir][0];
            var end_col = RayCaster.player.tile[1] + RayCaster.directions[tile_dir][1];

            var tile = get_tile(end_row, end_col);

            // Invalid movement.
            if (tile && tile.type != rc_enums.BLOCK_EMPTY)
            {
                RayCaster.current_command.free = true;
                RayCaster.current_command = null;
            }
            else
            {
                command.values[0] = RayCaster.player.tile[0];
                command.values[1] = RayCaster.player.tile[1];
                command.values[2] = end_row;
                command.values[3] = end_col;
                command.values[4] = RayCaster.player.position[2];
            }
        }
        break;

        case 'right':
        {
            var tile_dir = (RayCaster.player.tile_dir + 1) % 4;

            var end_row = RayCaster.player.tile[0] + RayCaster.directions[tile_dir][0];
            var end_col = RayCaster.player.tile[1] + RayCaster.directions[tile_dir][1];

            var tile = get_tile(end_row, end_col);

            // Invalid movement.
            if (tile && tile.type != rc_enums.BLOCK_EMPTY)
            {
                RayCaster.current_command.free = true;
                RayCaster.current_command = null;
            }
            else
            {
                command.values[0] = RayCaster.player.tile[0];
                command.values[1] = RayCaster.player.tile[1];
                command.values[2] = end_row;
                command.values[3] = end_col;
                command.values[4] = RayCaster.player.position[2];
            }
        }
        break;
    }
}

function process_commands(delta)
{
    // If there is no current command get one from the queue.
    if (!RayCaster.current_command)
    {
        var index = 0;

        for (var i = 0; i < RayCaster.max_queue_commands; ++i)
        {
            var command = RayCaster.command_queue[i];

            if (command.free)
                continue;

            RayCaster.current_command = command;
            break;
        }

        setup_command(RayCaster.current_command);
    }

    // No commands to process.
    if (!RayCaster.current_command)
        return;

    // Command is finished.
    if (RayCaster.current_command.t == 1)
    {
        RayCaster.current_command.free = true;
        RayCaster.current_command = null;
    }
    else
    {
        RayCaster.current_command.time_ms += delta;
        RayCaster.current_command.t = RayCaster.current_command.time_ms / RayCaster.player.speed_ms;

        if (RayCaster.current_command.t > 1)
            RayCaster.current_command.t = 1;

        if (RayCaster.current_command.action == 'rotate_left')
        {
            RayCaster.player.rotation = RayCaster.current_command.values[0] + 90 * RayCaster.current_command.t;

            if (RayCaster.current_command.t == 1)
            {
                RayCaster.player.tile_dir += 3;
                RayCaster.player.tile_dir %= 4;
            }
        }
        else if (RayCaster.current_command.action == 'rotate_right')
        {
            RayCaster.player.rotation = RayCaster.current_command.values[0] - 90 * RayCaster.current_command.t;

            if (RayCaster.current_command.t == 1)
            {
                RayCaster.player.tile_dir++;
                RayCaster.player.tile_dir %= 4;
            }
        }
        else if (RayCaster.current_command.action == 'forward' ||
                 RayCaster.current_command.action == 'backward' ||
                 RayCaster.current_command.action == 'left' ||
                 RayCaster.current_command.action == 'right')
        {
            var interp_row = RayCaster.current_command.values[0] + (RayCaster.current_command.values[2] - RayCaster.current_command.values[0]) * RayCaster.current_command.t;
            var interp_col = RayCaster.current_command.values[1] + (RayCaster.current_command.values[3] - RayCaster.current_command.values[1]) * RayCaster.current_command.t;

            RayCaster.player.position[0] = interp_col + 0.5;
            RayCaster.player.position[1] = interp_row + 0.5;

            if (RayCaster.player.headbob)
            {
                RayCaster.player.position[2] = RayCaster.current_command.values[4] +
                                               Math.sin(RayCaster.current_command.t * 2 * Math.PI) * RayCaster.player.headbob_max;
            }

            if (RayCaster.current_command.t == 1)
            {
                RayCaster.player.tile[0] = RayCaster.current_command.values[2];
                RayCaster.player.tile[1] = RayCaster.current_command.values[3];
            }
        }
    }
}

root.addEventListener('keydown', function(event)
{
    switch (event.key)
    {
        case "q": {
            push_command('rotate_left');
        }
        break;

        case "e": {
            push_command('rotate_right');
        }
        break;

        case "w": {
            push_command('forward');
        }
        break;

        case "s": {
            push_command('backward');
        }
        break;

        case "a": {
            push_command('left');
        }
        break;

        case "d": {
            push_command('right');
        }
        break;

        case "1": {
            RayCaster.settings.use_blank_color = !RayCaster.settings.use_blank_color;
        }
        break;

        case "2": {
            RayCaster.settings.use_lightmaps = !RayCaster.settings.use_lightmaps;
        }
        break;

        case "3":
        {
            RayCaster.settings.lightmap_filtering = !RayCaster.settings.lightmap_filtering;

            if (RayCaster.settings.lightmap_filtering)
                RayCaster.lightmap_sampler.sample = Common.sample_texture_filtering;
            else
                RayCaster.lightmap_sampler.sample = Common.sample_texture;
        }
        break;

        case "4":
        {
            RayCaster.settings.texture_filtering = !RayCaster.settings.texture_filtering;

            if (RayCaster.settings.texture_filtering)
                RayCaster.sampler.sample = Common.sample_texture_filtering;
            else
                RayCaster.sampler.sample = Common.sample_texture;
        }
        break;
    }
});

root.addEventListener('keyup', function(event)
{});

var dir = 1;
raycaster_setup();

function render(timestamp)
{
    var t0 = performance.now();

    var delta = timestamp - prev_timestamp;
    prev_timestamp = timestamp;

    update(delta);
    current_level.update(delta);

    process_commands(delta);
    update_player();
    clear_screen();

    if (RayCaster.level)
    {
        clear_depth_buffer();
        rasterize();
    }

    // debug_lightmap(38, 2, rc_enums.FACE_LEFT, 0);
    // debug_lightmap(0, 1, rc_enums.FACE_BACK, 1);
    // debug_lightmap(0, 1, rc_enums.FACE_RIGHT, 2);
    // debug_lightmap(0, 1, rc_enums.FACE_FRONT, 3);
    // debug_lightmap(1, 2, rc_enums.FACE_BOTTOM, 1, true);

    var t1 = performance.now();
    var frame_ms = t1 - t0;
    var fps = 1000 / (frame_ms ? frame_ms : 0.001);
    var resolution = RayCaster.resolution.width + 'x' + RayCaster.resolution.height + ' (x' + RayCaster.resolution.scale +')';

    var console_html = '&raquo;&nbsp; '+ RayCaster.settings.name + ' / '+ 'resolution: ' + resolution +' / ms: ' + frame_ms.toFixed(2);
    console_html += ' / ' + 'fps: ' + fps.toFixed(2);
    screen_console.innerHTML = console_html;

    screen_ctx.putImageData(rc_buffers.screen, 0, 0);
    window.requestAnimationFrame(render);
}

// -----------------------------------------------------------
// -- UI events.
// -----------------------------------------------------------

$("#raycaster-panel").on("click", "#back-to-menu-button", function(e) {
    window.location.href = "../index.html";
});

window.requestAnimationFrame(render);
