import Common from 'common';
import TextureAtlas from 'textures';

import VoxelRoom from './scenes/room';
import VoxelLandscape from './scenes/landscape';

// ----------------------------------------------------------------------------------

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

    // Camera initial orientation: x right, y forward, z up
    camera: {
        fov: 50,
        aspect: 1,
        fova: 1,

        start_position: [0.0, 0.0, 0.0],
        start_rotation: [0, 0, 0],

        position: [0, 0, 0],
        rotation: [0, 0, 0],

        // Screen plane offset from the camera position (y axis)
        // used to generate the world space ray vector.
        f_near: 0,
        sdx: 0,
        sdy: 0
    },

    base_color: [0, 0, 0],
    clip_dist: 32,
    one_over_clip_dist: 1,
    buffer: null,

    map: {
        // power of 2 required
        dims: [32, 32, 32],

        shift_0: 10,
        shift_1: 5,

        zpitch: 0,
        data: null,
        wrap: [false, false, false],
    },

    // +x, -x, +y, -y, +z, -z
    // Order: left, right, front, back, bottom, top
    light: [.5, .6, .85, .4, .2, .95],
    light_mult: 1,

    // For each voxel plane we define the axis used as u, v.
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
        uv: [[1, 2], [0, 2], [0, 1]]
    },

    voxel_textures: [
        [0, 0, 0, 0, 0, 0],
    ],

    voxel_objects: [],

    debug: {
        enable: false,
        x: 343,
        y: 335
    }
};

var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');

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

    // Format ABGR
    for (var i = 0; i < Voxels.width * Voxels.height; ++i)
    {
        Voxels.buffer.data[i * 4 + 1] = 0;
        Voxels.buffer.data[i * 4 + 2] = 0;
        Voxels.buffer.data[i * 4 + 3] = 0xff;
    }

    // ----------------------------------------------------------------------------------
    // -- Map generation.
    // ----------------------------------------------------------------------------------

    generate_objects(Voxels);

    Voxels.map.data = new Array(Voxels.map.dims[0] * Voxels.map.dims[1] * Voxels.map.dims[2]);
    Voxels.map.zpitch = Voxels.map.dims[0] * Voxels.map.dims[1];

    scene.generate(Voxels);
}

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

