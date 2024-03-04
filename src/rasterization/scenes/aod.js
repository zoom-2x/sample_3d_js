import Common from 'common'
import PlaneMesh from 'assets/meshes/plane.json'
import ProgramTexture from 'rasterization/programs/texture.js';

var AODScene =
{
    time: 0,
    scale_scaling: 1,

    model: {
        base_scale: 1.0,

        base_position: [0, 0, 0],
        base_rotation: [Common.deg2rad(-10), 0, Common.deg2rad(10)],

        position: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        rotation: [0, 0, 0]
    },

    animation_speed: Math.PI / 10000,

    init: function(rasterizer)
    {
        AODScene.rasterizer = rasterizer;

        rasterizer.reset_flags();
        rasterizer.reset_camera();

        rasterizer.texture = 7;

        rasterizer.model = AODScene.model;
        rasterizer.mesh = PlaneMesh;
        rasterizer.program = ProgramTexture;
        rasterizer.camera.eye = [0, -3, 0];
    },

    update: function(delta)
    {
        var offset_x = (Math.random() * 2 - 1) * 0.02;
        var offset_z = (Math.random() * 2 - 1) * 0.02;

        AODScene.model.position[0] = AODScene.model.base_position[0] + offset_x;
        AODScene.model.position[1] = AODScene.model.base_position[0];
        AODScene.model.position[2] = AODScene.model.base_position[2] + offset_z;

        AODScene.model.rotation[0] = AODScene.model.base_rotation[0] + offset_x * 0.5 * Math.PI;
        // AODScene.model.rotation[1] = AODScene.model.base_rotation[1] + offset_x * 0.05 * Math.PI;
        AODScene.model.rotation[2] = AODScene.model.base_rotation[2] + offset_z * 0.5 * Math.PI;

        var c = 0.07 * Math.sin(AODScene.time * Math.PI / 2000);

        AODScene.model.scale[0] = AODScene.scale_scaling * AODScene.model.base_scale + c;
        AODScene.model.scale[1] = AODScene.scale_scaling * AODScene.model.base_scale;
        AODScene.model.scale[2] = AODScene.scale_scaling * AODScene.model.base_scale + c;

        AODScene.time += delta;
    }
};

export default AODScene;