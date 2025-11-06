package utils

import (
	"github.com/gorilla/websocket"
	"net/http"
)

// Upgrade HTTP connection to WebSocket
var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // allow all origins for now
	},
}
