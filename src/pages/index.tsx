import React, { useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import { Player } from '@remotion/player';
import { CaptionedVideo } from '@/remotion/compositions/CaptionedVideo';
import styles from '@/styles/Home.module.css';
import { 
  API_ENDPOINTS, 
  CAPTION_STYLES, 
  ERROR_MESSAGES,
} from '@/lib/constants';
import type { CaptionSegment } from '@/lib/types';

// Size threshold for direct GCS upload (in bytes) - 30MB
const DIRECT_UPLOAD_THRESHOLD = 30 * 1024 * 1024;

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string>('');
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<(typeof CAPTION_STYLES)[keyof typeof CAPTION_STYLES]>(CAPTION_STYLES.BOTTOM_CENTERED);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderedVideoPath, setRenderedVideoPath] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setError('');
      setCaptions([]);
      setVideoPath('');
      setRenderedVideoPath('');
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setError(ERROR_MESSAGES.SELECT_FILE_FIRST);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Use direct GCS upload for large files (> 30MB)
      if (videoFile.size > DIRECT_UPLOAD_THRESHOLD) {
        await handleDirectGCSUpload();
      } else {
        await handleFormDataUpload();
      }
    } catch (err: any) {
      setError(err.response?.data?.details || err.message || ERROR_MESSAGES.UPLOAD_FAILED);
      setStatus('');
      setUploadProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Direct upload to GCS for large files (bypasses Cloud Run 32MB limit)
  const handleDirectGCSUpload = async () => {
    if (!videoFile) return;

    setStatus('Getting upload URL...');
    
    // Step 1: Get signed upload URL from our API
    const urlResponse = await axios.post(API_ENDPOINTS.GENERATE_UPLOAD_URL, {
      fileName: videoFile.name,
      contentType: videoFile.type || 'video/mp4',
    });

    const { uploadUrl, fileName: gcsFileName, publicUrl } = urlResponse.data;

    setStatus('Uploading video directly to cloud storage...');

    // Step 2: Upload directly to GCS using the signed URL
    await axios.put(uploadUrl, videoFile, {
      headers: {
        'Content-Type': videoFile.type || 'video/mp4',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          // Upload is 0-60%, processing is 60-100%
          const percentCompleted = Math.round((progressEvent.loaded * 60) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      },
    });

    setUploadProgress(65);
    setStatus('Processing video and generating captions...');

    // Step 3: Call process-video API to transcribe
    const processResponse = await axios.post(API_ENDPOINTS.PROCESS_VIDEO, {
      gcsFileName,
      publicUrl,
    });

    setUploadProgress(100);
    setVideoPath(processResponse.data.videoPath);
    setCaptions(processResponse.data.captions);
    setStatus('Captions generated successfully!');
  };

  // Standard form data upload for smaller files
  const handleFormDataUpload = async () => {
    if (!videoFile) return;

    setStatus('Uploading video...');

    const formData = new FormData();
    formData.append('video', videoFile);

    const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          // Upload is typically 0-70%, then processing takes 70-100%
          const percentCompleted = Math.round((progressEvent.loaded * 70) / progressEvent.total);
          setUploadProgress(percentCompleted);
          
          if (percentCompleted >= 70) {
            setStatus('Processing video and generating captions...');
          }
        }
      },
    });

    setUploadProgress(100);
    setVideoPath(response.data.videoPath);
    setCaptions(response.data.captions);
    setStatus('Captions generated successfully!');
  };

  const handleRender = async () => {
    if (!videoPath || !captions || captions.length === 0) {
      setError(ERROR_MESSAGES.GENERATE_CAPTIONS_FIRST);
      return;
    }

    setRenderLoading(true);
    setStatus('Rendering video with captions...');
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.RENDER, {
        videoPath,
        captions,
        style: selectedStyle,
      });

      setRenderedVideoPath(response.data.outputPath);
      setStatus('Video rendered successfully!');
    } catch (err: any) {
      setError(err.response?.data?.details || ERROR_MESSAGES.RENDER_FAILED);
      setStatus('');
    } finally {
      setRenderLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Remotion Captioning Platform</title>
        <meta name="description" content="Auto-generate and render captions on videos" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className={styles.container}>

      <main className={styles.main}>
        <h1 className={styles.title}>Remotion Captioning Platform</h1>
        <p className={styles.description}>
          Upload a video, auto-generate captions, and render them with custom styles
        </p>

        <div className={styles.uploadSection}>
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="video-upload"
          />
          <label htmlFor="video-upload" className={styles.fileLabel}>
            {videoFile ? videoFile.name : 'Choose Video File'}
          </label>

          <button
            onClick={handleUpload}
            disabled={!videoFile || loading}
            className={styles.button}
          >
            {loading ? 'Processing...' : 'Auto-generate Captions'}
          </button>
        </div>

        {loading && uploadProgress > 0 && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${uploadProgress}%` }}
              >
                <span className={styles.progressText}>{uploadProgress.toFixed(0)}%</span>
              </div>
            </div>
            <p className={styles.progressLabel}>
              {uploadProgress < 70 ? 'Uploading video...' : 'Processing and generating captions...'}
            </p>
          </div>
        )}

        {status && <p className={styles.status}>{status}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {captions.length > 0 && (
          <div className={styles.captionsSection}>
            <h2>Generated Captions</h2>
            <div className={styles.captionsList}>
              {captions.map((caption, index) => (
                <div key={index} className={styles.captionItem}>
                  <span className={styles.timestamp}>
                    {caption.startTime.toFixed(2)}s - {caption.endTime.toFixed(2)}s
                  </span>
                  <span className={styles.captionText}>{caption.text}</span>
                </div>
              ))}
            </div>

            <div className={styles.styleSelector}>
              <h3>Select Caption Style:</h3>
              <div className={styles.styleButtons}>
                <button
                  onClick={() => setSelectedStyle(CAPTION_STYLES.BOTTOM_CENTERED)}
                  className={`${styles.styleButton} ${selectedStyle === CAPTION_STYLES.BOTTOM_CENTERED ? styles.active : ''}`}
                >
                  Bottom Centered
                </button>
                <button
                  onClick={() => setSelectedStyle(CAPTION_STYLES.TOP_BAR)}
                  className={`${styles.styleButton} ${selectedStyle === CAPTION_STYLES.TOP_BAR ? styles.active : ''}`}
                >
                  Top Bar
                </button>
                <button
                  onClick={() => setSelectedStyle(CAPTION_STYLES.KARAOKE)}
                  className={`${styles.styleButton} ${selectedStyle === CAPTION_STYLES.KARAOKE ? styles.active : ''}`}
                >
                  Karaoke Style
                </button>
              </div>
            </div>

            {videoPath && (
              <div className={styles.previewSection}>
                <h3>Preview</h3>
                <Player
                  component={CaptionedVideo}
                  inputProps={{
                    videoSrc: videoPath,
                    captions: captions,
                    style: selectedStyle,
                  }}
                  durationInFrames={300}
                  fps={30}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  style={{
                    width: '100%',
                    maxWidth: '800px',
                    aspectRatio: '16/9',
                  }}
                  controls
                />
              </div>
            )}

            <button
              onClick={handleRender}
              disabled={renderLoading}
              className={`${styles.button} ${styles.renderButton}`}
            >
              {renderLoading ? 'Rendering...' : 'Export Video'}
            </button>

            {renderedVideoPath && (
              <div className={styles.downloadSection}>
                <h3>Download Rendered Video</h3>
                <a
                  href={renderedVideoPath}
                  download
                  className={styles.downloadButton}
                >
                  Download MP4
                </a>
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </>
  );
}
