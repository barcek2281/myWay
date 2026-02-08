package middleware

import (
	"myway-backend/internal/database"
	"myway-backend/internal/models"
	jwtutil "myway-backend/pkg/jwt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		claims, err := jwtutil.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Next()
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Org-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// OrgMembershipMiddleware ensures user is a member of the organization
func OrgMembershipMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userID").(uuid.UUID)

		// Get org ID from header or query param
		orgIDStr := c.GetHeader("X-Org-ID")
		if orgIDStr == "" {
			orgIDStr = c.Query("orgId")
		}
		if orgIDStr == "" {
			// Try to get from URL param
			orgIDStr = c.Param("orgId")
		}
		if orgIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID required"})
			c.Abort()
			return
		}

		orgID, err := uuid.Parse(orgIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
			c.Abort()
			return
		}

		// Check membership
		var membership models.OrgMembership
		if err := database.GetDB().Where("user_id = ? AND org_id = ? AND status = ?", userID, orgID, "Active").First(&membership).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this organization"})
			c.Abort()
			return
		}

		c.Set("orgID", orgID)
		c.Set("orgRole", membership.Role)
		c.Next()
	}
}

// RBACMiddleware checks if user has required role
func RBACMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("orgRole")
		if role == "" {
			// Try to get from membership if orgRole not set
			userID := c.MustGet("userID").(uuid.UUID)
			orgID := c.GetString("orgID")
			if orgID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Organization context required for RBAC"})
				c.Abort()
				return
			}

			orgUUID, _ := uuid.Parse(orgID)
			var membership models.OrgMembership
			if err := database.GetDB().Where("user_id = ? AND org_id = ?", userID, orgUUID).First(&membership).Error; err != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this organization"})
				c.Abort()
				return
			}
			role = membership.Role
		}

		allowed := false
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
