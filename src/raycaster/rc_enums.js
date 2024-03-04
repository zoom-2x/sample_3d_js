var rc_enums = {
    EPSILON: 0.000001,

    BLOCK_VOID: 0,
    BLOCK_EMPTY: 1,
    BLOCK_WALL: 2,
    BLOCK_HALFWALL_TOP: 3,
    BLOCK_HALFWALL_BOTTOM: 4,
    // BLOCK_VARWALL: 5, (?)

    FACE_NONE: -1,
    FACE_LEFT: 0,
    FACE_RIGHT: 1,
    FACE_FRONT: 2,
    FACE_BACK: 3,
    FACE_TOP: 4,
    FACE_BOTTOM: 5,

    STATE_CLOSED: 0,
    STATE_OPENED: 1,

    FLAG_MIRROR: 1,
    FLAG_SPAWN_POINT: 2,
};

export default rc_enums;