import sys
import os
import json
import math

from enum import IntEnum

class Face(IntEnum):
    LEFT = 0
    RIGHT = 1
    FRONT = 2
    BACK = 3
    TOP = 4
    BOTTOM = 5

class Block(IntEnum):
    VOID = 0
    EMPTY = 1
    WALL = 2
    HALFWALL_TOP = 3
    HALFWALL_BOTTOM = 4

def v3_dot(v1, v2):
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]

def v3_len(v):
    return math.sqrt(v3_dot(v, v))

def v3_normalize(v):
    len = v3_len(v)

    v[0] /= len
    v[1] /= len
    v[2] /= len

def clamp(c, min_val, max_val):
    c[0] = int(min(max(c[0], min_val), max_val))
    c[1] = int(min(max(c[1], min_val), max_val))
    c[2] = int(min(max(c[2], min_val), max_val))

def reinhard(c):
    c[0] /= 255
    c[1] /= 255
    c[2] /= 255

    c[0] /= c[0] + 1
    c[1] /= c[1] + 1
    c[2] /= c[2] + 1

    c[0] = int(c[0] * 255)
    c[1] = int(c[1] * 255)
    c[2] = int(c[2] * 255)

blur_radius = 2

def blur_pixel(buffer, in_x, in_y):

    color = [0, 0, 0]
    count = 0

    start_x = in_x - blur_radius
    start_y = in_y - blur_radius
    end_x = in_x + blur_radius
    end_y = in_y + blur_radius

    start_index = (in_y * lightmap_size + in_x) << 2

    start_color = [
        buffer[start_index + 0],
        buffer[start_index + 1],
        buffer[start_index + 2]
    ]

    for y in range(start_y, end_y):
        for x in range(start_x, end_x):
            if x >= 0 and y >= 0 and x < lightmap_size and y < lightmap_size:
                index = (y * lightmap_size + x) << 2
                color[0] += buffer[index + 0]
                color[1] += buffer[index + 1]
                color[2] += buffer[index + 2]
            else:
                color[0] += start_color[0]
                color[1] += start_color[1]
                color[2] += start_color[2]

            count += 1

    # Average the color.
    if count > 0:
        color[0] /= count
        color[1] /= count
        color[2] /= count

    return color

def filter_lightmap(src_buffer, dest_buffer):

    index = 0

    for y in range(lightmap_size):
        for x in range(lightmap_size):
            # color = blur_pixel(src_buffer, x, y)
            # index = (y * lightmap_size + x) << 2

            color = [
                src_buffer[index + 0],
                src_buffer[index + 1],
                src_buffer[index + 2]
            ]

            index += 4

            dest_buffer.append(int(color[0]))
            dest_buffer.append(int(color[1]))
            dest_buffer.append(int(color[2]))
            dest_buffer.append(255)

def is_occluded(light, pixel):

    ray = [pixel[0] - light[0], pixel[1] - light[1], pixel[2] - light[2]]

    ref_row = int(math.floor(pixel[1]))
    ref_col = int(math.floor(pixel[0]))

    offset_x = light[0] - math.floor(light[0])
    offset_y = light[1] - math.floor(light[1])

    bx = int(math.floor(light[0]))
    by = int(math.floor(light[1]))

    if ray[0] == 0:
        step_tx = 99999999
    else:
        step_tx = math.fabs(1.0 / ray[0])

    if ray[1] == 0:
        step_ty = 99999999
    else:
        step_ty = math.fabs(1.0 / ray[1])

    step_x = 1
    step_y = 1

    if ray[0] < 0:
        step_x = -1

        if offset_x == 0:
            offset_x = 1
            bx -= 1
    else:
        offset_x = 1 - offset_x

    if ray[1] < 0:
        step_y = -1

        if offset_y == 0:
            offset_y = 1
            by -= 1
    else:
        offset_y = 1 - offset_y

    current_tx = offset_x * step_tx
    current_ty = offset_y * step_ty

    if pixel[0] == 3 and pixel[1] == 1:
        a = 1

    # Block traversal.
    while True:
        current_t = current_tx

        check_tx = current_tx
        check_ty = current_ty

        if current_tx < current_ty:
            bx += step_x
            current_tx += step_tx
        else:
            current_t = current_ty
            by += step_y
            current_ty += step_ty

        # Check if the ray has reached the pixel.
        if check_tx >= 0.99 and check_ty >= 0.99:
            break

        if bx < 0 or bx >= level['cols'] or by < 0 or by >= level['rows']:
            break

        block_index = by * level['cols'] + bx
        block = level['data'][block_index]

        if block['type'] == 2:
            return True
        elif block['type'] == 3:

            ix = light[0] + ray[0] * current_t
            iy = light[1] + ray[1] * current_t
            iz = light[2] + ray[2] * current_t

            if iz >= level['half_height']:
                return True

        elif block['type'] == 4:

            ix = light[0] + ray[0] * current_t
            iy = light[1] + ray[1] * current_t
            iz = light[2] + ray[2] * current_t

            if iz <= level['half_height']:
                return True

    return False

