import rc_enums from "raycaster/rc_enums";
import Textures from "assets/textures/raycaster.json";

var screen_console = document.getElementById('console');
var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');
var $editor_panel = $('#editor-panel');

var light_index = 1;

var Editor =
{
    WIDTH: 0,
    HEIGHT: 0,

    map_size: 0,
    map_width: 0,
    map_height: 0,
    grid_size: 40,
    grid_size_inv: 0,

    screen_offset_x: 50,
    screen_offset_y: 50,

    debug_ms: 0,
    prev_timestamp: 0,

    map_point: [0, 0],
    map_coordinates: [0, 0],
    over_tile: [-1, -1],
    over_light: null,
    selected_tile: -1,
    selected_brush: 'brush_cursor',
    selected_light: null,
    paint_mode: false,
    move_mode: false,
    light_brush_radius: 5,
    map_space_light_brush_radius: 0,

    light_list: null,

    map: {
        name: "Test name",
        rows: 10,
        cols: 10,
        height: 1,
        half_height: 0,
        floor_texture: -1,
        ceiling_texture: -1,
        ceiling_floor_texture_scale: [1, 1],
        wall_u_offset: 0,
        wall_v_offset: 0,
        ambient_color: [30, 30, 30],
        data: [],
        lights: [],
        objects: []
    }
};

update_map();
clear_map();
update_ui();

var $brush_wall_properties = $('#brush_wall_properties');
var $brush_light_properties = $('#brush_light_properties');
var $brush_empty_properties = $('#brush_empty_properties');

// ----------------------------------------------------------------------------------
// -- Brush wall properties.
// ----------------------------------------------------------------------------------

var wall_brush =
{
    $wall_texture: $brush_wall_properties.find('select#wall_texture'),
    $flag_mirror: $brush_wall_properties.find('#flag_mirror'),
    $u_offset: $brush_wall_properties.find('#u_offset'),
    $v_offset: $brush_wall_properties.find('#v_offset'),

    open: function() {
        $brush_wall_properties.css('display', 'block');
    },

    close: function() {
        $brush_wall_properties.css('display', 'none');
    },

    get_texture: function() {
        return parseInt(this.$wall_texture.val());
    },

    get_u_offset: function() {
        return parseFloat(this.$u_offset.val());
    },

    get_v_offset: function() {
        return parseFloat(this.$v_offset.val());
    },

    set_texture: function(id) {
        this.$wall_texture.val(id);
    },

    is_mirror: function() {
        return this.$flag_mirror.is(':checked');
    },

    set_mirror: function(v)
    {
        if (v)
            this.$flag_mirror.prop('checked', 'checked');
        else
            this.$flag_mirror.prop('checked', false);
    },

    set_u_offset: function(v) {
        this.$u_offset.val(v);
    },

    set_v_offset: function(v) {
        this.$v_offset.val(v);
    }
};

wall_brush.$wall_texture.on('change', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile >= 0)
    {
        var tile = Editor.map.data[Editor.selected_tile];

        for (var i = 0; i < 6; ++i) {
            tile.textures[i] = parseInt($target.val());
        }
    }
});

wall_brush.$flag_mirror.on('click', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile >= 0)
    {
        var tile = Editor.map.data[Editor.selected_tile];
        tile_unset_flag(tile, rc_enums.FLAG_MIRROR);

        if ($target.is(':checked'))
            tile_set_flag(tile, rc_enums.FLAG_MIRROR);
    }
});

wall_brush.$u_offset.on('change', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile >= 0)
    {
        var tile = Editor.map.data[Editor.selected_tile];
        tile.u_offset = parseFloat($target.val());
        tile.u_offset = tile.u_offset || 0;
    }
});

wall_brush.$v_offset.on('change', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile >= 0)
    {
        var tile = Editor.map.data[Editor.selected_tile];
        tile.v_offset = parseFloat($target.val());
        tile.v_offset = tile.v_offset || 0;
    }
});

// ----------------------------------------------------------------------------------

$('select#map_ceiling_texture').append('<option value="-1">(Select a texture)</option>');
$('select#map_floor_texture').append('<option value="-1">(Select a texture)</option>');
$('#brush_wall_properties select').append('<option value="-1">(Select a texture)</option>');
$('select#empty_ceiling_texture').append('<option value="-1">(Select a texture)</option>');
$('select#empty_floor_texture').append('<option value="-1">(Select a texture)</option>');

for (var i = 0; i < Textures.name.length; ++i)
{
    $('select#map_ceiling_texture').append('<option value="'+ i +'">'+ Textures.name[i] +'</option>');
    $('select#map_floor_texture').append('<option value="'+ i +'">'+ Textures.name[i] +'</option>');
    $('#brush_wall_properties select').append('<option value="'+ i +'">'+ Textures.name[i] +'</option>');
    $('select#empty_ceiling_texture').append('<option value="'+ i +'">'+ Textures.name[i] +'</option>');
    $('select#empty_floor_texture').append('<option value="'+ i +'">'+ Textures.name[i] +'</option>');
}

