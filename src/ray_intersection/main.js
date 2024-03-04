var console_box = document.getElementById('console');
var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');

var Voxel = {
    WIDTH: 0,
    HEIGHT: 0,

    camera: {
        location: [4, 3.5],
        target: [12.4, 10.4],
        voxel: [0, 0],
        offset: [0, 0]
    },

    ray: {
        vector: [1, 0],
        dx: 0,
        dy: 0,
        incr_x: 1,
        incr_y: 1,
        face_x: -1,
        face_y: -1,
        start_tx: 0,
        start_ty: 0
    },

    map_size: 16,
    map_shift: 4,
    voxel_size: 40,
    voxel_size_inv: 1,
    total_voxels: 0,
    screen_offset_x: 50,
    screen_offset_y: 50,

    random_voxels: 8 * 8,
    clip_count: 32,
    map: null,
    wrap: [false, false],
    all: true,

    point_radius: 12,
    radius_threshold: 8 * 8,

    point_fill_style: '#105BCD',
    point_stroke_style: '#105BCD',

    move_mode: false,

    over_location: false,
    over_target: false,

    down_location: false,
    down_target: false,

    navigate: null,
    prev_timestamp: 0,
    delta: 0,
    debug_ms: 0,
    debug_threshold_ms: 1000
};

Voxel.navigate = navigate_single;

if (Voxel.all)
    Voxel.navigate = navigate_all;

// struct format: [len, voxel_x, voxel_y, face, point_x, point_y, voxel_x, voxel_y, face, point_x, point_y, ...]
var node_struct_offset = 5;
var nodes = new Array(1 + Voxel.clip_count * node_struct_offset);

// init_camera();
init_map();

function voxel_index(x, y) {
    return (y << Voxel.map_shift) | x;
}

function valid_voxel(x, y) {
    return (x >= 0 && x < Voxel.map_size && y >= 0 && y < Voxel.map_size);
}

function wrap_coord_x(x)
{
    if (Voxel.wrap[0])
        x = x < 0 ? Voxel.map_size + x : x % Voxel.map_size;

    return x;
}

function wrap_coord_y(y)
{
    if (Voxel.wrap[1])
        y = y < 0 ? Voxel.map_size + y : y % Voxel.map_size;

    return y;
}

function init_map()
{
    Voxel.WIDTH = Voxel.map_size * Voxel.voxel_size + 2 * Voxel.screen_offset_x;
    Voxel.HEIGHT = Voxel.map_size * Voxel.voxel_size + 2 * Voxel.screen_offset_y;

    screen.width = Voxel.WIDTH;
    screen.height = Voxel.HEIGHT;

    Voxel.total_voxels = Voxel.map_size * Voxel.map_size;
    Voxel.voxel_size_inv = 1.0 / Voxel.voxel_size;
    Voxel.map = new Array(Voxel.total_voxels);

    var voxel_index = 0;

    for (var y = 0; y < Voxel.map_size; ++y)
    {
        for (var x = 0; x < Voxel.map_size; ++x)
        {
            Voxel.map[voxel_index] = -1;

            // if (y == 7)
            //     Voxel.map[voxel_index] = 1;

            voxel_index++;
        }
    }

    for (var i = 0; i < Voxel.random_voxels; ++i)
    {
        var x = (Math.random() * Voxel.map_size) | 0;
        var y = (Math.random() * Voxel.map_size) | 0;

        var voxel_index = (y << Voxel.map_shift) | x;
        Voxel.map[voxel_index] = 1;
    }
}

function init_camera()
{
    Voxel.camera.voxel[0] = Voxel.camera.location[0] | 0;
    Voxel.camera.voxel[1] = Voxel.camera.location[1] | 0;

    Voxel.camera.offset[0] = Voxel.camera.location[0] - Voxel.camera.voxel[0];
    Voxel.camera.offset[1] = Voxel.camera.location[1] - Voxel.camera.voxel[1];
}

function init_ray()
{
    Voxel.ray.vector[0] = Voxel.camera.target[0] - Voxel.camera.location[0];
    Voxel.ray.vector[1] = Voxel.camera.target[1] - Voxel.camera.location[1];
}

