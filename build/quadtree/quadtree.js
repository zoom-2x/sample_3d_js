(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

// ----------------------------------------------------------------------------------
// -- Quadtree testing.
// ----------------------------------------------------------------------------------

var map_size = 16;
var voxel_size = 40;
var screen_offset_x = 50;
var screen_offset_y = 50;
var clip_dist = 64;
var WIDTH = map_size * voxel_size + 2 * screen_offset_x;
var HEIGHT = map_size * voxel_size + 2 * screen_offset_y;
var origin_point = [0, 3.5];
var ray = {
  vector: [1.0, 0.4],
  direction: 0
};
ray_init(ray);

// N = 0 / E = 1 / S = 2 / W = 3
// NW = 0 / NE = 1 / SW = 2 / SE = 3
var node_table = [[-1, 1, 2, -1],
// NW
[-1, -1, 3, 0],
// NE
[0, 3, -1, -1],
// SW
[1, -1, -1, 2] // SE
];

// Orientations: NW: 0, NE: 1, SW: 2, SE: 3

// orientation nw
var start_node_table = [[[0, 1], [0, 2]],
// NW
[[1, 0], [1, 3]],
// NE
[[2, 3], [2, 0]],
// SW
[[3, 2], [3, 1]] // SE
];

// t order: tx0: 0, ty0: 1, txm: 2, tym: 3, tx1: 4, ty1: 5
// Each row represents a node, each vector in a row represents the
// x1 and y1 for a node (used to navigate between nodes).
var t_navigation_node_table = [[[2, 3], [4, 3], [2, 5], [4, 5]],
// NW
[[4, 3], [2, 3], [4, 5], [2, 5]],
// NE
[[2, 5], [4, 5], [2, 3], [4, 3]],
// SW
[[4, 5], [2, 5], [4, 3], [2, 3]] // SE
];

// [x0, y0, txm, tym, x1, y1]
var t_node_table = [
// NW direction
[[0, 1, 2, 3],
// NW node
[2, 1, 4, 3],
// NE node
[0, 3, 2, 5],
// SW node
[2, 3, 4, 5] // SE node
],
// NE direction
[[2, 1, 4, 3],
// NW node
[0, 1, 2, 3],
// NE node
[2, 3, 4, 5],
// SW node
[0, 3, 2, 5] // SE node
],
// SW direction
[[0, 3, 2, 5],
// NW node
[2, 3, 4, 5],
// NE node
[0, 1, 2, 3],
// SW node
[2, 1, 4, 3] // SE node
],
// SE direction
[[2, 3, 4, 5],
// NW node
[0, 3, 2, 5],
// NE node
[2, 1, 4, 3],
// SW node
[0, 1, 2, 3] // SE node
]];

// First = horizontal move, second = vertical move
var traverse_table = [[[1, 2], [-1, 3], [3, -1], [-1, -1]],
// NW
[[-1, 2], [0, 3], [-1, -1], [2, -1]],
// NE
[[1, -1], [-1, -1], [3, 0], [-1, 1]],
// SW
[[-1, -1], [0, -1], [-1, 0], [2, 1]] // SE
];

var screen = document.getElementById('3dbase');
var screen_ctx = screen.getContext('2d');
screen.width = WIDTH;
screen.height = HEIGHT;
function node_name(node) {
  var names = ['NW', 'NE', 'SW', 'SE'];
  return names[node];
}
function get_start_node(ray_direction, t) {
  var r = t[0] < t[1] ? 0 : 1;
  var c = 0;
  if (r == 0 && t[2] < t[1] || r == 1 && t[3] < t[0]) c = 1;
  return start_node_table[ray_direction][r][c];
}
function normalize(ray) {
  var one_over_len = 1.0 / Math.sqrt(ray[0] * ray[0] + ray[1] * ray[1]);
  ray[0] *= one_over_len;
  ray[1] *= one_over_len;
}
function ray_init(ray) {
  normalize(ray.vector);
  ray.odx = 1.0 / ray.vector[0];
  ray.ody = 1.0 / ray.vector[1];
  ray.direction = 0;
  if (ray.vector[0] >= 0 && ray.vector[1] >= 0) ray.direction = 0;else if (ray.vector[0] >= 0 && ray.vector[1] < 0) ray.direction = 2;else if (ray.vector[0] < 0 && ray.vector[1] >= 0) ray.direction = 1;else if (ray.vector[0] < 0 && ray.vector[1] < 0) ray.direction = 3;
}
function quad_node_navigate(ray_direction, t) {
  var start_node = get_start_node(ray_direction, t);
  var nodes = [start_node];
  while (start_node != -1) {
    var indices = t_navigation_node_table[ray_direction][start_node];
    var c = 0;
    if (t[indices[1]] < t[indices[0]]) c = 1;
    start_node = traverse_table[ray_direction][start_node][c];
    if (start_node != -1) nodes.push(start_node);
  }
  return nodes;
}

/**
 * @param {Array} point Start point
 * @param {Object} ray Direction vector
 * @param {Number} x0
 * @param {Number} x1
 * @param {Number} y0
 * @param {Number} y1
 * @return {Array}
 */
function ray_intersection(point, ray, x0, x1, y0, y1) {
  var t = 0;
  if (ray.vector[0] < 0) {
    t = x0;
    x0 = x1;
    x1 = t;
  }
  if (ray.vector[1] < 0) {
    t = y0;
    y0 = y1;
    y1 = t;
  }
  var tx0 = (x0 - point[0]) * ray.odx;
  var tx1 = (x1 - point[0]) * ray.odx;
  var ty0 = (y0 - point[1]) * ray.ody;
  var ty1 = (y1 - point[1]) * ray.ody;
  var txm = (tx1 + tx0) * 0.5;
  var tym = (ty1 + ty0) * 0.5;
  if (ray.vector[0] == 0) {
    tx0 = -Infinity;
    tx1 = Infinity;
    txm = Infinity;
  }
  if (ray.vector[1] == 0) {
    ty0 = -Infinity;
    ty1 = Infinity;
    tym = Infinity;
  }
  return [tx0, ty0, txm, tym, tx1, ty1];
}
function intersects(t) {
  return t[0] <= t[5] && t[1] <= t[4];
}
function ray_point(start, ray, t) {
  var res = [start[0] + ray[0] * t, start[1] + ray[1] * t];
  return res;
}
function make_power_of_two(v) {
  if (v < 0) return 0;
  var res = 1;
  var count = 0;
  while (res < v) res = res << 1;
  return res;
}

// ----------------------------------------------------------------------------------
// -- Quadtree routines.
// ----------------------------------------------------------------------------------

// aabb = xmin, ymin, xmax, ymax
function quad_aabb_intersects(aabb1, aabb2) {
  var check = (aabb2[0] >= aabb1[0] && aabb2[0] < aabb1[2] || aabb2[2] >= aabb1[0] && aabb2[2] < aabb1[2]) && (aabb2[1] >= aabb1[1] && aabb2[1] < aabb1[3] || aabb2[3] >= aabb1[1] && aabb2[3] < aabb1[3]);
  return check;
}
function quad_aabb_has_point(aabb, point) {
  return aabb[0] >= point[0] && point[0] <= aabb[2] && aabb[1] >= point[1] && point[1] <= aabb[3];
}
function quad_point_find_quadrant(quad, point) {
  var res = [];
  if (quad.root.count) {
    for (var i = 0; i < 4; ++i) {
      var node_index = quad.root.children[i];
      var node = quad.nodes[node_index];
      if (node && quad_aabb_has_point(node.aabb, point)) res.push(node_index);
    }
  }
  return res;
}
function quad_aabb_has_voxel(aabb, voxel) {
  return aabb[0] <= voxel[0] && voxel[0] + 1 <= aabb[2] && aabb[1] <= voxel[1] && voxel[1] + 1 <= aabb[3];
}
function quad_get_node(quad, aabb) {
  var shift = quad.depth - 1;
  var nodex = point[0] >> shift;
  var nodey = point[1] >> shift;
}
function quad_node_split(quad, index) {
  var parent = quad.nodes[index];
  var fsize = parent.aabb[2] - parent.aabb[0];
  var hsize = fsize >> 1;
  var is_leaf = hsize == 1;
  var depth = parent.depth + 1;
  var dims = [[parent.aabb[0], parent.aabb[1], parent.aabb[0] + hsize, parent.aabb[1] + hsize], [parent.aabb[0] + hsize, parent.aabb[1], parent.aabb[0] + fsize, parent.aabb[1] + hsize], [parent.aabb[0], parent.aabb[1] + hsize, parent.aabb[0] + hsize, parent.aabb[1] + fsize], [parent.aabb[0] + hsize, parent.aabb[1] + hsize, parent.aabb[0] + fsize, parent.aabb[1] + fsize]];
  var indices = [-1, -1, -1, -1];
  for (var i = 0; i < 4; ++i) {
    if (quad.empty.length) {
      var node_index = quad.empty.pop();
      var node = quad.nodes[node_index];
      indices[i] = node_index;
      node.index = i;
      node.depth = depth;
      node.parent = index;
      node.aabb = dims[i];
      node.leaf = is_leaf;
      node.count = 0;
      node.data = null;
      node.children = [-1, -1, -1, -1];
    } else {
      indices[i] = quad.nodes.length;
      quad.nodes.push({
        index: i,
        depth: depth,
        parent: index,
        aabb: dims[i],
        leaf: is_leaf,
        count: 0,
        data: null,
        children: [-1, -1, -1, -1]
      });
    }
  }
  parent.children[0] = indices[0];
  parent.children[1] = indices[1];
  parent.children[2] = indices[2];
  parent.children[3] = indices[3];
}
function quad_voxel_exists(quad, voxel) {
  var queue = [quad.nodes[0]];
  while (queue.length) {
    var parent_node = queue.pop();
    if (quad_aabb_has_voxel(parent_node.aabb, voxel)) {
      if (parent_node.leaf) return true;
      for (var i = 0; i < 4; ++i) {
        var child_node = quad.nodes[parent_node.children[i]];
        if (child_node) queue.push(child_node);
      }
    }
  }
  return false;
}
function quad_add_voxel(quad, voxel) {
  var root = quad.nodes[0];
  var queue = [];
  if (quad_voxel_exists(quad, voxel)) return;
  if (root && quad_aabb_has_voxel(root.aabb, voxel)) {
    if (!root.count) quad_node_split(quad, 0);
    for (var i = 0; i < 4; ++i) {
      queue.push(root.children[i]);
    }
    root.count++;
  }
  while (queue.length) {
    var node_index = queue.pop();
    var node = quad.nodes[node_index];
    if (node && quad_aabb_has_voxel(node.aabb, voxel)) {
      if (node.leaf) {
        node.data = [voxel[0], voxel[1]];
        node.count = 1;
      } else {
        if (!node.count) quad_node_split(quad, node_index);
        for (var i = 0; i < 4; ++i) {
          queue.push(node.children[i]);
        }
        node.count++;
      }
    }
  }
}
function quad_remove_voxel(quad, voxel) {
  var queue = [0];
  while (queue.length) {
    var node_index = queue.pop();
    var node = quad.nodes[node_index];
    if (node && quad_aabb_has_voxel(node.aabb, voxel)) {
      if (node.leaf) {
        var parent = quad.nodes[node.parent];
        if (!parent.count) {
          for (var i = 0; i < 4; ++i) {
            var child_node = quad.nodes[parent.children[i]];
            quad.empty.push(parent.children[i]);
            parent.children[i] = -1;
            child_node.data = null;
            child_node.count = 0;
            child_node.parent = -1;
            child_node.leaf = false;
          }
        } else {
          // quad.empty.push(parent.children[node.index]);
          // parent.children[node.index] = -1;

          node.data = null;
          node.count = 0;
          // node.parent = -1;
          // node.leaf = false;
        }
      } else {
        node.count--;
        for (var i = 0; i < 4; ++i) {
          queue.push(node.children[i]);
        }
      }
    }
  }
}
function quad_voxel_list(quad) {
  var list = [];
  var queue = [0];
  while (queue.length) {
    var node_index = queue.pop();
    var node = quad.nodes[node_index];
    if (node && node.count) {
      if (node.leaf) list.push(node.data);else {
        queue.push(node.children[0]);
        queue.push(node.children[1]);
        queue.push(node.children[2]);
        queue.push(node.children[3]);
      }
    }
  }
  return list;
}

// t values order: [tx0, ty0, txm, tym, tx1, ty1]
function quad_traverse_recursive(quad, ray, parent_node, parent_t, intersection_list) {
  // TODO(gabic): Trebuie adaugat si wrap-ul cu verificarea pentru punctul de origine,
  // plus verificarea de distanta max(x0, y0).

  if (intersects(parent_t)) {
    if (parent_node.leaf) {
      intersection_list.push(parent_node.aabb);
      return true;
    }
    var node_order = quad_node_navigate(ray.direction, parent_t);
    for (var i = 0; i < node_order.length; ++i) {
      var node_index = parent_node.children[node_order[i]];
      var child_node = quad.nodes[node_index];
      if (!child_node || !child_node.count) continue;
      var child_node_t = new Array(6);
      var t_indices = t_node_table[ray.direction][node_order[i]];

      // Generate the child node t values based on the parent node.
      child_node_t[0] = parent_t[t_indices[0]];
      child_node_t[1] = parent_t[t_indices[1]];
      child_node_t[4] = parent_t[t_indices[2]];
      child_node_t[5] = parent_t[t_indices[3]];
      child_node_t[2] = (child_node_t[0] + child_node_t[4]) * 0.5;
      child_node_t[3] = (child_node_t[1] + child_node_t[5]) * 0.5;
      if (ray.vector[0] == 0) child_node_t[2] = Infinity;
      if (ray.vector[1] == 0) child_node_t[3] = Infinity;
      var found = quad_traverse_recursive(quad, ray, child_node, child_node_t, intersection_list);
      if (quad.all && found) return true;
    }
  }
  return false;
}
function quad_traverse_horizontal_r(quad, ray, origin_point, parent_node, intersection_list) {
  if (origin_point[1] >= parent_node.aabb[1] && origin_point[1] < parent_node.aabb[3]) {
    var nodes = [1, 0];

    // Left to right.
    if (ray.vector[0] >= 0) nodes = [0, 1];
    for (var i = 0; i < 2; ++i) var child_node_index = parent_node.children[nodes[0]];
    var child_node = quad.nodes[child_node_index];

    // if (child_node)
  }
}

function quad_traverse_vertical_r(quad, origin_point) {}

// Finds the closest voxel intersection.
function quad_find_intersection(quad, ray, origin_point) {
  var intersection_list = [];
  var root_node = quad.nodes[quad.root];

  // Compute the t values only for the root node, subsequent t values will be
  // derived from the root.
  var root_node_intersection = ray_intersection(origin_point, ray, root_node.aabb[0], root_node.aabb[2], root_node.aabb[1], root_node.aabb[3]);

  // Vertical ray.
  if (ray.vector[0] == 0) {}
  // Horizontal ray.
  else if (ray.vector[1] == 0) {} else quad_traverse_recursive(quad, ray, root_node, root_node_intersection, intersection_list);
  return intersection_list;
}
function quad_create(size) {
  var Quad = {
    size: make_power_of_two(size),
    depth: 0,
    nodes: [],
    empty: [],
    root: null,
    all: false
  };
  Quad.depth = Math.log2(Quad.size);

  // TODO(gabic): Posibilitatea sa refolosesc un nod sters.
  Quad.nodes.push({
    index: 0,
    count: 0,
    depth: 0,
    parent: -1,
    aabb: [0, 0, Quad.size, Quad.size],
    leaf: false,
    children: [-1, -1, -1, -1]
  });
  Quad.root = 0;
  return Quad;
}

// ----------------------------------------------------------------------------------
// -- Drawing routines.
// ----------------------------------------------------------------------------------

function draw_grid(ctx, size, voxel_size) {
  var full_length = size * voxel_size;
  var sx = screen_offset_x;
  var sy = screen_offset_y;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#999';
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx, sy + full_length);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + full_length, sy);
  ctx.lineTo(sx + full_length, sy + full_length);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + full_length, sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + full_length);
  ctx.lineTo(sx + full_length, sy + full_length);
  ctx.stroke();
  ctx.font = "14px Tahoma";
  ctx.fillStyle = '#999';
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ccc';
  ctx.setLineDash([2]);
  sx = screen_offset_x + voxel_size;
  for (var x = 1; x < size; ++x) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + full_length);
    ctx.stroke();
    sx += voxel_size;
  }
  sx = screen_offset_x;
  sy = screen_offset_y + voxel_size;
  for (var y = 1; y < size; ++y) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + full_length, sy);
    ctx.stroke();
    sy += voxel_size;
  }
  sx = screen_offset_x;
  sy = screen_offset_y;
  for (var x = 0; x <= size; ++x) {
    ctx.fillText(x, sx - 4, sy - 14);
    sx += voxel_size;
  }
  sx = screen_offset_x;
  for (var y = 0; y <= size; ++y) {
    ctx.fillText(y, sx - 24, sy + 5);
    sy += voxel_size;
  }
  ctx.restore();
}
function draw_ray(ctx, ray, origin_point) {}
function draw_voxels(ctx, voxel_list) {
  ctx.save();
  for (var i = 0; i < voxel_list.length; ++i) {
    var voxel = voxel_list[i];
    var vx = screen_offset_x + voxel[0] * voxel_size;
    var vy = screen_offset_y + voxel[1] * voxel_size;
    ctx.fillStyle = '#72BC70';
    ctx.strokeStyle = '#38674D';
    ctx.lineWidth = 2;
    ctx.fillRect(vx, vy, voxel_size, voxel_size);
    ctx.strokeRect(vx, vy, voxel_size, voxel_size);
  }
  ctx.restore();
}
function draw_intersections(ctx, intersections) {
  ctx.save();
  for (var i = 0; i < intersections.length; ++i) {
    var voxel_aabb = intersections[i];
    var voxel = [voxel_aabb[0], voxel_aabb[1]];
    var vx = screen_offset_x + voxel[0] * voxel_size;
    var vy = screen_offset_y + voxel[1] * voxel_size;
    ctx.fillStyle = '#8A1815';
    ctx.strokeStyle = '#3C1515';
    ctx.lineWidth = 2;
    ctx.fillRect(vx, vy, voxel_size, voxel_size);
    ctx.strokeRect(vx, vy, voxel_size, voxel_size);

    // Draw the intersection edge.
  }

  ctx.restore();
}
function draw_quadtree_splits(ctx, quadtree) {}