def get_face_traversal(block, face):
    # uv face step vectors
    traversal = {
        'normal': [0, 0, 0],
        'start': [0, 0, 0],
        'end': [0, 0, 0],
        'u_vector': [0, 0, 0],
        'v_vector': [0, 0, 0]
    }

    if face == Face.LEFT:

        traversal['normal'][0] = 0
        traversal['normal'][1] = 1
        traversal['normal'][2] = 0

        traversal['start'][0] = block['col'] + 1
        traversal['start'][1] = block['row'] + 1
        traversal['start'][2] = block['high_z']

        traversal['end'][0] = block['col']
        traversal['end'][1] = block['row'] + 1
        traversal['end'][2] = block['low_z']

        traversal['u_vector'][0] = traversal['end'][0] - traversal['start'][0]
        traversal['u_vector'][1] = 0
        traversal['u_vector'][2] = 0

        traversal['v_vector'][0] = 0
        traversal['v_vector'][1] = 0
        traversal['v_vector'][2] = traversal['end'][2] - traversal['start'][2]

    elif face == Face.RIGHT:

        traversal['normal'][0] = 0
        traversal['normal'][1] = -1
        traversal['normal'][2] = 0

        traversal['start'][0] = block['col']
        traversal['start'][1] = block['row']
        traversal['start'][2] = block['high_z']

        traversal['end'][0] = block['col'] + 1
        traversal['end'][1] = block['row']
        traversal['end'][2] = block['low_z']

        traversal['u_vector'][0] = traversal['end'][0] - traversal['start'][0]
        traversal['u_vector'][1] = 0
        traversal['u_vector'][2] = 0

        traversal['v_vector'][0] = 0
        traversal['v_vector'][1] = 0
        traversal['v_vector'][2] = traversal['end'][2] - traversal['start'][2]

    elif face == Face.FRONT:

        traversal['normal'][0] = -1
        traversal['normal'][1] = 0
        traversal['normal'][2] = 0

        traversal['start'][0] = block['col']
        traversal['start'][1] = block['row'] + 1
        traversal['start'][2] = block['high_z']

        traversal['end'][0] = block['col']
        traversal['end'][1] = block['row']
        traversal['end'][2] = block['low_z']

        traversal['u_vector'][0] = 0
        traversal['u_vector'][1] = traversal['end'][1] - traversal['start'][1]
        traversal['u_vector'][2] = 0

        traversal['v_vector'][0] = 0
        traversal['v_vector'][1] = 0
        traversal['v_vector'][2] = traversal['end'][2] - traversal['start'][2]

    elif face == Face.BACK:

        traversal['normal'][0] = 1
        traversal['normal'][1] = 0
        traversal['normal'][2] = 0

        traversal['start'][0] = block['col'] + 1
        traversal['start'][1] = block['row']
        traversal['start'][2] = block['high_z']

        traversal['end'][0] = block['col'] + 1
        traversal['end'][1] = block['row'] + 1
        traversal['end'][2] = block['low_z']

        traversal['u_vector'][0] = 0
        traversal['u_vector'][1] = traversal['end'][1] - traversal['start'][1]
        traversal['u_vector'][2] = 0

        traversal['v_vector'][0] = 0
        traversal['v_vector'][1] = 0
        traversal['v_vector'][2] = traversal['end'][2] - traversal['start'][2]

    elif face == Face.TOP:

        traversal['normal'][0] = 0
        traversal['normal'][1] = 0
        traversal['normal'][2] = 1

        traversal['start'][0] = block['col']
        traversal['start'][1] = block['row']
        traversal['start'][2] = block['high_z']

        traversal['end'][0] = block['col'] + 1
        traversal['end'][1] = block['row'] + 1
        traversal['end'][2] = block['high_z']

        traversal['u_vector'][0] = 0
        traversal['u_vector'][1] = traversal['end'][1] - traversal['start'][1]
        traversal['u_vector'][2] = 0

        traversal['v_vector'][0] = traversal['end'][0] - traversal['start'][0]
        traversal['v_vector'][1] = 0
        traversal['v_vector'][2] = 0

    elif face == Face.BOTTOM:

        traversal['normal'][0] = 0
        traversal['normal'][1] = 0
        traversal['normal'][2] = -1

        traversal['start'][0] = block['col']
        traversal['start'][1] = block['row']
        traversal['start'][2] = block['low_z']

        traversal['end'][0] = block['col'] + 1
        traversal['end'][1] = block['row'] + 1
        traversal['end'][2] = block['low_z']

        traversal['u_vector'][0] = 0
        traversal['u_vector'][1] = traversal['end'][1] - traversal['start'][1]
        traversal['u_vector'][2] = 0

        traversal['v_vector'][0] = traversal['end'][0] - traversal['start'][0]
        traversal['v_vector'][1] = 0
        traversal['v_vector'][2] = 0

    return traversal

