import Common from 'common'
import Textures from 'assets/textures/rasterizer.json'

var ProgramGouraud =
{
    // uv, normal
    attrs: 5,

    light_dir: Common.vec3_normalize([1, -1, 1]),
    light_intensity: 4,
    light_color: null,
    ambient: Common.color_255_to_one([80, 50, 55]),
    color: null,

    reset: function()
    {
        ProgramGouraud.light_dir = Common.vec3_normalize([1, -1, 1]);
        ProgramGouraud.light_intensity = 4;
        ProgramGouraud.light_color = null;
        ProgramGouraud.ambient = Common.color_255_to_one([80, 50, 55]);
        ProgramGouraud.color = null;
    },

    reader: function(rasterizer)
    {
        for (var i = 0; i < 3; ++i)
        {
            var vertex_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 0] - 1) * 3;
            var uv_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 1] - 1) * 2;
            var normal_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 2] - 1) * 3;

            // Position.
            rasterizer.triangle.vertices[i][0] = rasterizer.mesh.vertex[vertex_pointer + 0];
            rasterizer.triangle.vertices[i][1] = rasterizer.mesh.vertex[vertex_pointer + 1];
            rasterizer.triangle.vertices[i][2] = rasterizer.mesh.vertex[vertex_pointer + 2];
            rasterizer.triangle.vertices[i][3] = 1;

            // UV.
            rasterizer.triangle.vertices[i][4] = rasterizer.mesh.uv[uv_pointer + 0];
            rasterizer.triangle.vertices[i][5] = rasterizer.mesh.uv[uv_pointer + 1];

            // Normal.
            rasterizer.triangle.vertices[i][6] = rasterizer.mesh.normal[normal_pointer + 0];
            rasterizer.triangle.vertices[i][7] = rasterizer.mesh.normal[normal_pointer + 1];
            rasterizer.triangle.vertices[i][8] = rasterizer.mesh.normal[normal_pointer + 2];

            var n = [rasterizer.triangle.vertices[i][6], rasterizer.triangle.vertices[i][7], rasterizer.triangle.vertices[i][8], 1];
            n = Common.mat4_mulvec(rasterizer.MAT_NORMAL, n);

            rasterizer.triangle.vertices[i][6] = n[0];
            rasterizer.triangle.vertices[i][7] = n[1];
            rasterizer.triangle.vertices[i][8] = n[2];

            rasterizer.mesh_pointer += 3;
        }
    },

    shader: function(interp, one_over_w, depth, rasterizer)
    {
        var u = one_over_w * interp[2];
        var v = one_over_w * interp[3];

        if (ProgramGouraud.color)
        {
            rasterizer.pixel_color[0] = ProgramGouraud.color[0];
            rasterizer.pixel_color[1] = ProgramGouraud.color[1];
            rasterizer.pixel_color[2] = ProgramGouraud.color[2];
        }
        else
            rasterizer.sampler.sample(Textures.data, rasterizer.sampler, u, v, rasterizer.pixel_color);

        var dot = Common.clamp(interp[4] * ProgramGouraud.light_dir[0] + interp[5] * ProgramGouraud.light_dir[1] + interp[6] * ProgramGouraud.light_dir[2], 0, 1);
        dot *= ProgramGouraud.light_intensity;

        rasterizer.pixel_color[0] = rasterizer.pixel_color[0] * (dot + ProgramGouraud.ambient[0]);
        rasterizer.pixel_color[1] = rasterizer.pixel_color[1] * (dot + ProgramGouraud.ambient[1]);
        rasterizer.pixel_color[2] = rasterizer.pixel_color[2] * (dot + ProgramGouraud.ambient[2]);

        if (ProgramGouraud.light_color)
        {
            rasterizer.pixel_color[0] *= ProgramGouraud.light_color[0];
            rasterizer.pixel_color[1] *= ProgramGouraud.light_color[1];
            rasterizer.pixel_color[2] *= ProgramGouraud.light_color[2];
        }
    }
};

export default ProgramGouraud;