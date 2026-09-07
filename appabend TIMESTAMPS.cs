using ScriptPortal.Vegas;
using System;
using System.Text;
using System.Windows.Forms;

public class EntryPoint
{
    public void FromVegas(Vegas vegas)
    {
        StringBuilder sb = new StringBuilder();

        foreach (Region region in vegas.Project.Regions)
        {
            string timestamp = region.Position.ToString().Replace('.', ',');
            sb.AppendLine(timestamp);
        }

        Clipboard.SetText(sb.ToString());
    }
}
