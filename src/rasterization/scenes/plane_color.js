import PlaneColorMesh from 'assets/meshes/plane_color.json'
import ProgramColor from 'rasterization/programs/color.js';

var PlaneColorScene =
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
        rasterizer.texture = 0;

        rasterizer.model = PlaneColorScene.model;
        rasterizer.mesh = PlaneColorMesh;
        rasterizer.program = ProgramColor;

        rasterizer.camera.eye = [0, -4, 0];
    },

    update: function(delta)
    {
        PlaneColorScene.model.rotation[2] += delta * PlaneColorScene.animation_speed;
    }
};

export default PlaneColorScene;