import Common from 'common'
import AfricanHeadMesh from 'assets/meshes/african_head.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var AfricanHeadScene =
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

        rasterizer.texture = 2;
        rasterizer.set_flag(2);

        rasterizer.model = AfricanHeadScene.model;
        rasterizer.mesh = AfricanHeadMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.light_intensity = 5;
        // rasterizer.program.light_dir = Common.vec3_normalize([-1, -1, 0.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([60, 50, 45]);

        rasterizer.camera.eye = [0, -3, 0];
    },

    update: function(delta)
    {
        AfricanHeadScene.model.rotation[2] += delta * AfricanHeadScene.animation_speed;
    }
};

export default AfricanHeadScene;