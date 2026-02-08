package handlers

import (
	"myway-backend/internal/database"
	"myway-backend/internal/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrganizationHandler struct{}

func NewOrganizationHandler() *OrganizationHandler {
	return &OrganizationHandler{}
}

type CreateOrganizationRequest struct {
	Name string `json:"name" binding:"required"`
}

func (h *OrganizationHandler) CreateOrganization(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var req CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	org := models.Organization{
		Name: req.Name,
		Plan: "Free",
	}

	if err := database.GetDB().Create(&org).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
		return
	}

	// Add creator as ORGANIZER member
	membership := models.OrgMembership{
		OrgID:  org.ID,
		UserID: userID,
		Role:   "ORGANIZER",
		Status: "Active",
	}

	if err := database.GetDB().Create(&membership).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create membership"})
		return
	}

	c.JSON(http.StatusCreated, org)
}

func (h *OrganizationHandler) GetOrganizations(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	// Get user's organizations through memberships
	var memberships []models.OrgMembership
	if err := database.GetDB().
		Preload("Organization").
		Where("user_id = ?", userID).
		Find(&memberships).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
		return
	}

	orgs := make([]gin.H, len(memberships))
	for i, m := range memberships {
		orgs[i] = gin.H{
			"id":   m.Organization.ID,
			"name": m.Organization.Name,
			"plan": m.Organization.Plan,
			"role": m.Role,
		}
	}

	c.JSON(http.StatusOK, orgs)
}

func (h *OrganizationHandler) SwitchOrganization(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Verify membership
	var membership models.OrgMembership
	if err := database.GetDB().
		Preload("Organization").
		Where("user_id = ? AND org_id = ? AND status = ?", userID, orgID, "Active").
		First(&membership).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this organization"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"organization": gin.H{
			"id":   membership.Organization.ID,
			"name": membership.Organization.Name,
			"plan": membership.Organization.Plan,
		},
		"role": membership.Role,
	})
}

func (h *OrganizationHandler) JoinOrganization(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var org models.Organization
	if err := database.GetDB().First(&org, orgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	var existing models.OrgMembership
	if err := database.GetDB().Where("user_id = ? AND org_id = ?", userID, orgID).First(&existing).Error; err == nil {
		if existing.Status == "Active" {
			c.JSON(http.StatusConflict, gin.H{"error": "Already a member of this organization"})
			return
		}

		existing.Status = "Active"
		existing.Role = "STUDENT"
		if err := database.GetDB().Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate membership"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"organizationId": orgID,
			"role":           existing.Role,
			"status":         existing.Status,
		})
		return
	}

	membership := models.OrgMembership{
		OrgID:  orgID,
		UserID: userID,
		Role:   "STUDENT",
		Status: "Active",
	}

	if err := database.GetDB().Create(&membership).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join organization"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"organizationId": orgID,
		"role":           membership.Role,
		"status":         membership.Status,
	})
}

type InviteToOrganizationRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role"`
}

func (h *OrganizationHandler) InviteToOrganization(c *gin.Context) {
	inviterID := c.MustGet("userID").(uuid.UUID)
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Only organizer of the organization can invite
	var inviterMembership models.OrgMembership
	if err := database.GetDB().Where("user_id = ? AND org_id = ? AND status = ?", inviterID, orgID, "Active").First(&inviterMembership).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this organization"})
		return
	}
	if inviterMembership.Role != "ORGANIZER" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only organizers can invite users"})
		return
	}

	var req InviteToOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := strings.ToUpper(strings.TrimSpace(req.Role))
	if role == "" {
		role = "STUDENT"
	}
	if role != "STUDENT" && role != "TEACHER" && role != "ORGANIZER" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be STUDENT, TEACHER, or ORGANIZER"})
		return
	}

	var user models.User
	if err := database.GetDB().Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found by email"})
		return
	}

	var membership models.OrgMembership
	if err := database.GetDB().Where("user_id = ? AND org_id = ?", user.ID, orgID).First(&membership).Error; err == nil {
		if membership.Status == "Active" {
			c.JSON(http.StatusConflict, gin.H{"error": "User is already an active member of this organization"})
			return
		}

		membership.Status = "Active"
		membership.Role = role
		if err := database.GetDB().Save(&membership).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate membership"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"organizationId": orgID,
			"userId":         user.ID,
			"email":          user.Email,
			"role":           membership.Role,
			"status":         membership.Status,
		})
		return
	}

	newMembership := models.OrgMembership{
		OrgID:  orgID,
		UserID: user.ID,
		Role:   role,
		Status: "Active",
	}
	if err := database.GetDB().Create(&newMembership).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to invite user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"organizationId": orgID,
		"userId":         user.ID,
		"email":          user.Email,
		"role":           newMembership.Role,
		"status":         newMembership.Status,
	})
}
