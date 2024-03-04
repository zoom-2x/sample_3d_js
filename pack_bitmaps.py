import sys
import struct
import os
import json
import math

# NOTE(gabic): flipped is not implemented
def read_bitmap(filepath, json_buffer, flipped = False):

    if not os.path.isfile(filepath):
        print('Missing file %s !' % filepath)
        return 0

    res = 0
    input_bitmap = open(filepath, 'rb')

    bmp_header_format = '<ccIHHIIiiHHII'
    header_bytes = struct.calcsize(bmp_header_format)
    bmp_header = input_bitmap.read(header_bytes)
    header_struct = struct.unpack(bmp_header_format, bmp_header)

    if header_struct[0] == b'B' and header_struct[1] == b'M':

        data_offset = header_struct[5]
        width = header_struct[7]
        height = header_struct[8]
        total_pixels = width * height
        bits_per_pixel = header_struct[10]

        # Aseprite (for now) exports BMP files with the wrong header data bytes
        # so the size of the data portion of the bitmap will be computed manually
        # size_of_bitmap = header_struct[12]
        size_of_bitmap = (bits_per_pixel >> 3) * total_pixels
        has_alpha = bits_per_pixel == 32

        # rgb or rgba format required
        if bits_per_pixel >= 24:

            json_buffer['size'].append(width)
            json_buffer['size'].append(height)
            json_buffer['shift'].append(int(math.log2(width)))

            input_bitmap.seek(data_offset)
            pixel_data = input_bitmap.read(size_of_bitmap)
            channel_stride = 4 if has_alpha else 3

            # Exported textures have a rgba format.
            res = total_pixels << 2

            stride = width * channel_stride
            row_pointer = ((height - 1) * width) * channel_stride

            for y in range(height):
                for x in range(width):
                    pixel_base = row_pointer + (x * channel_stride)

                    # pixel channel format: BGRA.
                    r = pixel_data[pixel_base + 2]
                    g = pixel_data[pixel_base + 1]
                    b = pixel_data[pixel_base + 0]

                    if has_alpha:
                        a = pixel_data[pixel_base + 3]
                    else:
                        a = 255

                    json_buffer['data'].append(r)
                    json_buffer['data'].append(g)
                    json_buffer['data'].append(b)
                    json_buffer['data'].append(a)

                row_pointer -= stride
        else:
            print('Invalid bitmap channel setup (rgb or rgba required) %s\n' % filepath)

    else:
        print('Invalid bitmap file %s\n' % filepath)

    input_bitmap.close()

    return res

def output(stream, out, nl = False):
    stream.write('// ---------------------------------------------------\n')

    if (type(out) is str):
        stream.write('// -- %s\n' % str)
    elif (type(out) is list):
        for s in out:
            if (type(s) is str):
                stream.write('// -- %s\n' % s)

    stream.write('// ---------------------------------------------------\n')

    if nl:
        stream.write('\n')

# ----------------------------------------------------------------------------------
# -- Globals.
# ----------------------------------------------------------------------------------

bmp_reader = {
    'flipped': False,
    'output': None,

    'json': {
        'name': [],
        'size': [],
        'shift': [],
        'offset': [],
        'data': [],
    }
}

# ----------------------------------------------------------------------------------
# -- Read the config file.
# ----------------------------------------------------------------------------------

def read_config(filepath):
    config_json_file = open(filepath, 'r')
    config = json.load(config_json_file)

    bmp_reader['output'] = open(config['output_dir'] + '/' + config['name'] + '.json', 'w')

    if 'list' in config:

        for path in config['list']:

            print('> ' + path)

            texture_index = len(bmp_reader['json']['data'])
            bitmap_len = read_bitmap(path, bmp_reader['json'], bmp_reader['flipped'])

            if bitmap_len:
                bmp_reader['json']['name'].append(path)
                bmp_reader['json']['offset'].append(texture_index)
                texture_index += bitmap_len

        json.dump(bmp_reader['json'], bmp_reader['output'])

    bmp_reader['output'].close()
    config_json_file.close()

# ----------------------------------------------------------------------------------
# usage: python pack_bitmaps.py [option] package
# options:
#   -f: flipped xy axis (for raycasting use)
# ----------------------------------------------------------------------------------

argv = sys.argv
argc = len(argv)

if argc == 1:
    print("> No texture package was specified")
else:
    bmp_reader['flipped'] = False
    package_config = argv[argc - 1]

    if package_config != '-':
        for i, arg in enumerate(argv):
            if i > 0 and arg[0] == '-':
                if arg == '-f':
                    bmp_reader['flipped'] = True

        if not os.path.isfile(package_config):
            print('> Missing file \'%s\'' % package_config)
        else:
            read_config(package_config)
    else:
        print("> No texture package was specified !")