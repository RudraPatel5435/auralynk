package utils

import (
	"time"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Success   bool      `json:"success"`
	Message   string    `json:"message"`
	Data      any       `json:"data,omitempty"`
	Error     any       `json:"error,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

func SuccessResponse(c *gin.Context, statusCode int, message string, data any) {
	c.JSON(statusCode, Response{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
	})
}

func ErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, Response{
		Success:   false,
		Message:   message,
		Timestamp: time.Now(),
	})
}

func ErrorResponseWithDetails(c *gin.Context, statusCode int, message string, errorDetails any) {
	c.JSON(statusCode, Response{
		Success:   false,
		Message:   message,
		Error:     errorDetails,
		Timestamp: time.Now(),
	})
}

func ValidationErrorResponse(c *gin.Context, errors any) {
	c.JSON(400, Response{
		Success:   false,
		Message:   "Validation failed",
		Error:     errors,
		Timestamp: time.Now(),
	})
}
