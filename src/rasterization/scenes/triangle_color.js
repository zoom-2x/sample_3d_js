import TriangleColorMesh from 'assets/meshes/triangle_color.json'
import ProgramColor from 'rasterization/programs/color.js';

var TriangleColorScene =
{
    model: {
        base_scale: 0.8,

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 0]
    },

    animation_speed: Math.PI / 5000,

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.unset_flag(1);

        rasterizer.model = TriangleColorScene.model;
        rasterizer.mesh = TriangleColorMesh;
        rasterizer.program = ProgramColor;

        rasterizer.camera.eye = [0, -4, 0];
    },

    update: function(delta)
    {
        TriangleColorScene.model.rotation[2] += delta * TriangleColorScene.animation_speed;
    }
};

export default TriangleColorScene;