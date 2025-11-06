package handlers

import (
	"fmt"
	"github.com/RudraPatel5435/auralynk/server/database"
	"github.com/RudraPatel5435/auralynk/server/models"
	"github.com/RudraPatel5435/auralynk/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"net/http"
)

var clients = make(map[*websocket.Conn]*models.User)
var broadcast = make(chan models.Message)

func ChatWebSocket(c *gin.Context) {
	conn, err := utils.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		http.Error(c.Writer, "Could not open websocket", http.StatusBadRequest)
		return
	}

	// Demo
	user := models.User{Username: "Anonymous"}
	database.DB.FirstOrCreate(&user, models.User{Username: "Anonymous"})

	clients[conn] = &user
	fmt.Println("New user connected:", user.Username)

	go handleMessages()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("User disconnected")
			delete(clients, conn)
			conn.Close()
			break
		}

		message := models.Message{
			Content: string(msg),
			UserID:  user.ID,
		}

		// Save message to DB
		database.DB.Create(&message)

		broadcast <- message
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%s: %s", msg.User.Username, msg.Content)))
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
	}
}
