package models

import (
	"github.com/google/uuid"
	"time"
)

type MediaSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	ChannelID uuid.UUID `gorm:"index;not null"`
	Channel   *Channel  `gorm:"foreignKey:ChannelID"`
	UserID    uuid.UUID `gorm:"index;not null"`
	User      *User     `gorm:"foreignKey:UserID"`
	MediaType string    `gorm:"type:varchar(20);not null"` // "audio", "video", "screen"
	IsActive  bool      `gorm:"default:true"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}