// Faces: west: 0, east: 1, north: 2, south: 3
function ray_setup()
{
    Voxel.ray.dx = 1.0 / Voxel.ray.vector[0];
    Voxel.ray.dy = 1.0 / Voxel.ray.vector[1];

    Voxel.ray.dx = Voxel.ray.dx < 0 ? -Voxel.ray.dx : Voxel.ray.dx;
    Voxel.ray.dy = Voxel.ray.dy < 0 ? -Voxel.ray.dy : Voxel.ray.dy;

    Voxel.ray.face_x = 0;
    Voxel.ray.face_y = 2;

    Voxel.ray.incr_x = 1;
    Voxel.ray.incr_y = 1;

    var offset_x = Voxel.camera.offset[0];
    var offset_y = Voxel.camera.offset[1];

    if (Voxel.ray.vector[0] < 0)
    {
        Voxel.ray.incr_x = -1;
        Voxel.ray.face_x = 1;

        if (offset_x == 0)
        {
            offset_x = 1;
            Voxel.camera.voxel[0]--;
        }
    }
    else
        offset_x = 1 - offset_x;

    if (Voxel.ray.vector[1] < 0)
    {
        Voxel.ray.incr_y = -1;
        Voxel.ray.face_y = 3;

        if (offset_y == 0)
        {
            offset_y = 1;
            Voxel.camera.voxel[1]--;
        }
    }
    else
        offset_y = 1 - offset_y;

    Voxel.ray.start_tx = Voxel.ray.dx * offset_x;
    Voxel.ray.start_ty = Voxel.ray.dy * offset_y;

    if (Voxel.ray.vector[0] == 0)
        Voxel.ray.start_tx = Infinity;

    if (Voxel.ray.vector[1] == 0)
        Voxel.ray.start_ty = Infinity;
}

function navigate_all()
{
    var x = Voxel.camera.voxel[0];
    var y = Voxel.camera.voxel[1];

    var tx = Voxel.ray.start_tx;
    var ty = Voxel.ray.start_ty;

    var face = tx < ty ? Voxel.ray.face_x : Voxel.ray.face_y;
    var node_offset = 1;
    var voxel_index = -1;
    var voxel_dist = 0;

    nodes[0] = 0;

    while (true)
    {
        voxel_dist++;

        if (voxel_dist >= Voxel.clip_count)
            return -1;

        var t = tx < ty ? tx : ty;

        if (tx < ty)
        {
            tx += Voxel.ray.dx;
            x += Voxel.ray.incr_x;
            face = Voxel.ray.face_x;
        }
        else
        {
            ty += Voxel.ray.dy;
            y += Voxel.ray.incr_y;
            face = Voxel.ray.face_y;
        }

        if (Voxel.wrap[0])
            x = wrap_coord_x(x);

        if (Voxel.wrap[1])
            y = wrap_coord_y(y);

        voxel_index = (y << Voxel.map_shift) | x;

        if (valid_voxel(x, y) && Voxel.map[voxel_index] > 0)
        {
            nodes[node_offset + 0] = x;
            nodes[node_offset + 1] = y;
            nodes[node_offset + 2] = face;
            nodes[node_offset + 3] = Voxel.camera.location[0] + t * Voxel.ray.vector[0];
            nodes[node_offset + 4] = Voxel.camera.location[1] + t * Voxel.ray.vector[1];

            node_offset += node_struct_offset;
            nodes[0]++;
        }
    }
}

function navigate_single()
{
    var x = Voxel.camera.voxel[0];
    var y = Voxel.camera.voxel[1];

    var tx = Voxel.ray.start_tx;
    var ty = Voxel.ray.start_ty;

    var face = tx < ty ? Voxel.ray.face_x : Voxel.ray.face_y;
    var count = 0;
    var voxel_index = -1;

    while (true)
    {
        count++;

        if (count >= Voxel.clip_count)
            return -1;

        var t = tx < ty ? tx : ty;

        if (tx < ty)
        {
            tx += Voxel.ray.dx;
            x += Voxel.ray.incr_x;
            face = Voxel.ray.face_x;
        }
        else
        {
            ty += Voxel.ray.dy;
            y += Voxel.ray.incr_y;
            face = Voxel.ray.face_y;
        }

        x = wrap_coord_x(x);
        y = wrap_coord_y(y);

        voxel_index = (y << Voxel.map_shift) | x;

        if (valid_voxel(x, y) && Voxel.map[voxel_index] > 0)
        {
            var ix = Voxel.camera.location[0] + t * Voxel.ray.vector[0];
            var iy = Voxel.camera.location[1] + t * Voxel.ray.vector[1];

            return [x, y, face, ix, iy];
        }
    }

    return false;
}

