package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterMessageRoutes(rg *gin.RouterGroup) {
	messages := rg.Group("/channels/:id/messages")
	{
		messages.POST("", handlers.CreateMessage)
		messages.GET("", handlers.ListMessages)
	}
}
