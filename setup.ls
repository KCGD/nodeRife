#!/bin/bash

if [ "$1" = "--build" ]; then

    #run build
    npm i
    #git clone https://github.com/nihui/rife-ncnn-vulkan.git
    cd rife-ncnn-vulkan
    #git submodule update --init --recursive
    #mkdir build
    cd build
    cmake ../src
    cmake --build . -j$(nproc)
    echo done
else

    #install from prebuild
    npm i
    wget "https://github.com/nihui/rife-ncnn-vulkan/releases/download/20210520/rife-ncnn-vulkan-20210520-ubuntu.zip" -O rife.zip
    mkdir -p "./rife-ncnn-vulkan"
    unzip rife.zip -d "./rife-ncnn-vulkan"
    mv "./rife-ncnn-vulkan/rife-ncnn-vulkan-20210520-ubuntu" "./rife-ncnn-vulkan/build"
    rm rife.zip
    echo done
fi

