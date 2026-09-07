using System;
using System.IO;
using System.Windows.Forms;
using ScriptPortal.Vegas; // VEGAS API Reference

public class EntryPoint
{
    public void FromVegas(Vegas vegas)
    {
        // 1. Ensure project has regions to render
        if (vegas.Project.Regions.Count == 0)
        {
            MessageBox.Show("No regions found on the timeline. Please create regions first.", 
                            "Batch Render Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        // 2. Define target Renderer and Preset Hierarchy
        string rendererName = "AVC (H.264)"; 
        string nvencTemplateName = "Internet HD 720p 29.97 fps 9:16 (portrait-NVENC)";
        string qsvTemplateName   = "Internet HD 720p 29.97 fps 9:16 (portrait-Intel QSV)";
        string cpuTemplateName   = "Internet HD 720p 29.97 fps 9:16 (portrait)";

        RenderTemplate selectedTemplate = null;

        // 3. Locate Renderer
        Renderer targetRenderer = FindRenderer(vegas, rendererName);
        if (targetRenderer == null)
        {
            MessageBox.Show(string.Format("Could not find the renderer: '{0}'", rendererName), 
                            "Renderer Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        // Priority 1: NVIDIA NVENC
        selectedTemplate = FindTemplate(targetRenderer, nvencTemplateName);

        // Priority 2: Intel QSV
        if (selectedTemplate == null)
        {
            selectedTemplate = FindTemplate(targetRenderer, qsvTemplateName);
        }

        // Priority 3: CPU Fallback
        if (selectedTemplate == null)
        {
            selectedTemplate = FindTemplate(targetRenderer, cpuTemplateName);
        }

        // Error if none of the 3 templates are registered in VEGAS
        if (selectedTemplate == null)
        {
            MessageBox.Show(string.Format("None of the 720p vertical presets (NVENC, QSV, or CPU) were found under '{0}'.\nPlease verify your saved preset names.", rendererName), 
                            "Preset Missing", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        // 4. Set Fixed Destination Directory
        string outputDir = @"D:\Desktop";

        // Create the directory if D:\Desktop does not exist yet
        if (!Directory.Exists(outputDir))
        {
            try
            {
                Directory.CreateDirectory(outputDir);
            }
            catch (Exception ex)
            {
                MessageBox.Show(string.Format("Failed to access or create directory '{0}':\n{1}", outputDir, ex.Message),
                                "Directory Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }

        // 5. Execute Region Batch Loop
        int regionNumber = 1;
        int successCount = 0;

        foreach (Region region in vegas.Project.Regions)
        {
            // Build exact output name: _Region1.mp4, _Region2.mp4, etc.
            string fileName = string.Format("_Region{0}.mp4", regionNumber);
            string fullOutputPath = Path.Combine(outputDir, fileName);

            // Configure VEGAS Render Arguments
            RenderArgs args = new RenderArgs();
            args.OutputFile = fullOutputPath;
            args.RenderTemplate = selectedTemplate;
            args.Start = region.Position;
            args.Length = region.Length;

            // Execute single region render
            RenderStatus status = vegas.Render(args);

            if (status == RenderStatus.Canceled)
            {
                MessageBox.Show("Batch rendering was canceled by the user.", "Canceled", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            if (status == RenderStatus.Complete)
            {
                successCount++;
            }

            regionNumber++;
        }

        // 6. Completion Notification
        MessageBox.Show(string.Format("Successfully rendered {0} of {1} regions using '{2}'!\nSaved to: {3}", 
                        successCount, vegas.Project.Regions.Count, selectedTemplate.Name, outputDir), 
                        "Batch Render Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    // Helper: Find Renderer by Name
    private Renderer FindRenderer(Vegas vegas, string name)
    {
        foreach (Renderer renderer in vegas.Renderers)
        {
            if (renderer.FileTypeName.Equals(name, StringComparison.OrdinalIgnoreCase))
                return renderer;
        }
        return null;
    }

    // Helper: Find Template inside Renderer
    private RenderTemplate FindTemplate(Renderer renderer, string name)
    {
        foreach (RenderTemplate template in renderer.Templates)
        {
            if (template.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                return template;
        }
        return null;
    }
}
