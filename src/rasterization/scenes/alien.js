import Common from 'common'
import AlienMesh from 'assets/meshes/alien.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var AlienScene =
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

        rasterizer.texture = 5;
        rasterizer.set_flag(2);

        rasterizer.model = AlienScene.model;
        rasterizer.mesh = AlienMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.light_intensity = 5;
        rasterizer.program.light_dir = Common.vec3_normalize([0.2, -1.0, 3.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([61, 24, 24]);
        rasterizer.program.light_color = Common.color_255_to_one([176, 150, 205]);

        rasterizer.camera.eye = [0, -3, 0.7];
        rasterizer.camera.target = [0, 0, 0.4];
    },

    update: function(delta)
    {
        AlienScene.model.rotation[2] += delta * AlienScene.animation_speed;
    }
};

export default AlienScene;