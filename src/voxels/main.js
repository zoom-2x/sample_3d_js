import Common from 'common';
import TextureAtlas from 'assets/textures/voxel.json';

import TestRoom from './scenes/test_room';
import Matrix from './scenes/matrix';
import Hallway from './scenes/hallway';
import VoxelLandscape from './scenes/landscape';
import SpaceStation from './scenes/space_station';

var scenes = [
    TestRoom,
    Matrix,
    Hallway,
    VoxelLandscape,
    SpaceStation
];

var Voxels =
{
    c$: {},

    width: 800,
    height: 400,
    scale: 1,

    inv_width: 0,
    inv_height: 0,
    prev_timestamp: 0,

    scene: null,
    free_mode: false,

    input: {
        keys: {
            left: false,
            right: false,
            forward: false,
            backward: false,
            up: false,
            down: false,
            turn_left: false,
            turn_right: false
        }
    },

    // Camera initial orientation: x right, y forward, z up
    camera: {
        fov: 50,
        aspect: 1,
        fova: 1,

        key_speed: 1,
        mouse_speed: 1,
        rotation_speed: 10,

        start_position: [0.0, 0.0, 0.0],
        start_rotation: [0, 0, 0],

        position: [0, 0, 0],
        rotation: [0, 0, 0],

        // Screen plane offset from the camera position (y axis)
        // used to generate the world space ray vector.
        f_near: 0,
        sdx: 0,
        sdy: 0,

        voxel: [0, 0, 0],
        offset: [0, 0, 0]
    },

    ray: {
        vector: [1, 0, 0],
        dx: 0,
        dy: 0,
        dz: 0,
        incr_x: 1,
        incr_y: 1,
        incr_z: 1,
        face_x: -1,
        face_y: -1,
        face_z: -1,
        start_tx: 0,
        start_ty: 0,
        start_tz: 0,

        start_voxel: [0, 0, 0]
    },

    base_color: [0, 0, 0],
    clip_count: 32,
    clip_dist: 32,
    one_over_clip_dist: 1,
    buffer: null,

    map: {
        // power of 2 required
        dims: [32, 32, 32],

        shift_z: 10,
        shift_y: 5,

        data: null,
        wrap: [false, false, false],
    },

    intersection: {
        value: -1,
        face: 0,
        t: 0,
        ip: [0, 0, 0]
    },

    // +x, -x, +y, -y, +z, -z
    // Order: left (0), right (1), front (2), back (3), bottom (4), top (5)
    light: [.5, .6, .85, .4, .2, .95],
    light_mult: 1,

    // x (left, right) -> u = y, v = z
    // y (front, back) -> u = x, v = z
    // z (top, bottom) -> u = x, v = y

    texture_sampler: {
        use_blank_color: true,
        background_color: [0, 0, 0],
        default_color: [0, 0, 0],
        packed_color: 0,
        width: 16,
        height: 16,
        stride: 16,
        uv: [
            [1, 2], [1, 2], // left-right
            [0, 2], [0, 2], // front-back
            [0, 1], [0, 1]  // bottom-top
        ]
    },

    voxel_textures: [
        null,
        [0, 0, 0, 0, 0, 0],
    ],

    voxel_objects: [],

    debug: {
        enable: false,
        x: 343,
        y: 335
    }
};

var screen_console = document.getElementById('console');
var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');

// ----------------------------------------------------------------------------------
// -- Event listeners.
// ----------------------------------------------------------------------------------

function get_screen_point(event)
{
    var rect = screen.getBoundingClientRect();
    var point = [0, 0];

    point[0] = Math.floor(event.clientX - rect.left);
    point[1] = Math.floor(event.clientY - rect.top);

    return point;
};

var root = document.getElementById('root');