function tile_has_flag(tile, flag) {
    return (tile.flags & flag) > 0;
}

function tile_set_flag(tile, flag) {
    tile.flags |= flag;
};

function tile_unset_flag(tile, flag) {
    tile.flags &= ~flag;
};

function update_ui()
{
    $editor_panel.find('#map_name').val(Editor.map.name);
    $editor_panel.find('#map_height').val(Editor.map.height);
    $editor_panel.find('#map_rows').val(Editor.map.rows);
    $editor_panel.find('#map_cols').val(Editor.map.cols);
    $editor_panel.find('#brush_selector input[id="'+ Editor.selected_brush +'"]').attr('checked', 'checked');
    $editor_panel.find('select#map_ceiling_texture').val(Editor.map.ceiling_texture);
    $editor_panel.find('select#map_floor_texture').val(Editor.map.floor_texture);
    $editor_panel.find('#ambient_color_r').val(Editor.map.ambient_color[0]);
    $editor_panel.find('#ambient_color_g').val(Editor.map.ambient_color[1]);
    $editor_panel.find('#ambient_color_b').val(Editor.map.ambient_color[2]);
    $editor_panel.find('#map_u_offset').val(Editor.map.wall_u_offset);
    $editor_panel.find('#map_v_offset').val(Editor.map.wall_v_offset);
}

function update_map()
{
    Editor.map_size = Editor.map.rows * Editor.map.cols;
    Editor.grid_size_inv = 1.0 / Editor.grid_size;
    Editor.map_width = Editor.map.cols * Editor.grid_size;
    Editor.map_height = Editor.map.rows * Editor.grid_size;

    Editor.WIDTH = Editor.map.cols * Editor.grid_size + 2 * Editor.screen_offset_x;
    Editor.HEIGHT = Editor.map.rows * Editor.grid_size + 2 * Editor.screen_offset_y;

    screen.width = Editor.WIDTH;
    screen.height = Editor.HEIGHT;
    Editor.map_space_light_brush_radius = Editor.light_brush_radius * Editor.map.cols / Editor.map_width;
    Editor.map_space_light_brush_radius2 = Editor.map_space_light_brush_radius * Editor.map_space_light_brush_radius;

    Editor.light_list = new Array(Editor.map_size);

    for (var i = 0; i < Editor.map_size; ++i)
    {
        Editor.light_list[i] = {
            head: null,
            tail: null
        };
    }
}

function push_light_node_blank(x, y)
{
    var red = parseInt($brush_light_properties.find('#light_color_r').val());
    var green = parseInt($brush_light_properties.find('#light_color_g').val());
    var blue = parseInt($brush_light_properties.find('#light_color_b').val());
    var radius = parseFloat($brush_light_properties.find('#light_radius').val());
    var intensity = parseFloat($brush_light_properties.find('#light_intensity').val());
    var z = parseFloat($brush_light_properties.find('#light_z').val());

    var row = Math.floor(y);
    var col = Math.floor(x);
    var index = tile_index(row, col);

    if (index >= 0 && index < Editor.map_size)
    {
        var node = {
            prev: null,
            next: null,
            index: index,
            value: {
                id: light_index++,
                disabled: false,
                position: [x, y, z],
                intensity: intensity,
                radius: radius,
                color: [red, green, blue]
            }
        };

        ll_insert(Editor.light_list[index], node);
    }
}

function push_light_node(light)
{
    var row = Math.floor(light.position[1]);
    var col = Math.floor(light.position[0]);
    var index = tile_index(row, col);

    if (index >= 0 && index < Editor.map_size)
    {
        var node = {
            prev: null,
            next: null,
            index: index,
            value: light
        };

        ll_insert(Editor.light_list[index], node);
    }
}

function delete_selected_light()
{
    if (Editor.selected_light)
    {
        var list = Editor.light_list[Editor.selected_light.index];
        ll_remove(list, Editor.selected_light);
        Editor.selected_light = null;
    }
}

function ll_insert(list, node)
{
    if (!list.head)
    {
        list.head = node;
        list.tail = node;
        node.prev = null;
        node.next = null
    }
    else
    {
        node.prev = list.tail;
        list.tail.next = node;
        list.tail = node;
        node.next = null;
    }
}

