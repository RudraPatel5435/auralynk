package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Message struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID      `gorm:"index"`
	User      *User          `gorm:"foreignKey:UserID"`
	ChannelID uuid.UUID      `gorm:"index"`
	Channel   *Channel       `gorm:"foreignKey:ChannelID"`
	IsPinned  bool           `gorm:"default:false"`
	Content   string         `gorm:"not null"`
	CreatedAt time.Time      `gorm:"autoCreateTime"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// func (m *Message) BeforeCreate(tx *gorm.DB) (err error) {
// 	m.ID = uuid.New()
// 	return
// }
//
// func (m *Message) AfterCreate(tx *gorm.DB) (err error) {
// 	return
// }
