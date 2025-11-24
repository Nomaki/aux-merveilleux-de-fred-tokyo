# Japanese Font Setup for PDF Order Tickets

## Required Font

The PDF order tickets require **Noto Sans JP** font to properly display Japanese characters (Kanji, Hiragana, and Katakana).

## Installation

The font file `NotoSansJP-Regular.ttf` should be placed in:
```
api/fonts/NotoSansJP-Regular.ttf
```

### Download Command

If the font is not present, download it with:

```bash
curl -L -o api/fonts/NotoSansJP-Regular.ttf "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf"
```

## Deployment

**Important**: When deploying to Vercel, ensure the font file is included in your deployment:

1. The font file is intentionally excluded from git (`.gitignore`) due to its large size (~5.6MB)
2. During deployment, the font will be downloaded automatically or you can add it to your deployment process
3. Alternatively, commit the font file by removing it from `.gitignore` if your hosting allows large files

## Testing

Test Japanese character rendering with:
```bash
node test-pdf-generation.js
```

The test uses the name: **田中恵 / タナカ めぐみ**

## Font License

Noto Sans JP is licensed under the [SIL Open Font License](https://scripts.sil.org/OFL) and is free to use.
