# Getting Started with YTDownloader

## Problem Statement 
 
Idea to create a fully functional chrome extension that helps to download the youtube videos in Audio-Only format also on Full HD and normal 360p format. 


# Solution

# How to setup the Application and steps to run

1. Install NodeJS and npm (node - v14.16.0, npm - 6.14.11)
2. Clone the project
3. Goto server file and run command
- npm install
4. after that you need to add some extra npm modules for downloading youtube videos.
- npm i ytdl-core ffmpeg-static
5. Server part is completed now run the server using 
- node .
6. Open chrome goto chrome://extensions/ and on the developer mode
7. click on load unpacked and select the plugin folder
8. pin the extension present in the chrome header
9. And download the Youtube videos as your choice.
