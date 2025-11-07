package routes

import (
	// "github.com/RudraPatel5435/auralynk/server/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// r.Use(middleware.CORS())
	// r.Use(middleware.Logger())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server running", "status": "ok"})
	})

	public := r.Group("/api")
	{
		RegisterUserRoutes(public)
	}

	protected := r.Group("/api")
	protected.Use(middleware.Auth())
	{
		RegisterChannelRoutes(protected)
		RegisterMemberRoutes(protected)
		RegisterMessageRoutes(protected)
	}

	ws := r.Group("/ws")
	ws.Use(middleware.Auth())
	{
		RegisterWebSocketRoutes(ws)
	}

	// Remove in production
	if gin.Mode() == gin.DebugMode {
		r.GET("/debug/users", DebugGetUsers)
		r.GET("/debug/channels", DebugGetChannels)
		r.GET("/debug/messages", DebugGetMessages)
	}

	return r
}
