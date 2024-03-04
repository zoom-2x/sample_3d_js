var ProgramColor =
{
    // color
    attrs: 3,

    reader: function(rasterizer)
    {
        for (var i = 0; i < 3; ++i)
        {
            var vertex_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 0] - 1) * 3;
            var color_pointer = (rasterizer.mesh.face[rasterizer.mesh_pointer + 1] - 1) * 3;

            // Position.
            rasterizer.triangle.vertices[i][0] = rasterizer.mesh.vertex[vertex_pointer + 0];
            rasterizer.triangle.vertices[i][1] = rasterizer.mesh.vertex[vertex_pointer + 1];
            rasterizer.triangle.vertices[i][2] = rasterizer.mesh.vertex[vertex_pointer + 2];
            rasterizer.triangle.vertices[i][3] = 1;

            // Color.
            rasterizer.triangle.vertices[i][4] = rasterizer.mesh.color[color_pointer + 0];
            rasterizer.triangle.vertices[i][5] = rasterizer.mesh.color[color_pointer + 1];
            rasterizer.triangle.vertices[i][6] = rasterizer.mesh.color[color_pointer + 2];

            rasterizer.mesh_pointer += 2;
        }
    },

    shader: function(interp, one_over_w, depth, rasterizer)
    {
        var r = one_over_w * interp[2];
        var g = one_over_w * interp[3];
        var b = one_over_w * interp[4];

        rasterizer.pixel_color[0] = r | 0;
        rasterizer.pixel_color[1] = g | 0;
        rasterizer.pixel_color[2] = b | 0;
    }
}

export default ProgramColor;