root.addEventListener('keydown', function(event)
{
    if (event.code == 'KeyA')
        Voxels.input.keys.left = true;
    else if (event.code == 'KeyD')
        Voxels.input.keys.right = true;
    else if (event.code == 'KeyW')
        Voxels.input.keys.forward = true;
    else if (event.code == 'KeyS')
        Voxels.input.keys.backward = true;
    else if (event.code == 'Space')
        Voxels.input.keys.up = true;
    else if (event.code == 'ShiftLeft')
        Voxels.input.keys.down = true;
    else if (event.code == 'KeyQ')
        Voxels.input.keys.turn_left = true;
    else if (event.code == 'KeyE')
        Voxels.input.keys.turn_right = true;
});

root.addEventListener('keyup', function(event)
{
    if (event.code == 'KeyA')
        Voxels.input.keys.left = false;
    else if (event.code == 'KeyD')
        Voxels.input.keys.right = false;
    else if (event.code == 'KeyW')
        Voxels.input.keys.forward = false;
    else if (event.code == 'KeyS')
        Voxels.input.keys.backward = false;
    else if (event.code == 'Space')
        Voxels.input.keys.up = false;
    else if (event.code == 'ShiftLeft')
        Voxels.input.keys.down = false;
    else if (event.code == 'KeyQ')
        Voxels.input.keys.turn_left = false;
    else if (event.code == 'KeyE')
        Voxels.input.keys.turn_right = false;
});

screen.addEventListener('mousemove', function(event)
{
    var point = get_screen_point(event);
});

function process_input()
{
    if (!Voxels.free_mode)
        return;

    var forward = [0, 1, 0];
    var up = [0, 0, 1];

    Common.rotate_x(forward, Common.deg2rad(Voxels.camera.rotation[0]));
    Common.rotate_z(forward, Common.deg2rad(Voxels.camera.rotation[2]));

    var side = Common.vec3_cross(forward, up);

    // Common.vec3_normalize(forward);
    // Common.vec3_normalize(side);

    if (Voxels.input.keys.forward)
    {
        Voxels.camera.position[0] += Voxels.camera.key_speed * forward[0];
        Voxels.camera.position[1] += Voxels.camera.key_speed * forward[1];
        Voxels.camera.position[2] += Voxels.camera.key_speed * forward[2];
    }

    if (Voxels.input.keys.backward)
    {
        Voxels.camera.position[0] -= Voxels.camera.key_speed * forward[0];
        Voxels.camera.position[1] -= Voxels.camera.key_speed * forward[1];
        Voxels.camera.position[2] -= Voxels.camera.key_speed * forward[2];
    }

    if (Voxels.input.keys.left)
    {
        Voxels.camera.position[0] -= Voxels.camera.key_speed * side[0];
        Voxels.camera.position[1] -= Voxels.camera.key_speed * side[1];
        Voxels.camera.position[2] -= Voxels.camera.key_speed * side[2];
    }

    if (Voxels.input.keys.right)
    {
        Voxels.camera.position[0] += Voxels.camera.key_speed * side[0];
        Voxels.camera.position[1] += Voxels.camera.key_speed * side[1];
        Voxels.camera.position[2] += Voxels.camera.key_speed * side[2];
    }

    if (Voxels.input.keys.up) {
        Voxels.camera.position[2] += Voxels.camera.key_speed;
    }

    if (Voxels.input.keys.down) {
        Voxels.camera.position[2] -= Voxels.camera.key_speed;
    }

    if (Voxels.input.keys.turn_left) {
        Voxels.camera.rotation[2] += Voxels.camera.rotation_speed;
    }

    if (Voxels.input.keys.turn_right) {
        Voxels.camera.rotation[2] -= Voxels.camera.rotation_speed;
    }
}

// ----------------------------------------------------------------------------------
// -- Setup routines.
// ----------------------------------------------------------------------------------

