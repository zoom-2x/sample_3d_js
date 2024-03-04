import rc_enums from 'raycaster/rc_enums';
import rc_procs from 'raycaster/rc_procs';

import Common from 'common';
import map from 'raycaster/assets/world/map.json';
import lightmaps from 'raycaster/assets/world/lightmaps.json';

var WorldLevel =
{
    init: function(RayCaster)
    {
        RayCaster.level = map;
        RayCaster.lightmaps = lightmaps;

        RayCaster.level.ceiling_floor_texture_scale[0] = 1.0 / RayCaster.level.ceiling_floor_texture_scale[0];
        RayCaster.level.ceiling_floor_texture_scale[1] = 1.0 / RayCaster.level.ceiling_floor_texture_scale[1];

        var spawn_point = RayCaster.choose_spawn_point(map);
        var dir = Math.floor(Math.random() * RayCaster.rotations.length);

        // spawn_point[0] = 40;
        // spawn_point[1] = 2;
        // dir = 1;

        RayCaster.set_player_start(spawn_point, dir);

        // RayCaster.player.position[0] = spawn_point[0];
        // RayCaster.player.position[1] = spawn_point[1];
        // RayCaster.player.position[0] = 1.5;
        // RayCaster.player.position[1] = 4.5;
        // RayCaster.player.position[2] = 0.5;

        // RayCaster.player.tile[0] = Math.floor(RayCaster.player.position[1]);
        // RayCaster.player.tile[1] = Math.floor(RayCaster.player.position[0]);

        // RayCaster.player.rotation = -90;
        // RayCaster.player.tile_dir = 1;
    },

    update: function(delta)
    {}
};

export default WorldLevel;