function render(timestamp)
{
    var delta = timestamp - Voxels.prev_timestamp;
    Voxels.prev_timestamp = timestamp;

    console.log(delta);

    if (Voxels.scene)
    {
        var world_point = [0, 0, 0];
        var pixel_index = 0;
        var dy = 0;

        Voxels.scene.update(Voxels, timestamp, delta);

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

                var base_ray = [
                    Voxels.camera.fova * Voxels.camera.aspect * (dx - 1),
                    Voxels.camera.f_near,
                    (1 - dy) * Voxels.camera.fova
                ];

                base_ray = Common.rotate_around_x(base_ray, Common.deg2rad(Voxels.camera.rotation[0]));
                base_ray = Common.rotate_around_z(base_ray, Common.deg2rad(Voxels.camera.rotation[2]));

                navigate();

                var intersection = {
                    r: Voxels.texture_sampler.default_color[0],
                    g: Voxels.texture_sampler.default_color[1],
                    b: Voxels.texture_sampler.default_color[2],
                    a: 255,

                    // found: false,
                    index: pixel_index,
                    depth: 0,
                    light_dir: -1,
                    is_debug: false
                };

                var closest = Voxels.clip_dist;
                closest = 1.0;

                for (var i = 0; i < 3; ++i)
                {
                    // DDA, determine the vector (step) used to check for intersection. Adding
                    // this vector to the starting camera point will generate the intersection
                    // point with the voxels relative to the current processed axis. With this
                    // point found we check if the voxel is filled or empty.

                    if (base_ray[i] == 0)
                        continue;

                    var inv = 1.0 / (base_ray[i] < 0 ? -base_ray[i] : base_ray[i]);
                    var ray = [base_ray[0] * inv, base_ray[1] * inv, base_ray[2] * inv];

                    // Force the current axis step to be one unit (precision loss can result in 0.99999999998 values).
                    ray[i] = ray[i] < 0 ? -1 : 1;
                    var ray_len = Common.vec3_len(ray);
                    var is_positive = ray[i] > 0;

                    // Apply the initial offset based on the camera position.
                    var initial_offset = Voxels.camera.position[i] - Math.floor(Voxels.camera.position[i]);

                    if (is_positive)
                        initial_offset = 1 - initial_offset;

                    world_point[0] = Voxels.camera.position[0] + ray[0] * initial_offset;
                    world_point[1] = Voxels.camera.position[1] + ray[1] * initial_offset;
                    world_point[2] = Voxels.camera.position[2] + ray[2] * initial_offset;

                    // The voxel has a unit length of 1 and the coordinates start at the lower left edges,
                    // not at the center. For this reason, taking the x axis as an example, if the ray
                    // vector touches voxels on the left side, then a small correction needs to be applied
                    // to render the right (external) face of the nearby voxel, otherwise the left (interior)
                    // face would have to be drawn.

                    // if (Voxels.debug.enable && x == Voxels.debug.x && y == Voxels.debug.y)
                    //     debugger;

                    var face = i << 1;

                    if (!is_positive)
                        face++;

                    ray_len *= Voxels.one_over_clip_dist;
                    var depth = ray_len * initial_offset;

                    // Advance the vector.
                    // TODO(gabic): Trebuie optimizat while-ul asta, neaparat !!
                    while (depth <= closest)
                    {
                        var tmp_point = [world_point[0], world_point[1], world_point[2]];

                        if (!is_positive)
                            tmp_point[i]--;

                        var voxel = Common.get_voxel(Voxels.map, tmp_point);
                        var voxel_index = Voxels.map.zpitch * voxel[2] + Voxels.map.dims[0] * voxel[1] + voxel[0];
                        // var voxel_index = voxel[2] << Voxels.map.shift_0 | voxel[1] << Voxels.map.shift_1 | voxel[0];

                        if (voxel_index >= 0 && voxel_index < Voxels.map.data.length)
                        {
                            var texture_id = Voxels.map.data[voxel_index];

                            // if (toString.call(texture_id) == '[object Array]')
                            // {
                            //     intersection.r = texture_id[0];
                            //     intersection.g = texture_id[1];
                            //     intersection.b = texture_id[2];

                            //     intersection.found = true;
                            //     intersection.index = pixel_index;
                            //     intersection.depth = depth;
                            //     intersection.light_dir = face;
                            //     intersection.is_debug = false;
                            //     closest = depth;
                            // }
                            // else
                            if (texture_id >= 0)
                            {
                                var sampler = Voxels.texture_sampler.uv[i];

                                // Texture sampling.
                                if (!Voxels.texture_sampler.use_blank_color)
                                {
                                    var u = tmp_point[sampler[0]] - (tmp_point[sampler[0]] | 0);
                                    var v = tmp_point[sampler[1]] - (tmp_point[sampler[1]] | 0);

                                    u = u < 0 ? 1 + u : u;
                                    v = v < 0 ? -v : 1 - v;

                                    u = u == 1 ? 0.999999 : u;
                                    v = v == 1 ? 0.999999 : v;

                                    var tex_x = (u * Voxels.texture_sampler.width) | 0;
                                    var tex_y = (v * Voxels.texture_sampler.height) | 0;
                                    var tex_index = (tex_y * Voxels.texture_sampler.stride + tex_x) << 2;

                                    var offset = Voxels.voxel_textures[texture_id][face];
                                    var face_pointer = TextureAtlas.offsets[offset] + tex_index;

                                    intersection.r = TextureAtlas.data[face_pointer + 0];
                                    intersection.g = TextureAtlas.data[face_pointer + 1];
                                    intersection.b = TextureAtlas.data[face_pointer + 2];
                                    intersection.a = TextureAtlas.data[face_pointer + 3];
                                }

                                if (intersection.a == 255)
                                {
                                    // intersection.found = true;
                                    intersection.depth = depth;
                                    intersection.light_dir = face;
                                    // intersection.is_debug = texture_id == 0 ? true : false;
                                    closest = depth;
                                }
                            }
                        }

                        world_point[0] += ray[0];
                        world_point[1] += ray[1];
                        world_point[2] += ray[2];

                        depth += ray_len;
                    }
                }

                // console.log('pixel:', x, y, count);

                // Write pixel color to buffer.
                if (intersection.light_dir >= 0)
                {
                    var t = 1;

                    // if (!intersection.is_debug)
                    {
                        t = 1 - intersection.depth;
                        // t = t * t;
                        // Apply light.
                        t *= Voxels.light[intersection.light_dir] * Voxels.light_mult;
                    }

                    Voxels.buffer.data[intersection.index + 0] = (intersection.r * t) | 0;
                    Voxels.buffer.data[intersection.index + 1] = (intersection.g * t) | 0;
                    Voxels.buffer.data[intersection.index + 2] = (intersection.b * t) | 0;
                }

                dx += Voxels.camera.sdx;
                pixel_index += 4;
            }

            dy += Voxels.camera.sdy;
        }

        screen_ctx.putImageData(Voxels.buffer, 0, 0);
        window.requestAnimationFrame(render);
    }
}

set_scene(VoxelLandscape);
// set_scene(VoxelRoom);

window.requestAnimationFrame(render);