// ----------------------------------------------------------------------------------
// -- Drawing routines.
// ----------------------------------------------------------------------------------

function draw_point(ctx, x, y, outer_radius, inner_radius, stroke_style, fill_style)
{
    ctx.save();

    ctx.strokeStyle = stroke_style;
    ctx.lineWidth = 1;
    // ctx.setLineDash([3, 2]);

    ctx.beginPath();
    ctx.arc(x, y, outer_radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = fill_style;

    ctx.beginPath();
    ctx.arc(x, y, inner_radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
}

function draw_grid(ctx)
{
    var full_length = Voxel.map_size * Voxel.voxel_size;

    var sx = Voxel.screen_offset_x;
    var sy = Voxel.screen_offset_y;

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#999';
    ctx.lineJoin = 'miter';
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + full_length);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx + full_length, sy);
    ctx.lineTo(sx + full_length, sy + full_length);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + full_length, sy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx, sy + full_length);
    ctx.lineTo(sx + full_length, sy + full_length);
    ctx.stroke();

    ctx.font = "14px Tahoma";
    ctx.fillStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ccc';
    ctx.setLineDash([2]);
    sx = Voxel.screen_offset_x + Voxel.voxel_size;

    for (var x = 1; x < Voxel.map_size; ++x)
    {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + full_length);
        ctx.stroke();

        sx += Voxel.voxel_size;
    }

    sx = Voxel.screen_offset_x;
    sy = Voxel.screen_offset_y + Voxel.voxel_size;

    for (var y = 1; y < Voxel.map_size; ++y)
    {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + full_length, sy);
        ctx.stroke();

        sy += Voxel.voxel_size;
    }

    sx = Voxel.screen_offset_x;
    sy = Voxel.screen_offset_y;

    for (var x = 0; x <= Voxel.map_size; ++x)
    {
        ctx.fillText(x, sx - 4, sy - 14);
        sx += Voxel.voxel_size;
    }

    sx = Voxel.screen_offset_x;

    for (var y = 0; y <= Voxel.map_size; ++y)
    {
        ctx.fillText(y, sx - 24, sy + 5);
        sy += Voxel.voxel_size;
    }

    ctx.restore();
}

function draw_voxel(ctx, voxel)
{
    ctx.save();

    var voxel_index = (voxel[1] << Voxel.map_shift) | voxel[0];

    if (Voxel.map[voxel_index] > 0)
    {
        var vx = Voxel.screen_offset_x + voxel[0] * Voxel.voxel_size;
        var vy = Voxel.screen_offset_y + voxel[1] * Voxel.voxel_size;

        ctx.fillStyle = '#72BC70';
        ctx.strokeStyle = '#38674D';
        ctx.lineWidth = 2;

        ctx.fillRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);
        ctx.strokeRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);
    }

    ctx.restore();
}

function draw_voxels(ctx)
{
    ctx.save();

    var voxel_index = 0;

    for (var r = 0; r < Voxel.map_size; ++r)
    {
        for (var c = 0; c < Voxel.map_size; ++c)
        {
            if (Voxel.map[voxel_index] > 0)
            {
                var vx = Voxel.screen_offset_x + c * Voxel.voxel_size;
                var vy = Voxel.screen_offset_y + r * Voxel.voxel_size;

                ctx.fillStyle = '#72BC70';
                ctx.strokeStyle = '#38674D';
                ctx.lineWidth = 2;

                ctx.fillRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);
                ctx.strokeRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);
            }

            voxel_index++;
        }
    }

    ctx.restore();
}

function draw_intersections(ctx, voxel)
{
    ctx.save();

    var node_offset = 1;

    for (var i = 0; i < nodes[0]; ++i)
    {
        var vx = Voxel.screen_offset_x + nodes[node_offset + 0] * Voxel.voxel_size;
        var vy = Voxel.screen_offset_y + nodes[node_offset + 1] * Voxel.voxel_size;

        ctx.fillStyle = '#8A1815';
        ctx.strokeStyle = '#3C1515';
        ctx.lineWidth = 2;

        ctx.fillRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);
        ctx.strokeRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);

        node_offset += node_struct_offset;
    }

    ctx.restore();
}

