import rc_enums from 'raycaster/rc_enums';
import rc_procs from 'raycaster/rc_procs';

import map from 'raycaster/assets/test_level/map.json'
import lightmaps from 'raycaster/assets/test_level/lightmaps.json'

var TestLevel = {
    init: function(RayCaster)
    {
        RayCaster.level = map;
        RayCaster.lightmaps = lightmaps;

        RayCaster.level.ceiling_floor_texture_scale[0] = 1.0 / RayCaster.level.ceiling_floor_texture_scale[0];
        RayCaster.level.ceiling_floor_texture_scale[1] = 1.0 / RayCaster.level.ceiling_floor_texture_scale[1];

        // RayCaster.level = rc_procs.create_level(5, 5, 2);

        // var block = rc_procs.get_block(RayCaster.level, 2, 2);

        // // rc_procs.block_set_type(block, rc_enums.BLOCK_HALFWALL_TOP, RayCaster.level.height);
        // rc_procs.block_set_type(block, rc_enums.BLOCK_HALFWALL_BOTTOM, RayCaster.level.height);

        // block.textures[rc_enums.TEX_LEFT] = 0;
        // block.textures[rc_enums.TEX_RIGHT] = 0;
        // block.textures[rc_enums.TEX_FRONT] = 0;
        // block.textures[rc_enums.TEX_BACK] = 0;
        // block.textures[rc_enums.TEX_TOP] = 1;
        // block.textures[rc_enums.TEX_BOTTOM] = 1;

        // block = rc_procs.get_block(RayCaster.level, 2, 3);
        // rc_procs.block_set_type(block, rc_enums.BLOCK_WALL, RayCaster.level.height);

        // block = rc_procs.get_block(RayCaster.level, 1, 3);
        // rc_procs.block_set_type(block, rc_enums.BLOCK_WALL, RayCaster.level.height);

        // block = rc_procs.get_block(RayCaster.level, 1, 4);
        // rc_procs.block_set_type(block, rc_enums.BLOCK_WALL, RayCaster.level.height);

        RayCaster.player.position[0] = 2.0;
        RayCaster.player.position[1] = 2.5;
        RayCaster.player.position[2] = 0.5;

        RayCaster.player.rotation = 45;
    },

    update: function(delta)
    {}
};

export default TestLevel;