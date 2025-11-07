package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterWebSocketRoutes(rg *gin.RouterGroup) {
	rg.GET("/:channelId", handlers.ChatWebSocket)
}
