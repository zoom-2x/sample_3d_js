import Common from 'common'
import MonkeyMesh from 'assets/meshes/monkey.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var MonkeyScene =
{
    model: {
        base_scale: 0.8,

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 0]
    },

    animation_speed: [Math.PI / 20000, Math.PI / 8000, Math.PI / 9000],

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.model = MonkeyScene.model;
        rasterizer.mesh = MonkeyMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.color = [233, 159, 105];
        rasterizer.program.light_intensity = 4;
        rasterizer.program.light_dir = Common.vec3_normalize([-1, -1, 0.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([60, 50, 45]);

        rasterizer.camera.eye = [0, -4, 0];
    },

    update: function(delta)
    {
        MonkeyScene.model.rotation[0] += delta * MonkeyScene.animation_speed[0];
        MonkeyScene.model.rotation[1] += delta * MonkeyScene.animation_speed[1];
        MonkeyScene.model.rotation[2] += delta * MonkeyScene.animation_speed[2];
    }
};

export default MonkeyScene;