import axios from 'axios';
import ytdl from 'ytdl-core';
import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { URLDetector } from '../utils/url-detector';

interface VideoInfo {
  title: string;
  url: string;
  platform: 'youtube' | 'twitter' | 'instagram';
  quality?: string;
  format?: string;
  videoUrl: string
outputPath: string
}

class SocialMediaDownloader {
  private readonly outputDir: string;
  private browser: Browser | null = null;

  constructor(outputDir: string = './downloads') {
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        // headless: "shell",
        // args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        executablePath: `/opt/render/.cache/puppeteer/chrome/linux-130.0.6723.69/chrome-linux64/chrome`,
        args: [`--no-sandbox`, `--headless`, `--disable-gpu`, `--disable-dev-shm-usage`],
      });
    }
    return this.browser;
  }

  async downloadFile(url: string, pipe: string): Promise<void> {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      response.data
        .pipe(pipe)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async downloadYouTubeVideo(url: string, quality: string = 'highest'): Promise<VideoInfo> {
    try {
      const videoInfo = await ytdl.getInfo(url);
      const videoFormat = ytdl.chooseFormat(videoInfo.formats, { quality });
      
      const title = this.sanitizeFilename(videoInfo.videoDetails.title);
      const outputPath = path.join(this.outputDir, `${title}.mp4`);
        console.log("outputPath", outputPath)
      return new Promise((resolve, reject) => {
        const videoStream = ytdl.downloadFromInfo(videoInfo, { format: videoFormat });
        const writeStream = fs.createWriteStream(outputPath);
        
        videoStream.pipe(writeStream);

        videoStream.on('data', (data) => {

            console.log(`Downloading: ${data}`);
          });
        videoStream.on('progress', (chunkLength, downloaded, total) => {
          const percent = (downloaded / total) * 100;
          console.log(`Downloading: ${percent.toFixed(2)}%`);
        });

        writeStream.on('finish', () => {
          resolve({
            title: videoInfo.videoDetails.title,
            url,
            videoUrl: url,
            outputPath,
            platform: 'youtube',
            quality: videoFormat.qualityLabel,
            format: videoFormat.container
          });
        })
      });
    } catch (error: any) {
      throw new Error(`Failed to download YouTube video: ${error.message}`);
    }
  }

  async downloadTwitterVideo(tweetUrl: string): Promise<VideoInfo> {

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Use a third-party Twitter video downloader service
      await page.goto('https://twitsave.com/', { waitUntil: 'networkidle0' });
      console.log("gone to page")
      // Find input field and submit button
    //   await page.evaluate((url) => { document.querySelector('input[name="sf_url"]').value = url; }, tweetUrl);
    await page.type('input[name="url"]', tweetUrl);

      await page.click('button[type="submit"]');
      
      // Wait for video URL to appear
      await page.waitForSelector('video', { timeout: 30000 });
      
      // Get highest quality video URL
      const videoUrl = await page.evaluate(() => {
        const downloadLinks = document.querySelectorAll('td ul li a');
        return downloadLinks[0].getAttribute('href');
      });

      if (!videoUrl) {
        // page.
        throw new Error('Could not find video URL');
      }

      const tweetId = tweetUrl.split('/').pop()!;
      const outputPath = `twitter_${tweetId}.mp4`;
    //   const outputPath = path.join(this.outputDir, `twitter_${tweetId}.mp4`);
      
    //   await this.downloadFile(videoUrl, outputPath);

      await page.close();

      return {
        title: `twitter_${tweetId}`,
        videoUrl,
        outputPath,
        url: tweetUrl,
        platform: 'twitter'
      };
   
  }

  async downloadInstagramVideo(postUrl: string): Promise<VideoInfo> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Use a third-party Instagram video downloader service
      await page.goto('https://snapinsta.app/', { waitUntil: 'networkidle0' });
      
      // Find input field and submit button
      await page.type('#url', postUrl);
      await page.click('#submit');
      
      // Wait for video URL to appear
      await page.waitForSelector('.download-content .download-items a', { timeout: 30000 });
      
      // Get video URL
      const videoUrl = await page.evaluate(() => {
        const downloadLink = document.querySelector('.download-content .download-items a');
        return downloadLink?.getAttribute('href');
      });

      if (!videoUrl) {
        throw new Error('Could not find video URL');
      }

      const postId = postUrl.split('/p/')[1]?.split('/')[0];
      const outputPath = path.join(this.outputDir, `instagram_${postId}.mp4`);
      
      await this.downloadFile(videoUrl, outputPath);

      await page.close();

      return {
        title: `instagram_${postId}`,
        url: postUrl,
        platform: 'instagram',
        outputPath,
        videoUrl,
      };
    } catch (error: any) {
      throw new Error(`Failed to download Instagram video: ${error.message}`);
    }
  }

  async downloadVideo(url: string): Promise<VideoInfo> {
    try {


            const platformInfo = URLDetector.detectPlatform(url);
        
            if (!platformInfo.isValid) {
              throw new Error('Unsupported platform or invalid URL format.');
            }
              switch (platformInfo.platform) {
                case 'youtube':
                  return await this.downloadYouTubeVideo(url);
                case 'twitter':
                  return await this.downloadTwitterVideo(platformInfo.normalizedUrl || url);
                case 'instagram':
                  return await this.downloadInstagramVideo(platformInfo.normalizedUrl || url);
                default:
                  throw new Error('Unsupported platform.');
              }
    
    } finally {
      // Close browser if it was opened
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }
}


export { SocialMediaDownloader, VideoInfo };