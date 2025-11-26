# Video Caption Generator

A web application that auto-generates captions for videos using Google Cloud Speech-to-Text and renders them with Remotion.

## Features

- **Auto-Caption Generation**: Google Cloud Speech-to-Text API
- **Multiple Caption Styles**: Bottom-centered, top-bar, karaoke
- **Real-time Preview**: Remotion Player
- **Video Export**: Render captioned videos as MP4
- **Large File Support**: Direct GCS upload for files >30MB

## Tech Stack

- Next.js 14, React 18, TypeScript
- Remotion 4.x for video rendering
- Google Cloud Speech-to-Text & Cloud Storage
- FFmpeg for audio extraction

## Setup

### Prerequisites

- Node.js v18+
- FFmpeg installed
- Google Cloud account with:
  - Speech-to-Text API enabled
  - Cloud Storage bucket
  - Service account JSON key

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=./key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```

### Run Development Server

```bash
npm run dev
```

## Docker Deployment

### Build

```bash
docker build -t video-caption-generator .
```

### Run

```bash
docker run -p 3000:3000 \
  -e GOOGLE_CREDENTIALS_BASE64="$(base64 -w 0 key.json)" \
  -e GOOGLE_CLOUD_PROJECT_ID=your-project-id \
  -e GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name \
  video-caption-generator
```

## GCP Cloud Run Deployment

1. Push image to Artifact Registry
2. Deploy to Cloud Run with:
   - 4GB memory, 2 CPU
   - 1-hour timeout
   - Secret Manager for credentials

## API Endpoints

- `POST /api/upload` - Upload video and generate captions (files <30MB)
- `POST /api/generate-upload-url` - Get signed URL for direct GCS upload
- `POST /api/process-video` - Process video from GCS
- `POST /api/render` - Render video with captions

## License

MIT
