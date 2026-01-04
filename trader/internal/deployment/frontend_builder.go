package deployment

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// FrontendBuilder builds the React frontend
type FrontendBuilder struct {
	log Logger
}

// NewFrontendBuilder creates a new frontend builder
func NewFrontendBuilder(log Logger) *FrontendBuilder {
	return &FrontendBuilder{
		log: log,
	}
}

// BuildFrontend builds the React frontend
func (b *FrontendBuilder) BuildFrontend(repoDir string, deployDir string) error {
	frontendDir := filepath.Join(repoDir, "trader/frontend")
	targetDir := filepath.Join(deployDir, "frontend/dist")

	// Check if frontend directory exists
	if _, err := os.Stat(frontendDir); os.IsNotExist(err) {
		return &BuildError{
			ServiceName: "frontend",
			Message:     fmt.Sprintf("frontend directory does not exist: %s", frontendDir),
			Err:         err,
		}
	}

	b.log.Info().
		Str("source", frontendDir).
		Str("target", targetDir).
		Msg("Building React frontend")

	// Install dependencies if needed
	nodeModulesDir := filepath.Join(frontendDir, "node_modules")
	if _, err := os.Stat(nodeModulesDir); os.IsNotExist(err) {
		b.log.Info().Msg("Installing frontend dependencies...")
		cmd := exec.Command("npm", "install")
		cmd.Dir = frontendDir
		cmd.Stdout = nil
		cmd.Stderr = nil

		if err := cmd.Run(); err != nil {
			return &BuildError{
				ServiceName: "frontend",
				Message:     "failed to install dependencies",
				Err:         err,
			}
		}
		b.log.Info().Msg("Frontend dependencies installed")
	}

	// Build frontend
	b.log.Info().Msg("Building frontend with npm run build...")
	cmd := exec.Command("npm", "run", "build")
	cmd.Dir = frontendDir

	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	startTime := time.Now()
	err := cmd.Run()
	duration := time.Since(startTime)

	if err != nil {
		buildOutput := stdout.String() + stderr.String()
		return &BuildError{
			ServiceName: "frontend",
			Message:     "build failed",
			Err:         err,
			BuildOutput: buildOutput,
		}
	}

	b.log.Info().
		Dur("duration", duration).
		Msg("Frontend build completed")

	// Verify build output exists
	distDir := filepath.Join(frontendDir, "dist")
	if _, err := os.Stat(distDir); os.IsNotExist(err) {
		return &BuildError{
			ServiceName: "frontend",
			Message:     "build output directory not found",
			Err:         err,
		}
	}

	indexHTML := filepath.Join(distDir, "index.html")
	if _, err := os.Stat(indexHTML); os.IsNotExist(err) {
		return &BuildError{
			ServiceName: "frontend",
			Message:     "build output index.html not found",
			Err:         err,
		}
	}

	// Copy dist to deployment directory
	b.log.Info().
		Str("source", distDir).
		Str("target", targetDir).
		Msg("Copying frontend build to deployment directory")

	// Remove existing target directory if it exists
	if err := os.RemoveAll(targetDir); err != nil {
		return &BuildError{
			ServiceName: "frontend",
			Message:     "failed to remove existing deployment directory",
			Err:         err,
		}
	}

	// Create target directory
	if err := os.MkdirAll(filepath.Dir(targetDir), 0755); err != nil {
		return &BuildError{
			ServiceName: "frontend",
			Message:     "failed to create deployment directory",
			Err:         err,
		}
	}

	// Copy directory recursively
	if err := copyDirectory(distDir, targetDir); err != nil {
		return &BuildError{
			ServiceName: "frontend",
			Message:     "failed to copy build output",
			Err:         err,
		}
	}

	b.log.Info().
		Str("target", targetDir).
		Msg("Successfully built and deployed frontend")

	return nil
}

// copyDirectory recursively copies a directory (helper function)
func copyDirectory(sourceDir string, targetDir string) error {
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
		return copyFile(path, targetPath, info.Mode())
	})
}

// copyFile copies a single file (helper function)
func copyFile(sourcePath string, targetPath string, mode os.FileMode) error {
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
