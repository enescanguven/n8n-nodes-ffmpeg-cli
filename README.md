# n8n-nodes-ffmpeg-cli

Run **any** FFmpeg command directly inside your n8n workflows. No wrappers, no abstractions — just raw FFmpeg power.

## Why this node?

Other FFmpeg nodes try to wrap FFmpeg behind dropdowns and limited options. This node takes a different approach: **you write the FFmpeg command, it runs it.** If you know FFmpeg, you already know how to use this node.

- Direct FFmpeg command execution — no hidden magic
- Support for multiple binary inputs (`{video}`, `{audio}`, `{image}`, or any name)
- Automatic temp file handling and cleanup
- Works with any FFmpeg operation: transcode, merge, trim, overlay, extract, convert — anything

## Installation

In your n8n instance:

1. Go to **Settings → Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-ffmpeg-cli`
4. Click **Install**

> **Requirement:** FFmpeg must be installed on the machine/container running n8n.

## How it works

1. Binary inputs from previous nodes are written to temp files
2. Placeholders in your command are replaced with actual file paths
3. FFmpeg runs the command
4. Output file is captured as binary data for the next node

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| **FFmpeg Command** | Your FFmpeg arguments with placeholders | `-i {input} -c:v copy -c:a aac {output}` |
| **Input Binary Properties** | Comma-separated binary property names | `data` |
| **Output File Extension** | Extension for the output file | `mp4` |
| **Output Binary Property** | Binary property name for the result | `data` |
| **Output File Name** | File name for the output | `output.mp4` |
| **Timeout (seconds)** | Max execution time | `120` |

## Placeholders

| Placeholder | Resolves to |
|-------------|-------------|
| `{input}` | First binary input file path |
| `{output}` | Output file path |
| `{data}` | Binary property named "data" |
| `{video}` | Binary property named "video" |
| `{audio}` | Binary property named "audio" |
| `{anyname}` | Binary property named "anyname" |

Any binary property name wrapped in curly braces becomes a placeholder.

## Examples

### Replace video audio with a new track

**Input Binary Properties:** `video, audio`

```
-i {video} -i {audio} -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest {output}
```

### Convert video to GIF

**Output File Extension:** `gif`

```
-i {input} -vf "fps=10,scale=320:-1" -loop 0 {output}
```

### Extract audio from video

**Output File Extension:** `mp3`

```
-i {input} -vn -acodec libmp3lame -q:a 2 {output}
```

### Trim video (first 30 seconds)

```
-i {input} -t 30 -c copy {output}
```

### Add image watermark to video

**Input Binary Properties:** `video, watermark`

```
-i {video} -i {watermark} -filter_complex "overlay=10:10" -c:a copy {output}
```

### Resize video to 720p

```
-i {input} -vf "scale=-2:720" -c:a copy {output}
```

### Merge audio and image into video

**Input Binary Properties:** `image, audio`
**Output File Extension:** `mp4`

```
-loop 1 -i {image} -i {audio} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest {output}
```

### Convert to WebM

**Output File Extension:** `webm`

```
-i {input} -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus {output}
```

## Output

On success, the node outputs:

```json
{
  "success": true,
  "command": "ffmpeg -y -i /tmp/ffmpeg_data_xxx.mp4 -c:v copy -c:a aac /tmp/ffmpeg_out_xxx.mp4",
  "outputSize": 1234567
}
```

Plus the binary output file attached to the specified binary property.

On failure:

```json
{
  "success": false,
  "error": "Error message",
  "stderr": "FFmpeg stderr output"
}
```

## Docker / Self-hosted

If your n8n runs in Docker, make sure FFmpeg is installed in the container:

```dockerfile
# Add to your Dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

Or use an n8n image that already includes FFmpeg.

## License

MIT
