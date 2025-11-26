import { SpeechClient, protos } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
const ffmpeg = require('fluent-ffmpeg');

type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig;
const AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

const speechClient = new SpeechClient();
const storage = new Storage();

const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'captiongenerator';

export interface CaptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  words?: WordInfo[];
}

export interface WordInfo {
  word: string;
  startTime: number;
  endTime: number;
}

async function uploadToGCS(filePath: string, destination: string): Promise<string> {
  try {
    await storage.bucket(BUCKET_NAME).upload(filePath, {
      destination: destination,
    });
    return `gs://${BUCKET_NAME}/${destination}`;
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

export async function transcribeAudio(audioFilePath: string): Promise<CaptionSegment[]> {
  try {
    const fileName = path.basename(audioFilePath);
    const gcsPath = `audio-files/${Date.now()}-${fileName}`;
    
    console.log('Uploading audio to Google Cloud Storage...');
    const gcsUri = await uploadToGCS(audioFilePath, gcsPath);
    
    const audio = {
      uri: gcsUri,
    };

    const config: IRecognitionConfig = {
      encoding: AudioEncoding.MP3,
      sampleRateHertz: 44100,
      languageCode: 'en-US',
      alternativeLanguageCodes: ['hi-IN'],
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'latest_long',
    };

    console.log('Starting transcription...');
    const [operation] = await speechClient.longRunningRecognize({
      config: config,
      audio: audio,
    });

    console.log('Waiting for transcription to complete...');
    const [response] = await operation.promise();

    const captions: CaptionSegment[] = [];
    
    if (response.results) {
      for (const result of response.results) {
        if (result.alternatives && result.alternatives[0]) {
          const alternative = result.alternatives[0];
          
          if (alternative.words && alternative.words.length > 0) {
            const words = alternative.words.map(wordInfo => ({
              word: wordInfo.word || '',
              startTime: wordInfo.startTime?.seconds ? 
                Number(wordInfo.startTime.seconds) + (wordInfo.startTime.nanos || 0) / 1e9 : 0,
              endTime: wordInfo.endTime?.seconds ? 
                Number(wordInfo.endTime.seconds) + (wordInfo.endTime.nanos || 0) / 1e9 : 0,
            }));

            let currentSegment = '';
            let segmentStart = words[0].startTime;
            let segmentWords: WordInfo[] = [];

            for (let i = 0; i < words.length; i++) {
              currentSegment += words[i].word + ' ';
              segmentWords.push(words[i]);

              const shouldBreak = 
                currentSegment.split(' ').length >= 10 ||
                i === words.length - 1 ||
                (words[i + 1] && words[i + 1].startTime - words[i].endTime > 1.0);

              if (shouldBreak) {
                captions.push({
                  text: currentSegment.trim(),
                  startTime: segmentStart,
                  endTime: words[i].endTime,
                  words: segmentWords,
                });
                
                if (i < words.length - 1) {
                  currentSegment = '';
                  segmentStart = words[i + 1].startTime;
                  segmentWords = [];
                }
              }
            }
          } else {
            const text = alternative.transcript || '';
            if (text) {
              captions.push({
                text: text,
                startTime: 0,
                endTime: 0,
                words: [],
              });
            }
          }
        }
      }
    }

    console.log(`Generated ${captions.length} caption segments`);
    return captions;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
}

export async function extractAudioFromVideo(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .audioFrequency(44100)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}
