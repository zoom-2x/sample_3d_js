import PlaneMesh from 'assets/meshes/plane.json'
import ProgramTexture from 'rasterization/programs/texture.js';

var PlaneTextureScene =
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
        rasterizer.texture = 1;

        rasterizer.model = PlaneTextureScene.model;
        rasterizer.mesh = PlaneMesh;
        rasterizer.program = ProgramTexture;

        rasterizer.camera.eye = [0, -4, 0];
    },

    update: function(delta)
    {
        PlaneTextureScene.model.rotation[2] += delta * PlaneTextureScene.animation_speed;
    }
};

export default PlaneTextureScene;