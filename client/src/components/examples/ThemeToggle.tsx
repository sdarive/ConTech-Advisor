import { ThemeProvider } from "../ThemeProvider";
import { ThemeToggle as ThemeToggleComponent } from "../ThemeToggle";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="flex items-center justify-center p-8 bg-background">
        <ThemeToggleComponent />
      </div>
    </ThemeProvider>
  );
}
