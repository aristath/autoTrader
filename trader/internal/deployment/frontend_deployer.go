package deployment

import (
	"fmt"
	"os"
	"path/filepath"
)

// FrontendDeployer handles frontend deployment (copy-only, no building)
type FrontendDeployer struct {
	log Logger
}

// NewFrontendDeployer creates a new frontend deployer
func NewFrontendDeployer(log Logger) *FrontendDeployer {
	return &FrontendDeployer{
		log: log,
	}
}

// DeployFrontend copies the pre-built frontend dist/ directory from repo to deployment directory
// The frontend should be built on the development machine and committed to git.
// This function only copies files - it does not build.
func (d *FrontendDeployer) DeployFrontend(repoDir string, deployDir string) error {
	sourceDir := filepath.Join(repoDir, "trader/frontend/dist")
	targetDir := filepath.Join(deployDir, "frontend/dist")

	// Check if source exists
	if _, err := os.Stat(sourceDir); os.IsNotExist(err) {
		d.log.Warn().
			Str("source", sourceDir).
			Msg("Frontend dist/ directory not found in repo. Frontend should be built on dev machine and committed to git.")
		return nil // Non-fatal - just log warning
	}

	d.log.Info().
		Str("source", sourceDir).
		Str("target", targetDir).
		Msg("Deploying frontend (pre-built dist/)")

	// Create target directory
	if err := os.MkdirAll(filepath.Dir(targetDir), 0755); err != nil {
		return fmt.Errorf("failed to create target directory: %w", err)
	}

	// Remove existing target directory if it exists
	if err := os.RemoveAll(targetDir); err != nil {
		return fmt.Errorf("failed to remove existing deployment directory: %w", err)
	}

	// Copy files recursively
	if err := d.copyDirectory(sourceDir, targetDir); err != nil {
		return fmt.Errorf("failed to copy frontend files: %w", err)
	}

	d.log.Info().
		Str("target", targetDir).
		Msg("Successfully deployed frontend")

	return nil
}

// copyDirectory recursively copies a directory
func (d *FrontendDeployer) copyDirectory(sourceDir string, targetDir string) error {
	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calculate relative path
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		targetPath := filepath.Join(targetDir, relPath)

		if info.IsDir() {
			// Create directory
			return os.MkdirAll(targetPath, info.Mode())
		}

		// Copy file
		return d.copyFile(path, targetPath, info.Mode())
	})
}

// copyFile copies a single file
func (d *FrontendDeployer) copyFile(sourcePath string, targetPath string, mode os.FileMode) error {
	// Read source file
	data, err := os.ReadFile(sourcePath)
	if err != nil {
		return err
	}

	// Create target directory if needed
	targetDir := filepath.Dir(targetPath)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}

	// Write target file
	if err := os.WriteFile(targetPath, data, mode); err != nil {
		return err
	}

	return nil
}
