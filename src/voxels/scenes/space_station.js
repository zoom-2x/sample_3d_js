import Common from 'common';

var SpaceStation =
{
    name: "SpaceStation",
    data: {
        textures: {}
    },

    xd: Common.TWO_PI / 8000,
    zd: Common.TWO_PI / 15000,

    running: true,

    camera_circle_rotation: {
        radius: 0.3,
        center_distance: 1,
        point_distance: 0,
        speed: Common.TWO_PI / 10000
    },

    setup: function(Voxels)
    {
        Voxels.width = 800;
        Voxels.height = 400;
        Voxels.scale = 2;

        Voxels.map.dims = [32, 64, 32];
        Voxels.map.shift_z = 11;
        Voxels.map.shift_y = 5;

        Voxels.camera.start_position = [16, 0, 9];
        Voxels.camera.start_rotation = [0, 0, 0];
        Voxels.camera.rotation = [0, 0, 0];

        // Voxels.camera.rotation[0] = 35;
        // Voxels.camera.rotation[2] = 90;

        Voxels.map.wrap = [false, true, false];
        Voxels.texture_sampler.use_blank_color = false;
        Voxels.texture_sampler.default_color = [150, 150, 150];

        Voxels.clip_count = 128;
        Voxels.clip_dist = 80;

        Voxels.light = [.6, .6, .85, .35, .3, .95],
        Voxels.light_mult = 1.4;

        this.camera_circle_rotation.point_distance = Math.sqrt(
            this.camera_circle_rotation.radius * this.camera_circle_rotation.radius +
            this.camera_circle_rotation.center_distance * this.camera_circle_rotation.center_distance
        );
    },

    add_tower_left: function(map, point)
    {
        Common.brush(map,
            point,
            [point[0], point[1], point[2] + 19],
            0x01cccccc);

        // ----------------------------------------------------------------------------------

        Common.brush(map,
            [point[0] - 1, point[1], point[2]],
            [point[0] - 1, point[1], point[2] + 7],
            0x01cccccc);

        Common.brush(map,
            [point[0] + 1, point[1], point[2]],
            [point[0] + 1, point[1], point[2] + 7],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] - 1, point[2]],
            [point[0], point[1] - 1, point[2] + 7],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] + 1, point[2]],
            [point[0], point[1] + 1, point[2] + 7],
            0x01cccccc);

        // ----------------------------------------------------------------------------------

        Common.brush(map,
            [point[0] - 1, point[1], point[2] + 9],
            [point[0] - 1, point[1], point[2] + 15],
            0x01cccccc);

        Common.brush(map,
            [point[0] + 1, point[1], point[2] + 10],
            [point[0] + 1, point[1], point[2] + 13],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] - 1, point[2] + 10],
            [point[0], point[1] - 1, point[2] + 14],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] + 1, point[2] + 11],
            [point[0], point[1] + 1, point[2] + 16],
            0x01cccccc);

        // ----------------------------------------------------------------------------------

        Common.brush(map,
            [point[0], point[1], point[2] + 17],
            [point[0], point[1], point[2] + 17],
            0);
    },

    add_tower_right: function(map, point)
    {
        Common.brush(map,
            point,
            [point[0], point[1], point[2] + 19],
            0x01cccccc);

        // ----------------------------------------------------------------------------------

        Common.brush(map,
            [point[0] - 1, point[1], point[2]],
            [point[0] - 1, point[1], point[2] + 7],
            0x01cccccc);

        Common.brush(map,
            [point[0] + 1, point[1], point[2]],
            [point[0] + 1, point[1], point[2] + 7],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] - 1, point[2]],
            [point[0], point[1] - 1, point[2] + 7],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] + 1, point[2]],
            [point[0], point[1] + 1, point[2] + 7],
            0x01cccccc);

        // ----------------------------------------------------------------------------------

        Common.brush(map,
            [point[0] + 1, point[1], point[2] + 9],
            [point[0] + 1, point[1], point[2] + 15],
            0x01cccccc);

        Common.brush(map,
            [point[0] - 1, point[1], point[2] + 10],
            [point[0] - 1, point[1], point[2] + 13],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] - 1, point[2] + 10],
            [point[0], point[1] - 1, point[2] + 14],
            0x01cccccc);

        Common.brush(map,
            [point[0], point[1] + 1, point[2] + 11],
            [point[0], point[1] + 1, point[2] + 16],
            0x01cccccc);

        // ----------------------------------------------------------------------------------

        Common.brush(map,
            [point[0], point[1], point[2] + 17],
            [point[0], point[1], point[2] + 17],
            0);
    },

    add_tunnel: function(map, y)
    {
        Common.brush(map, [4, y, 10], [27, y + 8, 16], 0x01cccccc);
        // Common.brush(map, [4, y + 10, 10], [27, y + 18, 16], 0x01cccccc);

        Common.brush(map, [4, y, 11], [4, y + 8, 11], 0);
        Common.brush(map, [27, y, 11], [27, y + 8, 11], 0);

        Common.brush(map, [15, y, 16], [16, y + 8, 16], 0);
        Common.brush(map, [4, y, 12], [10, y + 8, 16], 0);
        Common.brush(map, [21, y, 12], [27, y + 8, 16], 0);
        Common.brush(map, [12, y, 11], [19, y + 8, 15], 0);
        Common.brush(map, [7, y, 10], [24, y + 8, 10], 0);

        Common.brush(map, [11, y, 16], [11, y + 8, 16], 0);
        Common.brush(map, [12, y, 15], [12, y + 8, 15], 0x01cccccc);

        Common.brush(map, [20, y, 16], [20, y + 8, 16], 0);
        Common.brush(map, [19, y, 15], [19, y + 8, 15], 0x01cccccc);
    },

    generate: function(Voxels)
    {
        Common.clear_map(Voxels.map, true);
        Common.brush(Voxels.map, [4, 0, 5], [27, 63, 30], 0);

        Common.brush(Voxels.map, [0, 0, 0], [10, 63, 9], 0x01cccccc);
        Common.brush(Voxels.map, [21, 0, 0], [31, 63, 9], 0x01cccccc);
        Common.brush(Voxels.map, [0, 0, 0], [31, 63, 5], 0x01cccccc);

        Common.brush(Voxels.map, [14, 0, 5], [17, 63, 5], 0);
        Common.brush(Voxels.map, [15, 0, 4], [16, 63, 4], 0);
        Common.brush(Voxels.map, [8, 0, 7], [10, 63, 7], 0);
        Common.brush(Voxels.map, [21, 0, 7], [23, 63, 7], 0);

        Common.brush(Voxels.map, [11, 0, 9], [11, 63, 9], 0x01cccccc);
        Common.brush(Voxels.map, [20, 0, 9], [20, 63, 9], 0x01cccccc);

        Common.brush(Voxels.map, [8, 13, 5], [23, 18, 9], 0);

        SpaceStation.add_tower_left(Voxels.map, [10, 15, 5]);
        SpaceStation.add_tower_right(Voxels.map, [21, 15, 5]);

        SpaceStation.add_tunnel(Voxels.map, 20);
        SpaceStation.add_tunnel(Voxels.map, 40);

        SpaceStation.add_tower_left(Voxels.map, [5, 4, 8]);
        SpaceStation.add_tower_right(Voxels.map, [26, 4, 8]);

        for (var i = 0; i < 64; ++i)
        {
            if (i % 9 == 0)
            {
                Common.brush(Voxels.map, [11, i, 5], [11, i + 3, 5], 0);
                Common.brush(Voxels.map, [20, i, 5], [20, i + 3, 5], 0);
            }
        }
    },

    update: function(Voxels, timestamp, delta)
    {
        if (!Voxels.free_mode && SpaceStation.running)
        {
            var xd = timestamp * SpaceStation.xd;
            var zd = timestamp * SpaceStation.zd;
            
            Voxels.camera.position[0] = Voxels.camera.start_position[0] + 1.0 * Math.sin(xd);
            Voxels.camera.position[1] += delta * 0.03;
            Voxels.camera.position[2] = Voxels.camera.start_position[2] + 1.5 * Math.sin(zd);
        }
    }
};

    export default SpaceStation;
