package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Message struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index"`
	User      *User     `gorm:"foreignKey:UserID"`
	ChannelID uuid.UUID `gorm:"type:uuid;index"`
	Channel   *Channel  `gorm:"foreignKey:ChannelID"`
	Content   string    `gorm:"not null"`
	CreatedAt time.Time
}

func (m *Message) BeforeCreate(tx *gorm.DB) (err error) {
	m.ID = uuid.New()
	return
}

func (m *Message) AfterCreate(tx *gorm.DB) (err error) {
	return
}
