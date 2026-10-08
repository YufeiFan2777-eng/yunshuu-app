#!/bin/bash
# setup_ob.sh — 在 VPS 上配置 Ombre Brain 记忆系统
# 在 VPS 以 root 运行：bash /root/setup_ob.sh

set -e

OB_TOKEN="yfshu-ob-mcp-2024"
OB_CONTAINER="ombre-brain"
XINCHAO_DIR="/root/xinchao-nian"

echo "=== 步骤 1：检查 ombre-brain 容器 ==="
if ! docker ps --format '{{.Names}}' | grep -q "^${OB_CONTAINER}$"; then
    echo "[ERROR] ombre-brain 容器未运行！先确认 xinchao-nian 已启动："
    echo "  cd $XINCHAO_DIR && docker compose up -d"
    exit 1
fi
echo "[OK] ombre-brain 容器运行中"

echo ""
echo "=== 步骤 2：检查 OB 是否已在 18001 上响应 ==="
if curl -sf http://localhost:18001/health > /dev/null 2>&1; then
    echo "[OK] OB /health 响应正常"
else
    echo "[WARN] 18001 未响应，可能还需要初始化"
fi

echo ""
echo "=== 步骤 3：配置 OB 使用 token 鉴权 ==="
# 找到 xinchao-nian 的 env 文件
ENV_FILE="$XINCHAO_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    echo "[INFO] 创建 $ENV_FILE"
fi

# 添加或更新 OB token 相关环境变量
update_env() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
        echo "[ENV] 更新 ${key}"
    else
        echo "${key}=${val}" >> "$ENV_FILE"
        echo "[ENV] 添加 ${key}"
    fi
}

update_env "OMBRE_MCP_AUTH_MODE" "token"
update_env "OMBRE_MCP_TOKEN" "$OB_TOKEN"
# AI 显示名
update_env "AI_NAME" "云舒"

echo ""
echo "=== 步骤 4：重启 ombre-brain 容器 ==="
cd "$XINCHAO_DIR"
docker compose restart ombre-brain
echo "[OK] ombre-brain 重启完成"

echo ""
echo "=== 步骤 5：等待 OB 就绪 ==="
for i in $(seq 1 12); do
    sleep 5
    if curl -sf http://localhost:18001/health > /dev/null 2>&1; then
        echo "[OK] OB 已就绪！"
        break
    fi
    echo "  等待中... ($((i*5))s)"
done

echo ""
echo "=== 步骤 6：验证 token 鉴权 ==="
RESP=$(curl -sf -X POST http://localhost:18001/mcp \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OB_TOKEN" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' \
    2>&1)

if echo "$RESP" | grep -q '"result"'; then
    echo "[OK] MCP token 鉴权成功！"
elif echo "$RESP" | grep -q '"error"'; then
    echo "[ERROR] MCP 返回错误："
    echo "$RESP"
else
    echo "[WARN] 未收到预期响应："
    echo "$RESP"
fi

echo ""
echo "=== 步骤 7：更新 cabin_relay.py ==="
echo "上传新版 cabin_relay.py 到 /root/cabin_relay.py，然后："
echo ""
echo "  # 停止旧进程"
echo "  pkill -f cabin_relay.py || true"
echo "  sleep 1"
echo "  # 启动新进程"
echo "  nohup python3 /root/cabin_relay.py >> /root/cabin_relay.log 2>&1 &"
echo ""
echo "=== 所有步骤完成！==="
echo ""
echo "可以测试 OB 接口："
echo "  curl -s https://cabin.yunshuyf.com/ob/health"
echo "  curl -s -X POST https://cabin.yunshuyf.com/ob/breath \\"
echo "    -H 'X-Secret: yfshu-cabin-write-2024' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\": \"雨菲\"}'"
