var BoxModel =
{
    face_vertices: 4,

    vertices: [
        -1, -1, 1,
        1, -1, 1,
        1, -1, -1,
        -1, -1, -1,
        1, 1, 1,
        -1, 1, 1,
        -1, 1, -1,
        1, 1, -1
    ],

    faces: [
        1, 2, 3, 4,
        2, 5, 8, 3,
        5, 6, 7, 8,
        6, 1, 4, 7,
        6, 5, 2, 1,
        4, 3, 8, 7
    ]
};

export default BoxModel;