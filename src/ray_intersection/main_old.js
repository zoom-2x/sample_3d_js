
// Orientations: NW: 0, NE: 1, SW: 2, SE: 3

// orientation nw
var start_node_table = [
    [[0,1], [0,2]],   // NW
    [[1,0], [1,3]],   // NE
    [[2,3], [2,0]],   // SW
    [[3,2], [3,1]]    // SE
];

// t order: tx0: 0, ty0: 1, txm: 2, tym: 3, tx1: 4, ty1: 5
// Each row represents a node, each vector in a row represents the
// x1 and y1 for a node.
var t_node_table = [
    [[2,3], [4,3], [2,5], [4,5]], // NW
    [[4,3], [2,3], [4,5], [2,5]], // NE
    [[2,5], [4,5], [2,3], [4,3]], // SW
    [[4,5], [2,5], [4,3], [2,3]] // SE
];

// First = horizontal move, second = vertical move
var traverse_table = [
    [[1,2], [-1,3], [3,-1], [-1,-1]], // NW
    [[-1,2], [0,3], [-1,-1], [2,-1]], // NE
    [[1,-1], [-1,-1], [3,0], [-1,1]], // SW
    [[-1,-1], [0,-1], [-1,0], [2,1]] // SE
];

function navigate(ray_direction, t)
{
    var start_node = get_start_node(ray_direction, t);
    var nodes = [start_node];

    while (start_node != -1)
    {
        var indices = t_node_table[ray_direction][start_node];
        var c = 0;

        if (t[indices[1]] < t[indices[0]])
            c = 1;

        start_node = traverse_table[ray_direction][start_node][c];

        if (start_node != -1)
            nodes.push(start_node);
    }

    return nodes;
}

function node_name(node)
{
    var names = ['NW', 'NE', 'SW', 'SE'];
    return names[node];
}

function get_start_node(ray_direction, t)
{
    var r = t[0] < t[1] ? 0 : 1;
    var c = 0;

    if ((r == 0 && t[2] < t[1]) || (r == 1 && t[3] < t[0]))
        c = 1;

    return start_node_table[ray_direction][r][c];
}

var ray = [1, -1];
var dir = ray_direction(ray);
var t = ray_intersection2([2, 9], ray, 0, 8, 0, 8);

var queue = [];

var t0 = performance.now();
for (var i = 0; i < 800 * 400; ++i)
{
    var nodes = navigate(dir, t);
}
var t1 = performance.now();
console.log('ms:', t1 - t0);

console.log('intersects:', intersects2(t));
console.log('node:', node_name(get_start_node(dir, t)));
console.log('nodes:', nodes);

function ray_direction(ray)
{
    var dir = 0;

    if (ray[0] >= 0 && ray[1] >= 0)
        dir = 0;
    else if (ray[0] >= 0 && ray[1] < 0)
        dir = 2;
    else if (ray[0] < 0 && ray[1] >= 0)
        dir = 1;
    else if (ray[0] < 0 && ray[1] < 0)
        dir = 3;

    return dir;
}

function ray_intersection2(point, ray, x0, x1, y0, y1)
{
    var t = 0;
    var dx = 1 / ray[0];
    var dy = 1 / ray[1];

    if (ray[0] < 0)
    {
        t = x0;
        x0 = x1;
        x1 = t;
    }

    if (ray[1] < 0)
    {
        t = y0;
        y0 = y1;
        y1 = t;
    }

    var tx0 = (x0 - point[0]) * dx;
    var tx1 = (x1 - point[0]) * dx;

    var ty0 = (y0 - point[1]) * dy;
    var ty1 = (y1 - point[1]) * dy;

    var txm = (tx1 + tx0) * 0.5;
    var tym = (ty1 + ty0) * 0.5;

    if (ray[0] == 0)
    {
        tx0 = -Infinity;
        tx1 = Infinity;
        txm = Infinity;
    }

    if (ray[1] == 0)
    {
        ty0 = -Infinity;
        ty1 = Infinity;
        tym = Infinity;
    }

    console.log('tx0:', tx0, 'tx1:', tx1, 'ty0:', ty0, 'ty1:', ty1, 'txm:', txm, 'tym:', tym);

    return [tx0, ty0, txm, tym, tx1, ty1];
}

