package routes

import (
	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/middleware"
	"github.com/RudraPatel5435/auralynk/server/models"
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
		r.GET("/debug/users", func(c *gin.Context) {
			var users []models.User
			database.DB.Find(&users)
			c.JSON(200, users)
		})
		r.GET("/debug/channels", func(c *gin.Context) {
			var channels []models.Channel
			database.DB.Find(&channels)
			c.JSON(200, channels)
		})
		r.GET("/debug/messages", func(c *gin.Context) {
			var messages []models.Message
			database.DB.Find(&messages)
			c.JSON(200, messages)
		})
	}

	return r
}