function ll_remove(list, node)
{
    if (!node.prev)
    {
        if (!node.next)
        {
            list.head = null;
            list.tail = node.next;
        }
        else
        {
            list.head = node.next;
            node.next.prev = null;
        }
    }
    else if (!node.next)
    {
        node.prev.next = null;
        list.tail = node.prev;
    }
    else
    {
        var prev_node = node.prev;
        var next_node = node.next;

        prev_node.next = next_node;
        next_node.prev = prev_node;
    }

    node.prev = null;
    node.next = null;
}

function move_light_node(node)
{
    var row = Math.floor(node.value.position[1]);
    var col = Math.floor(node.value.position[0]);
    var index = tile_index(row, col);

    if (index >= 0 && index < Editor.map_size)
    {
        if (index != node.index)
        {
            // Switched quadrant.
            if (node.index > -1)
            {
                var current_list = Editor.light_list[node.index];
                var destination_list = Editor.light_list[index];

                ll_remove(current_list, node);
                ll_insert(destination_list, node);

                node.index = index;
            }
            // New light.
            else
            {
                node.index = index;
                var list = Editor.light_list[index];

                ll_insert(list);
            }
        }
    }
}

function clear_map()
{
    Editor.map.data.length = 0;

    for (var row = 0; row < Editor.map.rows; ++row)
    {
        for (var col = 0; col < Editor.map.cols; ++col)
        {
            Editor.map.data.push(
            {
                type: rc_enums.BLOCK_VOID,
                row: row,
                col: col,
                textures: [-1, -1, -1, -1, -1, -1],
                lightmaps: [-1, -1, -1, -1, -1, -1],
                low_z: 0,
                high_z: 1,
                flags: rc_enums.FLAG_MIRROR,
                ceiling_lightmap: -1,
                floor_lightmap: -1
            });
        }
    }

    Editor.light_list = new Array(Editor.map_size);

    for (var i = 0; i < Editor.map_size; ++i)
    {
        Editor.light_list[i] = {
            head: null,
            tail: null
        };
    }
}

function valid_tile(row, col) {
    return col >= 0 && col < Editor.map.cols && row >= 0 && row < Editor.map.rows;
}

function tile_index(row, col) {
    return row * Editor.map.rows + col;
}

function get_tile(row, col) {
    return Editor.map.data[tile_index(row, col)];
}

function draw_brush_clear(ctx, x, y)
{
    ctx.save();
    ctx.font = "18px bold Tahoma";
    ctx.strokeStyle = 'rgb(210, 134, 134)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, Editor.grid_size, Editor.grid_size);
    ctx.fillStyle = 'rgb(210, 134, 134)';
    ctx.fillText('C', x - 6 + Editor.grid_size * 0.5, y + 6 + Editor.grid_size * 0.5);
    ctx.restore();
}

function draw_brush_empty(ctx, x, y, spawn_point)
{
    ctx.save();
    ctx.font = "18px bold Tahoma";
    ctx.strokeStyle = 'rgb(200, 219, 219)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, Editor.grid_size, Editor.grid_size);
    // ctx.strokeRect(x + 6, y + 6, Editor.grid_size - 12, Editor.grid_size - 12);
    ctx.fillStyle = 'rgb(200, 219, 219)';
    ctx.fillText('E', x - 6 + Editor.grid_size * 0.5, y + 6 + Editor.grid_size * 0.5);

    if (spawn_point)
    {
        ctx.fillStyle = 'rgb(48, 163, 68)';
        ctx.fillRect(x + 4, y + 4, 8, 8);
    }

    ctx.restore();
}

function draw_brush_wall(ctx, x, y)
{
    ctx.save();
    ctx.font = "18px bold Tahoma";
    ctx.strokeStyle = 'rgb(133, 176, 211)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, Editor.grid_size, Editor.grid_size);
    ctx.strokeRect(x + 6, y + 6, Editor.grid_size - 12, Editor.grid_size - 12);
    ctx.fillStyle = 'rgb(133, 176, 211)';
    ctx.fillText('B', x - 6 + Editor.grid_size * 0.5, y + 6 + Editor.grid_size * 0.5);
    ctx.restore();
}

