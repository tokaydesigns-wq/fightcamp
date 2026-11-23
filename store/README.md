# Store pictures and listing

- `LISTING.md`: the store text (name, subtitle, description, keywords, privacy and age answers).
- `app-store-icon-1024.png`, `play-store-icon-512.png`: store icons, made from `icon-square.svg`.
- `feature-graphic-1024x500.png`: Google Play banner, made from `feature-graphic.html`.
- `screens/`: iPhone (1290×2796) and Android (1080×1920) screenshots.

None of these files are part of the app itself (the service worker doesn't cache them).

## Re-making the screenshots

1. Start the local server (`Start FightCamp.bat`, or `python -m http.server 8124` in the FightCamp folder).
2. `sample-data.html` fills the app with made-up data and opens a screen. It **replaces** whatever is
   saved, so it refuses to run anywhere except a local server.
3. `frame.html` shows the app at an exact phone size, e.g.
   `http://localhost:8124/store/frame.html?w=430&h=932&go=home`. Add `&at=1150` on a program page
   (`go=p/p1`) to freeze the 3D move mid-kick.
4. Take the screenshot with headless Edge at 3× and crop to the phone area (left 430×932 points):

```
msedge --headless=new --hide-scrollbars --window-size=520,932 --force-device-scale-factor=3 --virtual-time-budget=8000 --use-angle=swiftshader --enable-unsafe-swiftshader --screenshot=shot.png "http://localhost:8124/store/frame.html?w=430&h=932&go=home"
```

For Android use `w=360&h=640` and `--window-size=520,640`. The window is wider than the phone
because headless Edge won't go narrower than about 500px; crop the result to 1290×2796 or 1080×1920.
