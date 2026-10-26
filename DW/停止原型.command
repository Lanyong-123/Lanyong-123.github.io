#!/bin/zsh
if [ -f /tmp/dwe-ai-prototype.pid ]; then
  kill "$(cat /tmp/dwe-ai-prototype.pid)" 2>/dev/null
  rm /tmp/dwe-ai-prototype.pid
fi
echo "原型服务已停止"
