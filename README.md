# NodeRife

NodeRife is a commandline tool written in node.js to automate the use of ncnn-rife-vulkan!

## Setup

### Using a pre-built binary

```bash
./setup.sh
```
### Building from source
Install these packages with your respective package manager
```bash
dnf install vulkan-headers vulkan-loader-devel ffmpeg
```
```bash
apt-get install libvulkan-dev ffmpeg
```
```bash
pacman -S vulkan-headers vulkan-icd-loader ffmpeg
```
Then run the setup script with the `--build` flag
```bash
./setup.sh --build
```


## Usage

```
node interpolate.js [video to interpolate]
    -model [path to interpolation model] ==> specify the interpolation model to use
    -tta ==> enables TTA
    -uhd ==> enables UHD mode for high resolution videos
    -gpu [GPU ID] ==> enables GPU processing, and specifying which GPU to use
```

