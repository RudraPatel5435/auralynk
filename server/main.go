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
	database.DB.AutoMigrate(&models.User{}, &models.Message{}, &models.Channel{})

	// user1 := models.User{Username: "Rudra", Email: "rudra@example.com", Password: "123", ID: 3}
	// user2 := models.User{Username: "Om", Email: "om@example.com", Password: "123"}
	user3 := models.User{Username: "VG", Email: "vg@example.com", Password: "123"}
	database.DB.Create(&user3)

	// channel := models.Channel{Name: "Rudra' Channel", AdminID: user1.ID}
	// channel2 := models.Channel{Name: "Om' Channel", AdminID: user2.ID}
	channel3 := models.Channel{Name: "VG' Channel", AdminID: user3.ID}
	database.DB.Create(&channel3)

	// database.DB.Model(&channel2).Association("Members").Append(&user2)
	database.DB.Model(&channel3).Association("Members").Append(&user3)
	database.DB.Model(&user3).Association("Channels").Append(&channel3)

	// msg := models.Message{UserID: user.ID, ChannelID: channel.ID, Content: "Channels created"}
	// msg2 := models.Message{UserID: user2.ID, ChannelID: channel2.ID, Content: "Om chu bc"}
	msg3 := models.Message{UserID: user3.ID, ChannelID: channel3.ID, Content: "I am the black god"}
	database.DB.Create(&msg3)

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
