package models

import (
	"gorm.io/gorm"
	"time"
)

type Message struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"index"`
	Content   string `gorm:"not null"`
	CreatedAt time.Time
	User      User `gorm:"foreignKey:UserID"`
}
