package routes

import (
	"github.com/RudraPatel5435/auralynk/server/handlers"
	"github.com/RudraPatel5435/auralynk/server/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(rg *gin.RouterGroup) {
	user := rg.Group("/user")
	{
		user.POST("/register", handlers.RegisterUser)
		user.POST("/login", handlers.LoginUser)

		user.POST("/logout", middleware.SessionAuth(), handlers.LogoutUser)
		user.GET("/me", middleware.SessionAuth(), handlers.GetMe)
	}
}
