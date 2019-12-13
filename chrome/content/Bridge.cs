using System;
using System.IO;
using System.IO.Pipes;
using System.Security.Principal;
using System.Windows.Forms;

namespace Bridge
{
    internal static class Program
    {
        private static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                MessageBox.Show("Usage: Bridge.exe \"<path of a file/folder>\"");
                return;
            }

            SendMessage(Toggle, args[0]);
        }

        private static readonly string PipeName = "QuickLook.App.Pipe." + WindowsIdentity.GetCurrent().User?.Value;
        private const string Toggle = "QuickLook.App.PipeMessages.Toggle";

        private static void SendMessage(string pipeMessage, string path = null)
        {
            if (path == null)
                path = "";

            try
            {
                using (var client = new NamedPipeClientStream(".", PipeName, PipeDirection.Out))
                {
                    client.Connect(1000);

                    using (var writer = new StreamWriter(client))
                    {
                        writer.WriteLine($"{pipeMessage}|{path}");
                        writer.Flush();
                    }
                }
            }
            catch (Exception e)
            {
                MessageBox.Show("QuickLook cannot be reached. Please run/install QuickLook (http://pooi.moe/QuickLook/) or specify a custom view command instead.");
            }
        }
    }
}