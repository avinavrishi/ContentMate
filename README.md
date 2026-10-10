# ContentMate

ContentMate is a platform that allows you to create videos using generative AI and schedule them to be posted on your social media accounts automatically.

### Transform Idea to Video
- **Step 1:** Input idea prompt and duration, then click Next.
- **Step 2:** Backend will suggest these three things using AI:
  1. Tone
  2. Purpose
  3. Audience
  Select any of the suggested items or add your own and click Next.
- **Step 3:** Configure the video settings:
  1. Size
  2. Language
  3. Media customizations
  Configure the video settings and click Next.
- **Step 4:** Click Create.
- **Step 5:** Backend will generate the video and return a script and a video path.
- **Step 6:** User can edit the script in the browser, click Apply, and the backend will generate the updated video and return a new video path.
- **Step 7:** User can click Download to download the video and script.
- **Step 8:** User can click Schedule to schedule the video to be posted on their social media accounts.

### Backend Functionality
- **Suggest tone, purpose, and audience.**
- **Generate script** for the video using the tone, purpose, audience, and the idea prompt.
- **Generate video** using the script:
  - Create segments of the video using the script.
  - Generate images for each segment using Gemini.
  - Generate audio for each segment - [TODO]
  - Generate video for each segment 
  - Combine the segments into a full video.
  - Store the video with metadata for each segment in the database.
- **Update an existing video using the script:**
  - Identify changed script segments.
  - Regenerate only the modified segments.
  - Merge updated segments into the existing video.
  - Store new version with metadata.

### Scheduling and Posting
- **Schedule video posts** on social media platforms.
- **Integrate with API** for automated publishing.
- **Provide analytics** on engagement and performance.

### Future Enhancements
- **AI-powered video optimization** based on engagement metrics.
- **Multi-language support** with auto-translation.
- **Custom branding options** for businesses and creators.
- **Advanced media library** with AI-recommended assets.

ContentMate streamlines the process of video creation and distribution, making it accessible for individuals and businesses to generate professional-quality videos with minimal effort.

