import CubeMesh from 'assets/meshes/cube.json'
import ProgramTexture from 'rasterization/programs/texture.js';

var CubeTextureScene =
{
    model: {
        base_scale: 0.8,

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 0]
    },

    animation_speed: [Math.PI / 5000, Math.PI / 7000, Math.PI / 20000],

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.texture = 1;

        rasterizer.model = CubeTextureScene.model;
        rasterizer.mesh = CubeMesh;

        rasterizer.program = ProgramTexture;
        rasterizer.camera.eye = [0, -5, 0];
    },

    update: function(delta)
    {
        CubeTextureScene.model.rotation[0] += delta * CubeTextureScene.animation_speed[0];
        CubeTextureScene.model.rotation[1] += delta * CubeTextureScene.animation_speed[1];
        CubeTextureScene.model.rotation[2] += delta * CubeTextureScene.animation_speed[2];
    }
};

export default CubeTextureScene;