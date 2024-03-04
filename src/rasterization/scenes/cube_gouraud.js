import Common from 'common'
import CubeMesh from 'assets/meshes/cube.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var CubeGouraudScene =
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

        rasterizer.model = CubeGouraudScene.model;
        rasterizer.mesh = CubeMesh;
        rasterizer.program = ProgramGouraud;

        rasterizer.program.reset();

        rasterizer.program.light_intensity = 5;
        // rasterizer.program.light_dir = Common.vec3_normalize([-1, -1, 0.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([40, 50, 55]);

        rasterizer.camera.eye = [0, -5, 0];
    },

    update: function(delta)
    {
        CubeGouraudScene.model.rotation[0] += delta * CubeGouraudScene.animation_speed[0];
        CubeGouraudScene.model.rotation[1] += delta * CubeGouraudScene.animation_speed[1];
        CubeGouraudScene.model.rotation[2] += delta * CubeGouraudScene.animation_speed[2];
    }
};

export default CubeGouraudScene;