function draw_brush_light(ctx, x, y, radius, width)
{
    ctx.save();
    ctx.lineWidth = width;
    ctx.strokeStyle = 'rgb(152, 70, 35)';
    ctx.fillStyle = 'rgb(235, 221, 167)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function draw_grid(ctx)
{
    var width_px = Editor.map.cols * Editor.grid_size;
    var height_px = Editor.map.rows * Editor.grid_size;

    var sx = Editor.screen_offset_x;
    var sy = Editor.HEIGHT - Editor.screen_offset_y;

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#999';
    ctx.lineJoin = 'miter';
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - height_px);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx + width_px, sy);
    ctx.lineTo(sx + width_px, sy - height_px);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + width_px, sy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx, sy - height_px);
    ctx.lineTo(sx + width_px, sy - height_px);
    ctx.stroke();

    ctx.font = "14px Tahoma";
    ctx.fillStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ccc';
    ctx.setLineDash([2]);
    sx = Editor.screen_offset_x + Editor.grid_size;

    for (var x = 1; x < Editor.map.cols; ++x)
    {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - height_px);
        ctx.stroke();

        sx += Editor.grid_size;
    }

    sx = Editor.screen_offset_x;
    sy = Editor.HEIGHT - Editor.screen_offset_y - Editor.grid_size;

    for (var y = 1; y < Editor.map.rows; ++y)
    {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + width_px, sy);
        ctx.stroke();

        sy -= Editor.grid_size;
    }

    sx = Editor.screen_offset_x;
    sy = Editor.screen_offset_y;

    for (var x = 0; x < Editor.map.cols; ++x)
    {
        ctx.fillText(x, sx + 18, sy - 14);
        sx += Editor.grid_size;
    }

    sx = Editor.screen_offset_x;

    for (var y = 0; y < Editor.map.rows; ++y)
    {
        ctx.fillText(Editor.map.rows - y - 1, sx - 24, sy + 24);
        sy += Editor.grid_size;
    }

    ctx.restore();
}

function draw_map(ctx)
{
    var map_point = [0, 0];

    ctx.save();

    for (var row = 0; row < Editor.map.rows; ++row)
    {
        for (var col = 0; col < Editor.map.cols; ++col)
        {
            var index = tile_index(row, col);
            var coordinates = tile_coordinates(row, col);
            var tile = Editor.map.data[index];

            if (tile.type == rc_enums.BLOCK_EMPTY)
                draw_brush_empty(ctx, coordinates[0], coordinates[1], tile_has_flag(tile, rc_enums.FLAG_SPAWN_POINT));
        }
    }

    for (var row = 0; row < Editor.map.rows; ++row)
    {
        for (var col = 0; col < Editor.map.cols; ++col)
        {
            var index = tile_index(row, col);
            var coordinates = tile_coordinates(row, col);
            var tile = Editor.map.data[index];

            if (tile.type == rc_enums.BLOCK_WALL)
                draw_brush_wall(ctx, coordinates[0], coordinates[1]);
        }
    }

    if (Editor.selected_tile > -1)
    {
        var tile = Editor.map.data[Editor.selected_tile];
        var coordinates = tile_coordinates(tile.row, tile.col);

        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgb(48, 163, 68)';
        ctx.strokeRect(coordinates[0], coordinates[1], Editor.grid_size, Editor.grid_size);
        ctx.restore();
    }

    ctx.restore();
}

function draw_lights(ctx)
{
    for (var i = 0; i < Editor.map_size; ++i)
    {
        var node = Editor.light_list[i];
        node = node.head;

        while (node)
        {
            var coordinates = map_to_screen_space(node.value.position[0], node.value.position[1]);
            draw_brush_light(ctx, coordinates[0], coordinates[1], Editor.light_brush_radius, 2);

            node = node.next;
        }
    }

    if (Editor.over_light)
    {
        var coordinates = map_to_screen_space(Editor.over_light.value.position[0], Editor.over_light.value.position[1]);
        draw_brush_light(ctx, coordinates[0], coordinates[1], Editor.light_brush_radius + 2, 4);
    }
    else if (Editor.selected_light)
    {
        var coordinates = map_to_screen_space(Editor.selected_light.value.position[0], Editor.selected_light.value.position[1]);
        draw_brush_light(ctx, coordinates[0], coordinates[1], Editor.light_brush_radius + 2, 4);
    }
}

function draw_cursor(ctx)
{
    if (valid_tile(Editor.over_tile[0], Editor.over_tile[1]))
    {
        var coordinates = tile_coordinates(Editor.over_tile[0], Editor.over_tile[1]);

        if (Editor.selected_brush != 'brush_cursor')
        {
            if (Editor.selected_brush == 'brush_clear')
                draw_brush_clear(ctx, coordinates[0], coordinates[1]);
            else if (Editor.selected_brush == 'brush_empty')
                draw_brush_empty(ctx, coordinates[0], coordinates[1]);
            else if (Editor.selected_brush == 'brush_wall')
                draw_brush_wall(ctx, coordinates[0], coordinates[1]);
            else if (Editor.selected_brush == 'brush_light')
                draw_brush_light(ctx, Editor.map_coordinates[0], Editor.map_coordinates[1]);
        }
        else
        {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#555';
            ctx.strokeRect(coordinates[0], coordinates[1], Editor.grid_size, Editor.grid_size);
            ctx.restore();
        }
    }
}

