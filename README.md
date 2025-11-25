# Remotion Captioning Platform

A full-stack web application that allows users to upload MP4 videos, automatically generate captions using Google Cloud Speech-to-Text, and render those captions onto videos using Remotion. The application supports Hinglish (Hindi + English) with proper font rendering and offers multiple caption styles.

## 🌟 Features

- **Video Upload**: Clean UI for uploading .mp4 video files
- **Auto-Caption Generation**: Uses Google Cloud Speech-to-Text API for accurate transcription
- **Hinglish Support**: Proper rendering of mixed Hindi (Devanagari) and English text using Noto Sans fonts
- **Multiple Caption Styles**:
  - Bottom-centered subtitles (standard)
  - Top-bar captions (news-style)
  - Karaoke-style highlighting (word-by-word)
- **Real-time Preview**: Preview captions on video using Remotion Player
- **Video Export**: Render and download the final captioned video as MP4

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Video Rendering**: Remotion 4.x
- **Speech-to-Text**: Google Cloud Speech-to-Text API
- **Storage**: Google Cloud Storage
- **Audio Processing**: FFmpeg via fluent-ffmpeg
- **Styling**: CSS Modules
- **Fonts**: Noto Sans, Noto Sans Devanagari

## 📋 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **FFmpeg**: Installed and available in system PATH
- **Google Cloud Platform Account** with:
  - Speech-to-Text API enabled
  - Cloud Storage bucket created
  - Service account with appropriate permissions

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd remotion-caption-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

### 4. Google Cloud Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Cloud Speech-to-Text API
   - Cloud Storage API
3. Create a service account:
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Grant roles: "Speech-to-Text Admin" and "Storage Object Admin"
   - Create and download a JSON key file
4. Create a Cloud Storage bucket:
   - Go to Cloud Storage
   - Create a new bucket (e.g., "captiongenerator")
   - Set appropriate permissions

5. Place your service account key file as `key.json` in the project root

### 5. Environment Variables

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS=./key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Upload Video**: Click "Choose Video File" and select an MP4 file
2. **Generate Captions**: Click "Auto-generate Captions" button
   - The app will extract audio from the video
   - Send audio to Google Cloud Speech-to-Text
   - Display generated captions with timestamps
3. **Select Style**: Choose from three caption styles:
   - Bottom Centered: Traditional subtitle style at the bottom
   - Top Bar: News-style captions at the top
   - Karaoke Style: Word-by-word highlighting effect
4. **Preview**: View the video with captions in the Remotion Player
5. **Export**: Click "Export Video" to render the final video with captions
6. **Download**: Download the rendered MP4 file

## 🎨 Caption Styles

### Bottom-Centered
- Traditional subtitle placement at the bottom
- Semi-transparent black background
- White text with proper line spacing
- Best for general content

### Top-Bar
- Full-width bar at the top
- News broadcast style
- Solid dark background
- Ideal for informative content

### Karaoke
- Word-by-word highlighting
- Yellow color for active word
- Center-aligned
- Great for music videos and lyrics