function set_scene(scene)
{
    Voxels.scene = scene;
    scene.setup(Voxels);

    if (Voxels.scale > 1)
    {
        Voxels.width = (Voxels.width / Voxels.scale) | 0;
        Voxels.height = (Voxels.height / Voxels.scale) | 0;

        screen.style.transformOrigin = "0 0";
        screen.style.transform = `scale(${Voxels.scale})`;
    }

    console.log(Voxels.width, Voxels.height);

    screen.width = Voxels.width;
    screen.height = Voxels.height;

    // ----------------------------------------------------------------------------------
    // -- Camera setup.
    // ----------------------------------------------------------------------------------

    Voxels.inv_width = 1.0 / Voxels.width;
    Voxels.inv_height = 1.0 / Voxels.height;
    Voxels.one_over_clip_dist = 1.0 / Voxels.clip_dist;

    Voxels.camera.position[0] = Voxels.camera.start_position[0];
    Voxels.camera.position[1] = Voxels.camera.start_position[1];
    Voxels.camera.position[2] = Voxels.camera.start_position[2];

    Voxels.camera.aspect = Voxels.width / Voxels.height;
    Voxels.camera.one_over_aspect = 1.0 / Voxels.camera.aspect;
    Voxels.camera.sdx = 2.0 / Voxels.width;
    Voxels.camera.sdy = 2.0 / Voxels.height;
    // Voxels.camera.f_near = 1.0 / Math.tan(Common.deg2rad(Voxels.camera.fov * 0.5));
    Voxels.camera.f_near = 1.0;
    Voxels.camera.fova = Math.tan(Common.deg2rad(Voxels.camera.fov * 0.5));

    // ----------------------------------------------------------------------------------
    // -- Screen buffer setup.
    // ----------------------------------------------------------------------------------

    Voxels.buffer = screen_ctx.createImageData(Voxels.width, Voxels.height);

    for (var i = 0; i < Voxels.width * Voxels.height; ++i)
    {
        Voxels.buffer.data[i * 4 + 0] = 0;
        Voxels.buffer.data[i * 4 + 1] = 0;
        Voxels.buffer.data[i * 4 + 2] = 0;
        Voxels.buffer.data[i * 4 + 3] = 255;
    }

    // ----------------------------------------------------------------------------------
    // -- Map generation.
    // ----------------------------------------------------------------------------------

    generate_objects(Voxels);

    Voxels.map.data = new Array(Voxels.map.dims[0] * Voxels.map.dims[1] * Voxels.map.dims[2]);

    scene.generate(Voxels);
}

