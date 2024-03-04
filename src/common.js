var color_0 = [0, 0, 0];
var color_1 = [0, 0, 0];
var color_2 = [0, 0, 0];
var color_3 = [0, 0, 0];
var color_4 = [0, 0, 0];
var color_5 = [0, 0, 0];

var Common =
{
    TWO_PI: 2 * Math.PI,
    ONE80_OVER_PI: 57.2957795130823208768,
    PI_OVER_ONE80: 0.01745329251994329577,
    EPSILON: 0.0000001,
    ONE_OVER_255: 0.00392156862745098039,

    // ----------------------------------------------------------------------------------
    // -- Voxel object rotations P(x,y,z)
    // ----------------------------------------------------------------------------------
    // ox cw(90) / (Px,-Pz,Py)
    // ox ccw(-90) / (Px,Pz,-Py)
    // ox flip(180) / (Px,-Py,-Pz)
    // oy cw(90) / (Pz,Py,-Px)
    // oy ccw(-90) / (-Pz,Py,Px)
    // oy flip(180) / (-Px,Py,-Pz)
    // oz ccw(90) / (-Py,Px,Pz)
    // oz cw(-90) / (Py,-Px,Pz)
    // oz flip(180) / (-Px,-Py,Pz)
    // ----------------------------------------------------------------------------------

    VOXEL_ROXCW: 0,
    VOXEL_ROXCCW: 1,
    VOXEL_ROXFLIP: 2,
    VOXEL_ROYCCW: 3,
    VOXEL_ROYCCW: 4,
    VOXEL_ROYFLIP: 5,
    VOXEL_ROZCCW: 6,
    VOXEL_ROZCW: 7,
    VOXEL_ROZFLIP: 8,

    // First 3 components extract the point components and the second 3 apply a sign change.
    voxel_rotations: [
        [0, 2, 1, 1, -1, 1],
        [0, 2, 1, 1, 1, -1],
        [0, 1, 2, 1, -1, -1],
        [2, 1, 0, 1, 1, -1],
        [2, 1, 0, -1, 1, 1],
        [0, 1, 2, -1, 1, -1],
        [1, 0, 2, -1, 1, 1],
        [1, 0, 2, 1, -1, 1],
        [0, 1, 2, -1, -1, 1]
    ],

    rad2deg: function(angle) { return angle * Common.ONE80_OVER_PI; },
    deg2rad: function(angle) { return angle * Common.PI_OVER_ONE80; },

    color_one_to_255: function(c)
    {
        c[0] *= 255;
        c[1] *= 255;
        c[2] *= 255;

        return c;
    },

    color_255_to_one: function(c)
    {
        c[0] *= Common.ONE_OVER_255;
        c[1] *= Common.ONE_OVER_255;
        c[2] *= Common.ONE_OVER_255;

        return c;
    },

    color_clamp: function(c)
    {
        c[0] = Common.clamp(c[0], 0, 255);
        c[1] = Common.clamp(c[1], 0, 255);
        c[2] = Common.clamp(c[2], 0, 255);
    },

    color_reinhard: function(c)
    {
        c[0] = 255 * c[0] / (c[0] + 255);
        c[1] = 255 * c[1] / (c[1] + 255);
        c[2] = 255 * c[2] / (c[2] + 255);
    },

    clamp: function(val, min, max)
    {
        if (val < min)
            val = min
        else if (val > max)
            val = max;

        return val;
    },

    color_mult: function(c, m)
    {
        var res = [0, 0, 0, 0];

        res[0] = c[0] * m;
        res[1] = c[1] * m;
        res[2] = c[2] * m;
        res[3] = c[3];

        return res;
    },

    vec3_add: function(v1, v2)
    {
        var res = [0, 0, 0];

        res[0] = v1[0] + v2[0];
        res[1] = v1[1] + v2[1];
        res[2] = v1[2] + v2[2];

        return res;
    },

    vec3_sub: function(v1, v2)
    {
        var res = [0, 0, 0];

        res[0] = v1[0] - v2[0];
        res[1] = v1[1] - v2[1];
        res[2] = v1[2] - v2[2];

        return res;
    },

    vec3_dot: function(v1, v2) {
        return (v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]);
    },

    vec3_len: function(v) {
        return Math.sqrt(Common.vec3_dot(v, v));
    },

    vec3_len2: function(v) {
        return Common.vec3_dot(v, v);
    },

    vec3_cross: function(v1, v2)
    {
        var res = [0, 0, 0];

        res[0] = v1[1] * v2[2] - v1[2] * v2[1];
        res[1] = v1[2] * v2[0] - v1[0] * v2[2];
        res[2] = v1[0] * v2[1] - v1[1] * v2[0];

        return res;
    },

    vec3_normalize: function(v)
    {
        var len = 1 / Common.vec3_len(v);

        v[0] *= len;
        v[1] *= len;
        v[2] *= len;

        return v;
    },

    rotate_x: function(p, angle)
    {
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        var t0 = cos * p[1] - sin * p[2];
        var t1 = sin * p[1] + cos * p[2];

        p[1] = t0;
        p[2] = t1;
    },

    rotate_y: function(p, angle)
    {
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        var t0 = cos * p[0] + sin * p[2];
        var t1 = -sin * p[0] + cos * p[2];

        p[0] = t0;
        p[2] = t1;
    },

    rotate_z: function(p, angle)
    {
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        var t0 = cos * p[0] - sin * p[1];
        var t1 = sin * p[0] + cos * p[1];

        p[0] = t0;
        p[1] = t1;
    },

    rotate_around_x: function(p, angle)
    {
        var res = [0, 0, 0];

        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        res[0] = p[0];
        res[1] = cos * p[1] - sin * p[2];
        res[2] = sin * p[1] + cos * p[2];

        return res;
    },

    rotate_around_y: function(p, angle)
    {
        var res = [0, 0, 0];

        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        res[0] = cos * p[0] + sin * p[2];
        res[1] = p[1];
        res[2] = -sin * p[0] + cos * p[2];

        return res;
    },

    rotate_around_z: function(p, angle)
    {
        var res = [0, 0, 0];

        var sin = Math.sin(angle);
        var cos = Math.cos(angle);

        res[0] = cos * p[0] - sin * p[1];
        res[1] = sin * p[0] + cos * p[1];
        res[2] = p[2];

        return res;
    },

    mat4_empty: function()
    {
        var mat = new Array(4*4);

        mat[0] = 0;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;

        mat[4] = 0;
        mat[5] = 0;
        mat[6] = 0;
        mat[7] = 0;

        mat[8] = 0;
        mat[9] = 0;
        mat[10] = 0;
        mat[11] = 0;

        mat[12] = 0;
        mat[13] = 0;
        mat[14] = 0;
        mat[15] = 0;

        return mat;
    },

    mat4_identity: function()
    {
        var mat = new Array(4*4);

        mat[0] = 1;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;

        mat[4] = 0;
        mat[5] = 1;
        mat[6] = 0;
        mat[7] = 0;

        mat[8] = 0;
        mat[9] = 0;
        mat[10] = 1;
        mat[11] = 0;

        mat[12] = 0;
        mat[13] = 0;
        mat[14] = 0;
        mat[15] = 1;

        return mat;
    },

    mat4_scale: function(sx, sy, sz)
    {
        var mat = Common.mat4_identity();

        mat[0] = sx;
        mat[5] = sy;
        mat[10] = sz;

        return mat;
    },

    mat4_rotation_x: function(angle)
    {
        var mat = Common.mat4_identity();

        var cos_t = Math.cos(angle);
        var sin_t = Math.sin(angle);

        mat[5] = cos_t;
        mat[6] = -sin_t;
        mat[9] = sin_t;
        mat[10] = cos_t;

        return mat;
    },

    mat4_rotation_y: function(angle)
    {
        var mat = Common.mat4_identity();

        var cos_t = Math.cos(angle);
        var sin_t = Math.sin(angle);

        mat[0] = cos_t;
        mat[8] = -sin_t;
        mat[2] = sin_t;
        mat[10] = cos_t;

        return mat;
    },

    mat4_rotation_z: function(angle)
    {
        var mat = Common.mat4_identity();

        var cos_t = Math.cos(angle);
        var sin_t = Math.sin(angle);

        mat[0] = cos_t;
        mat[4] = sin_t;
        mat[1] = -sin_t;
        mat[5] = cos_t;

        return mat;
    },

    mat4_mul_vec3: function(m, v)
    {
        var result = [0, 0, 0];

        result[0] = m[0] * v[0] + m[0] * v[1] + m[0] * v[2];
        result[1] = m[4] * v[0] + m[5] * v[1] + m[6] * v[2];
        result[2] = m[8] * v[0] + m[9] * v[1] + m[10] * v[2];

        return result;
    },

    mat4_mulvec: function(m, v)
    {
        var res = [0, 0, 0, 1];

        res[0] = m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3];
        res[1] = m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3];
        res[2] = m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3];
        res[3] = m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3];

        return res;
    },

    transform_point: function(m, p)
    {
        var res = [0, 0, 0, 1];

        res[0] = m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3];
        res[1] = m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7];
        res[2] = m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11];
        res[3] = m[12] * p[0] + m[13] * p[1] + m[14] * p[2] + m[15];

        return res;
    },

    transform_point_buffer: function(m, px, py, pz, buffer, from)
    {
        buffer[from + 0] = m[0] * px + m[1] * py + m[2] * pz + m[3];
        buffer[from + 1] = m[4] * px + m[5] * py + m[6] * pz + m[7];
        buffer[from + 2] = m[8] * px + m[9] * py + m[10] * pz + m[11];
        buffer[from + 3] = m[12] * px + m[13] * py + m[14] * pz + m[15];
    },

    transform_vector: function(m, p)
    {
        var res = [0, 0, 0, 0];

        res[0] = m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3];
        res[1] = m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7];
        res[2] = m[8] * p[0] + m[9] * p[1] + m[12] * p[2] + m[13];

        return res;
    },

    perspective_division: function(p)
    {
        var res = [0, 0, 0, 1];

        res[3] = 1.0 / p[3];
        res[0] = p[0] * res[3];
        res[1] = p[1] * res[3];
        res[2] = p[2] * res[3];

        return res;
    },

    perspective_division_buffer: function(buffer, from)
    {
        var t = 1.0 / buffer[from + 3];

        buffer[from + 3] = t;
        buffer[from + 0] *= t;
        buffer[from + 1] *= t;
        buffer[from + 2] *= t;
    },

    viewport_transform: function(m, p)
    {
        var res = [0, 0, 0, 0];

        res[0] = m[0] * p[0] + m[3];
        res[1] = m[5] * p[1] + m[7];
        res[2] = m[10] * p[2] + m[11];
        res[3] = p[3];

        return res;
    },

    viewport_transform_buffer: function(m, buffer, from)
    {
        buffer[from + 0] = m[0] * buffer[from + 0] + m[3];
        buffer[from + 1] = m[5] * buffer[from + 1] + m[7];
        buffer[from + 2] = m[10] * buffer[from + 2] + m[11];
        buffer[from + 3] = buffer[from + 3];
    },

    triangle_project: function(m, buffer)
    {
        var x, y, z, w;

        for (var i = 0; i < 3; ++i)
        {
            x = buffer[i][0];
            y = buffer[i][1];
            z = buffer[i][2];

            buffer[i][0] = m[0] * x + m[1] * y + m[2] * z + m[3];
            buffer[i][1] = m[4] * x + m[5] * y + m[6] * z + m[7];
            buffer[i][2] = m[8] * x + m[9] * y + m[10] * z + m[11];
            buffer[i][3] = m[12] * x + m[13] * y + m[14] * z + m[15];

            w = 1.0 / buffer[i][3];

            buffer[i][0] *= w;
            buffer[i][1] *= w;
            buffer[i][2] *= w;
            buffer[i][3] = w;
        }
    },

    triangle_viewport_transform: function(m, buffer)
    {
        for (var i = 0; i < 3; ++i)
        {
            buffer[i][0] = m[0] * buffer[i][0] + m[3];
            buffer[i][1] = m[5] * buffer[i][1] + m[7];
            buffer[i][2] = m[10] * buffer[i][2] + m[11];
            // buffer[i][3] = buffer[from + 3];
        }
    },

    mat4_mul: function(m1, m2)
    {
        var mat = new Array(4*4);

        mat[0] = m1[0] * m2[0] + m1[1] * m2[4] + m1[2] * m2[8] + m1[3] * m2[12];
        mat[1] = m1[0] * m2[1] + m1[1] * m2[5] + m1[2] * m2[9] + m1[3] * m2[13];
        mat[2] = m1[0] * m2[2] + m1[1] * m2[6] + m1[2] * m2[10] + m1[3] * m2[14];
        mat[3] = m1[0] * m2[3] + m1[1] * m2[7] + m1[2] * m2[11] + m1[3] * m2[15];

        mat[4] = m1[4] * m2[0] + m1[5] * m2[4] + m1[6] * m2[8] + m1[7] * m2[12];
        mat[5] = m1[4] * m2[1] + m1[5] * m2[5] + m1[6] * m2[9] + m1[7] * m2[13];
        mat[6] = m1[4] * m2[2] + m1[5] * m2[6] + m1[6] * m2[10] + m1[7] * m2[14];
        mat[7] = m1[4] * m2[3] + m1[5] * m2[7] + m1[6] * m2[11] + m1[7] * m2[15];

        mat[8] = m1[8] * m2[0] + m1[9] * m2[4] + m1[10] * m2[8] + m1[11] * m2[12];
        mat[9] = m1[8] * m2[1] + m1[9] * m2[5] + m1[10] * m2[9] + m1[11] * m2[13];
        mat[10] = m1[8] * m2[2] + m1[9] * m2[6] + m1[10] * m2[10] + m1[11] * m2[14];
        mat[11] = m1[8] * m2[3] + m1[9] * m2[7] + m1[10] * m2[11] + m1[11] * m2[15];

        mat[12] = m1[12] * m2[0] + m1[13] * m2[4] + m1[14] * m2[8] + m1[15] * m2[12];
        mat[13] = m1[12] * m2[1] + m1[13] * m2[5] + m1[14] * m2[9] + m1[15] * m2[13];
        mat[14] = m1[12] * m2[2] + m1[13] * m2[6] + m1[14] * m2[10] + m1[15] * m2[14];
        mat[15] = m1[12] * m2[3] + m1[13] * m2[7] + m1[14] * m2[11] + m1[15] * m2[15];

        return mat;
    },

    mat4_mul_dest: function(m1, m2, dest)
    {
        dest[0] = m1[0] * m2[0] + m1[1] * m2[4] + m1[2] * m2[8] + m1[3] * m2[12];
        dest[1] = m1[0] * m2[1] + m1[1] * m2[5] + m1[2] * m2[9] + m1[3] * m2[13];
        dest[2] = m1[0] * m2[2] + m1[1] * m2[6] + m1[2] * m2[10] + m1[3] * m2[14];
        dest[3] = m1[0] * m2[3] + m1[1] * m2[7] + m1[2] * m2[11] + m1[3] * m2[15];

        dest[4] = m1[4] * m2[0] + m1[5] * m2[4] + m1[6] * m2[8] + m1[7] * m2[12];
        dest[5] = m1[4] * m2[1] + m1[5] * m2[5] + m1[6] * m2[9] + m1[7] * m2[13];
        dest[6] = m1[4] * m2[2] + m1[5] * m2[6] + m1[6] * m2[10] + m1[7] * m2[14];
        dest[7] = m1[4] * m2[3] + m1[5] * m2[7] + m1[6] * m2[11] + m1[7] * m2[15];

        dest[8] = m1[8] * m2[0] + m1[9] * m2[4] + m1[10] * m2[8] + m1[11] * m2[12];
        dest[9] = m1[8] * m2[1] + m1[9] * m2[5] + m1[10] * m2[9] + m1[11] * m2[13];
        dest[10] = m1[8] * m2[2] + m1[9] * m2[6] + m1[10] * m2[10] + m1[11] * m2[14];
        dest[11] = m1[8] * m2[3] + m1[9] * m2[7] + m1[10] * m2[11] + m1[11] * m2[15];

        dest[12] = m1[12] * m2[0] + m1[13] * m2[4] + m1[14] * m2[8] + m1[15] * m2[12];
        dest[13] = m1[12] * m2[1] + m1[13] * m2[5] + m1[14] * m2[9] + m1[15] * m2[13];
        dest[14] = m1[12] * m2[2] + m1[13] * m2[6] + m1[14] * m2[10] + m1[15] * m2[14];
        dest[15] = m1[12] * m2[3] + m1[13] * m2[7] + m1[14] * m2[11] + m1[15] * m2[15];
    },

    mat4_det: function(m)
    {
        // (0,0) minor.
        var det00 = m[5] * (m[10] * m[15] - m[11] * m[14]) -
                    m[6] * (m[9] * m[15] - m[11] * m[13]) +
                    m[7] * (m[9] * m[14] - m[10] * m[13]);

        // (0,1) minor.
        var det01 = m[4] * (m[10] * m[15] - m[11] * m[14]) -
                    m[6] * (m[8] * m[15] - m[11] * m[12]) +
                    m[7] * (m[8] * m[14] - m[10] * m[12]);

        // (0,2) minor.
        var det02 = m[4] * (m[9] * m[15] - m[11] * m[13]) -
                    m[5] * (m[8] * m[15] - m[11] * m[12]) +
                    m[7] * (m[8] * m[13] - m[9] * m[12]);

        // (0,3) minor.
        var det03 = m[4] * (m[9] * m[14] - m[10] * m[13]) -
                    m[5] * (m[8] * m[14] - m[10] * m[12]) +
                    m[6] * (m[8] * m[13] - m[9] * m[12]);

        var result = m[0] * det00 - m[1] * det01 + m[2] * det02 - m[3] * det03;

        return result;
    },

    // mat4_inv: function(in, out)
    // {
    //     var one_over_det = 1.0f / mat4_det(in);
    //     var tmp = new Array(36);

    //     tmp[0] = mat->data[2][2] * mat->data[3][3];
    //     tmp[1] = mat->data[2][3] * mat->data[3][2];
    //     tmp[2] = mat->data[2][1] * mat->data[3][3];
    //     tmp[3] = mat->data[2][3] * mat->data[3][1];
    //     tmp[4] = mat->data[2][1] * mat->data[3][2];
    //     tmp[5] = mat->data[2][2] * mat->data[3][1];
    //     tmp[6] = mat->data[2][0] * mat->data[3][3];
    //     tmp[7] = mat->data[2][3] * mat->data[3][0];
    //     tmp[8] = mat->data[2][0] * mat->data[3][2];
    //     tmp[9] = mat->data[2][2] * mat->data[3][0];
    //     tmp[10] = mat->data[2][0] * mat->data[3][1];
    //     tmp[11] = mat->data[2][1] * mat->data[3][0];
    //     tmp[12] = mat->data[1][2] * mat->data[3][3];
    //     tmp[13] = mat->data[1][3] * mat->data[3][2];
    //     tmp[14] = mat->data[1][1] * mat->data[3][3];
    //     tmp[15] = mat->data[1][3] * mat->data[3][1];
    //     tmp[16] = mat->data[1][1] * mat->data[3][2];
    //     tmp[17] = mat->data[1][2] * mat->data[3][1];
    //     tmp[18] = mat->data[1][0] * mat->data[3][3];
    //     tmp[19] = mat->data[1][3] * mat->data[3][0];
    //     tmp[20] = mat->data[1][0] * mat->data[3][2];
    //     tmp[21] = mat->data[1][2] * mat->data[3][0];
    //     tmp[22] = mat->data[1][0] * mat->data[3][1];
    //     tmp[23] = mat->data[1][1] * mat->data[3][0];
    //     tmp[24] = mat->data[1][2] * mat->data[2][3];
    //     tmp[25] = mat->data[1][3] * mat->data[2][2];
    //     tmp[26] = mat->data[1][1] * mat->data[2][3];
    //     tmp[27] = mat->data[1][3] * mat->data[2][1];
    //     tmp[28] = mat->data[1][1] * mat->data[2][2];
    //     tmp[29] = mat->data[1][2] * mat->data[2][1];
    //     tmp[30] = mat->data[1][0] * mat->data[2][3];
    //     tmp[31] = mat->data[1][3] * mat->data[2][0];
    //     tmp[32] = mat->data[1][0] * mat->data[2][2];
    //     tmp[33] = mat->data[1][2] * mat->data[2][0];
    //     tmp[34] = mat->data[1][0] * mat->data[2][1];
    //     tmp[35] = mat->data[1][1] * mat->data[2][0];

    //     r32 e11 = mat->data[1][1] * (tmp[0] - tmp[1]) - mat->data[1][2] * (tmp[2] - tmp[3]) + mat->data[1][3] * (tmp[4] - tmp[5]);
    //     r32 e12 = mat->data[1][0] * (tmp[0] - tmp[1]) - mat->data[1][2] * (tmp[6] - tmp[7]) + mat->data[1][3] * (tmp[8] - tmp[9]);
    //     r32 e13 = mat->data[1][0] * (tmp[2] - tmp[3]) - mat->data[1][1] * (tmp[6] - tmp[7]) + mat->data[1][3] * (tmp[10] - tmp[11]);
    //     r32 e14 = mat->data[1][0] * (tmp[4] - tmp[5]) - mat->data[1][1] * (tmp[8] - tmp[9]) + mat->data[1][2] * (tmp[10] - tmp[11]);
    //     r32 e21 = mat->data[0][1] * (tmp[0] - tmp[1]) - mat->data[0][2] * (tmp[2] - tmp[3]) + mat->data[0][3] * (tmp[4] - tmp[5]);
    //     r32 e22 = mat->data[0][0] * (tmp[0] - tmp[1]) - mat->data[0][2] * (tmp[6] - tmp[7]) + mat->data[0][3] * (tmp[8] - tmp[9]);
    //     r32 e23 = mat->data[0][0] * (tmp[2] - tmp[3]) - mat->data[0][1] * (tmp[6] - tmp[7]) + mat->data[0][3] * (tmp[10] - tmp[11]);
    //     r32 e24 = mat->data[0][0] * (tmp[4] - tmp[5]) - mat->data[0][1] * (tmp[8] - tmp[9]) + mat->data[0][2] * (tmp[10] - tmp[11]);
    //     r32 e31 = mat->data[0][1] * (tmp[12] - tmp[13]) - mat->data[0][2] * (tmp[14] - tmp[15]) + mat->data[0][3] * (tmp[16] - tmp[17]);
    //     r32 e32 = mat->data[0][0] * (tmp[12] - tmp[13]) - mat->data[0][2] * (tmp[18] - tmp[19]) + mat->data[0][3] * (tmp[20] - tmp[21]);
    //     r32 e33 = mat->data[0][0] * (tmp[14] - tmp[15]) - mat->data[0][1] * (tmp[18] - tmp[19]) + mat->data[0][3] * (tmp[22] - tmp[23]);
    //     r32 e34 = mat->data[0][0] * (tmp[16] - tmp[17]) - mat->data[0][1] * (tmp[20] - tmp[21]) + mat->data[0][2] * (tmp[22] - tmp[23]);
    //     r32 e41 = mat->data[0][1] * (tmp[24] - tmp[25]) - mat->data[0][2] * (tmp[26] - tmp[27]) + mat->data[0][3] * (tmp[28] - tmp[29]);
    //     r32 e42 = mat->data[0][0] * (tmp[24] - tmp[25]) - mat->data[0][2] * (tmp[30] - tmp[31]) + mat->data[0][3] * (tmp[32] - tmp[33]);
    //     r32 e43 = mat->data[0][0] * (tmp[26] - tmp[27]) - mat->data[0][1] * (tmp[30] - tmp[31]) + mat->data[0][3] * (tmp[34] - tmp[35]);
    //     r32 e44 = mat->data[0][0] * (tmp[28] - tmp[29]) - mat->data[0][1] * (tmp[32] - tmp[33]) + mat->data[0][2] * (tmp[34] - tmp[35]);

    //     inv->data[0][0] = one_over_det * e11;
    //     inv->data[0][1] = -one_over_det * e21;
    //     inv->data[0][2] = one_over_det * e31;
    //     inv->data[0][3] = -one_over_det * e41;

    //     inv->data[1][0] = -one_over_det * e12;
    //     inv->data[1][1] = one_over_det * e22;
    //     inv->data[1][2] = -one_over_det * e32;
    //     inv->data[1][3] = one_over_det * e42;

    //     inv->data[2][0] = one_over_det * e13;
    //     inv->data[2][1] = -one_over_det * e23;
    //     inv->data[2][2] = one_over_det * e33;
    //     inv->data[2][3] = -one_over_det * e43;

    //     inv->data[3][0] = -one_over_det * e14;
    //     inv->data[3][1] = one_over_det * e24;
    //     inv->data[3][2] = -one_over_det * e34;
    //     inv->data[3][3] = one_over_det * e44;
    // },

    mat4_lookat: function(eye, target, up)
    {
        var mat = Common.mat4_identity();

        var z_axis = Common.vec3_normalize(Common.vec3_sub(eye, target));
        var x_axis = Common.vec3_normalize(Common.vec3_cross(up, z_axis));
        var y_axis = Common.vec3_normalize(Common.vec3_cross(z_axis, x_axis));

        // orthogonal axis => inverse = transpose (rotation).
        mat[0] = x_axis[0];
        mat[1] = x_axis[1];
        mat[2] = x_axis[2];

        mat[4] = y_axis[0];
        mat[5] = y_axis[1];
        mat[6] = y_axis[2];

        mat[8] = z_axis[0];
        mat[9] = z_axis[1];
        mat[10] = z_axis[2];

        // Extract the eye vector's components relative to the camera axis (translation).
        mat[3] = -Common.vec3_dot(x_axis, eye);
        mat[7] = -Common.vec3_dot(y_axis, eye);
        mat[11] = -Common.vec3_dot(z_axis, eye);

        return mat;
    },

    mat4_lookat_dest: function(eye, target, up, dest)
    {
        var z_axis = Common.vec3_normalize(Common.vec3_sub(eye, target));
        var x_axis = Common.vec3_normalize(Common.vec3_cross(up, z_axis));
        var y_axis = Common.vec3_normalize(Common.vec3_cross(z_axis, x_axis));

        // orthogonal axis => inverse = transpose (rotation).
        dest[0] = x_axis[0];
        dest[1] = x_axis[1];
        dest[2] = x_axis[2];

        dest[4] = y_axis[0];
        dest[5] = y_axis[1];
        dest[6] = y_axis[2];

        dest[8] = z_axis[0];
        dest[9] = z_axis[1];
        dest[10] = z_axis[2];

        // Extract the eye vector's components relative to the camera axis (translation).
        dest[3] = -Common.vec3_dot(x_axis, eye);
        dest[7] = -Common.vec3_dot(y_axis, eye);
        dest[11] = -Common.vec3_dot(z_axis, eye);
    },

    // fov (radians)
    mat4_perspective: function(aspect, fov, f_near, f_far)
    {
        var mat = Common.mat4_empty();

        var d = 1.0 / Math.tan(fov * 0.5);
        var s = f_near - f_far;

        mat[0] = d / aspect;
        mat[5] = d;
        mat[10] = (f_near + f_far) / s;
        mat[14] = -1;
        mat[11] = 2 * f_near * f_far / s;

        return mat;
    },

    mat4_perspective_dest: function(aspect, fov, f_near, f_far, dest)
    {
        var d = 1.0 / Math.tan(fov * 0.5);
        var s = f_near - f_far;

        dest[0] = d / aspect;
        dest[5] = d;
        dest[10] = (f_near + f_far) / s;
        dest[14] = -1;
        dest[11] = 2 * f_near * f_far / s;
    },

    mat4_orthographic: function(f_right, f_left, f_top, f_bottom, f_near, f_far)
    {
        var mat = Common.mat4_empty();

        var rml = f_right - f_left;
        var fmn = f_far - f_near;
        var tmb = f_top - f_bottom;

        mat[0] = 2 / rml;
        mat[5] = 2 / tmb;
        mat[10] = -2 / fmn;
        mat[15] = 1;
        mat[3] = -(f_right + f_left) / rml;
        mat[7] = -(f_top + f_bottom) / tmb;
        mat[11] = -(f_far + f_near) / fmn;

        return mat;
    },

    mat4_viewport: function(ws, hs, sx, sy, ds)
    {
        var mat = Common.mat4_empty();

        var wh = ws / 2.0;
        var hh = hs / 2.0;
        var dh = ds / 2.0;

        mat[0] = wh;
        mat[3] = wh + sx;
        mat[5] = -hh;
        mat[7] = hh + sy;
        mat[10] = dh;
        mat[11] = dh;
        mat[15] = 1;

        return mat;
    },

    mat4_viewport_dest: function(ws, hs, sx, sy, ds, dest)
    {
        var wh = ws / 2.0;
        var hh = hs / 2.0;
        var dh = ds / 2.0;

        dest[0] = wh;
        dest[3] = wh + sx;
        dest[5] = -hh;
        dest[7] = hh + sy;
        dest[10] = dh;
        dest[11] = dh;
        dest[15] = 1;
    },

    // get_map_index: function(map, x, y, z) {
    //     return map.zpitch * z + map.dims[0] * y + x;
    // },

    clear_map: function(map, fill)
    {
        fill = fill ? 0x01000000 : 0;

        for (var z = 0; z < map.dims[2]; ++z) {
            for (var y = 0; y < map.dims[1]; ++y) {
                for (var x = 0; x < map.dims[0]; ++x) {
                    map.data[Common.get_map_index(map, x, y, z)] = fill;
                }
            }
        }
    },

    get_map_index: function(map, x, y, z) {
        return (z << map.shift_z) | (y << map.shift_y) | x;
    },

    // Camera rotation based on a circle.
    get_camera_circle_rotation_angles: function(t, rot)
    {
        var res = [0, 0];
        var p = [rot.radius * Math.cos(t), 1, rot.radius * Math.sin(t)];

        res[0] = Math.asin(p[2] / rot.point_distance);
        res[1] = Math.atan2(p[0], rot.center_distance);

        return res;
    },

    // Camera rotation based on an ellipse.
    get_camera_ellipse_rotation_angles: function(t, rot)
    {},

    add_voxel_texture: function(Voxels, faces)
    {
        var index = Voxels.voxel_textures.length;

        if (toString.call(faces) == "[object Array]")
            Voxels.voxel_textures.push(faces);
        else if (toString.call(faces) == "[object Number]")
            Voxels.voxel_textures.push([faces, faces, faces, faces, faces, faces]);

        return index;
    },

    obj_push_data: function(obj, y, z, data)
    {
        if (obj.dims[0] == data.length)
        {
            for (var i = 0; i < data.length; ++i)
            {
                var tmp = [];

                // Format: [x, y, z, voxel_texture_id]
                tmp.push(i - obj.center[0]);
                tmp.push(y - obj.center[1]);
                tmp.push(z - obj.center[2]);
                tmp.push(data[i]);

                obj.data.push(tmp);
            }
        }
    },

    wall_ox: function(map, point, width, height, texture_id)
    {
        var mx = point[0];

        for (var mz = point[2]; mz < point[2] + height; mz++)
        {
            for (var my = point[1]; my < point[1] + width; my++)
            {
                if (mx >= 0 && my >= 0 && mz >= 0 &&
                    mx < map.dims[0] && my < map.dims[1] && mz < map.dims[2])
                {
                    var index = Common.get_map_index(map, mx, my, mz);
                    map.data[index] = texture_id;
                }
            }
        }
    },

    wall_oy: function(map, point, width, height, texture_id)
    {
        var my = point[1];

        for (var mz = point[2]; mz < point[2] + height; mz++)
        {
            for (var mx = point[0]; mx < point[0] + width; mx++)
            {
                if (mx >= 0 && my >= 0 && mz >= 0 &&
                    mx < map.dims[0] && my < map.dims[1] && mz < map.dims[2])
                {
                    var index = Common.get_map_index(map, mx, my, mz);
                    map.data[index] = texture_id;
                }
            }
        }
    },

    wall_oz: function(map, point, width, height, texture_id)
    {
        var mz = point[2];

        for (var my = point[1]; my < point[1] + height; my++)
        {
            for (var mx = point[0]; mx < point[0] + width; mx++)
            {
                if (mx >= 0 && my >= 0 && mz >= 0 &&
                    mx < map.dims[0] && my < map.dims[1] && mz < map.dims[2])
                {
                    var index = Common.get_map_index(map, mx, my, mz);
                    map.data[index] = texture_id;
                }
            }
        }
    },

    valid_voxel: function(map, x, y, z) {
        return (x >= 0 && x < map.dims[0] && y >= 0 && y < map.dims[1] && z >= 0 && z < map.dims[2]);
    },

    brush_old: function(map, point, dims, texture_id)
    {
        for (var mz = point[2]; mz < point[2] + dims[2]; mz++)
        {
            for (var my = point[1]; my < point[1] + dims[1]; my++)
            {
                for (var mx = point[0]; mx < point[0] + dims[0]; mx++)
                {
                    if (Common.valid_voxel(map, mx, my, mz))
                    {
                        var index = Common.get_map_index(map, mx, my, mz);
                        map.data[index] = texture_id;
                    }
                }
            }
        }
    },

    brush: function(map, start, end, texture_id, paint)
    {
        paint = paint ? true : false;

        var sx = start[0];
        var sy = start[1];
        var sz = start[2];

        var ex = end[0];
        var ey = end[1];
        var ez = end[2];

        var tmp = 0;

        if (ex < sx) { tmp = sx; sx = ex; ex = tmp; }
        if (ey < sy) { tmp = sy; sy = ey; ey = tmp; }
        if (ez < sz) { tmp = sz; sz = ez; ez = tmp; }

        for (var mz = sz; mz <= ez; mz++)
        {
            for (var my = sy; my <= ey; my++)
            {
                for (var mx = sx; mx <= ex; mx++)
                {
                    if (Common.valid_voxel(map, mx, my, mz))
                    {
                        var index = Common.get_map_index(map, mx, my, mz);

                        if (paint)
                        {
                            if (map.data[index])
                                map.data[index] = texture_id;
                        }
                        else
                            map.data[index] = texture_id;
                    }
                }
            }
        }
    },

    /**
     * @param {vec3} p
     * @param {array} rotation A vector containing multiple rotations.
     *
     * @return {vec3}
     */
    voxel_object_space_rotation: function(p, rotation)
    {
        var res = [p[0], p[1], p[2]];

        if (rotation)
        {
            rotation.forEach(function(index)
            {
                var rotation = Common.voxel_rotations[index];
                var tmp = [res[0], res[1], res[2]];

                res[0] = tmp[rotation[0]] * rotation[3];
                res[1] = tmp[rotation[1]] * rotation[4];
                res[2] = tmp[rotation[2]] * rotation[5];
            });
        }

        return res;
    },

    map_add_object: function(map, pos, object, rotation, texture_id)
    {
        object.data.forEach(function(voxel)
        {
            var rv = Common.voxel_object_space_rotation(voxel, rotation);

            var mx = pos[0] + rv[0];
            var my = pos[1] + rv[1];
            var mz = pos[2] + rv[2];

            if (mx >= 0 && my >= 0 && mz >= 0 &&
                mx < map.dims[0] && my < map.dims[1] && mz < map.dims[2])
            {
                var index = Common.get_map_index(map, mx, my, mz);
                map.data[index] = (voxel[3] >= 0) && texture_id ? texture_id : voxel[3];
            }
        });
    },

    float_snap: function(v)
    {
        var epsilon = 0.00000001;
        var s = v < 0 ? -1 : 1;
        var a = Math.abs(v);
        var f = Math.floor(a);
        var c = Math.ceil(a);

        if (a - f < epsilon)
            return f * s;
        else if (c - a < epsilon)
            return c * s;

        return v;
    },

    get_voxel: function(map, point)
    {
        var x = Math.floor(point[0]);
        var y = Math.floor(point[1]);
        var z = Math.floor(point[2]);

        if (map.wrap[0])
        {
            x %= map.dims[0];

            if (x < 0)
                x += map.dims[0];
        }
        else if (x < 0 || x >= map.dims[0])
            return [-1, -1, -1];

        if (map.wrap[1])
        {
            y %= map.dims[1];

            if (y < 0)
                y += map.dims[1];
        }
        else if (y < 0 || y >= map.dims[1])
            return [-1, -1, -1];

        if (map.wrap[2])
        {
            z %= map.dims[2];

            if (z < 0)
                z += map.dims[2];
        }
        else if (z < 0 || z >= map.dims[2])
            return [-1, -1, -1];

        return [x, y, z];
    },

    sample_texture: function(texture_data, sampler, u, v, buffer)
    {
        u += 0.00001;
        v += 0.00001;

        if (u >= 1) u = 0.9999999999;
        if (v >= 1) v = 0.9999999999;

        var tex_x = (u * sampler.tex_width) | 0;
        var tex_y = ((1 - v) * sampler.tex_height) | 0;
        var pointer = sampler.tex_pointer + ((tex_y << sampler.tex_width_shift | tex_x) << 2);

        buffer[0] = texture_data[pointer + 0];
        buffer[1] = texture_data[pointer + 1];
        buffer[2] = texture_data[pointer + 2];
    },

    sample_texture_filtering: function(texture_data, sampler, u, v, buffer)
    {
        u += 0.00001;
        v += 0.00001;

        if (u >= 1) u = 0.9999999999;
        if (v >= 1) v = 0.9999999999;

        var tex_xf = u * sampler.tex_width;
        var tex_yf = (1 - v) * sampler.tex_height;

        var tex_xstart = tex_xf | 0;
        var tex_ystart = tex_yf | 0;

        var tex_xend = tex_xstart + 1;
        var tex_yend = tex_ystart + 1;

        if (tex_xend >= sampler.tex_width) tex_xend = sampler.tex_width - 1;
        if (tex_yend >= sampler.tex_height) tex_yend = sampler.tex_height - 1;

        var s = tex_xf % 1;
        var t = tex_yf % 1;

        var c0 = tex_ystart << sampler.tex_width_shift;
        var c1 = tex_yend << sampler.tex_width_shift;

        var pointer_sample_0 = sampler.tex_pointer + ((c0 | tex_xstart) << 2);
        var pointer_sample_1 = sampler.tex_pointer + ((c0 | tex_xend) << 2);
        var pointer_sample_2 = sampler.tex_pointer + ((c1 | tex_xstart) << 2);
        var pointer_sample_3 = sampler.tex_pointer + ((c1 | tex_xend) << 2);

        color_0[0] = texture_data[pointer_sample_0 + 0];
        color_0[1] = texture_data[pointer_sample_0 + 1];
        color_0[2] = texture_data[pointer_sample_0 + 2];

        color_1[0] = texture_data[pointer_sample_1 + 0];
        color_1[1] = texture_data[pointer_sample_1 + 1];
        color_1[2] = texture_data[pointer_sample_1 + 2];

        color_2[0] = texture_data[pointer_sample_2 + 0];
        color_2[1] = texture_data[pointer_sample_2 + 1];
        color_2[2] = texture_data[pointer_sample_2 + 2];

        color_3[0] = texture_data[pointer_sample_3 + 0];
        color_3[1] = texture_data[pointer_sample_3 + 1];
        color_3[2] = texture_data[pointer_sample_3 + 2];

        var rs = 1 - s;
        var rt = 1 - t;

        color_4[0] = color_0[0] * rs + color_1[0] * s;
        color_4[1] = color_0[1] * rs + color_1[1] * s;
        color_4[2] = color_0[2] * rs + color_1[2] * s;

        color_5[0] = color_2[0] * rs + color_3[0] * s;
        color_5[1] = color_2[1] * rs + color_3[1] * s;
        color_5[2] = color_2[2] * rs + color_3[2] * s;

        buffer[0] = color_4[0] * rt + color_5[0] * t;
        buffer[1] = color_4[1] * rt + color_5[1] * t;
        buffer[2] = color_4[2] * rt + color_5[2] * t;
    }
};

export default Common;