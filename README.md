## Audio-to-Image Search Plugin 🔉 👉 🖼️

https://github.com/jacobmarks/audio-retrieval-plugin/assets/12500356/5365716f-5d65-4215-b6c4-889ee1d16f65

This plugin allows you to search your dataset for images that are similar to a
given audio clip.

How does it work?

- ImageBind embedding model embeds images and audio clips into a shared space (1024 dim)
- Qdrant similarity index stores the embeddings and allows for fast similarity search
- FiftyOne provides a UI for uploading the audio clip, pre-filtering, and searching the similarity index.

It demonstrates how to work with custom media types in FiftyOne, and how to create custom vector similarity indices.

Note: This plugin is a proof of concept and is not intended for production use.
It works with `ogg` and `wav` audio files, but not `mp3` files, and makes an API
call to replicate rather than running the embedding model locally, to avoid
potential installation issues.

## Watch On Youtube
[![Video Thumbnail](https://img.youtube.com/vi/dn5DA4H9b-o/0.jpg)](https://www.youtube.com/watch?v=dn5DA4H9b-o&list=PLuREAXoPgT0RZrUaT0UpX_HzwKkoB-S9j&index=12)


## Installation

```shell
fiftyone plugins download https://github.com/jacobmarks/audio-retrieval-plugin
```

You will also need to install `replicate` and `qdrant-client`:

```shell
pip install replicate qdrant-client
```

## Operators

### `open_audio_retrieval_panel`

- Opens the audio retrieval panel on click

### `create_imagebind_index`

- Creates an index for the dataset using the ImageBind embedding model. This
  operation can take a little while to run, so it is recommended to run it in
  delegated execution mode. To do so, check the `Delegated` box in the operator's
  modal, and then in a terminal run:

```shell
fiftyone delegated launch
```

### `search_images_from_audio`

- Searches the index for images that are similar to the given audio clip. This
  should be relatively fast, although it may take a minute for the replicate
  server to start up.

## Usage

Before you can use the plugin, you will need to create an account on
[Replicate.com](https://replicate.com/). Once you have created an account, you
can create an API token, and then add this token as an environment variable:

```shell
export REPLICATE_API_TOKEN=<your token>
```

You will also need to start a Qdrant server locally. To do so, start up your
Docker daemon, and then run:

```shell
docker run -p "6333:6333" -p "6334:6334" -d qdrant/qdrant
```

Then, you can run the `create_imagebind_index` operator, and the
`open_audio_retrieval_panel` operator. The latter will open a panel that allows
you to upload an audio clip, and then search for similar images.
