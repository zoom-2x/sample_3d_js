import Common from 'common'
import DiabloMesh from 'assets/meshes/diablo.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var DiabloScene =
{
    model: {
        base_scale: 0.5,

        position: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0]
    },

    animation_speed: Math.PI / 10000,

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.set_flag(2);
        rasterizer.texture = 6;

        rasterizer.model = DiabloScene.model;
        rasterizer.mesh = DiabloMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.light_intensity = 5;
        rasterizer.program.light_dir = Common.vec3_normalize([-0.2, -1.0, -0.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([60, 50, 45]);
        rasterizer.program.light_color = Common.color_255_to_one([244, 168, 111]);

        rasterizer.camera.eye = [0, -3, 0.5];
        rasterizer.camera.target = [0, 0, 0.1];
    },

    update: function(delta)
    {
        DiabloScene.model.rotation[2] += delta * DiabloScene.animation_speed;
    }
};

export default DiabloScene;