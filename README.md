# UnClanked
generate articles from nothing but a URL, in real-time

deployed at https://unclanked.com

## Usage

1. think up a random idea, for example "how many onions can man eat in a day?"
2. visit https://unclanked.com/how-many-onions-can-man-eat-in-a-day
3. enjoy!

Bonus:
sending the link in a chat (discord) will generate an embed with a title, description, and image


### deployment
I did not design this with the thought of other people running it, sorry

You can probably still run it but this readme may not be super helpful in getting there

#### steps
1. build vllm image depending on what cuda version you have
```
DOCKER_BUILDKIT=1 docker build . \
     --target vllm-openai \
     --tag tmux.io/vllm-openai:lb-10_5_2025 \
     --file docker/Dockerfile \
     --build-arg torch_cuda_arch_list="" \
     --build-arg max_jobs=8 \
     --build-arg nvcc_threads=32 \
     --build-arg GDRCOPY_VERSION=2.4-1 \
     --build-arg GDRCOPY_CUDA_VERSION=12.2 \
     --build-arg CUDA_VERSION=12.2.2 \
     --build-arg TARGETPLATFORM=linux/amd64
```

2. `./bin/up.sh`