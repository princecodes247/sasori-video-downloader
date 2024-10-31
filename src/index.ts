import express, { Request, Response } from 'express';
import ytdl from 'ytdl-core';
import axios from 'axios';
import { SocialMediaDownloader } from './core/downloader';

const app = express();
const PORT = process.env.PORT || 3000;

// YouTube video download endpoint
app.get('/download', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;
  const downloader = new SocialMediaDownloader();

  try {
    const videoInfo = await downloader.downloadVideo(videoUrl);
    console.log('Video download completed:', videoInfo);

    res.header('Content-Disposition', `attachment; filename="${videoInfo.outputPath}"`);
    // downloader.downloadFile(videoInfo.videoUrl, res);
    res.redirect(videoInfo.videoUrl);
  } catch (error) {
    console.log({error})
    res.status(500).json({ error: 'Failed to download video', log: error });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
