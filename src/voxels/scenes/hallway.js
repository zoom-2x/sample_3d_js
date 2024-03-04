import Common from 'common';

var Hallway =
{
    name: "Hallway",
    data: {
        textures: {}
    },

    xd: Common.TWO_PI / 5000,
    zd: Common.TWO_PI / 800,
    rot_x: Common.TWO_PI / 20000,
    rot_z: Common.TWO_PI / 10000,

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

        Voxels.map.dims = [32, 32, 32];
        Voxels.map.shift_z = 10;
        Voxels.map.shift_y = 5;

        Voxels.camera.start_position = [15.5, 0, 5];
        Voxels.camera.start_rotation = [0, 0, 0];

        // Voxels.camera.rotation[0] = 35;
        // Voxels.camera.rotation[2] = 90;

        Voxels.map.wrap = [false, true, false];
        Voxels.texture_sampler.use_blank_color = false;
        Voxels.texture_sampler.default_color = [150, 150, 150];

        Voxels.clip_count = 128;
        Voxels.clip_dist = 80;

        Voxels.light = [.6, .6, .85, .45, .3, .95],
        Voxels.light_mult = 1.5;

        this.camera_circle_rotation.point_distance = Math.sqrt(
            this.camera_circle_rotation.radius * this.camera_circle_rotation.radius +
            this.camera_circle_rotation.center_distance * this.camera_circle_rotation.center_distance
        );
    },

    add_window: function(map, point)
    {
        Common.brush(map, point, [point[0], point[1] + 2, point[2] + 2], 0);

        Common.brush(map,
            [point[0], point[1] + 1, point[2] + 3],
            [point[0], point[1] + 1, point[2] + 3],
            0);

        Common.brush(map,
            [point[0], point[1] + 1, point[2] - 1],
            [point[0], point[1] + 1, point[2] - 1],
            0);

        Common.brush(map,
            [point[0], point[1], point[2] + 1],
            [point[0], point[1] + 2, point[2] + 1],
            Hallway.data.textures.floor_tile_0);
    },

    add_column_left: function(map, point)
    {
        var end_point = [
            point[0] + 4,
            point[1] + 3,
            point[2] + 10
        ];

        Common.brush(map, point, end_point, Hallway.data.textures.bricks_1);

        Common.brush(map,
            [point[0] + 2, point[1] + 0, point[2] + 0],
            [point[0] + 2, point[1] + 0, point[2] + 6],
            0);

        Common.brush(map,
            [point[0] + 2, point[1] + 3, point[2] + 0],
            [point[0] + 2, point[1] + 3, point[2] + 6],
            0);

        Common.brush(map,
            [point[0] + 2, point[1] + 1, point[2] + 6],
            [point[0] + 2, point[1] + 2, point[2] + 6],
            Hallway.data.textures.light_0);

        Common.brush(map,
            [point[0] + 2, point[1] + 1, point[2] + 4],
            [point[0] + 2, point[1] + 2, point[2] + 4],
            Hallway.data.textures.light_0);

        Common.brush(map,
            [point[0] + 2, point[1] + 1, point[2] + 2],
            [point[0] + 2, point[1] + 2, point[2] + 2],
            Hallway.data.textures.light_0);

        Common.brush(map,
            [point[0] + 4, point[1] + 0, point[2] + 0],
            [point[0] + 4, point[1] + 0, point[2] + 10],
            0);

        Common.brush(map,
            [point[0] + 4, point[1] + 3, point[2] + 0],
            [point[0] + 4, point[1] + 3, point[2] + 10],
            0);

        Common.brush(map,
            point,
            [point[0] + 4, point[1] + 3, point[2]],
            Hallway.data.textures.bricks_1_bottom, true);

        Common.brush(map,
            [point[0], point[1], point[2] + 8],
            [point[0] + 4, point[1] + 3, point[2] + 8],
            Hallway.data.textures.bricks_1_top, true);
    },

    add_column_right: function(map, point)
    {
        var end_point = [
            point[0] - 4,
            point[1] + 3,
            point[2] + 10
        ];

        Common.brush(map, point, end_point, Hallway.data.textures.bricks_1);

        Common.brush(map,
            [point[0] - 2, point[1] + 0, point[2] + 0],
            [point[0] - 2, point[1] + 0, point[2] + 6],
            0);

        Common.brush(map,
            [point[0] - 2, point[1] + 3, point[2] + 0],
            [point[0] - 2, point[1] + 3, point[2] + 6],
            0);

        Common.brush(map,
            [point[0] - 2, point[1] + 1, point[2] + 6],
            [point[0] - 2, point[1] + 2, point[2] + 6],
            Hallway.data.textures.light_0);

        Common.brush(map,
            [point[0] - 2, point[1] + 1, point[2] + 4],
            [point[0] - 2, point[1] + 2, point[2] + 4],
            Hallway.data.textures.light_0);

        Common.brush(map,
            [point[0] - 2, point[1] + 1, point[2] + 2],
            [point[0] - 2, point[1] + 2, point[2] + 2],
            Hallway.data.textures.light_0);

        Common.brush(map,
            [point[0] - 4, point[1] + 0, point[2] + 0],
            [point[0] - 4, point[1] + 0, point[2] + 10],
            0);

        Common.brush(map,
            [point[0] - 4, point[1] + 3, point[2] + 0],
            [point[0] - 4, point[1] + 3, point[2] + 10],
            0);

        Common.brush(map,
            [point[0] - 4, point[1], point[2]],
            [point[0], point[1] + 3, point[2]],
            Hallway.data.textures.bricks_1_bottom, true);

        Common.brush(map,
            [point[0] - 4, point[1], point[2] + 8],
            [point[0], point[1] + 3, point[2] + 8],
            Hallway.data.textures.bricks_1_top, true);
    },

    add_support: function(map, point)
    {
        Common.brush(map, [point[0], point[1], point[2]], [point[0] + 16, point[1] + 1, point[2]], Hallway.data.textures.metal_0);
        Common.brush(map, [point[0] + 8 - 1, point[1] - 1, point[2]], [point[0] + 8 + 1, point[1] + 2, point[2]], Hallway.data.textures.deco_3);
    },

    generate: function(Voxels)
    {
        Common.clear_map(Voxels.map);

        var bricks_0 = Common.add_voxel_texture(Voxels, 10);
        var bricks_1 = Common.add_voxel_texture(Voxels, 11);
        var floor_tile_0 = Common.add_voxel_texture(Voxels, 12);
        var floor_tile_1 = Common.add_voxel_texture(Voxels, 13);
        var floor_tile_2 = Common.add_voxel_texture(Voxels, 14);
        var bricks_1_bottom = Common.add_voxel_texture(Voxels, 15);
        var bricks_1_top = Common.add_voxel_texture(Voxels, 16);
        var deco_0 = Common.add_voxel_texture(Voxels, 17);
        var light_0 = Common.add_voxel_texture(Voxels, 18);
        var light_1 = Common.add_voxel_texture(Voxels, 20);
        var deco_1 = Common.add_voxel_texture(Voxels, [19, 19, 19, 19, 20, 20]);
        var deco_2 = Common.add_voxel_texture(Voxels, 21);
        var deco_3 = Common.add_voxel_texture(Voxels, [23, 23, 23, 23, 20, 20]);
        var metal_0 = Common.add_voxel_texture(Voxels, 22);
        var metal_1 = Common.add_voxel_texture(Voxels, 23);
        var deco_4 = Common.add_voxel_texture(Voxels, [23, 23, 23, 23, 18, 18]);

        Hallway.data.textures.bricks_0 = bricks_0;
        Hallway.data.textures.bricks_1 = bricks_1;
        Hallway.data.textures.floor_tile_0 = floor_tile_0;
        Hallway.data.textures.floor_tile_1 = floor_tile_1;
        Hallway.data.textures.floor_tile_2 = floor_tile_2;
        Hallway.data.textures.bricks_1_bottom = bricks_1_bottom;
        Hallway.data.textures.bricks_1_top = bricks_1_top;
        Hallway.data.textures.deco_0 = deco_0;
        Hallway.data.textures.light_0 = light_0;
        Hallway.data.textures.light_1 = light_1;
        Hallway.data.textures.deco_1 = deco_1;
        Hallway.data.textures.deco_2 = deco_2;
        Hallway.data.textures.deco_3 = deco_3;
        Hallway.data.textures.metal_0 = metal_0;
        Hallway.data.textures.metal_1 = metal_1;

        // 15 = center
        // Floor.
        Common.brush(Voxels.map, [7, 0, 0], [23, 32, 2], floor_tile_2);
        Common.brush(Voxels.map, [7, 0, 3], [7, 32, 3], bricks_1);
        Common.brush(Voxels.map, [23, 0, 3], [23, 32, 3], bricks_1);

        Common.brush(Voxels.map, [12, 0, 2], [12, 32, 2], floor_tile_1, true);
        // Common.brush(Voxels.map, [15, 0, 2], [15, 32, 2], floor_tile_1, true);
        Common.brush(Voxels.map, [18, 0, 2], [18, 32, 2], floor_tile_1, true);

        Common.brush(Voxels.map, [13, 0, 2], [17, 32, 2], 0);
        Common.brush(Voxels.map, [14, 0, 1], [16, 31, 1], 0x01422433);

        for (var i = 0; i < 32; ++i)
        {
            if (i % 8 == 0)
                // Common.brush(Voxels.map, [15, i, 1], [15, i, 1], 0x0176D834);
                Common.brush(Voxels.map, [15, i, 1], [15, i, 1], light_0);
        }

        Common.brush(Voxels.map, [5, 0, 0], [5, 32, 12], 0x01BA2E2E);
        Common.brush(Voxels.map, [25, 0, 0], [25, 32, 12], 0x01BA2E2E);

        // Left wall.
        Common.brush(Voxels.map, [6, 0, 0], [6, 32, 12], bricks_1);
        Common.brush(Voxels.map, [6, 0, 11], [6, 32, 11], bricks_1_top, true);

        // Right wall.
        Common.brush(Voxels.map, [24, 0, 0], [24, 32, 12], bricks_1);
        Common.brush(Voxels.map, [24, 0, 11], [24, 32, 11], bricks_1_top, true);

        Common.brush(Voxels.map, [6, 15, 7], [6, 15, 7], light_1);
        Common.brush(Voxels.map, [24, 15, 7], [24, 15, 7], light_1);

        // ----------------------------------------------------------------------------------

        // Decoration 1.
        Common.brush(Voxels.map, [7, 14, 3], [8, 16, 4], metal_0);
        Common.brush(Voxels.map, [8, 15, 3], [8, 15, 3], 0);

        Common.brush(Voxels.map, [8, 13, 2], [8, 13, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [9, 13, 2], [9, 13, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [9, 14, 2], [9, 14, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [9, 15, 2], [9, 15, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [9, 16, 2], [9, 16, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [9, 17, 2], [9, 17, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [8, 17, 2], [8, 17, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [8, 15, 2], [8, 15, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [7, 15, 3], [7, 15, 3], 0x01BA2E2E);

        Common.brush(Voxels.map, [8, 12, 2], [8, 12, 2], floor_tile_1);
        Common.brush(Voxels.map, [9, 12, 2], [9, 12, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 12, 2], [10, 12, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 13, 2], [10, 13, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 14, 2], [10, 14, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 15, 2], [10, 15, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 16, 2], [10, 16, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 17, 2], [10, 17, 2], floor_tile_1);
        Common.brush(Voxels.map, [10, 18, 2], [10, 18, 2], floor_tile_1);
        Common.brush(Voxels.map, [9, 18, 2], [9, 18, 2], floor_tile_1);
        Common.brush(Voxels.map, [8, 18, 2], [8, 18, 2], floor_tile_1);

        // ----------------------------------------------------------------------------------

        // Decoration 2.
        Common.brush(Voxels.map, [22, 14, 3], [23, 16, 4], metal_0);
        Common.brush(Voxels.map, [22, 15, 3], [22, 15, 3], 0);

        Common.brush(Voxels.map, [22, 13, 2], [22, 13, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [21, 13, 2], [21, 13, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [21, 14, 2], [21, 14, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [21, 15, 2], [21, 15, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [21, 16, 2], [21, 16, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [21, 17, 2], [21, 17, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [22, 17, 2], [22, 17, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [22, 15, 2], [22, 15, 2], 0x01BA2E2E);
        Common.brush(Voxels.map, [23, 15, 3], [23, 15, 3], 0x01BA2E2E);

        Common.brush(Voxels.map, [22, 12, 2], [22, 12, 2], floor_tile_1);
        Common.brush(Voxels.map, [21, 12, 2], [21, 12, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 12, 2], [20, 12, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 13, 2], [20, 13, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 14, 2], [20, 14, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 15, 2], [20, 15, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 16, 2], [20, 16, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 17, 2], [20, 17, 2], floor_tile_1);
        Common.brush(Voxels.map, [20, 18, 2], [20, 18, 2], floor_tile_1);
        Common.brush(Voxels.map, [21, 18, 2], [21, 18, 2], floor_tile_1);
        Common.brush(Voxels.map, [22, 18, 2], [22, 18, 2], floor_tile_1);

        // ----------------------------------------------------------------------------------

        // Ceiling.
        Common.brush(Voxels.map, [7, 0, 12], [23, 32, 20], floor_tile_2);

        // Ceiling center.
        Common.brush(Voxels.map, [10, 0, 12], [20, 32, 13], 0);
        Common.brush(Voxels.map, [14, 0, 14], [16, 32, 18], 0);

        Common.brush(Voxels.map, [14, 0, 17], [16, 32, 17], 0x01BA2E2E);

        for (var i = 0; i < 32; ++i)
        {
            if (i % 8 == 0)
            {
                Common.brush(Voxels.map, [13, i, 14], [13, i + 4, 14], deco_4);
                Common.brush(Voxels.map, [17, i, 14], [17, i + 4, 14], deco_4);
            }
        }

        for (var i = 0; i < 32; ++i)
        {
            if (i % 6 == 0)
                Common.brush(Voxels.map, [14, i, 15], [16, i + 2, 15], metal_0);
        }

        Common.brush(Voxels.map, [9, 0, 12], [9, 32, 12], 0);
        Common.brush(Voxels.map, [21, 0, 12], [21, 32, 12], 0);

        Hallway.add_support(Voxels.map, [7, 14, 13]);
        Hallway.add_support(Voxels.map, [7, 29, 13]);

        Common.brush(Voxels.map, [9, 0, 13], [9, 32, 13], metal_0, true);
        Common.brush(Voxels.map, [21, 0, 13], [21, 32, 13], metal_0, true);
        Common.brush(Voxels.map, [7, 0, 12], [8, 32, 12], bricks_1, true);
        Common.brush(Voxels.map, [23, 0, 12], [22, 32, 12], bricks_1, true);

        Hallway.add_column_left(Voxels.map, [7, 3, 3]);
        Hallway.add_column_right(Voxels.map, [23, 3, 3]);

        Hallway.add_window(Voxels.map, [6, 11, 6]);
        Hallway.add_window(Voxels.map, [24, 11, 6]);

        Hallway.add_window(Voxels.map, [6, 17, 6]);
        Hallway.add_window(Voxels.map, [24, 17, 6]);

        Hallway.add_column_left(Voxels.map, [7, 24, 3]);
        Hallway.add_column_right(Voxels.map, [23, 24, 3]);

        Common.brush(Voxels.map, [9, 31, 3], [10, 31, 3], deco_1);
        Common.brush(Voxels.map, [20, 31, 3], [21, 31, 3], deco_1);
    },

    update: function(Voxels, timestamp, delta)
    {
        // Voxels.camera.rotation[2] = 90;

        if (!Voxels.free_mode && Hallway.running)
        {
            var xd = timestamp * Hallway.xd;
            var zd = timestamp * Hallway.zd;

            var rot_x = timestamp * Hallway.rot_x;
            var rot_z = timestamp * Hallway.rot_z;

            // Voxels.camera.position[0] = Voxels.camera.start_position[0] + 1.0 * Math.sin(xd);
            // Voxels.camera.position[1] += delta * 0.005;
            Voxels.camera.position[1] += delta * 0.012;
            // Voxels.camera.position[2] -= delta * 0.001;
            Voxels.camera.position[2] = Voxels.camera.start_position[2] + 0.5 * Math.sin(zd);

            // var angles = Common.get_camera_circle_rotation_angles(timestamp * this.camera_circle_rotation.speed, this.camera_circle_rotation);
            // Voxels.camera.rotation[0] = Voxels.camera.start_rotation[0] + Common.rad2deg(angles[0]);
            // Voxels.camera.rotation[2] = Voxels.camera.start_rotation[2] - Common.rad2deg(angles[1]);

            Voxels.camera.rotation[0] = Voxels.camera.start_rotation[0] + 20 * Math.sin(rot_x);
            Voxels.camera.rotation[2] = Voxels.camera.start_rotation[2] + 60 * Math.sin(rot_z);
        }
    }
};

export default Hallway;