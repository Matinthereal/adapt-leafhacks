#!/usr/bin/env bash
# ============================================================
# Adapt promo builder — stitches title cards + your screen clips
# into demo/assets/adapt-promo.mp4 with crossfades + music.
#
# 1. Record 4 clips (see demo/ADVERT_SCRIPT.md shot list) and save as:
#      demo/assets/clipA.mp4  (profile morph)
#      demo/assets/clipB.mp4  (reader)
#      demo/assets/clipC.mp4  (explain)
#      demo/assets/clipD.mp4  (teach-it-back HERO)
# 2. (optional) drop a music track at demo/assets/music.mp3
# 3. Run:  bash demo/build-promo.sh
#
# Missing clips are auto-replaced with a captioned placeholder so the
# pipeline always produces a watchable cut. Cards come from render-cards.js.
# ============================================================
set -e
cd "$(dirname "$0")/.."
A="demo/assets"
OUT="$A/adapt-promo.mp4"
W=1920; H=1080; FPS=30
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

have() { [ -f "$1" ]; }
font() { fc-list | grep -i "Lexend-Bold\|Lexend:style=Bold" | head -1 | cut -d: -f1; }
FONT="$(font)"; [ -z "$FONT" ] && FONT="$(fc-list | grep -i inter | head -1 | cut -d: -f1)"

# --- normalise any input (card png OR clip mp4) into a fixed-length, fixed-format segment ---
seg() { # $1=source $2=seconds $3=out  [$4=caption]
  local src="$1" secs="$2" out="$3" cap="${4:-}"
  local capf=""
  if [ -n "$cap" ]; then
    capf=",drawtext=fontfile='$FONT':text='$cap':fontcolor=white:fontsize=52:box=1:boxcolor=black@0.55:boxborderw=24:x=(w-text_w)/2:y=h-180"
  fi
  if [[ "$src" == *.png ]]; then
    ffmpeg -y -loop 1 -t "$secs" -i "$src" -f lavfi -t "$secs" -i anullsrc=cl=stereo:r=44100 \
      -vf "scale=$W:$H:force_original_aspect_ratio=decrease,pad=$W:$H:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=$FPS$capf" \
      -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$out" -loglevel error
  elif have "$src"; then
    ffmpeg -y -i "$src" -f lavfi -t "$secs" -i anullsrc=cl=stereo:r=44100 \
      -t "$secs" -vf "scale=$W:$H:force_original_aspect_ratio=decrease,pad=$W:$H:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=$FPS$capf" \
      -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$out" -loglevel error
  else # placeholder
    ffmpeg -y -f lavfi -t "$secs" -i "color=c=0x0b1220:s=${W}x${H}:r=$FPS" -f lavfi -t "$secs" -i anullsrc=cl=stereo:r=44100 \
      -vf "drawtext=fontfile='$FONT':text='[ record ${src##*/} ]':fontcolor=0x5b6b83:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2-40$capf" \
      -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$out" -loglevel error
  fi
}

echo "→ building segments…"
# order: intro card, A, B, C, HERO card-label baked as caption on D, science, tech, outro
seg "$A/card-0-intro.png"   4  "$TMP/00.mp4"
seg "$A/clipA.mp4"          9  "$TMP/01.mp4" "One profile reshapes everything"
seg "$A/card-1-stat.png"    5  "$TMP/02.mp4"
seg "$A/clipB.mp4"          9  "$TMP/03.mp4" "Reader — plain, chunked, every fact kept"
seg "$A/clipC.mp4"          8  "$TMP/04.mp4" "Explain it your way"
seg "$A/clipD.mp4"         34  "$TMP/05.mp4" "You teach the AI — it finds your gap"
seg "$A/card-2-science.png" 6  "$TMP/06.mp4"
seg "$A/card-3-tech.png"    6  "$TMP/07.mp4"
seg "$A/card-4-outro.png"   6  "$TMP/08.mp4"

# --- concat with 0.5s crossfades via xfade chain ---
echo "→ crossfading…"
FILES=( "$TMP"/0*.mp4 )
inputs=(); for f in "${FILES[@]}"; do inputs+=( -i "$f" ); done
# build xfade + acrossfade chains
XF=0.5
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
vlab="[0:v]"; alab="[0:a]"; filt=""; offset=0
prevdur=$(dur "${FILES[0]}")
for ((i=1;i<${#FILES[@]};i++)); do
  offset=$(awk "BEGIN{print $offset + $prevdur - $XF}")
  nv="[v$i]"; na="[a$i]"
  filt+="${vlab}[$i:v]xfade=transition=fade:duration=$XF:offset=$offset${nv};"
  filt+="${alab}[$i:a]acrossfade=d=$XF${na};"
  vlab="$nv"; alab="$na"
  prevdur=$(awk "BEGIN{print $prevdur + $(dur "${FILES[$i]}") - $XF}")
done
ffmpeg -y "${inputs[@]}" -filter_complex "${filt%;}" -map "$vlab" -map "$alab" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "$TMP/silent.mp4" -loglevel error

# --- mix music (ducked) if present ---
if have "$A/music.mp3"; then
  echo "→ mixing music…"
  ffmpeg -y -i "$TMP/silent.mp4" -i "$A/music.mp3" \
    -filter_complex "[1:a]volume=0.28,afade=t=out:st=$(awk "BEGIN{print $(dur "$TMP/silent.mp4")-2}"):d=2[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -movflags +faststart "$OUT" -loglevel error
else
  cp "$TMP/silent.mp4" "$OUT"
fi

echo "✅ done → $OUT"
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 "$OUT" | sed 's/^/   /'
