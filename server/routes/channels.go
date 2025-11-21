package routes

import (
	"github.com/RudraPatel5435/vyenet/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterChannelRoutes(rg *gin.RouterGroup) {
	channels := rg.Group("/channels")
	{
		channels.POST("/create", handlers.CreateChannel)
		channels.GET("", handlers.GetChannels)
		channels.GET("/:id", handlers.GetChannel)
		channels.DELETE("/:id", handlers.DeleteChannel)
		channels.POST("/:id/join", handlers.JoinChannel)
		channels.POST("/:id/leave", handlers.LeaveChannel)
		channels.PUT("/:id/access/:type", handlers.ChangeAccessType)
		channels.PATCH("/:id/change-name/:name", handlers.ChangeChannelName)
	}
}
