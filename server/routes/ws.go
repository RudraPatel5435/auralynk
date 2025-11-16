package routes

import (
	"github.com/RudraPatel5435/vyenet/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterWebSocketRoutes(rg *gin.RouterGroup) {
	rg.GET("/:channelId", handlers.ChatWebSocket)
}
