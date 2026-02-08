# n8n-nodes-ffmpeg-cli

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ffmpeg-cli.svg)](https://www.npmjs.com/package/n8n-nodes-ffmpeg-cli)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-ffmpeg-cli.svg)](https://www.npmjs.com/package/n8n-nodes-ffmpeg-cli)
[![license](https://img.shields.io/npm/l/n8n-nodes-ffmpeg-cli.svg)](https://github.com/enescanguven/n8n-nodes-ffmpeg/blob/main/LICENSE)

Run **any** FFmpeg command directly inside your [n8n](https://n8n.io) workflows.

**[npm](https://www.npmjs.com/package/n8n-nodes-ffmpeg-cli)** | **[GitHub](https://github.com/enescanguven/n8n-nodes-ffmpeg)**

---

## Why?

Let's be honest: you're going to ask AI to write the FFmpeg command anyway.

Every other FFmpeg node tries to "simplify" things by hiding FFmpeg behind dropdowns, limited presets, and abstractions. But FFmpeg already has a perfectly good interface — its command line. And in 2025, AI writes FFmpeg commands better than any dropdown menu ever could.

So why fight it? **Just paste the command.**

```
-i {input} -vf "fps=10,scale=320:-1" -loop 0 {output}
```

That's it. No wrappers, no magic, no learning a new UI on top of FFmpeg. You already know how to use this node.

## Zero Setup

The node **automatically handles FFmpeg installation at runtime**. You don't need to install FFmpeg on your machine, container, or server. On first run, it resolves the binary in this order:

1. Bundled `ffmpeg-static` binary (comes with the package)
2. System FFmpeg (if already installed)
3. Auto-downloads a static FFmpeg binary (cached for future runs)

Just install the node and go.

## Install

In your n8n instance:

1. Go to **Settings > Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-ffmpeg-cli`
4. Done.

## Usage

Write your FFmpeg command using placeholders:

| Placeholder | Description |
|---|---|
| `{input}` | First binary input |
| `{output}` | Output file |
| `{video}`, `{audio}`, `{image}`, `{anything}` | Named binary properties |

### Examples

**Convert to GIF** (output extension: `gif`)
```
-i {input} -vf "fps=10,scale=320:-1" -loop 0 {output}
```

**Extract audio** (output extension: `mp3`)
```
-i {input} -vn -acodec libmp3lame -q:a 2 {output}
```

**Replace audio track** (input binaries: `video, audio`)
```
-i {video} -i {audio} -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest {output}
```

**Trim first 30 seconds**
```
-i {input} -t 30 -c copy {output}
```

**Watermark** (input binaries: `video, watermark`)
```
-i {video} -i {watermark} -filter_complex "overlay=10:10" -c:a copy {output}
```

**Resize to 720p**
```
-i {input} -vf "scale=-2:720" -c:a copy {output}
```

## Parameters

| Parameter | Default | Description |
|---|---|---|
| FFmpeg Command | `-i {input} -c:v copy -c:a aac {output}` | Your FFmpeg arguments |
| Input Binary Properties | `data` | Comma-separated binary property names |
| Output File Extension | `mp4` | Output format |
| Output Binary Property | `data` | Binary property name for result |
| Output File Name | `output.mp4` | Output file name |
| Timeout | `120` | Max execution time in seconds |

## License

MIT