// TODO(gabic): Sa scot chestiile astea.
function generate_objects(Voxels)
{
    Voxels.c$.OBJ_CUBE = 0;
    Voxels.c$.OBJ_HALL_DECO_0 = 1;
    Voxels.c$.OBJ_HALL_DECO_1 = 2;
    Voxels.c$.OBJ_HALL_DECO_2 = 3;
    Voxels.c$.OBJ_HALL_DECO_3 = 4;
    Voxels.c$.OBJ_HALL_DECO_4 = 5;
    Voxels.c$.OBJ_HALL_DECO_5 = 6;
    Voxels.c$.OBJ_HALL_WINDOW_0 = 7;
    Voxels.c$.OBJ_HALL_WINDOW_1 = 8;
    Voxels.c$.OBJ_HALL_WINDOW_2 = 9;
    Voxels.c$.OBJ_HALL_COLUMN_0 = 10;
    Voxels.c$.OBJ_HALL_COLUMN_1 = 11;

    // ----------------------------------------------------------------------------------

    var obj = {
        name: 'Matrix cube',
        dims: [3, 3, 3],
        center: [1, 1, 1],
        data: []
    };

    var voxel_texture_index = Voxels.voxel_textures.length;

    // Textures.
    // matrix cube base
    var id0 = Common.add_voxel_texture(Voxels, [7, 7, 7, 7, 0, 7]);
    // matrix cube top
    var id1 = Common.add_voxel_texture(Voxels, [8, 8, 8, 8, 7, 7]);
    // matrix cube bottom
    var id2 = Common.add_voxel_texture(Voxels, [9, 9, 9, 9, 7, 7]);

    // Voxels.
    Common.obj_push_data(obj, 0, 0, [id2, id2, id2]);
    Common.obj_push_data(obj, 0, 1, [id0, -1, id0]);
    Common.obj_push_data(obj, 0, 2, [id1, id1, id1]);
    Common.obj_push_data(obj, 1, 0, [id2, -1, id2]);
    Common.obj_push_data(obj, 1, 1, [-1, -1, -1]);
    Common.obj_push_data(obj, 1, 2, [id1, -1, id1]);
    Common.obj_push_data(obj, 2, 0, [id2, id2, id2]);
    Common.obj_push_data(obj, 2, 1, [id0, -1, id0]);
    Common.obj_push_data(obj, 2, 2, [id1, id1, id1]);

    Voxels.voxel_objects.push(obj);

    // ----------------------------------------------------------------------------------

    obj = {
        name: 'Hall decoration 0',
        dims: [6, 1, 15],
        center: [0, 0, 0],
        data: []
    };

    // Textures.
    // Voxels.
    Common.obj_push_data(obj, 0, 0, [0, -1, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 1, [0, -1, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 2, [0, -1, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 3, [0, 0, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 4, [0, 0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 5, [0, -1, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 6, [0, -1, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 7, [0, -1, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 8, [0, -1, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 9, [0, -1, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 10, [0, 0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 11, [-1, 0, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 12, [-1, -1, 0, 0, -1, -1]);
    Common.obj_push_data(obj, 0, 13, [-1, 0, -1, 0, 0, -1]);
    Common.obj_push_data(obj, 0, 14, [0, -1, -1, -1, 0, 0]);

    Voxels.voxel_objects.push(obj);

    // ----------------------------------------------------------------------------------

    obj = {
        name: 'Hall decoration 1',
        dims: [5, 1, 15],
        center: [0, 0, 0],
        data: []
    };

    // Textures.
    // Voxels.
    Common.obj_push_data(obj, 0, 0, [0, 0, 0, -1, -1]);
    Common.obj_push_data(obj, 0, 1, [0, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 2, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 3, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 4, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 5, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 6, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 7, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 8, [0, -1, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 9, [0, 0, -1, -1, -1]);
    Common.obj_push_data(obj, 0, 10, [0, 0, 0, -1, -1]);
    Common.obj_push_data(obj, 0, 11, [0, -1, 0, 0, -1]);
    Common.obj_push_data(obj, 0, 12, [0, -1, -1, 0, 0]);
    Common.obj_push_data(obj, 0, 13, [0, 0, -1, -1, 0]);
    Common.obj_push_data(obj, 0, 14, [0, 0, 0, 0, 0]);

    Voxels.voxel_objects.push(obj);
}

function valid_voxel(x, y, z) {
    return (x >= 0 && x < Voxels.map.dims[0] && y >= 0 && y < Voxels.map.dims[1] && z >= 0 && z < Voxels.map.dims[2]);
}

function wrap_coord_v3(v)
{
    if (Voxels.map.wrap[0])
        v[0] = v[0] < 0 ? Voxels.map.dims[0] + v[0] : v[0] % Voxels.map.dims[0];

    if (Voxels.map.wrap[1])
        v[1] = v[1] < 0 ? Voxels.map.dims[1] + v[1] : v[1] % Voxels.map.dims[1];

    if (Voxels.map.wrap[2])
        v[2] = v[2] < 0 ? Voxels.map.dims[2] + v[2] : v[2] % Voxels.map.dims[2];
}

function wrap_coord_x(x)
{
    if (Voxels.map.wrap[0])
        x = x < 0 ? Voxels.map.dims[0] + x : x % Voxels.map.dims[0];

    return x;
}

function wrap_coord_y(y)
{
    if (Voxels.map.wrap[1])
        y = y < 0 ? Voxels.map.dims[1] + y : y % Voxels.map.dims[1];

    return y;
}

function wrap_coord_z(z)
{
    if (Voxels.map.wrap[2])
        z = z < 0 ? Voxels.map.dims[2] + z : z % Voxels.map.dims[2];

    return z;
}

function init_camera()
{
    wrap_coord_v3(Voxels.camera.position);

    Voxels.camera.voxel[0] = Voxels.camera.position[0] | 0;
    Voxels.camera.voxel[1] = Voxels.camera.position[1] | 0;
    Voxels.camera.voxel[2] = Voxels.camera.position[2] | 0;

    if (Voxels.camera.voxel[0] < 0)
        Voxels.camera.voxel[0]--;

    if (Voxels.camera.voxel[1] < 0)
        Voxels.camera.voxel[1]--;

    if (Voxels.camera.voxel[2] < 0)
        Voxels.camera.voxel[2]--;

    Voxels.camera.offset[0] = Voxels.camera.position[0] - Voxels.camera.voxel[0];
    Voxels.camera.offset[1] = Voxels.camera.position[1] - Voxels.camera.voxel[1];
    Voxels.camera.offset[2] = Voxels.camera.position[2] - Voxels.camera.voxel[2];
}

function ray_setup()
{
    Voxels.ray.start_voxel[0] = Voxels.camera.voxel[0];
    Voxels.ray.start_voxel[1] = Voxels.camera.voxel[1];
    Voxels.ray.start_voxel[2] = Voxels.camera.voxel[2];

    Voxels.ray.dx = 1.0 / Voxels.ray.vector[0];
    Voxels.ray.dy = 1.0 / Voxels.ray.vector[1];
    Voxels.ray.dz = 1.0 / Voxels.ray.vector[2];

    Voxels.ray.dx = Voxels.ray.dx < 0 ? -Voxels.ray.dx : Voxels.ray.dx;
    Voxels.ray.dy = Voxels.ray.dy < 0 ? -Voxels.ray.dy : Voxels.ray.dy;
    Voxels.ray.dz = Voxels.ray.dz < 0 ? -Voxels.ray.dz : Voxels.ray.dz;

    Voxels.ray.face_x = 0;
    Voxels.ray.face_y = 2;
    Voxels.ray.face_z = 4;

    Voxels.ray.incr_x = 1;
    Voxels.ray.incr_y = 1;
    Voxels.ray.incr_z = 1;

    var offset_x = Voxels.camera.offset[0];
    var offset_y = Voxels.camera.offset[1];
    var offset_z = Voxels.camera.offset[2];

    if (Voxels.ray.vector[0] < 0)
    {
        Voxels.ray.incr_x = -1;
        Voxels.ray.face_x = 1;

        if (offset_x == 0)
        {
            offset_x = 1;
            Voxels.ray.start_voxel[0]--;
        }
    }
    else
        offset_x = 1 - offset_x;

    if (Voxels.ray.vector[1] < 0)
    {
        Voxels.ray.incr_y = -1;
        Voxels.ray.face_y = 3;

        if (offset_y == 0)
        {
            offset_y = 1;
            Voxels.ray.start_voxel[1]--;
        }
    }
    else
        offset_y = 1 - offset_y;

    if (Voxels.ray.vector[2] < 0)
    {
        Voxels.ray.incr_z = -1;
        Voxels.ray.face_z = 5;

        if (offset_z == 0)
        {
            offset_z = 1;
            Voxels.ray.start_voxel[2]--;
        }
    }
    else
        offset_z = 1 - offset_z;

    Voxels.ray.start_tx = Voxels.ray.dx * offset_x;
    Voxels.ray.start_ty = Voxels.ray.dy * offset_y;
    Voxels.ray.start_tz = Voxels.ray.dz * offset_z;

    if (Voxels.ray.vector[0] == 0)
        Voxels.ray.start_tx = Infinity;

    if (Voxels.ray.vector[1] == 0)
        Voxels.ray.start_ty = Infinity;

    if (Voxels.ray.vector[2] == 0)
        Voxels.ray.start_tz = Infinity;
}

function render(timestamp)
{
    var delta = timestamp - Voxels.prev_timestamp;
    Voxels.prev_timestamp = timestamp;

    var t0 = performance.now();

    if (Voxels.scene)
    {
        var world_point = [0, 0, 0];
        var pixel_index = 0;
        var dy = 0;

        Voxels.scene.update(Voxels, timestamp, delta);

        process_input();
        init_camera();

        // ----------------------------------------------------------------------------------
        // -- Rasterization
        // ----------------------------------------------------------------------------------
        // Cast a ray through every pixel on the screen.
        // ----------------------------------------------------------------------------------

        for (var y = 0; y < Voxels.height; ++y)
        {
            var dx = 0;

            for (var x = 0; x < Voxels.width; ++x)
            {
                Voxels.buffer.data[pixel_index + 0] = Voxels.texture_sampler.background_color[0];
                Voxels.buffer.data[pixel_index + 1] = Voxels.texture_sampler.background_color[1];
                Voxels.buffer.data[pixel_index + 2] = Voxels.texture_sampler.background_color[2];

                Voxels.ray.vector[0] = Voxels.camera.fova * Voxels.camera.aspect * (dx - 1);
                Voxels.ray.vector[1] = Voxels.camera.f_near;
                Voxels.ray.vector[2] = (1 - dy) * Voxels.camera.fova;

                Common.rotate_x(Voxels.ray.vector, Common.deg2rad(Voxels.camera.rotation[0]));
                Common.rotate_z(Voxels.ray.vector, Common.deg2rad(Voxels.camera.rotation[2]));

                ray_setup();

                // ----------------------------------------------------------------------------------
                // -- Ray traversal.
                // ----------------------------------------------------------------------------------

                var vx = Voxels.ray.start_voxel[0];
                var vy = Voxels.ray.start_voxel[1];
                var vz = Voxels.ray.start_voxel[2];

                var tx = Voxels.ray.start_tx;
                var ty = Voxels.ray.start_ty;
                var tz = Voxels.ray.start_tz;

                var face = tx < ty ? Voxels.ray.face_x : Voxels.ray.face_y;
                var count = 0;
                var t = 0;
                var voxel_index = -1;

                Voxels.intersection.value = -1;

                while (true)
                {
                    count++;

                    if (count >= Voxels.clip_count)
                        break;

                    if (tx < ty)
                    {
                        if (tx < tz)
                        {
                            t = tx;
                            tx += Voxels.ray.dx;
                            vx += Voxels.ray.incr_x;
                            face = Voxels.ray.face_x;
                        }
                        else
                        {
                            t = tz;
                            tz += Voxels.ray.dz;
                            vz += Voxels.ray.incr_z;
                            face = Voxels.ray.face_z;
                        }
                    }
                    else
                    {
                        if (ty < tz)
                        {
                            t = ty;
                            ty += Voxels.ray.dy;
                            vy += Voxels.ray.incr_y;
                            face = Voxels.ray.face_y;
                        }
                        else
                        {
                            t = tz;
                            tz += Voxels.ray.dz;
                            vz += Voxels.ray.incr_z;
                            face = Voxels.ray.face_z;
                        }
                    }

                    if (t >= Voxels.clip_dist)
                        break;

                    vx = wrap_coord_x(vx);
                    vy = wrap_coord_y(vy);
                    vz = wrap_coord_z(vz);

                    voxel_index = (vz << Voxels.map.shift_z) | (vy << Voxels.map.shift_y) | vx;

                    if (valid_voxel(vx, vy, vz) && Voxels.map.data[voxel_index] > 0)
                    {
                        Voxels.intersection.value = Voxels.map.data[voxel_index];
                        Voxels.intersection.face = face;
                        Voxels.intersection.t = t;

                        Voxels.intersection.ip[0] = Voxels.camera.position[0] + Voxels.intersection.t * Voxels.ray.vector[0];
                        Voxels.intersection.ip[1] = Voxels.camera.position[1] + Voxels.intersection.t * Voxels.ray.vector[1];
                        Voxels.intersection.ip[2] = Voxels.camera.position[2] + Voxels.intersection.t * Voxels.ray.vector[2];

                        break;
                    }
                }

                // ----------------------------------------------------------------------------------
                // -- Pixel color determination.
                // ----------------------------------------------------------------------------------

                if (Voxels.intersection.value > 0)
                {
                    var out_r = Voxels.texture_sampler.default_color[0];
                    var out_g = Voxels.texture_sampler.default_color[1];
                    var out_b = Voxels.texture_sampler.default_color[2];
                    var out_a = 255;

                    // Texture sampling.
                    if (!Voxels.texture_sampler.use_blank_color)
                    {
                        // Custom color.
                        if (Voxels.intersection.value & 0xff000000)
                        {
                            out_r = (Voxels.intersection.value & 0x00ff0000) >> 16;
                            out_g = (Voxels.intersection.value & 0x0000ff00) >> 8;
                            out_b = Voxels.intersection.value & 0x000000ff;
                        }
                        // Texture.
                        else
                        {
                            var sampler = Voxels.texture_sampler.uv[Voxels.intersection.face];

                            var u = Voxels.intersection.ip[sampler[0]] - (Voxels.intersection.ip[sampler[0]] | 0);
                            var v = Voxels.intersection.ip[sampler[1]] - (Voxels.intersection.ip[sampler[1]] | 0);

                            u = u < 0 ? 1 + u : u;
                            v = v < 0 ? -v : 1 - v;

                            u = u == 1 ? 0.999999 : u;
                            v = v == 1 ? 0.999999 : v;

                            var tex_x = (u * Voxels.texture_sampler.width) | 0;
                            var tex_y = (v * Voxels.texture_sampler.height) | 0;
                            // var tex_index = (tex_y * Voxels.texture_sampler.stride + tex_x) << 2;
                            var tex_index = ((tex_y << 4) | tex_x) << 2;

                            var offset = Voxels.voxel_textures[Voxels.intersection.value][Voxels.intersection.face];
                            var face_pointer = TextureAtlas.offset[offset] + tex_index;

                            out_r = TextureAtlas.data[face_pointer + 0];
                            out_g = TextureAtlas.data[face_pointer + 1];
                            out_b = TextureAtlas.data[face_pointer + 2];
                            out_a = TextureAtlas.data[face_pointer + 3];
                        }
                    }

                    if (out_a == 255)
                    {
                        // TODO(gabic): Cazul pentru textura de debug.
                        var t = 1 - Voxels.intersection.t * Voxels.one_over_clip_dist;
                        t *= Voxels.light[Voxels.intersection.face] * Voxels.light_mult;

                        Voxels.buffer.data[pixel_index + 0] = (out_r * t) | 0;
                        Voxels.buffer.data[pixel_index + 1] = (out_g * t) | 0;
                        Voxels.buffer.data[pixel_index + 2] = (out_b * t) | 0;
                    }
                }

                dx += Voxels.camera.sdx;
                pixel_index += 4;
            }

            dy += Voxels.camera.sdy;
        }
    }

    var t1 = performance.now();
    var frame_ms = t1 - t0;
    var fps = 1000 / frame_ms;
    var name = Voxels.scene ? Voxels.scene.name : 'Unknown';
    var resolution = Voxels.width + 'x' + Voxels.height + ' (x' + Voxels.scale +')';

    var console_html = '&raquo;&nbsp; '+ name + ' / '+ 'resolution: ' + resolution +' / ms: ' + frame_ms.toFixed(2);
    console_html += ' / ' + 'fps: ' + fps.toFixed(2);
    screen_console.innerHTML = console_html;

    if (Voxels.buffer)
        screen_ctx.putImageData(Voxels.buffer, 0, 0);

    window.requestAnimationFrame(render);
}

// -----------------------------------------------------------
// -- UI events.
// -----------------------------------------------------------

$("#voxels-panel").on("click", "#back-to-menu-button", function(e) {
    window.location.href = "../index.html";
});

$("#voxels-panel").on("change", "#scene-select", function(e)
{
    var $target = $(e.target);
    var scene_index = parseInt($target.val());

    if (scene_index < 0 || scene_index >= scenes.length)
        scene_index = 0;

    set_scene(scenes[scene_index]);
});

window.requestAnimationFrame(render);
