package main

import (
	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	database.ConnectDB()
	database.DB.AutoMigrate(&models.User{}, &models.Message{})

	r := gin.Default()

	// Websocket route
	r.GET("/ws", routes.HandleWebSocket)

	//c (variable) => context
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server running on :8080"})
	})

	r.Run(":8080")

}
