@powershell -ExecutionPolicy UnRestricted -Command "(Add-Type -memberDefinition \"[DllImport(\"\"user32.dll\"\")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int x,int y,int cx, int xy, uint flagsw);\" -name \"Win32SetWindowPos\" -passThru )::SetWindowPos((Add-Type -memberDefinition \"[DllImport(\"\"Kernel32.dll\"\")] public static extern IntPtr GetConsoleWindow();\" -name \"Win32GetConsoleWindow\" -passThru )::GetConsoleWindow(),-1,0,0,0,0,67)"
cd C:\work\experiment\WOW\Fishit
npm start
