# ChloeStart
A simple Chrome start page with bookmark bar and easy image wallpaper support.

Demonstration:
<video src="https://github.com/user-attachments/assets/59483cd1-542b-4820-8e5e-246168c0ad90" />

## How to install?

! This uses Chromium exclusive CSS features and may have visual issues on other browsers !

1. Clone this repository
2. Go to the extension settings page (chrome://extensions/)
3. Enable "Developer mode"
4. Click on "Load unpacked" at the top left
5. Select the folder you cloned the repository to

## FAQ

Q: How does the image randomness work? My image isn't changing!
A: The randomness is based on your time divided by the interval used as a seed. This means that setting an interval to 30 minutes will display the same image for 30 minutes across all tabs and new tabs you open. I thought of this being a better way of picking a random image as start pages get reloaded very frequently which would make an interval useless for random image on every tab. If you want a random image every time you open a new tab please set the interval to something like "0.01".

Q: How can I use a video instead of an image?
A: Convert your video to a (looping) WEBP or AVIF (or GIF if you do not care about the quality).

Q: My bookmark folders aren't appearing!
A: Bookmark folders are not supported yet.
