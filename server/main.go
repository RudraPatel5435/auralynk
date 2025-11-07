package main

import (
	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/routes"
	"github.com/gin-gonic/gin"
	// "github.com/google/uuid"
	// "log"
)

func main() {
	database.ConnectDB()
	// database.DB.Migrator().DropTable(&models.User{}, &models.Message{}, &models.Channel{}, "user_owned_channels", "channel_members")
	// database.DB.AutoMigrate(&models.User{}, &models.Message{}, &models.Channel{})

	// user := models.User{
	// 	ID:       uuid.New(),
	// 	Username: "Rudra",
	// 	Email:    "rudra@example.com",
	// 	Password: "123",
	// }
	// database.DB.Create(&user)
	//
	// channel := models.Channel{
	// 	ID:      uuid.New(),
	// 	Name:    "Rudra's Channel",
	// 	AdminID: user.ID,
	// }
	// database.DB.Create(&channel)
	//
	// database.DB.Model(&channel).Association("Members").Append(&user)
	// database.DB.Model(&user).Association("OwnedChannels").Append(&channel)
	//
	// msg := models.Message{
	// 	ID:        uuid.New(),
	// 	UserID:    user.ID,
	// 	ChannelID: channel.ID,
	// 	IsPinned:  true,
	// 	Content:   "Hello world!",
	// }
	// database.DB.Create(&msg)

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
