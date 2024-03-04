import Common from 'common'
import TorusKnotMesh from 'assets/meshes/torus_knot.json'
import ProgramGouraud from 'rasterization/programs/gouraud.js';

var TorusKnotScene =
{
    model: {
        base_scale: 1.0,

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 0]
    },

    animation_speed: [Math.PI / 3000, Math.PI / 10000, 0],

    init: function(rasterizer)
    {
        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.model = TorusKnotScene.model;
        rasterizer.mesh = TorusKnotMesh;

        rasterizer.program = ProgramGouraud;
        rasterizer.program.reset();
        rasterizer.program.color = [45, 146, 206];
        rasterizer.program.light_intensity = 2;
        rasterizer.program.light_dir = Common.vec3_normalize([1, -1, 0.5]);
        rasterizer.program.light_dir.ambient = Common.color_255_to_one([60, 50, 45]);
        rasterizer.program.light_color = Common.color_255_to_one([255, 200, 210]);

        rasterizer.camera.eye = [0, -3, 0];
        rasterizer.camera.target = [0, 0, 0];
    },

    update: function(delta)
    {
        TorusKnotScene.model.rotation[0] += delta * TorusKnotScene.animation_speed[0];
        TorusKnotScene.model.rotation[1] += delta * TorusKnotScene.animation_speed[1];
        // TorusKnotScene.model.rotation[2] += delta * TorusKnotScene.animation_speed[2];
    }
};

export default TorusKnotScene;