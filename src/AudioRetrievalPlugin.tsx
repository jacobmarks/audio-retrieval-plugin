import React, { useState } from "react";
import { registerComponent, PluginComponentType } from "@fiftyone/plugins";
import { useOperatorExecutor } from "@fiftyone/operators";
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Input,
  Grid,
} from "@mui/material";
import { useDropzone } from "react-dropzone";

export default function AudioRetrievalPanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [numResults, setNumResults] = useState(50);

  const operatorExecutor = useOperatorExecutor(
    "@jacobmarks/audio_retrieval/search_images_from_audio"
  );

  const executeSearch = () => {
    let payload = {
      num_results: numResults,
    };

    if (selectedFile) {
      console.log("Selected file: ", selectedFile);
      const reader = new FileReader();
      console.log("Before reading file");
      reader.readAsArrayBuffer(selectedFile); // Read the file as an ArrayBuffer

      reader.onerror = (event) => {
        console.error(`File read error: ${event.target.error}`);
      };
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          console.log(`File read progress: ${event.loaded / event.total}`);
        }
      };
      // console.log("Size of ArrayBuffer: ", reader.result.byteLength);
      console.log("After reading file");
      // reader.onerror = (error) => console.log('FileReader error: ', error);
      reader.onloadend = () => {
        if (reader.readyState === FileReader.DONE) {
          // Convert ArrayBuffer to Base64
          let chunks = [];
          let u8 = new Uint8Array(reader.result);
          for (let i = 0; i < u8.length; i += 1024) {
            chunks.push(
              String.fromCharCode.apply(null, u8.subarray(i, i + 1024))
            );
          }
          const base64String = btoa(chunks.join(""));
          console.log(base64String);

          payload["file_data"] = base64String;
          console.log(payload);
          operatorExecutor.execute(payload);
        }
      };
    }
  };

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: "audio/*",
    onDrop: (acceptedFiles) => {
      setSelectedFile(
        Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0]),
        })
      );
    },
  });

  return (
    <Box p={4}>
      <Typography variant="h6">Search Images with Audio</Typography>

      <Box display="flex" justifyContent="space-between">
        <FormControl style={{ width: "45%" }} margin="normal">
          <InputLabel htmlFor="num-samples">Number of Samples</InputLabel>
          <Input
            id="num-samples"
            type="number"
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value, 10))}
          />
        </FormControl>
      </Box>
      <Box mt={4}>
        {" "}
        <Typography variant="h6">Select Audio</Typography>
      </Box>

      <Grid container alignItems="center" spacing={2}>
        {
          <Box
            {...getRootProps()}
            sx={{
              padding: 2,
              border: "2px dashed gray",
              minHeight: "56px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input {...getInputProps()} />
            <Typography>
              {isDragActive
                ? "Drop the audio file here ..."
                : "Drag 'n' drop a file here, or click to select one"}
            </Typography>
          </Box>
        }
      </Grid>

      {/* Audio Preview */}
      {selectedFile && selectedFile.type.startsWith("audio/") && (
        <Box
          sx={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
        >
          <audio controls>
            <source src={selectedFile.preview} type={selectedFile.type} />
            Your browser does not support the audio element.
          </audio>
        </Box>
      )}

      <Box
        sx={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        <Button variant="contained" onClick={executeSearch}>
          Search
        </Button>
      </Box>
    </Box>
  );
}

const AudioIcon = ({ size = 41, style = {} }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-name="Layer 1"
      viewBox="15 -20 128 160"
      x="0px"
      y="0px"
      width={size}
      height={size}
    >
      <path
        fill="white"
        d="M10.373,56.736V38.263c0-1.5-1.216-2.716-2.716-2.716S4.94,36.763,4.94,38.263v18.473c0,1.501,1.216,2.717,2.717,2.717  S10.373,58.237,10.373,56.736z"
      />
      <path
        fill="white"
        d="M13.794,33.917v28.615c0,1.5,1.216,2.716,2.717,2.716s2.716-1.216,2.716-2.716V33.917c0-1.5-1.216-2.717-2.716-2.717  S13.794,32.417,13.794,33.917z"
      />
      <path
        fill="white"
        d="M22.648,20.877v53.245c0,1.5,1.216,2.717,2.716,2.717s2.717-1.216,2.717-2.717V20.877c0-1.5-1.216-2.717-2.717-2.717  S22.648,19.377,22.648,20.877z"
      />
      <path
        fill="white"
        d="M31.502,35.366v24.268c0,1.5,1.216,2.717,2.717,2.717s2.716-1.216,2.716-2.717V35.366c0-1.5-1.216-2.717-2.716-2.717  S31.502,33.865,31.502,35.366z"
      />
      <path
        fill="white"
        d="M40.356,13.633v67.733c0,1.5,1.216,2.717,2.717,2.717s2.717-1.216,2.717-2.717V13.633c0-1.501-1.216-2.717-2.717-2.717  S40.356,12.132,40.356,13.633z"
      />
      <path
        fill="white"
        d="M49.21,28.122v38.756c0,1.5,1.216,2.717,2.716,2.717s2.717-1.216,2.717-2.717V28.122c0-1.5-1.216-2.717-2.717-2.717  S49.21,26.621,49.21,28.122z"
      />
      <path
        fill="white"
        d="M58.064,33.917v28.615c0,1.5,1.216,2.716,2.717,2.716s2.716-1.216,2.716-2.716V33.917c0-1.5-1.216-2.717-2.716-2.717  S58.064,32.417,58.064,33.917z"
      />
      <path
        fill="white"
        d="M66.918,20.877v54.693c0,1.501,1.216,2.717,2.716,2.717s2.717-1.216,2.717-2.717V20.877c0-1.5-1.216-2.717-2.717-2.717  S66.918,19.377,66.918,20.877z"
      />
      <path
        fill="white"
        d="M75.772,35.366v25.717c0,1.5,1.216,2.717,2.717,2.717s2.716-1.216,2.716-2.717V35.366c0-1.5-1.216-2.717-2.716-2.717  S75.772,33.865,75.772,35.366z"
      />
      <path
        fill="white"
        d="M90.06,55.287V39.712c0-1.5-1.216-2.717-2.717-2.717s-2.716,1.216-2.716,2.717v15.575c0,1.5,1.216,2.717,2.716,2.717  S90.06,56.788,90.06,55.287z"
      />
    </svg>
  );
};

registerComponent({
  name: "AudioRetrievalPanel",
  label: "Search Images by Audio",
  component: AudioRetrievalPanel,
  type: PluginComponentType.Panel,
  Icon: () => <AudioIcon size={"1rem"} style={{ marginRight: "0.5rem" }} />,
});
