#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./render.sh <clip-name>"
  echo "Example: ./render.sh bounce"
  exit 1
fi

CLIP=$1

rm -rf "frames/$CLIP"
rm -f "frames/$CLIP.mp4"

echo "Recording $CLIP..."
bun run src/record.ts "$CLIP"

echo "Encoding video..."
ffmpeg -y -framerate 60 -i "frames/$CLIP/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p "frames/$CLIP.mp4"

echo "Done: frames/$CLIP.mp4"
