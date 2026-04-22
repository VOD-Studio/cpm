package server

import (
	"encoding/json"
	"net/http"
)

// writeJSON 将数据序列化为 JSON 写入响应
func writeJSON(w http.ResponseWriter, data any) {
	json.NewEncoder(w).Encode(map[string]any{"data": data})
}
