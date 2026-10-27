#!/bin/zsh
cd "$(dirname "$0")"
PORT=8765
if lsof -ti tcp:$PORT >/dev/null 2>&1; then
  open "http://127.0.0.1:$PORT/登录-AI行为分析运营平台.html"
  exit 0
fi
python3 -m http.server $PORT --bind 127.0.0.1 > /tmp/dwe-ai-prototype.log 2>&1 &
echo $! > /tmp/dwe-ai-prototype.pid
sleep 1
open "http://127.0.0.1:$PORT/登录-AI行为分析运营平台.html"