function set_tile(row, col)
{
    if (valid_tile(row, col))
    {
        var index = tile_index(row, col);
        var tile = Editor.map.data[index];

        if (Editor.selected_brush == 'brush_clear')
        {
            tile.type = rc_enums.BLOCK_VOID;
            tile.row = row;
            tile.col = col;
            tile.textures = [-1, -1, -1, -1, -1, -1];
            tile.lightmaps = [-1, -1, -1, -1, -1, -1];
            tile.low_z = 0;
            tile.high_z = Editor.map.height;
            tile.flags = rc_enums.FLAG_MIRROR;
            tile.ceiling_lightmap = -1;
            tile.floor_lightmap = -1;
            tile.u_offset = 0;
            tile.v_offset = 0;
        }

        else if (Editor.selected_brush == 'brush_empty')
        {
            var ceiling_texture_id = parseInt($('select#empty_ceiling_texture').val());
            var floor_texture_id = parseInt($('select#empty_floor_texture').val());

            tile.type = rc_enums.BLOCK_EMPTY;
            tile.row = row;
            tile.col = col;
            tile.textures = [-1, -1, -1, -1, ceiling_texture_id, floor_texture_id];
            tile.lightmaps = [-1, -1, -1, -1, -1, -1];
            tile.low_z = 0;
            tile.high_z = Editor.map.height;
            tile.flags = rc_enums.FLAG_MIRROR;
            tile.ceiling_lightmap = -1;
            tile.floor_lightmap = -1;
            tile.u_offset = 0;
            tile.v_offset = 0;

            if ($('#spawn_point').is(':checked'))
                tile_set_flag(tile, rc_enums.FLAG_SPAWN_POINT);
        }

        else if (Editor.selected_brush == 'brush_wall')
        {
            var texture_id = wall_brush.get_texture();
            var flags = 0;

            if (wall_brush.is_mirror())
                flags |= rc_enums.FLAG_MIRROR;

            tile.type = rc_enums.BLOCK_WALL;
            tile.row = row;
            tile.col = col;
            tile.textures = [texture_id, texture_id, texture_id, texture_id, texture_id, texture_id];
            tile.lightmaps = [-1, -1, -1, -1, -1, -1];
            tile.low_z = 0;
            tile.high_z = Editor.map.height;
            tile.flags = flags;
            tile.ceiling_lightmap = -1;
            tile.floor_lightmap = -1;
            tile.u_offset = 0;
            tile.v_offset = 0;
        }
    }
}

function save_map()
{
    Editor.map.ceiling_texture = parseInt($('select#map_ceiling_texture').val());
    Editor.map.floor_texture = parseInt($('select#map_floor_texture').val());

    Editor.map.lights.length = 0;

    for (var i = 0; i < Editor.map_size; ++i)
    {
        var list = Editor.light_list[i];
        var node = list.head;

        while (node)
        {
            node.value.color[0] = parseInt(node.value.color[0]);
            node.value.color[1] = parseInt(node.value.color[1]);
            node.value.color[2] = parseInt(node.value.color[2]);

            node.value.position[0] = parseFloat(node.value.position[0]);
            node.value.position[1] = parseFloat(node.value.position[1]);
            node.value.position[2] = parseFloat(node.value.position[2]);

            node.value.radius = parseFloat(node.value.radius);
            node.value.intensity = parseFloat(node.value.intensity);
            node.value.intensity = parseFloat(node.value.intensity);

            Editor.map.lights.push(node.value);
            node = node.next;
        }
    }

    return JSON.stringify(Editor.map);
}

function load_map(json)
{
    Editor.map = JSON.parse(json);

    if (!Editor.map.hasOwnProperty('ambient_color'))
        Editor.map.ambient_color = [30, 30, 30];

    if (!Editor.map.hasOwnProperty('wall_u_offset'))
        Editor.map.wall_u_offset = 0;
    else
        Editor.map.wall_u_offset = parseFloat(Editor.map.wall_u_offset);

    if (!Editor.map.hasOwnProperty('wall_v_offset'))
        Editor.map.wall_v_offset = 0;
    else
        Editor.map.wall_v_offset = parseFloat(Editor.map.wall_v_offset);

    update_map();
    update_ui();

    for (var i = 0; i < Editor.map_size; ++i)
    {
        var tile = Editor.map.data[i];

        tile.u_offset = parseFloat(tile.u_offset ? tile.u_offset : 0);
        tile.v_offset = parseFloat(tile.v_offset ? tile.v_offset : 0);
    }

    var max_id = 0;

    for (var i = 0; i < Editor.map.lights.length; ++i)
    {
        var light = Editor.map.lights[i];

        if (light.id > max_id)
            max_id = light.id;

        push_light_node(light);
    }

    light_index = max_id + 1;
    Editor.map.lights = [];
}

