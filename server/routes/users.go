package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(rg *gin.RouterGroup) {
	user := rg.Group("/user")
	{
		user.POST("/register", handlers.RegisterUser)
		user.POST("/login", handlers.LoginUser)
	}
}
