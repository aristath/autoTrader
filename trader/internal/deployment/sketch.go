package deployment

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/aristath/arduino-trader/pkg/embedded"
)

// SketchDeployer handles Arduino sketch compilation and upload
type SketchDeployer struct {
	log Logger
}

// NewSketchDeployer creates a new sketch deployer
func NewSketchDeployer(log Logger) *SketchDeployer {
	return &SketchDeployer{
		log: log,
	}
}

// DeploySketch extracts sketch from embedded files, compiles and uploads it
// sketchPath is the relative path within display/sketch (e.g., "display/sketch/sketch.ino")
func (d *SketchDeployer) DeploySketch(sketchPath string) error {
	fqbn := "arduino:zephyr:unoq" // Arduino Uno Q FQBN

	d.log.Info().
		Str("sketch", sketchPath).
		Str("fqbn", fqbn).
		Msg("Extracting, compiling and uploading Arduino sketch from embedded files")

	// Create temp directory for sketch extraction
	tempDir, err := os.MkdirTemp("", "sketch-*")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir) // Clean up temp directory

	// Extract sketch directory from embedded files
	// sketchPath is like "display/sketch/sketch.ino", we need "display/sketch"
	// The embed path is display/sketch relative to the embedded package
	sketchDirPath := filepath.Dir(sketchPath)
	sketchFS, err := fs.Sub(embedded.Files, sketchDirPath)
	if err != nil {
		return fmt.Errorf("failed to get sketch directory from embedded files: %w", err)
	}

	// Extract all sketch files to temp directory
	if err := d.extractSketchFiles(sketchFS, tempDir); err != nil {
		return fmt.Errorf("failed to extract sketch files: %w", err)
	}

	// Verify sketch.ino exists in temp directory (required for compilation)
	sketchFile := filepath.Join(tempDir, "sketch.ino")
	if _, err := os.Stat(sketchFile); os.IsNotExist(err) {
		return fmt.Errorf("sketch file not found after extraction: %s", sketchFile)
	}

	sketchDir := tempDir

	// Install arduino-cli if not present
	if err := d.ensureArduinoCLI(); err != nil {
		d.log.Warn().
			Err(err).
			Msg("Arduino CLI may not be installed, compilation may fail")
	}

	// Update core index
	if err := d.updateCoreIndex(); err != nil {
		d.log.Warn().
			Err(err).
			Msg("Failed to update core index")
	}

	// Install board platform
	if err := d.installPlatform(fqbn); err != nil {
		return &SketchCompilationError{
			Message: "failed to install board platform",
			Err:     err,
		}
	}

	// Install required libraries
	if err := d.installLibraries(); err != nil {
		d.log.Warn().
			Err(err).
			Msg("Some libraries may not be installed")
	}

	// Compile sketch
	if err := d.compileSketch(sketchDir, fqbn); err != nil {
		return &SketchCompilationError{
			Message: "sketch compilation failed",
			Err:     err,
		}
	}

	// Detect serial port
	serialPort := d.detectSerialPort()
	if serialPort == "" {
		d.log.Warn().
			Msg("Serial port not detected, skipping upload (compilation succeeded)")
		return nil
	}

	// Upload sketch
	if err := d.uploadSketch(sketchDir, fqbn, serialPort); err != nil {
		return &SketchUploadError{
			Message: "sketch upload failed",
			Err:     err,
		}
	}

	d.log.Info().
		Str("sketch", sketchPath).
		Str("port", serialPort).
		Msg("Successfully deployed Arduino sketch")

	return nil
}

// ensureArduinoCLI checks if arduino-cli is installed
func (d *SketchDeployer) ensureArduinoCLI() error {
	_, err := exec.LookPath("arduino-cli")
	if err == nil {
		return nil // Already installed
	}

	d.log.Info().Msg("Arduino CLI not found, attempting installation...")

	// Try to install arduino-cli
	cmd := exec.Command("sh", "-c", "curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to install arduino-cli: %w", err)
	}

	// Check if installed to ~/bin
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	cliPath := filepath.Join(homeDir, "bin", "arduino-cli")
	if _, err := os.Stat(cliPath); err == nil {
		// Add to PATH for this session
		os.Setenv("PATH", fmt.Sprintf("%s:%s", filepath.Join(homeDir, "bin"), os.Getenv("PATH")))
	}

	return nil
}

// updateCoreIndex updates the Arduino core index
func (d *SketchDeployer) updateCoreIndex() error {
	cmd := exec.Command("arduino-cli", "core", "update-index")
	cmd.Stdout = nil
	cmd.Stderr = nil
	return cmd.Run()
}

