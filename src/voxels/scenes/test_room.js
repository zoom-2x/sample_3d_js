import Common from 'common';

var TestRoom =
{
    name: "Test room",

    data: {},

    setup: function(Voxels)
    {
        Voxels.width = 800;
        Voxels.height = 400;
        Voxels.scale = 2;
        Voxels.clip_count = 64;
        Voxels.clip_dist = 32;

        Voxels.light = [.5, .7, .85, .2, .2, .95];

        // Voxels.camera.start_position = [64.0, 0.0, 16.0];
        Voxels.camera.start_position = [2.5, -4.0, 1.5];
        Voxels.camera.start_rotation = [0, 0, 0];
        Voxels.texture_sampler.use_blank_color = false;
        Voxels.texture_sampler.default_color = [114, 188, 112, 255];

        Voxels.map.dims = [8, 8, 8];
        Voxels.map.shift_z = 6;
        Voxels.map.shift_y = 3;
        // Voxels.map.wrap = [true, true, true];
        Voxels.map.wrap = [true, true, true];
    },

    generate: function(Voxels)
    {
        Common.brush(Voxels.map, [0, 0, 0], [0, 7, 2], 0x010000ff);
        Common.brush(Voxels.map, [4, 0, 0], [4, 7, 2], 0x01ff0000);
        Common.brush(Voxels.map, [4, 1, 1], [4, 7, 1], 0);
        Common.brush(Voxels.map, [0, 1, 1], [0, 7, 1], 0);

        Common.brush(Voxels.map, [0, 4, 0], [4, 4, 2], 0x01009900);
        Common.brush(Voxels.map, [1, 4, 1], [3, 4, 1], 0);

        Common.brush(Voxels.map, [2, 0, 3], [2, 7, 3], 0x01cc9955);
    },

    update: function(Voxels, timestamp, delta)
    {
        var rot_x = timestamp * Common.TWO_PI / 10000;
        var rot_z = timestamp * Common.TWO_PI / 20000;

        var zd = timestamp * Common.TWO_PI / 10000;

        Voxels.camera.position[0] = Voxels.camera.start_position[0] + 0.4 * Math.sin(zd * 2);
        Voxels.camera.position[1] += delta * 0.01;
        Voxels.camera.position[2] = Voxels.camera.start_position[2] + 0.2 * Math.sin(zd);

        Voxels.camera.rotation[0] = Voxels.camera.start_rotation[0] + 20 * Math.sin(rot_x);
        Voxels.camera.rotation[2] = Voxels.camera.start_rotation[2] + 50 * Math.sin(rot_z);
    }
};

export default TestRoom;