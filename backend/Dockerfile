# ===== 构建阶段 =====
FROM golang:1.25-alpine AS build
ENV GOPROXY=https://goproxy.cn,direct
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# 输出静态二进制文件
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# ===== 运行阶段 =====
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
# 复制二进制文件和迁移文件
COPY --from=build /server ./server
COPY migrations ./migrations
EXPOSE 8080
CMD ["./server"]