function get_screen_point(screen, event)
{
    var rect = screen.getBoundingClientRect();
    var point = [0, 0];

    point[0] = Math.floor(event.clientX - rect.left);
    point[1] = Math.floor(event.clientY - rect.top);

    return point;
}

function screen_to_map_space(x, y)
{
    var res = [
        (x - Editor.screen_offset_x) * Editor.grid_size_inv,
        (Editor.HEIGHT - y - Editor.screen_offset_y) * Editor.grid_size_inv
    ];

    return res;
}

function map_to_screen_space(x, y)
{
    var res = [
        x * Editor.grid_size + Editor.screen_offset_x,
        Editor.HEIGHT - y * Editor.grid_size - Editor.screen_offset_y
    ];

    return res;
}

function screen_to_tile(x, y)
{
    var tile = screen_to_map_space(x, y);

    var t = tile[0];
    tile[0] = Math.floor(tile[1]);
    tile[1] = Math.floor(t);

    return tile;
}

function tile_coordinates(row, col)
{
    var coordinates = map_to_screen_space(col, row);
    coordinates[1] -= Editor.grid_size;

    return coordinates;
}

function mouse_over_light(map_point)
{
    var row = Math.floor(map_point[1]);
    var col = Math.floor(map_point[0]);
    var index = tile_index(row, col);

    if (index >= 0 && index < Editor.map_size)
    {
        var node = Editor.light_list[index].head;

        while (node)
        {
            var t1 = map_point[0] - node.value.position[0];
            var t2 = map_point[1] - node.value.position[1];

            var check = t1 * t1 + t2 * t2;

            Editor.over_light = null;

            if (check <= Editor.map_space_light_brush_radius2)
            {
                Editor.over_light = node;
                return true;
            }

            if (node.next)
                node = node.next;
            else
                break;
        }
    }

    return false;
}

function close_properties()
{
    wall_brush.close();
    $brush_light_properties.css('display', 'none');
    $brush_empty_properties.css('display', 'none');
}

function open_brush_empty_properties(tile)
{
    close_properties();

    if (!tile)
    {
        $brush_empty_properties.css('display', 'block');
        $('#brush_empty_properties input').prop('checked', false);
        $('select#empty_ceiling_texture').val(-1);
        $('select#empty_floor_texture').val(-1);
    }
    else
    {
        if (tile.type == rc_enums.BLOCK_EMPTY)
        {
            var ceiling_texture_index = tile.textures[rc_enums.FACE_TOP];
            var floor_texture_index = tile.textures[rc_enums.FACE_BOTTOM];

            $brush_empty_properties.css('display', 'block');
            $('#brush_empty_properties input').prop('checked', tile_has_flag(tile, rc_enums.FLAG_SPAWN_POINT) ? 'checked' : false);
            $('select#empty_ceiling_texture').val(ceiling_texture_index);
            $('select#empty_floor_texture').val(floor_texture_index);
        }
    }
}

function open_brush_wall_properties(tile)
{
    close_properties();

    if (!tile)
    {
        wall_brush.open();
        wall_brush.set_texture(-1);
        wall_brush.set_mirror(true);
        wall_brush.set_u_offset(0);
        wall_brush.set_v_offset(0);
    }
    else
    {
        if (tile.type == rc_enums.BLOCK_WALL)
        {
            var texture_index = tile.textures[0];

            if (!tile.hasOwnProperty('u_offset'))
                tile.u_offset = 0;

            if (!tile.hasOwnProperty('v_offset'))
                tile.v_offset = 0;

            wall_brush.open();
            wall_brush.set_texture(texture_index);
            wall_brush.set_mirror(tile_has_flag(tile, rc_enums.FLAG_MIRROR));
            wall_brush.set_u_offset(tile.u_offset || 0);
            wall_brush.set_v_offset(tile.v_offset || 0);
        }
    }
}

function change_map_height(height)
{
    Editor.map.height = height;
    Editor.map.half_height = Editor.map.height * 0.5;

    for (var i = 0; i < Editor.map.data.length; ++i)
    {
        var tile = Editor.map.data[i];

        if (tile.type == rc_enums.BLOCK_EMPTY || tile.type == rc_enums.BLOCK_WALL) {
            tile.high_z = Editor.map.height;
        }
    }
}

function color_to_hex(color) {
    return color[0].toString(16) + color[1].toString(16) + color[2].toString(16);
}

$brush_empty_properties.on('change', '#spawn_point', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile > -1)
    {
        var tile = Editor.map.data[Editor.selected_tile];

        if ($target.is(':checked'))
            tile_set_flag(tile, rc_enums.FLAG_SPAWN_POINT);
        else
            tile_unset_flag(tile, rc_enums.FLAG_SPAWN_POINT);
    }
});