function ray_intersection(point, ray, x0, x1, y0, y1)
{
    var t = 0;
    var dx = 1 / ray[0];
    var dy = 1 / ray[1];

    if (ray[0] < 0)
    {
        t = x0;
        x0 = x1;
        x1 = t;
    }

    if (ray[1] < 0)
    {
        t = y0;
        y0 = y1;
        y1 = t;
    }

    var tx0 = (x0 - point[0]) * dx;
    var tx1 = (x1 - point[0]) * dx;

    var ty0 = (y0 - point[1]) * dy;
    var ty1 = (y1 - point[1]) * dy;

    if (ray[0] == 0)
    {
        tx0 = -Infinity;
        tx1 = Infinity;
    }

    if (ray[1] == 0)
    {
        ty0 = -Infinity;
        ty1 = Infinity;
    }

    var txm = (tx1 + tx0) * 0.5;
    var tym = (ty1 + ty0) * 0.5;

    var t0 = tx0 > ty0 ? tx0 : ty0;
    var t1 = tx1 < ty1 ? tx1 : ty1;

    var tmask = 0b0011;

    if (ty0 >= tx0)
        tmask = 0b1100;

    console.log('tx0:', tx0, 'tx1:', tx1, 'ty0:', ty0, 'ty1:', ty1, 'txm:', txm, 'tym:', tym);

    // var entry = [
        // point[0] + ray[0] * t0,
        // point[1] + ray[1] * t0
    // ];

    // var exit = [
        // point[0] + ray[0] * t1,
        // point[1] + ray[1] * t1
    // ];

    return [t0, t1, tmask, entry, exit];
}

function intersects2(t) {
    return t[0] <= t[5]  && t[1] <= t[4];
}

function intersects(t0, t1) {
    return t0 <= t1  && t1 >= 0;
}

function intersection_face(ray, tmask)
{
    var vmask = 0b0000;

    if (ray[0] >= 0 && ray[1] >= 0)
        vmask = 0b1001;
    else if (ray[0] >= 0 && ray[1] < 0)
        vmask = 0b0101;
    else if (ray[0] < 0 && ray[1] >= 0)
        vmask = 0b1010;
    else if (ray[0] < 0 && ray[1] < 0)
        vmask = 0b0110;

    return vmask & tmask;
}

var tests = [
    {point: [-1, -0.1], ray: [1, 1], aabb: [0, 8, 0, 8]},
    {point: [2, -1], ray: [0, 1], aabb: [0, 8, 0, 8]},
    // {point: [0, 1], ray: [1, 0], aabb: [2, 3, 0, 1]},
    // {point: [9, 1], ray: [-1, 0], aabb: [0, 8, 0, 8]},
    // {point: [-1, 1], ray: [1, 0], aabb: [0, 8, 0, 8]},
    // {point: [9, 1], ray: [1, -0.5], aabb: [0, 8, 0, 8]},
    // {point: [9, 1], ray: [-0.5, -0.5], aabb: [0, 8, 0, 8]},
    // {point: [7, 9], ray: [0, 1], aabb: [0, 8, 0, 8]},
    // {point: [3, 7], ray: [0, 1], aabb: [0, 8, 0, 8]},
    // {point: [3, 7], ray: [-1, -0.3], aabb: [0, 4, 4, 8]},
    // {point: [3, 7], ray: [0, -0.3], aabb: [0, 4, 4, 8]},
    // {point: [7, -1], ray: [1, 0.3], aabb: [0, 8, 0, 8]},
    // {point: [-3, 5], ray: [1, -1], aabb: [0, 4, 0, 4]},
    // {point: [0, 5], ray: [1, -1], aabb: [0, 4, 0, 4]},
    // {point: [7, 5], ray: [-1, -1], aabb: [0, 4, 0, 4]},
    // {point: [-1, -2], ray: [1, 1], aabb: [0, 4, 0, 4]},
    // {point: [1, -7], ray: [0, 1], aabb: [0, 4, 0, 4]},
];

tests.forEach(function(test){
    var t = ray_intersection2(test.point, test.ray, test.aabb[0], test.aabb[1], test.aabb[2], test.aabb[3]);
    // var face = intersection_face(test.ray, t[2]);
    // console.log(intersects(t[0], t[1]), t, face);
});
