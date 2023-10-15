"""Audio Retrieval plugin.

| Copyright 2017-2023, Voxel51, Inc.
| `voxel51.com <https://voxel51.com/>`_
|
"""

import base64
from bson import json_util
import json

import fiftyone.operators as foo
import fiftyone.operators.types as types
import fiftyone.core.utils as fou

import qdrant_client as qc
import qdrant_client.http.models as qmodels
import replicate


def _to_qdrant_id(_id):
    return _id + "00000000"


def _to_qdrant_ids(ids):
    return [_to_qdrant_id(_id) for _id in ids]


def _to_fiftyone_id(qid):
    return qid.replace("-", "")[:-8]


model_uri = "daanelson/imagebind:0383f62e173dc821ec52663ed22a076d9c970549c209666ac3db181618b7a304"


def _imagebind_embed_image(fp):
    return replicate.run(
        model_uri,
        input={"input": open(fp, "rb"), "modality": "vision"},
    )


def _execution_mode(ctx, inputs):
    delegate = ctx.params.get("delegate", False)

    if delegate:
        description = "Uncheck this box to execute the operation immediately"
    else:
        description = "Check this box to delegate execution of this task"

    inputs.bool(
        "delegate",
        default=False,
        required=True,
        label="Delegate execution?",
        description=description,
        view=types.CheckboxView(),
    )

    if delegate:
        inputs.view(
            "notice",
            types.Notice(
                label=(
                    "You've chosen delegated execution. Note that you must "
                    "have a delegated operation service running in order for "
                    "this task to be processed. See "
                    "https://docs.voxel51.com/plugins/index.html#operators "
                    "for more information"
                )
            ),
        )


def _get_collection_name(dataset):
    return f"imagebind_{dataset.name}"


def _create_index(dataset):
    embeddings, sample_ids = [], []

    for sample in dataset.iter_samples(progress=True):
        if "imagebind_embedding" in sample:
            ie = sample["imagebind_embedding"]
        else:
            ie = _imagebind_embed_image(sample.filepath)
        embeddings.append(ie)
        sample_ids.append(sample.id)

    batch_size = 100

    client = qc.QdrantClient()
    vectors_config = qmodels.VectorParams(
        size=1024,
        distance=qmodels.Distance.COSINE,
    )

    client.recreate_collection(
        collection_name=_get_collection_name(dataset),
        vectors_config=vectors_config,
    )

    for _embeddings, _ids in zip(
        fou.iter_batches(embeddings, batch_size),
        fou.iter_batches(sample_ids, batch_size),
    ):
        client.upsert(
            collection_name=_get_collection_name(dataset),
            points=qmodels.Batch(
                ids=_to_qdrant_ids(_ids),
                payloads=[{"sample_id": _sid} for _sid in _ids],
                vectors=_embeddings,
            ),
        )


class CreateImageBindIndex(foo.Operator):
    @property
    def config(self):
        _config = foo.OperatorConfig(
            name="create_imagebind_index",
            label="Audio Retrieval: Create vector index for images <> audio",
            dynamic=True,
        )
        _config.icon = "/assets/icon.svg"
        return _config

    def resolve_input(self, ctx):
        inputs = types.Object()
        inputs.message(
            "create_image_audio_index",
            label="Audio Retrieval: Create vector index for images <> audio",
        )
        _execution_mode(ctx, inputs)
        return types.Property(inputs)

    def resolve_delegation(self, ctx):
        return ctx.params.get("delegate", False)

    def execute(self, ctx):
        _create_index(ctx.dataset)
        ctx.trigger("reload_dataset")


def _imagebind_embed_audio(audio_data):
    return replicate.run(
        model_uri,
        input={"input": audio_data, "modality": "audio"},
    )


def handle_payload(payload):
    base64_string = payload.get("file_data", "")
    audio_data = base64.b64decode(base64_string)
    return audio_data


def run_audio_image_search(ctx):
    current_ids = ctx.view.values("id")

    _filter = qmodels.Filter(
        must=[qmodels.HasIdCondition(has_id=_to_qdrant_ids(current_ids))]
    )

    dataset = ctx.dataset
    k = int(ctx.params.get("num_results"))

    audio_data = handle_payload(ctx.params)

    TMP_FILE = "tmp.wav"
    ofile = open(TMP_FILE, "wb")
    ofile.write(audio_data)

    query_embedding = _imagebind_embed_audio(open(TMP_FILE, "rb"))

    client = qc.QdrantClient()
    results = client.search(
        collection_name=_get_collection_name(dataset),
        query_vector=query_embedding,
        with_payload=False,
        limit=k,
        query_filter=_filter,
    )

    sample_ids = [_to_fiftyone_id(sc.id) for sc in results]
    view = ctx.dataset.select(sample_ids, ordered=True)
    return view


def serialize_view(view):
    return json.loads(json_util.dumps(view._serialize()))


class OpenAudioRetrievalPanel(foo.Operator):
    @property
    def config(self):
        return foo.OperatorConfig(
            name="open_audio_retrieval_panel",
            label="Audio Retrieval: open audio retrieval panel",
            icon="/assets/icon.svg",
        )

    def resolve_placement(self, ctx):
        return types.Placement(
            types.Places.SAMPLES_GRID_SECONDARY_ACTIONS,
            types.Button(
                label="Audio to Image Search",
                icon="/assets/icon.svg",
                prompt=False,
            ),
        )

    def execute(self, ctx):
        ctx.trigger(
            "open_panel",
            params=dict(
                name="AudioRetrievalPanel", isActive=True, layout="horizontal"
            ),
        )


class RunAudioToImageSearch(foo.Operator):
    @property
    def config(self):
        return foo.OperatorConfig(
            name="search_images_from_audio",
            label="Search Images from Audio",
            unlisted=True,
        )

    def resolve_input(self, ctx):
        inputs = types.Object()
        inputs.int("num_results", label="Number of Results", required=True)
        inputs.str("file_data", label="Image File", required=False)
        return types.Property(inputs)

    def execute(self, ctx):
        view = run_audio_image_search(ctx)
        ctx.trigger(
            "set_view",
            params=dict(view=serialize_view(view)),
        )


def register(p):
    p.register(RunAudioToImageSearch)
    p.register(OpenAudioRetrievalPanel)
    p.register(CreateImageBindIndex)