function draw_intersection(ctx, voxel)
{
    ctx.save();

    var vx = Voxel.screen_offset_x + voxel[0] * Voxel.voxel_size;
    var vy = Voxel.screen_offset_y + voxel[1] * Voxel.voxel_size;

    ctx.fillStyle = '#8A1815';
    ctx.strokeStyle = '#3C1515';
    ctx.lineWidth = 2;

    ctx.fillRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);
    ctx.strokeRect(vx, vy, Voxel.voxel_size, Voxel.voxel_size);

    ctx.restore();
}

function draw_intersection_points(ctx, voxel)
{
    ctx.save();

    var node_offset = 1;

    for (var i = 0; i < nodes[0]; ++i)
    {
        var position = map_to_screen([nodes[node_offset + 0], nodes[node_offset + 1]]);
        var face = nodes[node_offset + 2];

        ctx.strokeStyle = '#348D36';
        ctx.lineWidth = 4;

        if (face == 0)
        {
            ctx.beginPath();
            ctx.moveTo(position[0], position[1]);
            ctx.lineTo(position[0], position[1] + Voxel.voxel_size);
            ctx.stroke();
        }
        else if (face == 1)
        {
            ctx.beginPath();
            ctx.moveTo(position[0] + Voxel.voxel_size, position[1]);
            ctx.lineTo(position[0] + Voxel.voxel_size, position[1] + Voxel.voxel_size);
            ctx.stroke();
        }
        else if (face == 2)
        {
            ctx.beginPath();
            ctx.moveTo(position[0], position[1]);
            ctx.lineTo(position[0] + Voxel.voxel_size, position[1]);
            ctx.stroke();
        }
        else if (face == 3)
        {
            ctx.beginPath();
            ctx.moveTo(position[0], position[1] + Voxel.voxel_size);
            ctx.lineTo(position[0] + Voxel.voxel_size, position[1] + Voxel.voxel_size);
            ctx.stroke();
        }

        var px = Voxel.screen_offset_x + nodes[node_offset + 3] * Voxel.voxel_size;
        var py = Voxel.screen_offset_y + nodes[node_offset + 4] * Voxel.voxel_size;

        draw_point(ctx, px, py, 6, 3, '#00000090', '#00000090');

        node_offset += node_struct_offset;
    }

    ctx.restore();
}

function draw_intersection_point(ctx, voxel)
{
    ctx.save();

    var px = Voxel.screen_offset_x + voxel[3] * Voxel.voxel_size;
    var py = Voxel.screen_offset_y + voxel[4] * Voxel.voxel_size;

    draw_point(ctx, px, py, 6, 3, '#00000090', '#00000090');

    ctx.restore();
}

function draw_ray(ctx)
{
    var screen_location = map_to_screen(Voxel.camera.location);

    var start_point = [
        screen_location[0] + -9999 * Voxel.ray.vector[0],
        screen_location[1] + -9999 * Voxel.ray.vector[1],
    ];

    var end_point = [
        screen_location[0] + 9999 * Voxel.ray.vector[0],
        screen_location[1] + 9999 * Voxel.ray.vector[1],
    ];

    ctx.save();

    ctx.strokeStyle = '#00000050';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);

    ctx.beginPath();
    ctx.moveTo(start_point[0], start_point[1]);
    ctx.lineTo(end_point[0], end_point[1]);
    ctx.stroke();

    ctx.restore();
}

// ----------------------------------------------------------------------------------

function map_to_screen(map_point)
{
    var screen_point = [
        (map_point[0] * Voxel.voxel_size) + Voxel.screen_offset_x,
        (map_point[1] * Voxel.voxel_size) + Voxel.screen_offset_y
    ];

    return screen_point;
}

function screen_to_map(screen_point)
{
    var map_point = [
        (screen_point[0] - Voxel.screen_offset_x) * Voxel.voxel_size_inv,
        (screen_point[1] - Voxel.screen_offset_y) * Voxel.voxel_size_inv
    ];

    return map_point;
}

function get_screen_point(screen, event)
{
    var rect = screen.getBoundingClientRect();
    var point = [0, 0];

    point[0] = Math.floor(event.clientX - rect.left);
    point[1] = Math.floor(event.clientY - rect.top);

    return point;
};

function check_mouse_over_point(screen_point)
{
    var screen_location = map_to_screen(Voxel.camera.location);
    var screen_target = map_to_screen(Voxel.camera.target);

    var lcx = screen_point[0] - screen_location[0];
    var lcy = screen_point[1] - screen_location[1];

    var tcx = screen_point[0] - screen_target[0];
    var tcy = screen_point[1] - screen_target[1];

    var check_location = (lcx * lcx + lcy * lcy) <= Voxel.radius_threshold;
    var check_target = (tcx * tcx + tcy * tcy) <= Voxel.radius_threshold;

    Voxel.over_location = false;
    Voxel.over_target = false;

    if (check_location)
        Voxel.over_location = true;
    else if (check_target)
        Voxel.over_target = true;
}

