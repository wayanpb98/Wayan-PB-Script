using ScriptPortal.Vegas;
using System;
using System.IO;
using System.Windows.Forms;

public class EntryPoint
{
    public void FromVegas(Vegas vegas)
    {
        string rendererName = "AVC (H.264)";
        string outputFolder = @"D:\Desktop\";

        // Template priority for shorts (portrait)
        string[] portraitTemplates = new string[]
        {
            "Internet HD 1080p 29.97 fps 9:16 (portrait-NVENC)",
            "Internet HD 1080p 29.97 fps 9:16 (portrait-Intel QSV)",
            "Internet HD 1080p 29.97 fps 9:16 (portrait)"
        };

        // Template priority for full video (landscape)
        string[] landscapeTemplates = new string[]
        {
            "Internet HD 1080p 29.97 fps (NVENC)",
            "Internet HD 1080p 29.97 fps (Intel QSV)",
            "Internet HD 1080p 29.97 fps"
        };

        Renderer targetRenderer = null;
        RenderTemplate selectedTemplate = null;

        // Find the renderer
        foreach (Renderer renderer in vegas.Renderers)
        {
            if (renderer.Name == rendererName)
            {
                targetRenderer = renderer;
                break;
            }
        }

        if (targetRenderer == null)
        {
            MessageBox.Show("Renderer not found: " + rendererName);
            return;
        }

        // Decide which template list to use
        bool isShortsProject = vegas.Project.Regions.Count > 0;
        string[] templateList = isShortsProject ? portraitTemplates : landscapeTemplates;

        // Find the best available template
        foreach (string templateName in templateList)
        {
            foreach (RenderTemplate template in targetRenderer.Templates)
            {
                if (template.Name == templateName)
                {
                    selectedTemplate = template;
                    break;
                }
            }
            if (selectedTemplate != null) break;
        }

        if (selectedTemplate == null)
        {
            MessageBox.Show("No matching render template found.");
            return;
        }

        if (isShortsProject)
        {
            // Render each region as a separate short
            int count = 1;
            foreach (Region region in vegas.Project.Regions)
            {
                string safeName = region.Label;
                if (string.IsNullOrEmpty(safeName))
                {
                    safeName = "Region" + count;
                }

                string outputPath = Path.Combine(outputFolder, "_" + safeName + ".mp4");

                RenderArgs args = new RenderArgs();
                args.RenderTemplate = selectedTemplate;
                args.OutputFile = outputPath;
                args.Start = region.Position;
                args.Length = region.Length;
                args.UseSelection = false;

                vegas.Render(args);
                count++;
            }
        }
        else
        {
            // Render full timeline
			string projectPath = vegas.Project.FilePath;
			string baseName = string.IsNullOrEmpty(projectPath) ? "FullVideo" : Path.GetFileNameWithoutExtension(projectPath);
            string outputPath = Path.Combine(outputFolder, baseName + ".mp4");

            RenderArgs args = new RenderArgs();
            args.RenderTemplate = selectedTemplate;
            args.OutputFile = outputPath;
            args.Start = vegas.SelectionStart;
			args.Length = vegas.SelectionLength;
            args.UseSelection = false;

            vegas.Render(args);
        }
    }
}
