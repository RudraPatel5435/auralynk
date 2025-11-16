package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterWebRTCRoutes(rg *gin.RouterGroup, ws *gin.RouterGroup) {
	// HTTP endpoints
	rg.GET("/channels/:id/media-sessions", handlers.GetActiveMediaSessions)

	// WebSocket signaling endpoint
	ws.GET("/rtc/:channelId", handlers.RTCSignalingWebSocket)
}
