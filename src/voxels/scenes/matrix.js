import Common from 'common';

var Matrix =
{
    name: "Matrix",

    data: {},

    voxel_texture_index: 0,
    running: true,

    vtindex: function(offset) {
        return this.voxel_texture_index + offset;
    },

    camera_circle_rotation: {
        radius: 0.5,
        center_distance: 1,
        point_distance: 0,
        speed: Common.TWO_PI / 10000
    },

    setup: function(Voxels)
    {
        Voxels.width = 800;
        Voxels.height = 400;
        Voxels.scale = 2;

        Voxels.clip_count = 64;
        Voxels.clip_dist = 32;

        Voxels.map.dims = [4, 4, 4];
        Voxels.map.shift_z = 4;
        Voxels.map.shift_y = 2;
        Voxels.camera.start_position = [0.5, 0, 3.5];

        // Voxels.map.dims = [8, 8, 8];
        // Voxels.map.shift_z = 6;
        // Voxels.map.shift_y = 3;
        // Voxels.camera.start_position = [-1.5, 0, 3.5];

        // Voxels.camera.start_rotation = [0, 0, -90.0];
        Voxels.map.wrap = [true, true, true];
        Voxels.texture_sampler.use_blank_color = false;

        this.camera_circle_rotation.point_distance = Math.sqrt(
            this.camera_circle_rotation.radius * this.camera_circle_rotation.radius +
            this.camera_circle_rotation.center_distance * this.camera_circle_rotation.center_distance
        );

        // Textures.
        this.voxel_texture_index = Voxels.voxel_textures.length;

        Voxels.voxel_textures.push([3, 3, 3, 3, 6, 6]);
        Voxels.voxel_textures.push([1, 1, 1, 1, 6, 6]);
        Voxels.voxel_textures.push([2, 2, 2, 2, 2, 2]);
        Voxels.voxel_textures.push([4, 4, 4, 4, 4, 4]);
        Voxels.voxel_textures.push([5, 5, 5, 5, 5, 5]);
    },

    generate: function(Voxels)
    {
        for (var z = 0; z < Voxels.map.dims[2]; ++z) {
            for (var y = 0; y < Voxels.map.dims[1]; ++y) {
                for (var x = 0; x < Voxels.map.dims[0]; ++x) {
                    Voxels.map.data[Common.get_map_index(Voxels.map, x, y, z)] = -1;
                }
            }
        }

        Common.map_add_object(Voxels.map, [2, 2, 1], Voxels.voxel_objects[Voxels.c$.OBJ_CUBE]);
    },

    update: function(Voxels, timestamp, delta)
    {
        if (!Voxels.free_mode && Matrix.running)
        {
            var xd = timestamp * Common.TWO_PI / 5000;
            var zd = timestamp * Common.TWO_PI / 10000;

            // Voxels.camera.position[0] = Voxels.camera.start_position[0] + 1.0 * Math.sin(xd);

            Voxels.camera.position[1] += delta * 0.005;
            Voxels.camera.position[2] -= delta * 0.001;

            // Voxels.camera.position[2] = Voxels.camera.start_position[2] + 5.0 * Math.sin(zd);

            var angles = Common.get_camera_circle_rotation_angles(timestamp * this.camera_circle_rotation.speed, this.camera_circle_rotation);

            Voxels.camera.rotation[0] = Voxels.camera.start_rotation[0] + Common.rad2deg(angles[0]);
            Voxels.camera.rotation[2] = Voxels.camera.start_rotation[2] - Common.rad2deg(angles[1]);
        }
    }
};

export default Matrix;