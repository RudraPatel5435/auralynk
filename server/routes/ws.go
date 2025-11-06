package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/gin-gonic/gin"
)

func HandleWebSocket(c *gin.Context) {
	handlers.ChatWebSocket(c)
}
