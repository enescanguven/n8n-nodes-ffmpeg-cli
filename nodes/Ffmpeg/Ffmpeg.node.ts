import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const FFMPEG_CACHE_PATH = '/tmp/ffmpeg_bin';

function getFfmpegPath(): { bin: string; debug: string } {
	const tried: string[] = [];

	// 1) Check cached download from previous run
	if (existsSync(FFMPEG_CACHE_PATH)) {
		tried.push(`cached binary found at ${FFMPEG_CACHE_PATH}`);
		return { bin: FFMPEG_CACHE_PATH, debug: tried.join('; ') };
	}

	// 2) Try require('ffmpeg-static')
	try {
		const ffmpegStatic = require('ffmpeg-static') as string;
		tried.push(`ffmpeg-static resolved: ${ffmpegStatic}`);
		if (ffmpegStatic && existsSync(ffmpegStatic)) {
			chmodSync(ffmpegStatic, 0o755);
			return { bin: ffmpegStatic, debug: tried.join('; ') };
		}
		tried.push(`but file does not exist`);
	} catch (e: any) {
		tried.push(`ffmpeg-static require failed: ${e.message}`);
	}

	// 3) Try system ffmpeg
	try {
		const systemPath = execSync('which ffmpeg 2>/dev/null').toString().trim();
		if (systemPath) {
			tried.push(`system ffmpeg: ${systemPath}`);
			return { bin: systemPath, debug: tried.join('; ') };
		}
	} catch {
		tried.push('system ffmpeg not found');
	}

	// 4) Download static ffmpeg binary
	tried.push('downloading ffmpeg static binary...');
	try {
		execSync(
			`curl -sL "https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-linux-x64" -o "${FFMPEG_CACHE_PATH}" && chmod +x "${FFMPEG_CACHE_PATH}"`,
			{ timeout: 120000 },
		);
		if (existsSync(FFMPEG_CACHE_PATH)) {
			tried.push('download successful');
			return { bin: FFMPEG_CACHE_PATH, debug: tried.join('; ') };
		}
	} catch (e: any) {
		tried.push(`download failed: ${e.message}`);
	}

	// 5) Try apk install as last resort
	try {
		execSync('apk add --no-cache ffmpeg 2>/dev/null', { timeout: 60000 });
		const apkPath = execSync('which ffmpeg 2>/dev/null').toString().trim();
		if (apkPath) {
			tried.push(`apk install succeeded: ${apkPath}`);
			return { bin: apkPath, debug: tried.join('; ') };
		}
	} catch {
		tried.push('apk install failed');
	}

	return { bin: 'ffmpeg', debug: tried.join('; ') };
}

export class Ffmpeg implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FFmpeg',
		name: 'ffmpeg',
		group: ['transform'],
		version: 1,
		description: 'Run any FFmpeg command on media files',
		defaults: {
			name: 'FFmpeg',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
		properties: [
			{
				displayName: 'FFmpeg Command',
				name: 'command',
				type: 'string',
				default: '-i {input} -c:v copy -c:a aac {output}',
				description: 'FFmpeg arguments. Use placeholders: {input}, {output}, and any binary property name in curly braces like {audio}, {video}, {image} etc.',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Input Binary Properties',
				name: 'inputBinaries',
				type: 'string',
				default: 'data',
				description: 'Comma-separated list of binary property names to make available as temp files. Each becomes a {name} placeholder in the command.',
			},
			{
				displayName: 'Output File Extension',
				name: 'outputExtension',
				type: 'string',
				default: 'mp4',
				description: 'File extension for the output file (mp4, mp3, wav, gif, etc.)',
			},
			{
				displayName: 'Output Binary Property',
				name: 'outputBinaryProperty',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property to store the output file in',
			},
			{
				displayName: 'Output File Name',
				name: 'outputFileName',
				type: 'string',
				default: 'output.mp4',
				description: 'File name for the output',
			},
			{
				displayName: 'Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				default: 120,
				description: 'Maximum time to wait for FFmpeg to finish',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const id = randomUUID();
			const tmpDir = '/tmp';
			const tempFiles: string[] = [];

			const { bin: ffmpegBin, debug: ffmpegDebug } = getFfmpegPath();

			try {
				let command = this.getNodeParameter('command', i) as string;
				const inputBinaries = (this.getNodeParameter('inputBinaries', i) as string)
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
				const outputExtension = this.getNodeParameter('outputExtension', i) as string;
				const outputBinaryProperty = this.getNodeParameter('outputBinaryProperty', i) as string;
				const outputFileName = this.getNodeParameter('outputFileName', i) as string;
				const timeout = (this.getNodeParameter('timeout', i) as number) * 1000;

				const outputPath = join(tmpDir, `ffmpeg_out_${id}.${outputExtension}`);
				tempFiles.push(outputPath);

				// Write each binary property to a temp file and replace placeholder
				for (const propName of inputBinaries) {
					if (items[i].binary && items[i].binary![propName]) {
						const binaryData = await this.helpers.getBinaryDataBuffer(i, propName);
						const mimeType = items[i].binary![propName].mimeType || '';
						let ext = 'bin';
						if (mimeType.includes('video')) ext = 'mp4';
						else if (mimeType.includes('audio/mpeg')) ext = 'mp3';
						else if (mimeType.includes('audio')) ext = 'aac';
						else if (mimeType.includes('image/png')) ext = 'png';
						else if (mimeType.includes('image')) ext = 'jpg';

						const filePath = join(tmpDir, `ffmpeg_${propName}_${id}.${ext}`);
						writeFileSync(filePath, binaryData);
						tempFiles.push(filePath);

						// Replace {propName} placeholder
						const placeholder = new RegExp(`\\{${propName}\\}`, 'g');
						command = command.replace(placeholder, filePath);

						// Also replace {input} with the first binary if it matches 'data' or is the first one
						if (propName === inputBinaries[0]) {
							command = command.replace(/\{input\}/g, filePath);
						}
					}
				}

				// Replace {output} placeholder
				command = command.replace(/\{output\}/g, outputPath);

				// Run FFmpeg
				const fullCommand = `"${ffmpegBin}" -y ${command}`;
				execSync(fullCommand, {
					timeout,
					stdio: ['pipe', 'pipe', 'pipe'],
				});

				// Read output and create binary
				const outputData = readFileSync(outputPath);
				const mimeType = outputExtension === 'mp3' ? 'audio/mpeg'
					: outputExtension === 'wav' ? 'audio/wav'
					: outputExtension === 'gif' ? 'image/gif'
					: outputExtension === 'png' ? 'image/png'
					: outputExtension === 'jpg' ? 'image/jpeg'
					: `video/${outputExtension}`;

				const binaryData = await this.helpers.prepareBinaryData(
					Buffer.from(outputData),
					outputFileName,
					mimeType,
				);

				returnData.push({
					json: {
						success: true,
						command: fullCommand,
						outputSize: outputData.length,
					},
					binary: { [outputBinaryProperty]: binaryData },
				});
			} catch (error: any) {
				returnData.push({
					json: {
						success: false,
						error: error.message,
						stderr: error.stderr?.toString() || '',
						ffmpegBin,
						ffmpegDebug,
						nodeDir: __dirname,
					},
				});
			} finally {
				// Cleanup
				for (const f of tempFiles) {
					try { unlinkSync(f); } catch {}
				}
			}
		}

		return [returnData];
	}
}
