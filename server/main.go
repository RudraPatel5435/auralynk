package main

import (
	"github.com/RudraPatel5435/auralynk/server/database"
	// "github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/routes"
	// "github.com/google/uuid"
	// "log"
)

func main() {
	database.ConnectDB()
	// database.DB.Migrator().DropTable(&models.User{}, &models.Message{}, &models.Channel{}, "user_owned_channels", "channel_members")
	// database.DB.AutoMigrate(&models.User{}, &models.Message{}, &models.Channel{})

	r := routes.SetupRouter()

	r.Run(":8080")

}