function open_brush_light_properties(light)
{
    close_properties();

    if (!light)
    {
        $brush_light_properties.css('display', 'block');
        $brush_light_properties.find('#light_id').text('Id:');
        $brush_light_properties.find('#light_color_r').val(255);
        $brush_light_properties.find('#light_color_g').val(255);
        $brush_light_properties.find('#light_color_b').val(255);
        $brush_light_properties.find('#light_radius').val(3);
        $brush_light_properties.find('#light_intensity').val(1);
        $brush_light_properties.find('#light_z').val(0.5);
    }
    else
    {
        $brush_light_properties.css('display', 'block');
        $brush_light_properties.find('#light_id').text('Id: ' + light.id);
        $brush_light_properties.find('#light_color_r').val(light.color[0]);
        $brush_light_properties.find('#light_color_g').val(light.color[1]);
        $brush_light_properties.find('#light_color_b').val(light.color[2]);
        $brush_light_properties.find('#light_radius').val(light.radius);
        $brush_light_properties.find('#light_intensity').val(light.intensity);
        $brush_light_properties.find('#light_z').val(light.position[2]);
    }
}

$('#map_name').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.name = $target.val();
});

$brush_light_properties.on('change', '#light_color_r', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_light)
        Editor.selected_light.value.color[0] = parseInt($target.val());
});

$brush_light_properties.on('change', '#light_color_g', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_light)
        Editor.selected_light.value.color[1] = parseInt($target.val());
});

$brush_light_properties.on('change', '#light_color_b', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_light)
        Editor.selected_light.value.color[2] = parseInt($target.val());
});

$brush_light_properties.on('change', '#light_radius', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_light)
        Editor.selected_light.value.radius = parseFloat($target.val());
});

$brush_light_properties.on('change', '#light_intensity', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_light)
        Editor.selected_light.value.intensity = parseFloat($target.val());
});

$brush_light_properties.on('change', '#light_z', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_light)
        Editor.selected_light.value.position[2] = parseFloat($target.val());
});

$editor_panel.on('click', '#brush_selector input', function(e)
{
    var $target = $(e.target);
    Editor.selected_brush = $target.attr('id');

    close_properties();

    if (Editor.selected_brush != 'brush_cursor')
        Editor.selected_tile = -1;

    if (Editor.selected_brush == 'brush_empty')
        open_brush_empty_properties();
    else if (Editor.selected_brush == 'brush_wall')
        open_brush_wall_properties();
    else if (Editor.selected_brush == 'brush_light')
        open_brush_light_properties();
});

$('#save_map_button').click(function(e)
{
    var json = save_map();
    $('#save_modal_content textarea').val(json);
});

const myModalEl = document.getElementById('load_map_modal')
myModalEl.addEventListener('hidden.bs.modal', function(e)
{
    var json = $('#load_map_modal textarea').val();
    load_map(json);
})

screen.addEventListener('mousedown', function(event)
{
    if (Editor.selected_brush == 'brush_clear' ||
        Editor.selected_brush == 'brush_empty' ||
        Editor.selected_brush == 'brush_wall')
        Editor.paint_mode = true;

    if (Editor.selected_light)
        Editor.move_mode = true;
});

screen.addEventListener('mouseup', function(event)
{
    Editor.paint_mode = false;
    Editor.move_mode = false;
});

var $delete_light_button = $('#delete_light_button');

$delete_light_button.on('click', function(e)
{
    delete_selected_light();
    $delete_light_button.css('display', 'none');
    close_properties();
});

screen.addEventListener('click', function(event)
{
    var screen_point = get_screen_point(screen, event);
    var tile = screen_to_tile(screen_point[0], screen_point[1]);

    Editor.selected_tile = -1;
    Editor.selected_light = null;

    $delete_light_button.css('display', 'none');

    if (Editor.selected_brush == 'brush_cursor')
    {
        if (Editor.over_light)
        {
            Editor.selected_light = Editor.over_light;
            open_brush_light_properties(Editor.selected_light.value);
            $delete_light_button.css('display', 'block');
        }
        else
        {
            $brush_empty_properties.css('display', 'none');
            $('#brush_wall_properties').css('display', 'none');
            $brush_light_properties.css('display', 'none');

            if (valid_tile(tile[0], tile[1]))
            {
                var index = tile_index(tile[0], tile[1]);
                var tile = Editor.map.data[index];

                if (tile.type != rc_enums.BLOCK_VOID)
                {
                    Editor.selected_tile = index;

                    if (tile.type == rc_enums.BLOCK_EMPTY)
                        open_brush_empty_properties(tile);

                    else if (tile.type == rc_enums.BLOCK_WALL)
                        open_brush_wall_properties(tile);
                }
            }
        }
    }
    else if (Editor.selected_brush == 'brush_light')
    {
        var map_point = screen_to_map_space(screen_point[0], screen_point[1]);

        var row = Math.floor(map_point[1]);
        var col = Math.floor(map_point[0]);

        var tile = get_tile(row, col);

        if (valid_tile(row, col) && tile.type == rc_enums.BLOCK_EMPTY)
            push_light_node_blank(map_point[0], map_point[1]);
    }
    else
        set_tile(tile[0], tile[1]);
});