// ----------------------------------------------------------------------------------

var quadtree = quad_create(map_size);
// var quads = quad_point_find_quadrant(quadtree, [1.4, 5.6]);

function generate_random_voxels(quad, count) {
  for (var i = 0; i < count; ++i) {
    var row = Math.random() * quad.size | 0;
    var col = Math.random() * quad.size | 0;
    quad_add_voxel(quad, [col, row]);
  }
}
generate_random_voxels(quadtree, 128);
var voxel_list = quad_voxel_list(quadtree);
function render(timestamp) {
  var t0 = performance.now();
  screen_ctx.fillStyle = '#fff';
  screen_ctx.fillRect(0, 0, WIDTH, HEIGHT);
  var t1 = performance.now();
  var intersections = [];
  var w = 1;
  var h = 1;
  for (var i = 0; i < w * h; ++i) {
    intersections = quad_find_intersection(quadtree, ray, origin_point, false);
  }
  var t2 = performance.now();
  console.log('intersection:', t2 - t1);
  draw_grid(screen_ctx, quadtree.size, voxel_size);
  draw_voxels(screen_ctx, voxel_list);
  draw_intersections(screen_ctx, intersections);
  draw_ray(screen_ctx, ray, origin_point);
  var t3 = performance.now();
  console.log('ms:', t3 - t0);
  window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);

},{}]},{},[1])
//# sourceMappingURL=quadtree.js.map