def is_neighbour(row0, col0, row1, col1):
    dr = int(abs(row0 - row1))
    dc = int(abs(col0 - col1))

    return dr <= 1 and dc <= 1

def generate_face_lightmap(buffer, block, face, reverse_normal = False):

    buffer_index = 0
    clear_tmp_buffer()

    traversal = get_face_traversal(block, face)

    row = traversal['start']

    traversal['u_vector'][0] /= lightmap_size
    traversal['u_vector'][1] /= lightmap_size
    traversal['u_vector'][2] /= lightmap_size

    traversal['v_vector'][0] /= lightmap_size
    traversal['v_vector'][1] /= lightmap_size
    traversal['v_vector'][2] /= lightmap_size

    if reverse_normal:
        traversal['normal'][0] *= -1
        traversal['normal'][1] *= -1
        traversal['normal'][2] *= -1

    for y in range(lightmap_size):
        pixel = [row[0], row[1], row[2]]

        for x in range(lightmap_size):

            color = [0, 0, 0]

            # Add all the lights.
            for light in level['lights']:

                if light['disabled']:
                    continue

                if debug and light['id'] not in debug_lights:
                    continue

                light_vector = [
                    light['position'][0] - pixel[0],
                    light['position'][1] - pixel[1],
                    light['position'][2] - pixel[2]
                ]

                # if is_neighbour(block['row'], block['col'],
                #                 int(math.floor(light['position'][1])),
                #                 int(math.floor(light['position'][0]))):
                #     occluded = False
                # else:

                light_distance = v3_len(light_vector)

                v3_normalize(light_vector)
                angle = v3_dot(light_vector, traversal['normal'])

                if x == 0 and y == 13:
                    a = 1

                if x == 1 and y == 13:
                    a = 1

                if light_distance < light['radius'] and angle > 0:

                    occluded = is_occluded(light['position'], pixel)

                    if occluded:
                        continue

                # if angle > 0:

                    la = 1 / light['radius']
                    # lc = light['intensity'] * angle / (light_distance * light_distance)
                    lc = light['intensity'] * angle / (8 * light_distance * light_distance + 0.5)
                    # lc = light['intensity'] * angle / light_distance

                    color[0] += light['color'][0] * lc
                    color[1] += light['color'][1] * lc
                    color[2] += light['color'][2] * lc

            clamp(color, 0, 255)
            # reinhard(color)

            tmp_buffer[buffer_index + 0] = color[0]
            tmp_buffer[buffer_index + 1] = color[1]
            tmp_buffer[buffer_index + 2] = color[2]
            tmp_buffer[buffer_index + 3] = 255

            buffer_index += 4

            pixel[0] += traversal['u_vector'][0]
            pixel[1] += traversal['u_vector'][1]
            pixel[2] += traversal['u_vector'][2]

        row[0] += traversal['v_vector'][0]
        row[1] += traversal['v_vector'][1]
        row[2] += traversal['v_vector'][2]

    filter_lightmap(tmp_buffer, buffer)

