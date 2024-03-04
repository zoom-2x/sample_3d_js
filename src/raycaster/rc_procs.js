import rc_enums from 'raycaster/rc_enums';

var rc_procs = {
    create_level: function(rows, cols, height)
    {
        var level =
        {
            rows: rows,
            cols: cols,
            height: height,
            half_height: 0.5,

            data: null,

            objects: [],
            lights: []
        };

        var index = 0;
        level.data = new Array(level.rows * level.cols);
        level.half_height = (level.height * 0.5) | 0;

        for (var row = 0; row < level.rows; ++row)
        {
            for (var col = 0; col < level.cols; ++col)
            {
                var block = rc_procs.create_block();

                block.high_z = level.height;
                level.data[index++] = block;
            }
        }

        return level;
    },

    create_block: function()
    {
        var block = {
            type: rc_enums.BLOCK_VOID,
            textures: [-1, -1, -1, -1, -1, -1],
            lightmaps: [-1, -1, -1, -1, -1, -1],
            low_z: 0,
            high_z: 1,
            object: null,
            flags: 0
        };

        return block;
    },

    block_set_type: function(block, type, level_height)
    {
        if (type == rc_enums.BLOCK_HALFWALL_TOP)
        {
            block.type = type;
            block.low_z = (level_height * 0.5) | 0;
            block.high_z = level_height;
        }
        else if (type == rc_enums.BLOCK_HALFWALL_BOTTOM)
        {
            block.type = type;
            block.low_z = 0;
            block.high_z = (level_height * 0.5) | 0;
        }
        else if (type == rc_enums.BLOCK_WALL)
        {
            block.type = type;
            block.low_z = 0;
            block.high_z = level_height;
        }
    },

    get_block: function(level, row, col)
    {
        if (col >= 0 && col < level.cols && row >= 0 && row < level.rows)
            return level.data[row * level.cols + col];

        return null;
    }
};

export default rc_procs;