function check_mouse_down_point(screen_point)
{
    var screen_location = map_to_screen(Voxel.camera.location);
    var screen_target = map_to_screen(Voxel.camera.target);

    var lcx = screen_point[0] - screen_location[0];
    var lcy = screen_point[1] - screen_location[1];

    var tcx = screen_point[0] - screen_target[0];
    var tcy = screen_point[1] - screen_target[1];

    var check_location = (lcx * lcx + lcy * lcy) <= Voxel.radius_threshold;
    var check_target = (tcx * tcx + tcy * tcy) <= Voxel.radius_threshold;

    Voxel.down_location = false;
    Voxel.down_target = false;

    if (check_location)
        Voxel.down_location = true;
    else if (check_target)
        Voxel.down_target = true;
}

// ----------------------------------------------------------------------------------
// -- Event listeners.
// ----------------------------------------------------------------------------------

screen.addEventListener('mousedown', function(event)
{
    Voxel.move_mode = true;
    var screen_point = get_screen_point(screen, event);

    check_mouse_down_point(screen_point);
});

screen.addEventListener('mouseup', function(event)
{
    Voxel.move_mode = false;

    Voxel.down_location = false;
    Voxel.down_target = false;
});

screen.addEventListener('mousemove', function(event)
{
    var screen_point = get_screen_point(screen, event);
    var map_point = screen_to_map(screen_point);

    check_mouse_over_point(screen_point);

    var html = 'screen: ['+ screen_point[0] +', '+ screen_point[1] +']';
    html += ' / map: ['+ map_point[0].toFixed(3) +', '+ map_point[1].toFixed(3) +']';

    console_box.innerHTML = html;

    if (Voxel.move_mode)
    {
        if (Voxel.down_location)
        {
            Voxel.camera.location[0] = map_point[0];
            Voxel.camera.location[1] = map_point[1];
        }
        else if (Voxel.down_target)
        {
            Voxel.camera.target[0] = map_point[0];
            Voxel.camera.target[1] = map_point[1];
        }
    }
});

// ----------------------------------------------------------------------------------

if (false)
{
    var t0 = performance.now();

    init_camera();
    init_ray();

    for (var k = 0; k < 800 * 400; ++k) {
        var ray = ray_setup();
        Voxel.navigate();
    }

    var t1 = performance.now();
    console.log('ms:', t1 - t0);
    console.log(nodes);
}

function render(timestamp)
{
    Voxel.delta = timestamp - Voxel.prev_timestamp;
    Voxel.prev_timestamp = timestamp;
    Voxel.debug_ms += Voxel.delta;

    var t_start = performance.now();

    screen_ctx.fillStyle = '#fff';
    screen_ctx.fillRect(0, 0, Voxel.WIDTH, Voxel.HEIGHT);

    init_camera();
    init_ray();
    ray_setup();

    // if (Voxel.debug_ms > Voxel.debug_threshold_ms)
    // {
    //     Voxel.debug_ms = 0;
    //     console.log(Voxel.ray.vector);
    // }

    var voxel = Voxel.navigate();

    draw_grid(screen_ctx);
    draw_voxels(screen_ctx);

    if (Voxel.all)
        draw_intersections(screen_ctx);
    else
        draw_intersection(screen_ctx, voxel);

    draw_ray(screen_ctx, ray);

    if (Voxel.all)
        draw_intersection_points(screen_ctx);
    else
        draw_intersection_point(screen_ctx, voxel);

    var screen_location = map_to_screen(Voxel.camera.location);
    var target_location = map_to_screen(Voxel.camera.target);

    var location_radius = Voxel.point_radius;
    var target_radius = Voxel.point_radius;

    if (Voxel.over_location)
        location_radius += 4;

    if (Voxel.over_target)
        target_radius += 4;

    draw_point(screen_ctx, screen_location[0], screen_location[1], location_radius, location_radius - 6, Voxel.point_stroke_style, Voxel.point_fill_style);
    draw_point(screen_ctx, target_location[0], target_location[1], target_radius, target_radius - 6, Voxel.point_stroke_style, Voxel.point_fill_style);

    var t_end = performance.now();

    window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);