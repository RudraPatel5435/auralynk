package main

import (
	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/routes"
	"github.com/gin-gonic/gin"
	// "log"
)

func main() {
	database.ConnectDB()
	// database.DB.AutoMigrate(&models.User{}, &models.Message{})

	// testUser := models.User{
	// 	Username: "rudra",
	// 	Email:    "rudra@example.com",
	// 	Password: "1234",
	// }
	// result := database.DB.Create(&testUser)
	// if result.Error != nil {
	// 	log.Fatal(result.Error)
	// }
	// log.Println("Insted User:", testUser.Username)

	r := gin.Default()

	// Websocket route
	r.GET("/ws", routes.HandleWebSocket)

	//c (variable) => context
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server running on :8080"})
	})

	r.GET("/debug/user", func(c *gin.Context) {
		var users []models.User
		database.DB.Find(&users)
		c.JSON(200, users)
	})

	r.Run(":8080")

}