screen.addEventListener('mousemove', function(event)
{
    var sp = get_screen_point(screen, event);

    var map_point = screen_to_map_space(sp[0], sp[1]);
    var screen_point = map_to_screen_space(map_point[0], map_point[1]);
    var is_over_light = mouse_over_light(map_point);
    var tile = screen_to_tile(sp[0], sp[1]);

    Editor.map_coordinates[0] = sp[0];
    Editor.map_coordinates[1] = sp[1];

    Editor.over_tile[0] = tile[0];
    Editor.over_tile[1] = tile[1];

    if (Editor.move_mode && Editor.selected_light)
    {
        Editor.selected_light.value.position[0] = map_point[0];
        Editor.selected_light.value.position[1] = map_point[1];

        move_light_node(Editor.selected_light);
    }

    if (Editor.paint_mode)
        set_tile(Editor.over_tile[0], Editor.over_tile[1]);

    var html = 'screen: ['+ sp[0] +', '+ sp[1] +']';
    html += ' / screen: ['+ map_point[0].toFixed(3) +', '+ map_point[1].toFixed(3) +']';
    html += ' / screen: ['+ screen_point[0].toFixed(3) +', '+ screen_point[1].toFixed(3) +']';
    // html += ' / map: ['+ map_point[0].toFixed(3) +', '+ map_point[1].toFixed(3) +']';
    // html += ' / map: ['+ Editor.map_coordinates[0].toFixed(3) +', '+ Editor.map_coordinates[1].toFixed(3) +']';

    screen_console.innerHTML = html;
});

$('select#map_ceiling_texture').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.ceiling_texture = parseInt($target.val());
});

$('select#map_floor_texture').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.floor_texture = parseInt($target.val());
});

$('select#empty_ceiling_texture').on('change', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile >= 0)
    {
        var tile = Editor.map.data[Editor.selected_tile];

        if (tile.type == rc_enums.BLOCK_EMPTY)
            tile.textures[rc_enums.FACE_TOP] = parseInt($target.val());
    }
});

$('select#empty_floor_texture').on('change', function(e)
{
    var $target = $(e.target);

    if (Editor.selected_tile >= 0)
    {
        var tile = Editor.map.data[Editor.selected_tile];

        if (tile.type == rc_enums.BLOCK_EMPTY)
            tile.textures[rc_enums.FACE_BOTTOM] = parseInt($target.val());
    }
});

$editor_panel.on('click', '#generate_map', function(e)
{
    var $target = $(e.target);

    Editor.map.name = $editor_panel.find('#map_name').val();
    Editor.map.height = parseFloat($editor_panel.find('#map_height').val());
    Editor.map.half_height = Editor.map.height * 0.5;
    Editor.map.rows = parseInt($editor_panel.find('#map_rows').val());
    Editor.map.cols = parseInt($editor_panel.find('#map_cols').val());

    light_index = 1;

    update_map();
    clear_map();
    update_ui();
});

$('#map_height').on('change', function(e)
{
    var $target = $(e.target);
    change_map_height(parseFloat($target.val()));
});

$('#ambient_color_r').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.ambient_color[0] = parseInt($target.val());
});

$('#ambient_color_g').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.ambient_color[1] = parseInt($target.val());
});

$('#ambient_color_b').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.ambient_color[2] = parseInt($target.val());
});

$('#map_u_offset').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.wall_u_offset = parseFloat($target.val());
});

$('#map_v_offset').on('change', function(e)
{
    var $target = $(e.target);
    Editor.map.wall_v_offset = parseFloat($target.val());
});

function render(timestamp)
{
    var t0 = performance.now();

    var delta = timestamp - Editor.prev_timestamp;
    Editor.prev_timestamp = timestamp;
    Editor.debug_ms += delta;

    screen_ctx.fillStyle = '#fff';
    screen_ctx.fillRect(0, 0, Editor.WIDTH, Editor.HEIGHT);

    draw_grid(screen_ctx);
    draw_map(screen_ctx);
    draw_lights(screen_ctx);
    draw_cursor(screen_ctx);

    var t1 = performance.now();
    var frame_ms = t1 - t0;
    var fps = 1000 / (frame_ms ? frame_ms : 0.001);

    var console_html = '&raquo;&nbsp; ms: ' + frame_ms.toFixed(2) + ' / ' + 'fps: ' + fps.toFixed(2);
    // screen_console.innerHTML = console_html;

    window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);