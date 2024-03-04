import Common from 'common'
import Textures from 'assets/textures/rasterizer.json'

var ProgramTexture =
{
    // uv
    attrs: 2,

    reader: function(rasterizer)
    {
        for (var i = 0; i < 3; ++i)
        {
            var vertex_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 0] - 1) * 3;
            var uv_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 1] - 1) * 2;
            // var normal_pointer = (rasterizer.mesh.faces[rasterizer.mesh_pointer + 2] - 1) * 3;

            // Position.
            rasterizer.triangle.vertices[i][0] = rasterizer.mesh.vertex[vertex_pointer + 0];
            rasterizer.triangle.vertices[i][1] = rasterizer.mesh.vertex[vertex_pointer + 1];
            rasterizer.triangle.vertices[i][2] = rasterizer.mesh.vertex[vertex_pointer + 2];
            rasterizer.triangle.vertices[i][3] = 1;

            // UV.
            rasterizer.triangle.vertices[i][4] = rasterizer.mesh.uv[uv_pointer + 0];
            rasterizer.triangle.vertices[i][5] = rasterizer.mesh.uv[uv_pointer + 1];

            // Normal.
            // rasterizer.triangle.vertices[i][6] = rasterizer.mesh.normal[normal_pointer + 0];
            // rasterizer.triangle.vertices[i][7] = rasterizer.mesh.normal[normal_pointer + 1];
            // rasterizer.triangle.vertices[i][8] = rasterizer.mesh.normal[normal_pointer + 2];

            rasterizer.mesh_pointer += 3;
        }
    },

    shader: function(interp, one_over_w, depth, rasterizer)
    {
        var u = one_over_w * interp[2];
        var v = one_over_w * interp[3];

        rasterizer.sampler.sample(Textures.data, rasterizer.sampler, u, v, rasterizer.pixel_color);
    }
};

export default ProgramTexture;