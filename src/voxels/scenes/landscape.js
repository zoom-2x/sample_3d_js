import Common from 'common';
import { createNoise2D } from 'simplex-noise';

var VoxelLandscape =
{
    name: "Landscape",

    data: {
        c0: Common.TWO_PI / 10000,
        c1: Common.TWO_PI / 20000
    },

    setup: function(Voxels)
    {
        Voxels.width = 600;
        Voxels.height = 300;
        Voxels.scale = 2;
        Voxels.clip_count = 128;
        Voxels.clip_dist = 64;

        Voxels.light = [.5, .7, .85, .3, .2, .95];

        // Voxels.camera.start_position = [64.0, 0.0, 16.0];
        Voxels.camera.start_position = [32.0, -10.0, 16.0];
        Voxels.camera.start_rotation = [-20, 0, -45];
        Voxels.texture_sampler.use_blank_color = true;
        Voxels.texture_sampler.default_color = [114, 188, 112, 255];

        Voxels.map.dims = [64, 64, 32];
        Voxels.map.shift_z = 12;
        Voxels.map.shift_y = 6;
        Voxels.map.wrap = [true, true, false];
    },

    attenuation: function(v)
    {
        var s = 0.9;
        return s * Math.sin(0.5 * Math.PI * v + Math.PI * 0.5) + (1 - s);
    },

    generate: function(Voxels)
    {
        var noise2D = createNoise2D();

        for (var z = 0; z < Voxels.map.dims[2]; ++z) {
            for (var y = 0; y < Voxels.map.dims[1]; ++y) {
                for (var x = 0; x < Voxels.map.dims[0]; ++x) {
                    Voxels.map.data[Common.get_map_index(Voxels.map, x, y, z)] = -1;
                }
            }
        }

        var freq = 0.9;

        for (var y = 0; y < Voxels.map.dims[1]; ++y)
        {
            for (var x = 0; x < Voxels.map.dims[0]; ++x)
            {
                var nx = 2 * x / Voxels.map.dims[0] - 1;
                var ny = 2 * y / Voxels.map.dims[1] - 1;
                var nz = noise2D(freq * nx, freq * ny);

                var ax = VoxelLandscape.attenuation(nx);
                var ay = VoxelLandscape.attenuation(ny);

                nz = 0.5 * nz + 0.5;
                nz *= (ax < ay ? ax : ay) * 0.5;
                // nz = 0.4 * Math.pow(nz, 0.6);

                var z = (nz * (Voxels.map.dims[2] - 1)) | 0;

                for (var zi = 0; zi <= z; ++zi) {
                    Voxels.map.data[Common.get_map_index(Voxels.map, x, y, zi)] = 1;
                }
            }
        }
    },

    update: function(Voxels, timestamp, delta)
    {
        var zd = timestamp * VoxelLandscape.data.c0;

        var rot_x = timestamp * VoxelLandscape.data.c0;
        var rot_z = timestamp * VoxelLandscape.data.c1;

        Voxels.camera.position[0] += delta * 0.01;
        Voxels.camera.position[1] += delta * 0.01;
        Voxels.camera.position[2] = Voxels.camera.start_position[2] + 2.0 * Math.sin(zd);

        Voxels.camera.rotation[0] = Voxels.camera.start_rotation[0] + 5 * Math.sin(rot_x);
        Voxels.camera.rotation[2] = Voxels.camera.start_rotation[2] + 80 * Math.sin(rot_z);
    }
};

export default VoxelLandscape;