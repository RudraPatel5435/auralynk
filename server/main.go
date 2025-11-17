package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/RudraPatel5435/vyenet/server/database"
	"github.com/RudraPatel5435/vyenet/server/handlers"
	// "github.com/RudraPatel5435/vyenet/server/models"
	"github.com/RudraPatel5435/vyenet/server/routes"
	"github.com/joho/godotenv"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	database.ConnectDB()

	// database.DB.Migrator().DropTable(&models.User{}, &models.Message{}, &models.Channel{}, &models.MediaSession{}, "user_owned_channels", "channel_members")
	// database.DB.AutoMigrate(&models.User{}, &models.Message{}, &models.Channel{}, &models.MediaSession{})

	handlers.StartHub()

	r := routes.SetupRouter()

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")

}
