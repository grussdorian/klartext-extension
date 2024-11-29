# Klartext browser extension

Install klartext as a browser extension for chromium based broswers


## Instructions

Clone this repository `git clone https://github.com/grussdorian/klartext-extension`

1. Go to your browser's developer settings `>` Extensions `>` Manage extensions
2. Turn on Developer mode
3. Click on load unpacked
4. Navigate to the root of the cloned repo (where manifest.json is) and then load it
5. Extension should show in the all extensions list
6. Run the backend server with `npm run dev`
7. Go to any website and hover over any text until a purple highlight comes up
8. Click on the highlighted text and open the browser's debug console
9. The debug console should have the clicked text and the corresponding response from the backend

*Note*: Project still under development, expect a lot of (breaking) changes