def generate_lightmaps(level, buffer, block):

    if block['type'] == Block.EMPTY:

        empty_block = {
            'row': block['row'],
            'col': block['col'],
            'low_z': 0,
            'high_z': level['height']
        }

        block['ceiling_lightmap'] = len(buffer)
        generate_face_lightmap(buffer, empty_block, Face.TOP, True)

        block['floor_lightmap'] = len(buffer)
        generate_face_lightmap(buffer, empty_block, Face.BOTTOM, True)

    elif block['type'] == Block.WALL:

        block['lightmaps'][Face.LEFT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.LEFT)

        block['lightmaps'][Face.RIGHT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.RIGHT)

        block['lightmaps'][Face.FRONT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.FRONT)

        block['lightmaps'][Face.BACK] = len(buffer)
        generate_face_lightmap(buffer, block, Face.BACK)

        empty_block = {
            'row': block['row'],
            'col': block['col'],
            'low_z': 0,
            'high_z': level['height']
        }

        block['ceiling_lightmap'] = len(buffer)
        generate_face_lightmap(buffer, empty_block, Face.TOP, True)

        block['floor_lightmap'] = len(buffer)
        generate_face_lightmap(buffer, empty_block, Face.BOTTOM, True)

    elif block['type'] == Block.HALFWALL_TOP:

        block['lightmaps'][Face.LEFT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.LEFT)

        block['lightmaps'][Face.RIGHT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.RIGHT)

        block['lightmaps'][Face.FRONT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.FRONT)

        block['lightmaps'][Face.BACK] = len(buffer)
        generate_face_lightmap(buffer, block, Face.BACK)

        block['lightmaps'][Face.BOTTOM] = len(buffer)
        generate_face_lightmap(buffer, block, Face.BOTTOM)

        empty_block = {
            'row': block['row'],
            'col': block['col'],
            'low_z': 0,
            'high_z': level['height']
        }

        block['floor_lightmap'] = len(buffer)
        generate_face_lightmap(buffer, empty_block, Face.BOTTOM, True)

    elif block['type'] == Block.HALFWALL_BOTTOM:

        block['lightmaps'][Face.LEFT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.LEFT)

        block['lightmaps'][Face.RIGHT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.RIGHT)

        block['lightmaps'][Face.FRONT] = len(buffer)
        generate_face_lightmap(buffer, block, Face.FRONT)

        block['lightmaps'][Face.BACK] = len(buffer)
        generate_face_lightmap(buffer, block, Face.BACK)

        block['lightmaps'][Face.TOP] = len(buffer)
        generate_face_lightmap(buffer, block, Face.TOP)

        empty_block = {
            'row': block['row'],
            'col': block['col'],
            'low_z': 0,
            'high_z': level['height']
        }

        block['ceiling_lightmap'] = len(buffer)
        generate_face_lightmap(buffer, empty_block, Face.TOP, True)

# ----------------------------------------------------------------------------------
# usage: python generate_lightmaps.py map
# ----------------------------------------------------------------------------------

lightmap_size = 16
argv = sys.argv
argv = ['', 'world']
argc = len(argv)

debug = False
debug_lights = [10]

tmp_buffer_len = lightmap_size * lightmap_size * 4
tmp_buffer = [0] * tmp_buffer_len

def clear_tmp_buffer():
    for i in range(tmp_buffer_len):
        tmp_buffer[i] = 0

if argc == 1:
    print("> No map was specified")
else:
    map_filepath = "src/raycaster/assets/" + argv[1] + "/map.json"
    out_filepath = "src/raycaster/assets/" + argv[1] + "/lightmaps.json"

    lightmap_buffer = []

    if not os.path.isfile(map_filepath):
        print('> Missing map \'%s\'' % map_filepath)
    else:
        map_file = open(map_filepath, 'r')
        level = json.load(map_file)
        map_file.close()

        for block in level['data']:
            # if (block['row'] == 38 and block['col'] == 2):
                generate_lightmaps(level, lightmap_buffer, block)

        # print(lightmap_buffer)

        # Save the generated lightmaps.
        out_file = open(out_filepath, 'w')
        json.dump(lightmap_buffer, out_file)
        out_file.close()

        # Save the updated map.
        out_map_file = open(map_filepath, 'w')
        json.dump(level, out_map_file)
        out_map_file.close()
