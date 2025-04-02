import os
import ffmpy

import sys, json, numpy as np

#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main():
    #get our data as an array from read_in()
    lines = read_in()

    #create a numpy array
    np_lines = np.array(lines)

    #use numpys sum method to find sum of all elements in the array

    #return the sum to the output stream
    print(np_lines)

    NEW_RESOLUTION = "1280x720"  # Target resolution, constant
    NEW_FPS = 30  # Target frame rate, constant

    curpath = os.getcwd()  # Get current path
    input_dir = os.path.join(curpath, "src", "files")
    output_dir = os.path.join(curpath, "src", "files", "compressed")
    ffmpeg = os.path.join(curpath, "src", "python", "ffmpeg.exe")

    # If there is no Output_Video, create this folder
    if not os.path.exists(output_dir):
        os.mkdir(output_dir)

    # Start to batch encode and compress video transcoding
    video_name = f'{np_lines[0]}'  # A kind of It's meaningless. It's just a useless code. It's just a hole

    ffmpeg_command = (f"{ffmpeg} -i {os.path.join(input_dir, f'{np_lines[0]}{np_lines[1]}')} -y -ab 48k {os.path.join(output_dir, video_name)}_c.mp4")
    print(ffmpeg_command)
    os.system(ffmpeg_command)

    os.system("stop")


#start process
if __name__ == '__main__':
    main()