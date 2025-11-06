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

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan string)

func ChatWebSocket(c *gin.Context) {
	conn, err := utils.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		http.Error(c.Writer, "Could not open websocket", http.StatusBadRequest)
		return
	}

	clients[conn] = true
	fmt.Println("New user connected")

	go handleMessages()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("User disconnected")
			delete(clients, conn)
			conn.Close()
			break
		}
		broadcast <- string(msg)
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, []byte(msg))
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
	}
}
