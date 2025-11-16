package routes

import (
	// "github.com/RudraPatel5435/vyenet/server/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterMemberRoutes(rg *gin.RouterGroup) {
	members := rg.Group("/channels/:id/member")
	{
		members.GET("")
	}
}
