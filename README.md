# n8n-nodes-ffmpeg-cli

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ffmpeg-cli.svg)](https://www.npmjs.com/package/n8n-nodes-ffmpeg-cli)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-ffmpeg-cli.svg)](https://www.npmjs.com/package/n8n-nodes-ffmpeg-cli)
[![license](https://img.shields.io/npm/l/n8n-nodes-ffmpeg-cli.svg)](https://github.com/enescanguven/n8n-nodes-ffmpeg/blob/main/LICENSE)

Run **any** FFmpeg command directly inside your [n8n](https://n8n.io) workflows.

**[npm](https://www.npmjs.com/package/n8n-nodes-ffmpeg-cli)** | **[GitHub](https://github.com/enescanguven/n8n-nodes-ffmpeg)**

---

## Why?

You're going to ask AI to write the FFmpeg command anyway. Other nodes hide FFmpeg behind dropdowns and limited presets — this one just lets you paste the command. Done.

```
-i {input} -vf "fps=10,scale=320:-1" -loop 0 {output}
```

## Install

**Settings > Community Nodes > Install >** `n8n-nodes-ffmpeg-cli`

FFmpeg binary is handled automatically at runtime. No manual installation needed.

## Usage

Use `{input}`, `{output}`, or any binary property name as placeholder (`{video}`, `{audio}`, `{image}`, etc).

```
-i {video} -i {audio} -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest {output}
```

## License

MIT
