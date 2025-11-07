package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterChannelRoutes(rg *gin.RouterGroup) {
	channels := rg.Group("/channels")
	{
		channels.POST("", handlers.CreateChannel)

		channels.GET("", handlers.GetChannels)

	}
}
