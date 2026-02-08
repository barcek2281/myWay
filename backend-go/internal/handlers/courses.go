package handlers

import (
	"myway-backend/internal/database"
	"myway-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CourseHandler struct{}

func NewCourseHandler() *CourseHandler {
	return &CourseHandler{}
}

type CreateCourseRequest struct {
	OrgID       string `json:"orgId" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func (h *CourseHandler) CreateCourse(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var req CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// RBAC Check: Only ORGANIZER can create courses
	// Get membership for the target organization
	orgID, err := uuid.Parse(req.OrgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var membership models.OrgMembership
	if err := database.GetDB().Where("user_id = ? AND org_id = ? AND status = ?", userID, orgID, "Active").First(&membership).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this organization"})
		return
	}

	if membership.Role != "ORGANIZER" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only organizers can create courses"})
		return
	}

	course := models.Course{
		OrgID:       orgID,
		Code:        req.Code,
		Title:       req.Title,
		Description: req.Description,
		CreatedBy:   userID,
	}

	if err := database.GetDB().Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

func (h *CourseHandler) GetCourse(c *gin.Context) {
	courseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var course models.Course
	if err := database.GetDB().
		Preload("Modules.Materials.StudyPacks").
		Preload("Assignments").
		First(&course, courseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, course)
}

func (h *CourseHandler) GetCoursesByOrg(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("orgId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var courses []models.Course

	// Check if user is a member of the organization
	userID := c.MustGet("userID").(uuid.UUID)
	var membership models.OrgMembership
	if err := database.GetDB().Where("user_id = ? AND org_id = ? AND status = ?", userID, orgID, "Active").First(&membership).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this organization"})
		return
	}

	if err := database.GetDB().Where("org_id = ?", orgID).Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}
