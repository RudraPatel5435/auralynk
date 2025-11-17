package routes

import (
	"log"

	"github.com/RudraPatel5435/vyenet/server/database"
	"github.com/RudraPatel5435/vyenet/server/handlers"
	"github.com/RudraPatel5435/vyenet/server/middleware"
	"github.com/RudraPatel5435/vyenet/server/models"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	store, err := middleware.InitSessionStore(database.DB)
	if err != nil {
		log.Fatal("Failed to initialize session store:", err)
	}

	r.Use(middleware.CORS())
	r.Use(sessions.Sessions("vyenet_session", store))

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server running", "status": "ok"})
	})

	public := r.Group("/api")
	{
		RegisterUserRoutes(public)
	}

	protected := r.Group("/api")
	protected.Use(middleware.SessionAuth())
	{
		RegisterChannelRoutes(protected)
		RegisterMemberRoutes(protected)
		RegisterMessageRoutes(protected)

		// Register WebRTC HTTP endpoints
		protected.GET("/channels/:id/media-sessions", handlers.GetActiveMediaSessions)
	}

	ws := r.Group("/ws")
	ws.Use(middleware.SessionAuth())
	{
		// Chat WebSocket
		ws.GET("/:channelId", handlers.ChatWebSocket)

		// WebRTC Signaling WebSocket
		ws.GET("/rtc/:channelId", handlers.RTCSignalingWebSocket)
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
