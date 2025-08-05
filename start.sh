#!/bin/bash

# 设置颜色输出
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # 无颜色

# 定义PID文件和日志文件路径
BACKEND_PID_FILE="./backend.pid"
FRONTEND_PID_FILE="./frontend.pid"
LOG_FILE="./server.log"

# 确保日志文件存在
mkdir -p $(dirname "$LOG_FILE")
 touch "$LOG_FILE"

# 显示用法信息
usage() {
  echo -e "${YELLOW}用法: $0 [start|restart|stop]${NC}"
  echo -e "  start   - 启动服务"
  echo -e "  restart - 重启服务"
  echo -e "  stop    - 停止服务"
  echo -e "${BLUE}示例:${NC}"
  echo -e "  前台启动: $0 start"
  echo -e "  后台启动: nohup $0 start &"
  echo -e "  重启服务: $0 restart"
  echo -e "  停止服务: $0 stop"
  exit 1
}

# 解析命令行参数
COMMAND="start"
if [ $# -gt 0 ]; then
  case "$1" in
    start|restart|stop)
      COMMAND="$1"
      ;;
    *)
      usage
      ;;
  esac
else
  echo -e "${YELLOW}未指定命令，默认执行 start${NC}"
fi

# 如果是停止命令，执行后退出
if [ "$COMMAND" = "stop" ]; then
  echo -e "${GREEN}=== 停止 AI 模型能力测评平台 ===${NC}"
  stop_services
  echo -e "${GREEN}所有服务已停止${NC}"
  exit 0
fi

if [ "$COMMAND" = "restart" ]; then
  echo -e "${GREEN}=== 重启 AI 模型能力测评平台 ===${NC}"
else
  echo -e "${GREEN}=== 启动 AI 模型能力测评平台 ===${NC}"
fi

# 存储进程ID
backend_pid=""
frontend_pid=""

# 停止服务函数
stop_services() {
  echo -e "${YELLOW}正在停止服务...${NC}"

  # 停止后端服务
  if [ -f "$BACKEND_PID_FILE" ]; then
    backend_pid=$(cat "$BACKEND_PID_FILE")
    if [ ! -z "$backend_pid" ] && kill -0 $backend_pid 2>/dev/null; then
      kill $backend_pid 2>/dev/null
      wait $backend_pid 2>/dev/null
      echo -e "${GREEN}后端服务已停止${NC}"
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  # 停止前端服务
  if [ -f "$FRONTEND_PID_FILE" ]; then
    frontend_pid=$(cat "$FRONTEND_PID_FILE")
    if [ ! -z "$frontend_pid" ] && kill -0 $frontend_pid 2>/dev/null; then
      kill $frontend_pid 2>/dev/null
      wait $frontend_pid 2>/dev/null
      echo -e "${GREEN}前端服务已停止${NC}"
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi
}

# 处理脚本中断
cleanup() {
  stop_services
  echo -e "${GREEN}所有服务已停止${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# 如果是重启命令，先停止现有服务
if [ "$COMMAND" = "restart" ]; then
  stop_services
fi

# 检查PostgreSQL连接并初始化数据库
echo -e "${YELLOW}检查数据库状态...${NC}"
cd "$(dirname "$0")/backend"

# 检查数据库表是否存在
node -e "const pool = require('./config/database');
pool.query('SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = \'models\' AND table_schema = \'public\')')
  .then(result => {
    if (!result.rows[0].exists) {
      console.log('数据库表不存在，需要初始化');
      process.exit(2);
    } else {
      console.log('数据库已初始化');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('数据库连接错误:', err.message);
    process.exit(1);
  });" || {
  echo -e "${RED}数据库连接失败，请检查PostgreSQL服务是否运行${NC}"
  exit 1
}

# 根据退出码决定是否初始化
if [ $? -eq 2 ]; then
  echo -e "${YELLOW}初始化数据库...${NC}"
  node init-db.js || {
    echo -e "${RED}数据库初始化失败${NC}"
    exit 1
  }
  echo -e "${GREEN}数据库初始化成功!${NC}"
  
  # 添加示例数据
  echo -e "${YELLOW}添加示例数据...${NC}"
  node seed-data.js || {
    echo -e "${RED}示例数据添加失败，但不影响系统使用${NC}"
  }
  echo -e "${GREEN}示例数据添加成功!${NC}"
fi

# 启动后端服务
echo -e "${YELLOW}启动后端服务...${NC}"
npm run dev & backend_pid=$!
# 保存后端PID到文件
echo $backend_pid > "$BACKEND_PID_FILE"

# 检查后端服务是否成功启动
sleep 2
curl -s http://localhost:3001/api/health > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}等待后端服务启动...${NC}"
  sleep 3
  curl -s http://localhost:3001/api/health > /dev/null || {
    echo -e "${RED}后端服务启动失败${NC}"
    cleanup
    exit 1
  }
fi

# 启动前端服务
echo -e "${YELLOW}启动前端服务...${NC}"
cd ..
npm run dev & frontend_pid=$!
# 保存前端PID到文件
echo $frontend_pid > "$FRONTEND_PID_FILE"

# 输出访问地址
sleep 3
echo -e "${GREEN}================================${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}后端服务运行在: ${BLUE}http://localhost:3001${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}前端服务运行在: ${BLUE}http://localhost:5174${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}================================${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo -e "${YELLOW}日志文件: $LOG_FILE${NC}"

# 记录启动完成时间
echo "$(date '+%Y-%m-%d %H:%M:%S') - 服务启动完成" >> "$LOG_FILE"

# 保持脚本运行
wait $backend_pid $frontend_pid