// installPlatform installs a board platform
func (d *SketchDeployer) installPlatform(fqbn string) error {
	parts := strings.Split(fqbn, ":")
	if len(parts) < 3 {
		return fmt.Errorf("invalid FQBN: %s", fqbn)
	}

	platform := fmt.Sprintf("%s:%s", parts[0], parts[1])
	d.log.Debug().
		Str("platform", platform).
		Msg("Installing board platform")

	cmd := exec.Command("arduino-cli", "core", "install", platform)
	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		output := stdout.String() + stderr.String()
		return fmt.Errorf("failed to install platform %s: %w\nOutput: %s", platform, err, output)
	}

	return nil
}

// installLibraries installs required libraries
func (d *SketchDeployer) installLibraries() error {
	libraries := []string{
		"ArduinoGraphics",
		"MsgPack@0.4.2",
		"DebugLog@0.8.4",
		"ArxContainer@0.7.0",
		"ArxTypeTraits@0.3.1",
	}

	for _, lib := range libraries {
		d.log.Debug().
			Str("library", lib).
			Msg("Installing library")

		cmd := exec.Command("arduino-cli", "lib", "install", lib)
		cmd.Stdout = nil
		cmd.Stderr = nil

		if err := cmd.Run(); err != nil {
			d.log.Warn().
				Err(err).
				Str("library", lib).
				Msg("Failed to install library")
		}
	}

	return nil
}

// compileSketch compiles an Arduino sketch
func (d *SketchDeployer) compileSketch(sketchDir string, fqbn string) error {
	d.log.Info().
		Str("sketch_dir", sketchDir).
		Str("fqbn", fqbn).
		Msg("Compiling sketch")

	cmd := exec.Command("arduino-cli", "compile", "--fqbn", fqbn, sketchDir)
	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		output := stdout.String() + stderr.String()
		return fmt.Errorf("compilation failed: %w\nOutput: %s", err, output)
	}

	d.log.Info().
		Str("sketch_dir", sketchDir).
		Msg("Compilation successful")

	return nil
}

// detectSerialPort detects the serial port for Arduino Uno Q
func (d *SketchDeployer) detectSerialPort() string {
	// Try ttyHS1 first (Arduino Uno Q internal), then ttyACM0
	ports := []string{"/dev/ttyHS1", "/dev/ttyACM0"}

	for _, port := range ports {
		if _, err := os.Stat(port); err == nil {
			d.log.Debug().
				Str("port", port).
				Msg("Serial port detected")
			return port
		}
	}

	return ""
}

// uploadSketch uploads a compiled sketch to the MCU
func (d *SketchDeployer) uploadSketch(sketchDir string, fqbn string, serialPort string) error {
	d.log.Info().
		Str("sketch_dir", sketchDir).
		Str("fqbn", fqbn).
		Str("port", serialPort).
		Msg("Uploading sketch to MCU")

	cmd := exec.Command("arduino-cli", "upload", "--fqbn", fqbn, "--port", serialPort, sketchDir)
	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		output := stdout.String() + stderr.String()
		return fmt.Errorf("upload failed: %w\nOutput: %s", err, output)
	}

	d.log.Info().
		Str("sketch_dir", sketchDir).
		Str("port", serialPort).
		Msg("Upload successful")

	return nil
}

// extractSketchFiles extracts all files from embed.FS to target directory
func (d *SketchDeployer) extractSketchFiles(sourceFS fs.FS, targetDir string) error {
	return fs.WalkDir(sourceFS, ".", func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Skip the root directory itself if it's just "."
		if path == "." && entry.IsDir() {
			return nil
		}

		targetPath := filepath.Join(targetDir, path)

		if entry.IsDir() {
			// Create directory
			return os.MkdirAll(targetPath, 0755)
		}

		// Extract file
		return d.extractSketchFile(sourceFS, path, targetPath)
	})
}

// extractSketchFile extracts a single file from embed.FS to target path
func (d *SketchDeployer) extractSketchFile(sourceFS fs.FS, sourcePath string, targetPath string) error {
	// Open source file from embedded filesystem
	sourceFile, err := sourceFS.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("failed to open embedded file %s: %w", sourcePath, err)
	}
	defer sourceFile.Close()

	// Create target directory if needed
	targetDir := filepath.Dir(targetPath)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}

	// Create target file
	targetFile, err := os.Create(targetPath)
	if err != nil {
		return fmt.Errorf("failed to create target file %s: %w", targetPath, err)
	}
	defer targetFile.Close()

	// Copy file contents
	if _, err := io.Copy(targetFile, sourceFile); err != nil {
		return fmt.Errorf("failed to copy file contents: %w", err)
	}

	// Set file permissions
	if err := os.Chmod(targetPath, 0644); err != nil {
		return fmt.Errorf("failed to set file permissions: %w", err)
	}

	return nil
}
