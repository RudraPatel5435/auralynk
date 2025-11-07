package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Channel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey"`
	Name      string         `gorm:"type:varchar(100);not null"`
	AdminID   uuid.UUID      `gorm:"not null"`
	Admin     *User          `gorm:"foreignKey:AdminID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Members   []*User        `gorm:"many2many:channel_members;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Messages  []*Message     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CreatedAt time.Time      `gorm:"autoCreateTime"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// func (c *Channel) BeforeCreate(tx *gorm.DB) (err error) {
// 	c.ID = uuid.New()
// 	return
// }
//
// func (c *Channel) AfterCreate(tx *gorm.DB) (err error) {
// 	return
// }
