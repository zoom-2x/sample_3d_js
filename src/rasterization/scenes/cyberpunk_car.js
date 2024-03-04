import Common from 'common'
import CyberpunkCarMesh from 'assets/meshes/cyberpunk_car.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var CyberpunkCarScene =
{
    model: {
        base_scale: 1.0,

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 40]
    },

    animation_speed: Math.PI / 10000,

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.texture = 3;
        rasterizer.set_flag(2);

        rasterizer.model = CyberpunkCarScene.model;
        rasterizer.mesh = CyberpunkCarMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.light_intensity = 10;
        rasterizer.program.light_dir = Common.vec3_normalize([1, -1.5, 0.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([79, 40, 63]);
        rasterizer.program.light_color = Common.color_255_to_one([133, 173, 222]);

        rasterizer.camera.eye = [0, -5.5, 1.5];
        rasterizer.camera.target = [0, 0, 0.4];
    },

    update: function(delta)
    {
        CyberpunkCarScene.model.rotation[2] += delta * CyberpunkCarScene.animation_speed;
    }
};

export default CyberpunkCarScene;