import Common from 'common'
import HeadscanMesh from 'assets/meshes/headscan.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var HeadscanScene =
{
    model: {
        base_scale: 1.0,

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 0]
    },

    animation_speed: Math.PI / 10000,

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.texture = 4;
        rasterizer.set_flag(2);

        rasterizer.model = HeadscanScene.model;
        rasterizer.mesh = HeadscanMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.light_intensity = 3;
        rasterizer.program.light_dir = Common.vec3_normalize([1, -0.5, 2.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([60, 50, 45]);

        rasterizer.camera.eye = [0, -3, 0];
    },

    update: function(delta)
    {
        HeadscanScene.model.rotation[2] += delta * HeadscanScene.animation_speed;
    }
};

export default HeadscanScene;