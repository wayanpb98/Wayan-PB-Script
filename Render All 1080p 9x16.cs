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

        // Priority list of exact template names
        string[] preferredTemplates = new string[]
        {
            "Internet HD 1080p 29.97 fps 9:16 (portrait-NVENC)",
            "Internet HD 1080p 29.97 fps 9:16 (portrait-Intel QSV)",
            "Internet HD 1080p 29.97 fps 9:16 (portrait)"
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

        if (targetRenderer != null)
        {
            foreach (string templateName in preferredTemplates)
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
        }

        if (selectedTemplate == null)
        {
            MessageBox.Show("None of the preferred render templates were found.");
            return;
        }

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
}
