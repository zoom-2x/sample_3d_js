import sys
import os
import json
import math

argv = sys.argv
argc = len(argv)

def read_config(filepath):
    config_json_file = open(filepath, 'r')
    config = json.load(config_json_file)

    if 'list' in config:

        for path in config['list']:

            obj_file = open(path, 'r')
            name = os.path.splitext(os.path.basename(path))[0]
            out_path = config['output_dir'] + '/' + name + ".json"
            print('> ' + out_path)
            out_file = open(out_path, "w")

            obj_json = {
                "faces": 0,
                "vertex": [],
                "uv": [],
                "normal": [],
                "face": []
            }

            for line in obj_file:

                if line[0:2] == 'v ':
                    vl = line[2:].rstrip().split(' ')

                    for d in vl:
                        obj_json['vertex'].append(float(d))

                elif line[0:3] == 'vt ':
                    vl = line[3:].rstrip().split(' ')

                    for d in vl:
                        obj_json['uv'].append(float(d))

                elif line[0:3] == 'vn ':
                    vl = line[3:].rstrip().split(' ')

                    for d in vl:
                        obj_json['normal'].append(float(d))

                elif line[0:2] == 'f ':
                    vl = line[2:].rstrip().split(' ')
                    obj_json['faces'] += 1

                    for d in vl:
                        il = d.split('/')

                        for i in il:
                            obj_json['face'].append(int(i))

            json.dump(obj_json, out_file)

            out_file.close()
            obj_file.close()

    config_json_file.close()

if argc == 1:
    print('> No mesh package was specified')
else:
    package_config = argv[argc - 1]
    # filepath = argv[1]

    if not os.path.isfile(package_config):
        print('> Missing file \'%s\'' % package_config)
    else:
        read_config(package_config)
